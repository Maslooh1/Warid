import { X, ArrowUpCircle } from "lucide-react";
import { useLang } from "../../lib/useLang";

interface Props {
  version: string;
  onDismiss: () => void;
}

export function UpdateBanner({ version, onDismiss }: Props) {
  const { t } = useLang();

  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{
        width: 320,
        background: "var(--toast-bg)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid var(--toast-accent-ring)",
        borderRadius: 18,
        boxShadow: "var(--toast-shadow), 0 0 28px -2px var(--toast-accent-glow)",
        animation: "toast-in 0.22s ease-out",
      }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-xl grid place-items-center"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <ArrowUpCircle size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
          {t("upd_available")}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          {t("upd_desc", version)}
        </p>
        <a
          href="https://mohamedmaslooh.github.io/Warid/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-85"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {t("upd_download")}
        </a>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 w-7 h-7 rounded-lg grid place-items-center transition-opacity hover:opacity-80"
        style={{ color: "var(--muted)" }}
        aria-label={t("upd_dismiss")}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
