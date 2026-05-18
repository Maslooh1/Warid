export interface Template {
  id: string;
  name: string;
  name_en?: string;   // English display name for built-in templates
  icon: string;
  color: string;
  prompt_body: string;
  output_language: "en" | "ar" | null;
  model: string | null;
  hotkey: string | null;
  is_default: 0 | 1;
  created_at: number;
  updated_at: number;
}

export interface HistoryItem {
  id: string;
  created_at: number;
  template_id: string | null;
  template_snapshot: string | null;
  model: string;
  audio_path: string | null;
  duration_ms: number | null;
  output_text: string;
  estimated_tokens: number | null;
}

export interface Settings {
  apiKey: string;
  openRouterApiKey: string;
  logsEnabled: boolean;
  selectedModel: string;
  defaultTemplateId: string;
  autoCopy: boolean;
  showTray: boolean;
  saveHistory: boolean;
  theme: "light" | "dark" | "system";
  uiLanguage: "ar" | "en";
  firstRun: boolean;
  /** deviceId of the preferred audio input. Empty string = system default. */
  audioDeviceId: string;
  launchOnStartup: boolean;
  /** Global shortcut to cancel an active recording from any screen. */
  cancelHotkey: string;
  /** False until the user dismisses the cancel-hotkey feature tip (shown once after upgrade). */
  seenCancelHotkey: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  openRouterApiKey: "",
  logsEnabled: false,
  selectedModel: "gemini-3.1-flash-lite",
  defaultTemplateId: "transcribe",
  autoCopy: true,
  showTray: true,
  saveHistory: true,
  theme: "system",
  uiLanguage: "ar",
  firstRun: true,
  audioDeviceId: "",
  launchOnStartup: false,
  cancelHotkey: "CommandOrControl+Alt+X",
  seenCancelHotkey: false,
};

export const DEFAULT_TEMPLATES: Omit<Template, "created_at" | "updated_at">[] = [
  {
    id: "transcribe",
    name: "تفريغ نصي",
    name_en: "Transcribe",
    icon: "Microphone",
    color: "#FF6B3D",
    prompt_body: `Transcribe the audio verbatim. Preserve the original language of each word exactly as spoken — if the speaker switches between languages (e.g., Arabic and English), transcribe each word in the language it was spoken. Output the transcription only.`,
    output_language: null,
    model: null,
    hotkey: "CommandOrControl+Shift+R",
    is_default: 1,
  },
  {
    id: "translate_en",
    name: "ترجمة وتنظيم",
    name_en: "Translate & Polish",
    icon: "Languages",
    color: "#2563EB",
    prompt_body: `Translate the audio to clean English. Remove fillers, fix grammar, preserve meaning. Output the English text only.`,
    output_language: "en",
    model: null,
    hotkey: "CommandOrControl+Shift+T",
    is_default: 1,
  },
  {
    id: "coding_assistant",
    name: "مساعد البرمجة",
    name_en: "Coding Assistant",
    icon: "Code",
    color: "#10B981",
    prompt_body: `Rewrite the audio as a clear English coding task or developer brief. Output the brief only.`,
    output_language: "en",
    model: null,
    hotkey: "CommandOrControl+Shift+C",
    is_default: 1,
  },
];
