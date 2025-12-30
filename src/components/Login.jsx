import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { login as loginService } from "../services/authService";
import PopupModal from "./PopupModal";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("error");
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const showModal = (type, message, title) => {
    setModalType(type);
    setModalMessage(message);
    setModalTitle(title || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorUsername("");
    setErrorPassword("");

    let valid = true;

    if (!username.trim()) {
      setErrorUsername("Username cannot be empty");
      valid = false;
    }

    if (!password.trim()) {
      setErrorPassword("Password cannot be empty");
      valid = false;
    }

    if (!valid) return;

    setIsSubmitting(true);
    try {
      const payload = { username: username.trim(), password: password.trim() };
      const res = await loginService(payload);

      const userFromBackend = {
        id: res?.data?.id,
        username: res?.data?.username,
        role: res?.data?.role,
      };

      localStorage.setItem("user", JSON.stringify(userFromBackend));
      onLogin?.(userFromBackend);

      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.data?.status;
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message;

      if (status === "pending" || status === "rejected") {
        showModal("error", backendMsg, "Failed to Login");
        return;
      }

      if (status === "reset_pending") {
        setErrorUsername(backendMsg);
        return;
      }

      setErrorPassword(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-gray dark:bg-primary-black flex items-center justify-center px-4 xs:px-5 sm:px-6 py-8 sm:py-10 relative overflow-hidden transition-colors duration-300">
      <PopupModal
        open={modalOpen}
        type={modalType}
        title={modalTitle || (modalType === "success" ? "Success" : "Failed to Login")}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />

      {/* Login Card */}
      <div
        className={[
          "relative z-10 w-full",
          "max-w-sm xs:max-w-md md:max-w-lg lg:max-w-md",
          "px-5 xs:px-6 sm:px-10",
          "py-8 xs:py-9 sm:py-12",
          "bg-primary-white dark:bg-zinc-900",
          "rounded-3xl shadow-xl text-center transition-colors duration-300",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="mb-4 xs:mb-5 flex flex-col items-center">
          <div className="rounded-full p-3 bg-white/60 shadow-sm ring-2 ring-gray-300">
            <img
              src={Logo}
              alt="App Logo"
              className="w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 object-contain"
            />
          </div>
        </div>

        <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-primary-black dark:text-white mb-2">
          Sign in to your account
        </h1>

        <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
          Please log in to access the monitoring and analytics dashboard.
        </p>

        <form className="space-y-4 sm:space-y-5 text-left" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-1">
            <label className="block text-xs xs:text-sm font-medium text-primary-black dark:text-white">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorUsername) setErrorUsername("");
                if (errorPassword) setErrorPassword("");
              }}
              className={[
                "w-full rounded-lg border px-3 py-2.5 sm:py-2 text-xs xs:text-sm outline-none focus:ring-2",
                "bg-white dark:bg-zinc-800 dark:text-white",
                errorUsername
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
              ].join(" ")}
              autoComplete="username"
              disabled={isSubmitting}
            />
            {errorUsername && <p className="text-red-500 text-xs mt-1">{errorUsername}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs xs:text-sm font-medium text-primary-black dark:text-white">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorPassword) setErrorPassword("");
                  if (errorUsername) setErrorUsername("");
                }}
                className={[
                  "w-full rounded-lg border px-3 py-2.5 sm:py-2 pr-10 text-xs xs:text-sm outline-none focus:ring-2",
                  "bg-white dark:bg-zinc-800 dark:text-white",
                  errorPassword
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
                ].join(" ")}
                autoComplete="current-password"
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2.5 flex items-center px-1 text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white disabled:opacity-60"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {errorPassword && <p className="text-red-500 text-xs mt-1">{errorPassword}</p>}

            {/* Forgot password */}
            <div className="mt-2 flex items-center justify-end gap-1">
              <span className="text-[11px] xs:text-xs text-gray-500 dark:text-gray-400">
                Forgot password?
              </span>
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-[11px] xs:text-xs font-semibold text-primary-black dark:text-white underline underline-offset-2 disabled:opacity-60"
                disabled={isSubmitting}
              >
                Reset password
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "mt-2 w-full rounded-lg",
              "bg-primary-black dark:bg-primary-yellow",
              "py-2.5 sm:py-2",
              "text-xs xs:text-sm font-semibold",
              "text-primary-white dark:text-primary-black",
              "hover:bg-primary-yellow hover:text-primary-black dark:hover:bg-white",
              "transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Register Redirect */}
        <p className="mt-4 text-xs xs:text-sm text-center text-primary-black dark:text-white">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
            disabled={isSubmitting}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
