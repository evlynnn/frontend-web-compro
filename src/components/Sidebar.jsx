import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Logo from "../assets/Logo.png";

const ThemeToggleSwitch = ({ theme = "dark", setTheme }) => {
  const isDark = theme === "dark";
  const canToggle = typeof setTheme === "function";

  return (
    <button
      type="button"
      onClick={() => {
        if (!canToggle) return;
        setTheme(isDark ? "light" : "dark");
      }}
      disabled={!canToggle}
      role="switch"
      aria-checked={isDark}
      title={isDark ? "Dark mode" : "Light mode"}
      className={[
        "relative w-14 h-7 rounded-full px-1.5",
        "flex items-center justify-between",
        "border border-white/10 shadow-inner",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary-yellow/60",
        canToggle ? "cursor-pointer" : "opacity-60 cursor-not-allowed",
        isDark ? "bg-black/70 ring-1 ring-primary-yellow/60" : "bg-white/70",
      ].join(" ")}
    >
      <span className={`-mt-[1px] ${isDark ? "text-white/40" : "text-black/70"}`}>
        <LightModeRoundedIcon sx={{ fontSize: 15 }} />
      </span>

      <span className={`-mt-[1px] ${isDark ? "text-white/75" : "text-black/45"}`}>
        <DarkModeRoundedIcon sx={{ fontSize: 15 }} />
      </span>

      <span
        className={[
          "absolute inset-y-1 my-auto w-5 h-5 rounded-full shadow-md transition-all duration-200",
          isDark ? "bg-white left-1" : "bg-black right-1",
        ].join(" ")}
      />
    </button>
  );
};

const Sidebar = (props) => {
  const {
    activeSection,
    theme = "dark",
    setTheme,
    userName = "Evelyn",
    userRole = "Verificator",
  } = props;

  const goTo = props.scrollToSection || props.onScrollToSection || (() => {});
  const logout = props.handleLogout || props.onLogout || (() => {});

  const navigate = useNavigate();
  const location = useLocation();

  const role = String(userRole).trim().toLowerCase();
  const isVerificator = role === "verificator";

  // routes
  const DASHBOARD_PATH = "/dashboard";
  const USER_REQUEST_PATH = "/register-request";
  const RESET_PASSWORD_PATH = "/reset-password-request";

  const isOnSubPage =
    location.pathname === USER_REQUEST_PATH ||
    location.pathname === RESET_PASSWORD_PATH;

  const isRouteActive = (path) => location.pathname === path;

  const handleDashboardSectionClick = (section) => {
    if (isOnSubPage) {
      navigate(DASHBOARD_PATH, {
        state: { scrollTo: section },
        replace: false, 
      });
      return;
    }
    goTo(section);
  };

  const navBtnClass = (key, forceActive) => {
    const active =
      typeof forceActive === "boolean" ? forceActive : activeSection === key;

    return [
      "w-full text-left px-3 py-2 rounded-2xl font-semibold transition",
      active ? "bg-primary-yellow text-primary-black" : "text-white/80 hover:bg-white/5",
    ].join(" ");
  };

  return (
    <aside className="fixed inset-y-0 left-0 h-screen w-60 md:w-64 z-[9999] pointer-events-auto border-r border-white/10 flex flex-col px-5 py-6 bg-primary-black text-white">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center mb-3">
            <img src={Logo} alt="AI Lab Logo" className="w-15 h-15 object-contain" />
          </div>

          <div className="flex flex-col items-center text-center leading-tight">
            <span className="text-sm font-semibold tracking-wide">Monitoring Dashboard</span>
            <span className="text-[11px] text-white/60">AI Lab • Smart Door Access</span>
          </div>
        </div>

        <div className="mb-4 border-t border-white/10" />

        <nav className="flex flex-col flex-1 min-h-0 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => handleDashboardSectionClick("camera")}
            className={navBtnClass("camera")}
          >
            Camera Monitor
          </button>

          <button
            type="button"
            onClick={() => handleDashboardSectionClick("logs")}
            className={navBtnClass("logs")}
          >
            Door Access Logs
          </button>

          <button
            type="button"
            onClick={() => handleDashboardSectionClick("analytics")}
            className={navBtnClass("analytics")}
          >
            Analytics
          </button>

          {isVerificator && (
            <>
              <button
                type="button"
                onClick={() => navigate(USER_REQUEST_PATH)}
                className={navBtnClass("register-request", isRouteActive(USER_REQUEST_PATH))}
              >
                Register Request
              </button>

              <button
                type="button"
                onClick={() => navigate(RESET_PASSWORD_PATH)}
                className={navBtnClass("reset-password-request", isRouteActive(RESET_PASSWORD_PATH))}
              >
                Reset Password Request
              </button>
            </>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-2xl text-white/80 hover:bg-red-500/10 hover:text-red-400 transition font-semibold"
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{userName}</span>
          <span className="text-[11px] text-white/60">{userRole}</span>
        </div>

        <ThemeToggleSwitch theme={theme} setTheme={setTheme} />
      </div>
    </aside>
  );
};

export default Sidebar;
