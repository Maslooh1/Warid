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
      className="flex items-center justify-between gap-3 px-4 py-2 text-sm shrink-0"
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ArrowUpCircle size={16} strokeWidth={2} className="shrink-0" />
        <span className="font-medium">{t("upd_available")} —</span>
        <span className="truncate">{t("upd_desc", version)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="https://mohamedmaslooh.github.io/Warid/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.25)" }}
        >
          {t("upd_download")}
        </a>
        <button
          type="button"
          onClick={onDismiss}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label={t("upd_dismiss")}
        >
          <X size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
