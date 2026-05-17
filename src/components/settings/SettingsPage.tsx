import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { KNOWN_MODELS } from "../../lib/gemini";
import { Select } from "../ui/Select";
import { useLang } from "../../lib/useLang";
import { setLaunchOnStartup } from "../../lib/autostart";

export function SettingsPage() {
  const { settings, update } = useSettingsStore();
  const { t } = useLang();
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showORKey, setShowORKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [openRouterApiKey, setOpenRouterApiKey] = useState(settings.openRouterApiKey);
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel);
  const [autoCopy, setAutoCopy] = useState(settings.autoCopy);
  const [saveHistory, setSaveHistory] = useState(settings.saveHistory);
  const [logsEnabled, setLogsEnabled] = useState(settings.logsEnabled);
  const [theme, setTheme] = useState(settings.theme);
  const [uiLanguage, setUiLanguage] = useState(settings.uiLanguage);
  const [launchOnStartup, setLaunchOnStartupState] = useState(settings.launchOnStartup);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await setLaunchOnStartup(launchOnStartup).catch(() => {});
    await update({ apiKey, openRouterApiKey, selectedModel, autoCopy, saveHistory, logsEnabled, theme, uiLanguage, launchOnStartup });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionHeading = (text: string) => (
    <h2 className="section-label pb-2" style={{ borderBottom: "1px solid var(--border)" }}>{text}</h2>
  );

  const geminiModels = KNOWN_MODELS.filter((m) => m.provider === "gemini");
  const orModels = KNOWN_MODELS.filter((m) => m.provider === "openrouter");

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="page-header">
        <h1 className="page-title">{t("set_title")}</h1>
      </header>

      <form onSubmit={handleSave} className="max-w-xl mx-auto p-6 space-y-8">

        {/* Gemini API Key */}
        <section className="space-y-3">
          {sectionHeading(t("set_gemini"))}
          <div className="space-y-1.5">
            <label className="section-label" style={{ color: "var(--text-2)" }}>{t("set_gemini_key")}</label>
            <div className="relative">
              <input type={showGeminiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIzaSy..." className="input-base" style={{ paddingLeft: 40 }} dir="ltr" />
              <button type="button" onClick={() => setShowGeminiKey(!showGeminiKey)} className="absolute inset-y-0 left-0 px-3 flex items-center" style={{ color: "var(--muted)" }}>
                {showGeminiKey ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("set_gemini_free")}{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--accent)" }}>
                aistudio.google.com
              </a>
            </p>
          </div>
        </section>

        {/* OpenRouter API Key */}
        <section className="space-y-3">
          {sectionHeading(t("set_or"))}
          <div className="space-y-1.5">
            <label className="section-label" style={{ color: "var(--text-2)" }}>{t("set_or_key")}</label>
            <div className="relative">
              <input type={showORKey ? "text" : "password"} value={openRouterApiKey} onChange={(e) => setOpenRouterApiKey(e.target.value)} placeholder="sk-or-..." className="input-base" style={{ paddingLeft: 40 }} dir="ltr" />
              <button type="button" onClick={() => setShowORKey(!showORKey)} className="absolute inset-y-0 left-0 px-3 flex items-center" style={{ color: "var(--muted)" }}>
                {showORKey ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("set_or_from")}{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--accent)" }}>
                openrouter.ai/keys
              </a>
            </p>
          </div>
        </section>

        {/* Model Selection */}
        <section className="space-y-3">
          {sectionHeading(t("set_model"))}
          <p className="text-xs" style={{ color: "var(--muted)" }}>{t("set_model_hint")}</p>
          {geminiModels.length > 0 && (
            <div className="space-y-1.5">
              <label className="section-label" style={{ color: "var(--text-2)" }}>Google AI Studio</label>
              <div className="flex flex-col gap-1.5">
                {geminiModels.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors" style={{ border: `1px solid ${selectedModel === m.id ? "var(--accent-border)" : "var(--border)"}`, background: selectedModel === m.id ? "var(--accent-soft)" : "var(--surface-2)", borderRadius: 10 }}>
                    <input type="radio" name="selectedModel" value={m.id} checked={selectedModel === m.id} onChange={() => setSelectedModel(m.id)} style={{ accentColor: "var(--accent)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: selectedModel === m.id ? "var(--accent)" : "var(--text)" }}>{m.label}</p>
                      <p className="text-xs font-mono truncate" style={{ color: "var(--muted)" }}>{m.id}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {orModels.length > 0 && (
            <div className="space-y-1.5">
              <label className="section-label" style={{ color: "var(--text-2)" }}>OpenRouter</label>
              <div className="flex flex-col gap-1.5">
                {orModels.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors" style={{ border: `1px solid ${selectedModel === m.id ? "var(--accent-border)" : "var(--border)"}`, background: selectedModel === m.id ? "var(--accent-soft)" : "var(--surface-2)", borderRadius: 10 }}>
                    <input type="radio" name="selectedModel" value={m.id} checked={selectedModel === m.id} onChange={() => setSelectedModel(m.id)} style={{ accentColor: "var(--accent)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: selectedModel === m.id ? "var(--accent)" : "var(--text)" }}>{m.label}</p>
                      <p className="text-xs font-mono truncate" style={{ color: "var(--muted)" }}>{m.id}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Behavior */}
        <section className="space-y-3">
          {sectionHeading(t("set_behavior"))}
          <label className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text)" }}>{t("set_autocopy")}</span>
            <input type="checkbox" checked={autoCopy} onChange={(e) => setAutoCopy(e.target.checked)} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text)" }}>{t("set_save_hist")}</span>
            <input type="checkbox" checked={saveHistory} onChange={(e) => setSaveHistory(e.target.checked)} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: "var(--text)" }}>{t("set_logs")}</span>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("set_logs_hint")}</p>
            </div>
            <input type="checkbox" checked={logsEnabled} onChange={(e) => setLogsEnabled(e.target.checked)} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: "var(--text)" }}>{t("set_launch_startup")}</span>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("set_launch_startup_hint")}</p>
            </div>
            <input type="checkbox" checked={launchOnStartup} onChange={(e) => setLaunchOnStartupState(e.target.checked)} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} />
          </label>
        </section>

        {/* Appearance */}
        <section className="space-y-3">
          {sectionHeading(t("set_appearance"))}
          <Select
            value={theme}
            onChange={(v) => setTheme(v as typeof theme)}
            options={[
              { value: "system", label: t("set_theme_auto") },
              { value: "light",  label: t("set_theme_light") },
              { value: "dark",   label: t("set_theme_dark") },
            ]}
          />
        </section>

        {/* Language */}
        <section className="space-y-3">
          {sectionHeading(t("set_language"))}
          <Select
            value={uiLanguage}
            onChange={(v) => {
              const next = v as "ar" | "en";
              setUiLanguage(next);
              void update({ uiLanguage: next }); // apply immediately
            }}
            options={[
              { value: "ar", label: "العربية" },
              { value: "en", label: "English" },
            ]}
          />
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {uiLanguage === "ar" ? "تطبيق فوري — بدون حاجة للحفظ" : "Applied instantly — no save needed"}
          </p>
        </section>


        <button type="submit" className="btn-primary w-full">
          <Save size={18} strokeWidth={1.75} />
          {saved ? t("set_saved") : t("set_save")}
        </button>
      </form>
    </div>
  );
}
