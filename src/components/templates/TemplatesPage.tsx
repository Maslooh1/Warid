import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, X, Download, Upload, Keyboard, XCircle } from "lucide-react";
import { useTemplatesStore } from "../../stores/templatesStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { KNOWN_MODELS } from "../../lib/gemini";
import { Select } from "../ui/Select";
import { acceleratorFromEvent, formatAccelerator, normalizeAccelerator } from "../../lib/hotkey";
import { useLang } from "../../lib/useLang";
import type { Template } from "../../types";

function getTemplateName(tpl: { name: string; name_en?: string }, lang: string): string {
  return lang === "en" && tpl.name_en ? tpl.name_en : tpl.name;
}


const EMPTY_TEMPLATE = (): Template => ({
  id: crypto.randomUUID(),
  name: "",
  icon: "Microphone",
  color: "#FF6B3D",
  prompt_body: "",
  output_language: null,
  model: null,
  hotkey: null,
  is_default: 0,
  created_at: Date.now(),
  updated_at: Date.now(),
});

export function TemplatesPage() {
  const { templates, save, remove } = useTemplatesStore();
  const { settings } = useSettingsStore();
  const { t, lang } = useLang();
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.prompt_body.trim()) return;
    if (hotkeyError) return;
    setSaving(true);
    await save({ ...editing, updated_at: Date.now() });
    setSaving(false);
    setEditing(null);
  };

  useEffect(() => {
    if (!editing || !editing.hotkey) { setHotkeyError(null); return; }
    const norm = normalizeAccelerator(editing.hotkey);
    const conflict = templates.find((tpl) => tpl.id !== editing.id && normalizeAccelerator(tpl.hotkey) === norm);
    setHotkeyError(conflict ? t("tpl_hk_conflict", getTemplateName(conflict, lang)) : null);
  }, [editing?.hotkey, editing?.id, templates, t, lang]);

  const handleExport = () => {
    const json = JSON.stringify(templates.filter((tpl) => !tpl.is_default), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warid-commands.json";
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text) as Template[];
      for (const tpl of data) {
        await save({ ...tpl, id: crypto.randomUUID(), is_default: 0, hotkey: null, created_at: Date.now(), updated_at: Date.now() });
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <h1 className="page-title">{t("tpl_title")}</h1>
        <div className="flex gap-2">
          <button onClick={handleImport} className="btn-ghost">
            <Upload size={14} strokeWidth={1.75} /> {t("tpl_import")}
          </button>
          <button onClick={handleExport} className="btn-ghost">
            <Download size={14} strokeWidth={1.75} /> {t("tpl_export")}
          </button>
          <button onClick={() => setEditing(EMPTY_TEMPLATE())} className="btn-primary">
            <Plus size={14} strokeWidth={2} /> {t("tpl_new")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 overflow-y-auto" style={{ borderInlineStart: "1px solid var(--border)", background: "var(--surface)", backdropFilter: "blur(10px)" }}>
          {templates.map((tpl) => {
            const hk = formatAccelerator(tpl.hotkey);
            const isSelected = editing?.id === tpl.id;
            return (
              <div key={tpl.id} className="p-4 flex items-center justify-between group cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--border)", background: isSelected ? "var(--accent-soft)" : "transparent" }} onClick={() => setEditing({ ...tpl })}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold truncate" style={{ color: isSelected ? "var(--accent)" : "var(--text)" }}>{getTemplateName(tpl, lang)}</p>
                    {hk && <span className="kbd shrink-0" dir="ltr">{hk}</span>}
                  </div>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>{tpl.prompt_body}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(tpl.id); if (editing?.id === tpl.id) setEditing(null); }} className="opacity-0 group-hover:opacity-100 p-1.5 transition-all" style={{ color: "var(--danger)", borderRadius: 8 }}>
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {editing ? (
            <div className="p-6 space-y-5 max-w-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                  {getTemplateName(editing, lang) || t("tpl_new")}
                </h2>
                <button onClick={() => setEditing(null)} className="icon-btn" style={{ width: 32, height: 32 }}>
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="section-label">{t("tpl_name")}</label>
                <input
                  type="text"
                  value={getTemplateName(editing, lang)}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, name_en: undefined })}
                  className="input-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="section-label">{t("tpl_prompt")}</label>
                <textarea value={editing.prompt_body} onChange={(e) => setEditing({ ...editing, prompt_body: e.target.value })} rows={8} className="input-base resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="section-label">{t("tpl_out_lang")}</label>
                <Select
                  value={editing.output_language ?? "auto"}
                  onChange={(v) => setEditing({ ...editing, output_language: v === "auto" ? null : v as "en" | "ar" })}
                  options={[
                    { value: "auto", label: t("tpl_lang_auto") },
                    { value: "en",   label: t("tpl_lang_en") },
                    { value: "ar",   label: t("tpl_lang_ar") },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="section-label">{t("tpl_model", settings.selectedModel)}</label>
                <Select
                  value={editing.model ?? ""}
                  onChange={(v) => setEditing({ ...editing, model: v || null })}
                  dir="ltr"
                  options={[
                    { value: "", label: t("tpl_model_def", settings.selectedModel) },
                    ...KNOWN_MODELS.map((m) => ({ value: m.id, label: m.label, hint: m.id })),
                  ]}
                />
              </div>

              <HotkeyField value={editing.hotkey} onChange={(hk) => setEditing({ ...editing, hotkey: hk })} error={hotkeyError} />

              <button onClick={handleSave} disabled={saving || !!hotkeyError} className="btn-primary">
                <Save size={16} strokeWidth={1.75} />
                {saving ? t("tpl_saving") : t("tpl_save")}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm h-full" style={{ color: "var(--muted)" }}>
              {t("tpl_select")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HotkeyField({ value, onChange, error }: { value: string | null; onChange: (hk: string | null) => void; error: string | null }) {
  const { t } = useLang();
  const [capturing, setCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setCapturing(false); return; }
      const accel = acceleratorFromEvent(e);
      if (!accel) return;
      onChange(accel);
      setCapturing(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, onChange]);

  const display = formatAccelerator(value);

  return (
    <div className="space-y-1.5">
      <label className="section-label">{t("tpl_hotkey")}</label>
      <div ref={captureRef} className="flex items-center gap-2">
        {capturing ? (
          <div className="input-base flex-1 flex items-center justify-center font-mono text-xs" style={{ color: "var(--accent)", borderColor: "var(--accent-border)" }}>
            {t("tpl_hk_capture")}
          </div>
        ) : (
          <button type="button" onClick={() => setCapturing(true)} className="input-base flex-1 flex items-center justify-between text-start hover:border-[var(--accent-border)] transition-colors">
            <span className={display ? "font-mono text-sm" : "text-sm"} style={{ color: display ? "var(--text)" : "var(--muted)" }} dir="ltr">
              {display || t("tpl_hk_click")}
            </span>
            <Keyboard size={16} strokeWidth={1.75} style={{ color: "var(--muted)" }} />
          </button>
        )}
        {value && !capturing && (
          <button type="button" onClick={() => onChange(null)} className="transition-colors p-2" style={{ color: "var(--muted)", borderRadius: 8 }}>
            <XCircle size={20} strokeWidth={1.75} />
          </button>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
      <p className="text-xs" style={{ color: "var(--muted)" }}>{t("tpl_hk_hint")}</p>
    </div>
  );
}
