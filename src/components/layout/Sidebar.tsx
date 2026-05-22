import {
  Mic,
  History,
  LayoutTemplate,
  Settings,
  Terminal,
  BarChart2,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSettingsStore } from "../../stores/settingsStore";
import { useLang } from "../../lib/useLang";
import type { LangKey } from "../../lib/i18n";

const ALL_NAV_ITEMS: Array<{ to: string; icon: React.ElementType; key: LangKey; logsOnly: boolean }> = [
  { to: "/",          icon: Mic,           key: "nav_record",    logsOnly: false },
  { to: "/upload",    icon: Upload,        key: "nav_upload",    logsOnly: false },
  { to: "/history",   icon: History,       key: "nav_history",   logsOnly: false },
  { to: "/templates", icon: LayoutTemplate,key: "nav_templates", logsOnly: false },
  { to: "/analytics", icon: BarChart2,     key: "nav_analytics", logsOnly: false },
  { to: "/logs",      icon: Terminal,      key: "nav_logs",      logsOnly: true  },
];

export function Sidebar() {
  const { settings } = useSettingsStore();
  const { t } = useLang();
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.logsOnly || settings.logsEnabled);
  return (
    <aside
      className="w-16 flex flex-col items-center py-4 shrink-0 z-20 backdrop-blur-xl"
      style={{
        background: "var(--surface)",
        borderInlineStart: "1px solid var(--border)",
      }}
    >
      <NavLink to="/" className="mb-6 group relative">
        <div
          className="w-10 h-10 flex items-center justify-center text-white font-extrabold text-lg"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            borderRadius: 12,
            boxShadow: "var(--shadow-accent)",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          W
        </div>
        <Tooltip>{t("app_name")}</Tooltip>
      </NavLink>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, key: navKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `nav-icon${isActive ? " active" : ""} group`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <Tooltip>{t(navKey)}</Tooltip>
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `nav-icon${isActive ? " active" : ""} group`
        }
      >
        <Settings size={20} strokeWidth={1.75} />
        <Tooltip>{t("nav_settings")}</Tooltip>
      </NavLink>
    </aside>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute text-xs py-1.5 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium"
      style={{
        background: "var(--text)",
        color: "var(--bg)",
        borderRadius: 8,
        insetInlineEnd: "calc(100% + 8px)",
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      {children}
    </div>
  );
}
