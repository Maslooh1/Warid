import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LogLevel } from "../stores/logStore";
import type { Settings, Template } from "../types";
import { buildPrompt } from "./prompts";

export type OnLog = (level: LogLevel, msg: string, detail?: string) => void;

/** Above this base64 size, switch to Files API instead of inline data.
 *  Gemini hard-limits inline payloads (~20MB inline ~= 15MB raw). We use a
 *  conservative threshold so we never hit it. */
const INLINE_AUDIO_LIMIT_B64 = 5 * 1024 * 1024; // 5MB base64 ≈ 3.7MB raw audio

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Upload an audio blob to Gemini's Files API using the resumable protocol.
 * Returns { uri, mimeType } that can be passed as `fileData` in generateContent.
 * Files live ~48h on Google's servers, plenty for one transcription call.
 */
async function uploadToGeminiFilesAPI(
  apiKey: string,
  audioBase64: string,
  mimeType: string,
  onLog?: OnLog,
): Promise<{ uri: string; mimeType: string }> {
  const bytes = base64ToBytes(audioBase64);
  const sizeMB = (bytes.byteLength / 1024 / 1024).toFixed(2);
  const t0 = Date.now();
  onLog?.("info", `↑ Uploading audio to Gemini Files API`, `size=${sizeMB}MB mime=${mimeType}`);

  // Step 1 — initiate resumable upload, get upload URL from the response header.
  const initResp = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: `warid-${Date.now()}` } }),
    },
  );

  if (!initResp.ok) {
    const txt = await initResp.text();
    throw new Error(`Files API init failed ${initResp.status}: ${txt.slice(0, 300)}`);
  }

  const uploadUrl = initResp.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Files API: missing upload URL header");

  // Step 2 — upload the bytes and finalize in one shot.
  // Wrap in Blob to give fetch a BodyInit-compatible type (some TS DOM lib
  // versions reject raw Uint8Array as a fetch body).
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: blob,
  });

  if (!uploadResp.ok) {
    const txt = await uploadResp.text();
    throw new Error(`Files API upload failed ${uploadResp.status}: ${txt.slice(0, 300)}`);
  }

  const json = await uploadResp.json();
  const file = json.file;
  if (!file?.uri) throw new Error("Files API: response missing file.uri");

  onLog?.("success", `↑ Upload done in ${Date.now() - t0}ms`, `uri=${file.uri}`);
  return { uri: file.uri, mimeType: file.mimeType ?? mimeType };
}

export async function* streamTranscription(
  apiKey: string,
  model: string,
  template: Template,
  audioBase64: string,
  mimeType: string,
  onLog?: OnLog,
  promptOverride?: string,
): AsyncGenerator<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Disable thinking on models that support it (2.5+ / 3.x). thinkingBudget:0
  // forces the model to skip its internal reasoning step and emit tokens
  // immediately — massive latency win for transcription where reasoning adds
  // nothing. Unknown fields are ignored by older models.
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      // @ts-expect-error — thinkingConfig is supported by the REST API but not
      // yet typed in @google/generative-ai
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const prompt = promptOverride ?? buildPrompt(template);

  // Decide inline vs. Files API. Large audio MUST go through Files API or the
  // request body will exceed Gemini's inline limit and fail silently/with 400.
  let audioPart;
  if (audioBase64.length > INLINE_AUDIO_LIMIT_B64) {
    const uploaded = await uploadToGeminiFilesAPI(apiKey, audioBase64, mimeType, onLog);
    audioPart = { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } };
  } else {
    audioPart = { inlineData: { mimeType, data: audioBase64 } };
  }

  const tReq = Date.now();
  onLog?.(
    "info",
    `→ POST generateContentStream (thinking=off)`,
    `model=${model} audio=${(audioBase64.length / 1024).toFixed(1)}KB mode=${"fileData" in audioPart ? "files-api" : "inline"}`,
  );
  const result = await genModel.generateContentStream([prompt, audioPart]);
  let firstToken = true;
  let totalChars = 0;
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      if (firstToken) {
        onLog?.("success", `← first token in ${Date.now() - tReq}ms`);
        firstToken = false;
      }
      totalChars += text.length;
      yield text;
    }
  }
  onLog?.("info", `← stream complete: ${totalChars} chars in ${Date.now() - tReq}ms`);
}

export async function* streamOpenRouter(
  apiKey: string,
  model: string,
  template: Template,
  audioBase64: string,
  mimeType: string,
  serviceTier?: "flex" | "priority" | null,
  onLog?: OnLog,
  promptOverride?: string,
): AsyncGenerator<string> {
  const prompt = promptOverride ?? buildPrompt(template);
  const format = mimeType.includes("webm") ? "webm"
    : mimeType.includes("mp4") ? "mp4"
    : mimeType.includes("wav") ? "wav"
    : "webm";

  const body: Record<string, unknown> = {
    model,
    stream: true,
    // Disable any internal reasoning for fastest first-token latency.
    reasoning: { exclude: true, max_tokens: 0 },
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "input_audio", input_audio: { data: audioBase64, format } },
      ],
    }],
  };
  if (serviceTier) body.service_tier = serviceTier;

  const tReq = Date.now();
  onLog?.("info", `→ POST openrouter.ai/v1/chat/completions (reasoning=off)`, `model=${model}`);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 300)}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstToken = true;
  let totalChars = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        onLog?.("info", `← stream complete: ${totalChars} chars in ${Date.now() - tReq}ms`);
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) {
          if (firstToken) {
            onLog?.("success", `← first token in ${Date.now() - tReq}ms`);
            firstToken = false;
          }
          totalChars += text.length;
          yield text;
        }
      } catch { /* skip malformed SSE lines */ }
    }
  }
  onLog?.("info", `← stream complete: ${totalChars} chars in ${Date.now() - tReq}ms`);
}

export const KNOWN_MODELS = [
  { id: "gemini-3.1-flash-lite",                                    provider: "gemini"      as const, label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-3-flash-preview",                                    provider: "gemini"      as const, label: "Gemini 3 Flash Preview" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",        provider: "openrouter"  as const, label: "Nemotron 3 Nano Omni 30B (free)" },
  { id: "google/gemini-3.1-flash-lite",                              provider: "openrouter"  as const, label: "Gemini 3.1 Flash Lite (OR)" },
  { id: "google/gemini-3-flash-preview",                             provider: "openrouter"  as const, label: "Gemini 3 Flash Preview (OR)" },
  { id: "google/gemini-2.5-flash-lite-preview-09-2025",              provider: "openrouter"  as const, label: "Gemini 2.5 Flash Lite Preview (OR)" },
];

export async function* streamAudio(
  settings: Settings,
  template: Template,
  audioBase64: string,
  mimeType: string,
  onLog?: OnLog,
): AsyncGenerator<string> {
  const modelId = template.model || settings.selectedModel;
  const entry = KNOWN_MODELS.find((m) => m.id === modelId);
  const provider = entry?.provider ?? "gemini";

  onLog?.("info", `النموذج: ${entry?.label ?? modelId}`);

  if (provider === "gemini") {
    if (!settings.apiKey) throw new Error("Gemini API Key مفقود، أضفه من الإعدادات");
    yield* streamTranscription(settings.apiKey, modelId, template, audioBase64, mimeType, onLog);
  } else {
    if (!settings.openRouterApiKey) throw new Error("OpenRouter API Key مفقود، أضفه من الإعدادات");
    yield* streamOpenRouter(settings.openRouterApiKey, modelId, template, audioBase64, mimeType, undefined, onLog);
  }
}
