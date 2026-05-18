import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Monitor,
  Sun,
  Moon,
  Mic,
  XCircle,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettingsStore } from "../../stores/settingsStore";
import { useLang } from "../../lib/useLang";
import { formatAccelerator } from "../../lib/hotkey";
import type { Lang } from "../../lib/i18n";
import type { Settings } from "../../types";

interface Props {
  /** When true, skip the preferences step (used when the user already finished firstRun
   *  but cleared their API key). */
  startAtKey?: boolean;
  onComplete: () => void;
}

const AI_STUDIO_URL = "https://aistudio.google.com/apikey";

export function Welcome({ startAtKey = false, onComplete }: Props) {
  const { settings, update } = useSettingsStore();
  const { t, isRTL } = useLang();
  const [step, setStep] = useState<0 | 1>(startAtKey ? 1 : 0);
  const [apiKey, setApiKey] = useState("");

  const ArrowNext = isRTL ? ArrowLeft : ArrowRight;
  const ArrowPrev = isRTL ? ArrowRight : ArrowLeft;

  const goNext = async () => {
    if (settings.firstRun) await update({ firstRun: false });
    setStep(1);
  };

  const finish = async (saveKey: boolean) => {
    const patch: Partial<Settings> = { firstRun: false, seenCancelHotkey: true };
    if (saveKey && apiKey.trim()) patch.apiKey = apiKey.trim();
    await update(patch);
    onComplete();
  };

  const handleOpenStudio = async () => {
    try {
      await openUrl(AI_STUDIO_URL);
    } catch (err) {
      console.error("openUrl failed:", err);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top accent strip */}
      <div
        className="flex-shrink-0"
        style={{
          height: 4,
          background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
        }}
      />

      {/* Body — fills remaining space, never scrolls */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-8 py-4">
        <div className="w-full max-w-3xl">
          {step === 0 ? (
            <PreferencesStep
              t={t}
              lang={settings.uiLanguage}
              theme={settings.theme}
              audioDeviceId={settings.audioDeviceId}
              cancelHotkey={settings.cancelHotkey}
              onPickLang={(l) => update({ uiLanguage: l })}
              onPickTheme={(th) => update({ theme: th })}
              onPickMic={(id) => update({ audioDeviceId: id })}
              onNext={goNext}
              ArrowNext={ArrowNext}
            />
          ) : (
            <ApiKeyStep
              t={t}
              apiKey={apiKey}
              setApiKey={setApiKey}
              onBack={startAtKey ? null : () => setStep(0)}
              onSkip={() => finish(false)}
              onSave={() => finish(true)}
              onOpenStudio={handleOpenStudio}
              ArrowPrev={ArrowPrev}
            />
          )}
        </div>
      </div>

      {/* Footer step indicator */}
      {!startAtKey && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-2 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <StepDot active={step === 0} done={step > 0} />
          <StepDot active={step === 1} done={false} />
        </div>
      )}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  const color = done ? "var(--success)" : active ? "var(--accent)" : "var(--border)";
  return (
    <div
      style={{
        width: active ? 22 : 8,
        height: 8,
        borderRadius: 999,
        background: color,
        transition: "width .2s ease",
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Step 0 — preferences (language + theme + mic)                    */
/* ──────────────────────────────────────────────────────────────── */

interface PreferencesProps {
  t: (key: any, ...args: string[]) => string;
  lang: Lang;
  theme: Settings["theme"];
  audioDeviceId: string;
  cancelHotkey: string;
  onPickLang: (l: Lang) => void;
  onPickTheme: (t: Settings["theme"]) => void;
  onPickMic: (id: string) => void;
  onNext: () => void;
  ArrowNext: typeof ArrowRight;
}

function PreferencesStep({
  t,
  lang,
  theme,
  audioDeviceId,
  cancelHotkey,
  onPickLang,
  onPickTheme,
  onPickMic,
  onNext,
  ArrowNext,
}: PreferencesProps) {
  return (
    <div className="space-y-5">
      {/* Hero — horizontal, compact */}
      <div className="flex items-center gap-4">
        <div
          className="grid place-items-center flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "white",
            boxShadow: "0 8px 24px -8px var(--accent)",
          }}
        >
          <Sparkles size={24} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
            {t("ob_title")}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            {t("ob_sub")}
          </p>
        </div>
      </div>

      {/* About — single compact card */}
      <div
        className="p-3.5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>
            {t("ob_about_t")}
          </span>
          {"  "}
          {t("ob_about_b")}
        </p>
      </div>

      {/* Two-column: language + theme */}
      <div className="grid grid-cols-5 gap-4">
        {/* Language */}
        <div className="col-span-2 space-y-2">
          <Label icon={null}>{t("ob_pick_lang")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <SegmentCard
              selected={lang === "ar"}
              onClick={() => onPickLang("ar")}
              title="العربية"
              subtitle="AR"
            />
            <SegmentCard
              selected={lang === "en"}
              onClick={() => onPickLang("en")}
              title="English"
              subtitle="EN"
            />
          </div>
        </div>

        {/* Theme */}
        <div className="col-span-3 space-y-2">
          <Label icon={null}>{t("ob_pick_theme")}</Label>
          <div className="grid grid-cols-3 gap-2">
            <ThemeCard
              selected={theme === "system"}
              onClick={() => onPickTheme("system")}
              icon={<Monitor size={16} strokeWidth={2} />}
              title={t("set_theme_auto")}
            />
            <ThemeCard
              selected={theme === "light"}
              onClick={() => onPickTheme("light")}
              icon={<Sun size={16} strokeWidth={2} />}
              title={t("set_theme_light")}
            />
            <ThemeCard
              selected={theme === "dark"}
              onClick={() => onPickTheme("dark")}
              icon={<Moon size={16} strokeWidth={2} />}
              title={t("set_theme_dark")}
            />
          </div>
        </div>
      </div>

      {/* Microphone picker */}
      <div className="space-y-2">
        <Label icon={<Mic size={13} strokeWidth={2} />}>{t("ob_pick_mic")}</Label>
        <MicrophonePicker
          t={t}
          value={audioDeviceId}
          onChange={onPickMic}
        />
      </div>

      {/* Cancel shortcut tip */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <XCircle size={16} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          {t("ob_cancel_tip", formatAccelerator(cancelHotkey))}
        </p>
      </div>

      {/* Continue */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
          style={{ padding: "10px 24px", fontSize: 14 }}
        >
          {t("ob_next")}
          <ArrowNext size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function Label({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span style={{ color: "var(--text-2)" }}>{icon}</span>}
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
        {children}
      </p>
    </div>
  );
}

function SegmentCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 transition-all"
      style={{
        padding: "10px 8px",
        border: `1px solid ${selected ? "var(--accent-border)" : "var(--border)"}`,
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        borderRadius: 10,
        boxShadow: selected ? "0 0 0 3px var(--accent-soft)" : "none",
        minHeight: 44,
      }}
    >
      <span
        className="font-bold text-sm"
        style={{ color: selected ? "var(--accent)" : "var(--text)" }}
      >
        {title}
      </span>
      <span
        className="text-xs"
        style={{
          color: selected ? "var(--accent)" : "var(--muted)",
          opacity: 0.7,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}

function ThemeCard({
  selected,
  onClick,
  icon,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 transition-all"
      style={{
        padding: "10px 6px",
        border: `1px solid ${selected ? "var(--accent-border)" : "var(--border)"}`,
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        borderRadius: 10,
        boxShadow: selected ? "0 0 0 3px var(--accent-soft)" : "none",
        minHeight: 44,
        color: selected ? "var(--accent)" : "var(--text-2)",
      }}
    >
      {icon}
      <span
        className="font-semibold text-xs"
        style={{ color: selected ? "var(--accent)" : "var(--text)" }}
      >
        {title}
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Microphone picker                                                */
/* ──────────────────────────────────────────────────────────────── */

interface MicPickerProps {
  t: (key: any, ...args: string[]) => string;
  value: string;
  onChange: (id: string) => void;
}

function MicrophonePicker({ t, value, onChange }: MicPickerProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [needsGrant, setNeedsGrant] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = list.filter((d) => d.kind === "audioinput");
      setDevices(mics);
      // Labels are empty when permission hasn't been granted yet
      setNeedsGrant(mics.length > 0 && mics.every((d) => !d.label));
    } catch {
      setDevices([]);
      setNeedsGrant(true);
    }
  }, []);

  const grant = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop());
      await refresh();
    } catch (err) {
      console.error("Mic permission denied:", err);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    navigator.mediaDevices.addEventListener?.("devicechange", handler);
    return () => navigator.mediaDevices.removeEventListener?.("devicechange", handler);
  }, [refresh]);

  return (
    <div className="flex items-stretch gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base flex-1"
        style={{ paddingTop: 10, paddingBottom: 10, minHeight: 44 }}
        dir="ltr"
      >
        <option value="">{t("ob_mic_default")}</option>
        {devices.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId}>
            {d.label || `Microphone ${i + 1}`}
          </option>
        ))}
      </select>
      {needsGrant && (
        <button
          type="button"
          onClick={grant}
          className="btn-ghost text-xs flex-shrink-0"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            paddingInline: 12,
          }}
        >
          <Mic size={13} strokeWidth={2} />
          {t("ob_mic_grant")}
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Step 1 — API key                                                 */
/* ──────────────────────────────────────────────────────────────── */

interface ApiKeyProps {
  t: (key: any, ...args: string[]) => string;
  apiKey: string;
  setApiKey: (v: string) => void;
  onBack: (() => void) | null;
  onSkip: () => void;
  onSave: () => void;
  onOpenStudio: () => void;
  ArrowPrev: typeof ArrowLeft;
}

function ApiKeyStep({
  t,
  apiKey,
  setApiKey,
  onBack,
  onSkip,
  onSave,
  onOpenStudio,
  ArrowPrev,
}: ApiKeyProps) {
  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Back row */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="btn-ghost text-xs"
            style={{ padding: "4px 8px" }}
          >
            <ArrowPrev size={13} strokeWidth={2} />
            {t("ob_back")}
          </button>
        </div>
      )}

      {/* Hero — horizontal */}
      <div className="flex items-center gap-4">
        <div
          className="grid place-items-center flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <KeyRound size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>
            {t("ob_key_step_t")}
          </h1>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>
            {t("ob_key_step_b")}
          </p>
        </div>
      </div>

      {/* Three steps — horizontal row */}
      <div className="grid grid-cols-3 gap-3">
        <StepCard n={1} title={t("ob_step1_t")} body={t("ob_step1_b")} />
        <StepCard n={2} title={t("ob_step2_t")} body={t("ob_step2_b")} />
        <StepCard n={3} title={t("ob_step3_t")} body={t("ob_step3_b")} />
      </div>

      {/* Open AI Studio button */}
      <button
        type="button"
        onClick={onOpenStudio}
        className="w-full flex items-center justify-center gap-2 transition-all"
        style={{
          padding: "12px 18px",
          background: "var(--surface)",
          color: "var(--text)",
          border: "1px dashed var(--accent-border)",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <ExternalLink size={15} strokeWidth={2} style={{ color: "var(--accent)" }} />
        <span>{t("ob_open_studio")}</span>
        <span
          className="text-[10px] px-2 py-0.5"
          style={{
            background: "var(--success-bg)",
            color: "var(--success)",
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {t("ob_free_badge")}
        </span>
      </button>

      {/* Key input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold" style={{ color: "var(--text)" }}>
          {t("ob_key_label")}
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t("ob_key_ph")}
          className="input-base w-full"
          style={{ paddingTop: 10, paddingBottom: 10 }}
          dir="ltr"
          autoFocus
        />
        <div
          className="flex items-start gap-1.5 text-[11px]"
          style={{ color: "var(--muted)" }}
        >
          <ShieldCheck size={11} strokeWidth={2} className="flex-shrink-0 mt-px" />
          <span>{t("ob_key_hint")}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button type="button" onClick={onSkip} className="btn-ghost text-xs">
          {t("ob_skip")}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasKey}
          className="btn-primary"
          style={{ padding: "10px 22px", fontSize: 14 }}
        >
          <Check size={15} strokeWidth={2} />
          {t("ob_start")}
        </button>
      </div>
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div
      className="p-3 flex flex-col gap-1.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 grid place-items-center flex-shrink-0 text-xs font-bold"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            borderRadius: "50%",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {n}
        </div>
        <p className="font-semibold text-xs" style={{ color: "var(--text)" }}>
          {title}
        </p>
      </div>
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: "var(--text-2)" }}
      >
        {body}
      </p>
    </div>
  );
}
