import { useEffect, useState } from "react";
import { Pause, Play, Square, X } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { emit } from "@tauri-apps/api/event";
import { useLang } from "../../lib/useLang";
import { formatDuration } from "../../lib/audio";

type BarState = "recording" | "processing" | "idle";

interface OverlayPayload {
  state: BarState;
  paused: boolean;
  duration: number;
}

export function ControlBar() {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [payload, setPayload] = useState<OverlayPayload>({
    state: "recording",
    paused: false,
    duration: 0,
  });
  const [dots, setDots] = useState("");

  useEffect(() => {
    const unlistenPromise = listen<OverlayPayload>("recording:state", (event) => {
      setPayload(event.payload);
    });
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (payload.state !== "processing") {
      setDots("");
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [payload.state]);

  const sendCommand = (cmd: "pause" | "resume" | "stop" | "cancel") => {
    emit(`overlay:${cmd}`);
  };

  const isProcessing = payload.state === "processing";
  const isPaused = payload.paused;

  const statusLabel = isProcessing
    ? (lang === "ar" ? "جارٍ المعالجة" : "Processing")
    : isPaused
    ? (lang === "ar" ? "موقوف" : "Paused")
    : (lang === "ar" ? "تسجيل" : "REC");

  const statusColor = isProcessing
    ? "var(--accent)"
    : isPaused
    ? "var(--warning)"
    : "var(--danger, #dc2626)";

  return (
    <div
      className="h-screen w-screen overflow-hidden flex items-center justify-center"
      style={{ background: "transparent" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="flex items-center gap-2 h-12 px-3 select-none"
        style={{
          background: "var(--surface)",
          border: `1px solid ${isProcessing ? "var(--accent-border)" : "var(--border)"}`,
          borderRadius: 999,
          boxShadow: "0 12px 32px -8px rgba(0,0,0,.35)",
          backdropFilter: "blur(14px)",
          animation: "overlayPop 0.25s ease-out",
        }}
      >
        <div
          data-tauri-drag-region
          className="flex items-center gap-2 px-2 cursor-grab"
        >
          {isProcessing ? (
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin"
            />
          ) : isPaused ? (
            <Pause size={14} fill="currentColor" style={{ color: statusColor }} />
          ) : (
            <span className="relative inline-flex">
              <span
                className="absolute inline-flex w-2.5 h-2.5 rounded-full opacity-75 animate-ping"
                style={{ background: statusColor }}
              />
              <span
                className="relative inline-flex w-2.5 h-2.5 rounded-full"
                style={{ background: statusColor }}
              />
            </span>
          )}
          <span
            className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
            style={{ color: statusColor, fontFamily: '"Inter", system-ui' }}
          >
            {statusLabel}
            {isProcessing && dots}
          </span>
          {!isProcessing && (
            <span
              className="text-sm font-mono font-bold whitespace-nowrap"
              style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}
            >
              {formatDuration(payload.duration)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ms-auto">
          {!isProcessing && (
            isPaused ? (
              <IconButton
                tone="accent"
                onClick={() => sendCommand("resume")}
                title={lang === "ar" ? "استئناف" : "Resume"}
              >
                <Play size={14} fill="currentColor" />
              </IconButton>
            ) : (
              <IconButton
                tone="muted"
                onClick={() => sendCommand("pause")}
                title={lang === "ar" ? "إيقاف مؤقت" : "Pause"}
              >
                <Pause size={14} fill="currentColor" />
              </IconButton>
            )
          )}

          {!isProcessing && (
            <button
              onClick={() => sendCommand("stop")}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent-2), var(--accent))",
                color: "#fff",
                boxShadow: "0 4px 12px -2px rgba(0,0,0,.25)",
              }}
              title={lang === "ar" ? "إنهاء ومعالجة" : "Stop & Process"}
            >
              <Square size={12} fill="currentColor" />
              <span>{lang === "ar" ? "إنهاء" : "Stop"}</span>
            </button>
          )}

          <IconButton
            tone="danger"
            onClick={() => sendCommand("cancel")}
            title={lang === "ar" ? "إلغاء" : "Cancel"}
          >
            <X size={14} strokeWidth={2.5} />
          </IconButton>
        </div>
      </div>

      <style>{`
        @keyframes overlayPop {
          from { transform: translateY(8px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        html, body, #root { background: transparent !important; }
      `}</style>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone: "accent" | "muted" | "danger";
}) {
  const palette = {
    accent: { bg: "var(--accent-soft)", color: "var(--accent)", border: "var(--accent-border)" },
    muted: { bg: "var(--surface-2)", color: "var(--text)", border: "var(--border)" },
    danger: { bg: "var(--danger-bg, rgba(220,38,38,.12))", color: "var(--danger, #dc2626)", border: "rgba(220,38,38,.4)" },
  }[tone];

  return (
    <button
      onClick={onClick}
      title={title}
      className="grid place-items-center w-8 h-8 rounded-full transition-transform hover:scale-110"
      style={{
        background: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
      }}
    >
      {children}
    </button>
  );
}

