import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Recorder } from "./components/recording/Recorder";
import { HistoryPage } from "./components/history/HistoryPage";
import { TemplatesPage } from "./components/templates/TemplatesPage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { LogsPage } from "./components/logs/LogsPage";
import { AnalyticsPage } from "./components/analytics/AnalyticsPage";
import { Welcome } from "./components/onboarding/Welcome";
import { useSettingsStore } from "./stores/settingsStore";
import { useTemplatesStore } from "./stores/templatesStore";
import { ControlBar } from "./components/recording/ControlBar";
import { UpdateBanner } from "./components/layout/UpdateBanner";
import { fetchLatestVersion, isNewer } from "./lib/updateCheck";

export default function App() {
  const isOverlay = new URLSearchParams(window.location.search).has("overlay");
  const { load: loadSettings, settings, loaded, update } = useSettingsStore();
  const { load: loadTemplates, activeTemplateId, templates } = useTemplatesStore();
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      await loadSettings();
    })();
  }, []);

  // Check for a newer GitHub release once on startup
  useEffect(() => {
    if (isOverlay) return;
    (async () => {
      const current = await getVersion();
      const latest = await fetchLatestVersion();
      if (latest && isNewer(latest, current)) setUpdateVersion(latest);
    })();
  }, []);

  useEffect(() => {
    if (!loaded || isOverlay) return;

    (async () => {
      await loadTemplates(settings.defaultTemplateId);
    })();
  }, [loaded, settings.defaultTemplateId, loadTemplates, isOverlay]);

  useEffect(() => {
    if (!loaded || !templates.length || !activeTemplateId || settings.defaultTemplateId === activeTemplateId) return;
    update({ defaultTemplateId: activeTemplateId });
  }, [loaded, templates.length, activeTemplateId, settings.defaultTemplateId, update]);

  // Sync tray menu labels with the user's chosen UI language.
  useEffect(() => {
    if (!loaded || isOverlay) return;
    invoke("update_tray_language", { lang: settings.uiLanguage }).catch(() => {});
  }, [loaded, settings.uiLanguage, isOverlay]);

  // Apply theme
  useEffect(() => {
    const html = document.documentElement;
    if (settings.theme === "dark") {
      html.classList.add("dark");
    } else if (settings.theme === "light") {
      html.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      html.classList.toggle("dark", mq.matches);
      const listener = (e: MediaQueryListEvent) => html.classList.toggle("dark", e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [settings.theme]);

  if (isOverlay) {
    return (
      <div className={settings.theme === "dark" ? "dark" : ""}>
        <ControlBar />
      </div>
    );
  }

  // Show the full-page welcome flow on first launch, or whenever the user has
  // no API key yet (in that case we skip the language/theme step).
  const showWelcome =
    loaded && !welcomeDone && (settings.firstRun || !settings.apiKey);

  return (
    <BrowserRouter>
      <div
        className="h-screen flex overflow-hidden"
        style={{ background: "var(--bg)", color: "var(--text)" }}
        dir={settings.uiLanguage === "en" ? "ltr" : "rtl"}
      >
        {showWelcome ? (
          <Welcome
            startAtKey={!settings.firstRun}
            onComplete={() => setWelcomeDone(true)}
          />
        ) : (
          <>
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              {updateVersion && !updateDismissed && (
                <UpdateBanner version={updateVersion} onDismiss={() => setUpdateDismissed(true)} />
              )}
              <Routes>
                <Route path="/" element={<Recorder />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/logs" element={<LogsPage />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
