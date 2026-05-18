import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Eye, EyeOff, Save } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { KNOWN_MODELS } from "../../lib/gemini";
import { Select } from "../ui/Select";
import { HotkeyField } from "../ui/HotkeyField";
import { useLang } from "../../lib/useLang";
import { setLaunchOnStartup } from "../../lib/autostart";

type Tab = "keys" | "models" | "prefs" | "about";

export function SettingsPage() {
  const { settings, update } = useSettingsStore();
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>("keys");
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
  const [cancelHotkey, setCancelHotkey] = useState<string | null>(settings.cancelHotkey || null);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await setLaunchOnStartup(launchOnStartup).catch(() => {});
    await update({ apiKey, openRouterApiKey, selectedModel, autoCopy, saveHistory, logsEnabled, theme, uiLanguage, launchOnStartup, cancelHotkey: cancelHotkey ?? "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionHeading = (text: string) => (
    <h2 className="section-label pb-2" style={{ borderBottom: "1px solid var(--border)" }}>{text}</h2>
  );

  const geminiModels = KNOWN_MODELS.filter((m) => m.provider === "gemini");
  const orModels = KNOWN_MODELS.filter((m) => m.provider === "openrouter");

  const QuotaBadge = ({ quota }: { quota: (typeof KNOWN_MODELS)[number]["quota"] }) => {
    if (quota.type === "paid") {
      return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>{t("set_quota_paid")}</span>;
    }
    if (quota.type === "free_or_paid") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
          {t("set_quota_free_or_paid", quota.freeRpd.toString(), quota.paidRpd.toLocaleString())}
        </span>
      );
    }
    return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>{t("set_quota_free", quota.rpd.toString())}</span>;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "keys",   label: t("set_tab_keys") },
    { id: "models", label: t("set_tab_models") },
    { id: "prefs",  label: t("set_tab_prefs") },
    { id: "about",  label: t("set_tab_about") },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="page-header">
        <h1 className="page-title">{t("set_title")}</h1>
      </header>

      {/* Tab bar */}
      <div className="max-w-xl mx-auto px-6 pt-2">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 text-sm py-1.5 px-3 rounded-lg transition-colors font-medium"
              style={{
                background: activeTab === tab.id ? "var(--surface)" : "transparent",
                color: activeTab === tab.id ? "var(--accent)" : "var(--muted)",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-xl mx-auto p-6 space-y-8">

        {/* Tab: API Keys */}
        {activeTab === "keys" && (
          <>
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

            <button type="submit" className="btn-primary w-full">
              <Save size={18} strokeWidth={1.75} />
              {saved ? t("set_saved") : t("set_save")}
            </button>
          </>
        )}

        {/* Tab: Models */}
        {activeTab === "models" && (
          <>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold" style={{ color: selectedModel === m.id ? "var(--accent)" : "var(--text)" }}>{m.label}</p>
                            <QuotaBadge quota={m.quota} />
                          </div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold" style={{ color: selectedModel === m.id ? "var(--accent)" : "var(--text)" }}>{m.label}</p>
                            <QuotaBadge quota={m.quota} />
                          </div>
                          <p className="text-xs font-mono truncate" style={{ color: "var(--muted)" }}>{m.id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <button type="submit" className="btn-primary w-full">
              <Save size={18} strokeWidth={1.75} />
              {saved ? t("set_saved") : t("set_save")}
            </button>
          </>
        )}

        {/* Tab: Preferences */}
        {activeTab === "prefs" && (
          <>
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
              <div className="space-y-1">
                <div>
                  <span className="text-sm" style={{ color: "var(--text)" }}>{t("set_cancel_hotkey")}</span>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{t("set_cancel_hotkey_hint")}</p>
                </div>
                <HotkeyField value={cancelHotkey} onChange={setCancelHotkey} label={null} hint={null} />
              </div>
            </section>

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

            <section className="space-y-3">
              {sectionHeading(t("set_language"))}
              <Select
                value={uiLanguage}
                onChange={(v) => {
                  const next = v as "ar" | "en";
                  setUiLanguage(next);
                  void update({ uiLanguage: next });
                }}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]}
              />
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {uiLanguage === "ar" ? "تطبيق فوري، بدون حاجة للحفظ" : "Applied instantly, no save needed"}
              </p>
            </section>

            <button type="submit" className="btn-primary w-full">
              <Save size={18} strokeWidth={1.75} />
              {saved ? t("set_saved") : t("set_save")}
            </button>
          </>
        )}

        {/* Tab: About */}
        {activeTab === "about" && (
          <section className="space-y-6">
            {/* App identity */}
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>Warid</p>
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>{t("set_about_desc")}</p>
            </div>

            {/* Developer info */}
            <div className="space-y-3 rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t("set_about_version")}</span>
                <span className="text-sm font-mono" style={{ color: "var(--text)" }}>{appVersion ? `v${appVersion}` : "—"}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t("set_about_developer")}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Mohamed Maslooh</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t("set_about_github")}</span>
                <a
                  href="https://github.com/mohamedmaslooh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: "var(--accent)" }}
                >
                  github.com/mohamedmaslooh
                </a>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t("set_about_website")}</span>
                <a
                  href="https://mohamedmaslooh.github.io/Warid/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: "var(--accent)" }}
                >
                  mohamedmaslooh.github.io/Warid
                </a>
              </div>
            </div>
          </section>
        )}

      </form>
    </div>
  );
}
