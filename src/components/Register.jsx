import { useMemo, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { registerUser } from "../services/authService";
import PopupModal from "./PopupModal";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const showModal = (type, message, title) => {
    setModalType(type);
    setModalMessage(message);
    setModalTitle(title || "");
    setModalOpen(true);
  };

  const parseRegisterError = (err) => {
    const backendError =
      err?.response?.data?.error || err?.response?.data?.message || err?.message;

    const lowered = String(backendError).toLowerCase();

    const usernameTaken =
      lowered.includes("username") &&
      (lowered.includes("exist") ||
        lowered.includes("already") ||
        lowered.includes("duplicate"));

    const msg = backendError;

    return { msg, usernameTaken };
  };

  const validate = () => {
    let valid = true;

    setErrorUsername("");
    setErrorPassword("");
    setErrorConfirm("");

    const u = username.trim();

    if (!u) {
      setErrorUsername("Username cannot be empty");
      valid = false;
    } else if (u.length < 5) {
      setErrorUsername("Username must be at least 5 characters");
      valid = false;
    }

    if (!password.trim()) {
      setErrorPassword("Password cannot be empty");
      valid = false;
    } else if (password.length < 8) {
      setErrorPassword("Password must be at least 8 characters");
      valid = false;
    }

    if (!confirmPass.trim()) {
      setErrorConfirm("Please confirm your password");
      valid = false;
    } else if (password !== confirmPass) {
      setErrorConfirm("Passwords do not match");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = validate();
    if (!ok) return;

    try {
      setIsSubmitting(true);

      const payload = {
        username: username.trim(),
        password,
        confirmPassword: confirmPass,
      };

      const res = await registerUser(payload);

      setUsername("");
      setPassword("");
      setConfirmPass("");
      setShowPassword(false);
      setShowConfirmPass(false);

      const backendMessage = res?.message;

      showModal("success", backendMessage, "Success");
    } catch (err) {
      const { msg, usernameTaken } = parseRegisterError(err);

      if (usernameTaken) {
        setErrorUsername(msg);
      } else {
        setErrorUsername(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameHint = useMemo(() => {
    const u = username.trim();
    if (!u) return "";
    if (u.length < 5) return "Min. 5 characters • lowercase only";
    return "Looks good • lowercase only";
  }, [username]);

  return (
    <div className="min-h-screen bg-secondary-gray dark:bg-primary-black flex items-center justify-center px-4 xs:px-5 sm:px-6 py-8 sm:py-10 relative overflow-hidden transition-colors duration-300">
      <PopupModal
        open={modalOpen}
        type={modalType}
        title={modalTitle || (modalType === "success" ? "Success" : "Failed to Register")}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />

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
          Create your account
        </h1>

        <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
          Register to access the monitoring and analytics dashboard.
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
              disabled={isSubmitting}
              onChange={(e) => {
                const val = (e.target.value || "").toLowerCase();
                setUsername(val);
                if (errorUsername) setErrorUsername("");
              }}
              className={[
                "w-full rounded-lg border px-3 py-2.5 sm:py-2 text-xs xs:text-sm outline-none focus:ring-2",
                "bg-white dark:bg-zinc-800 dark:text-white",
                errorUsername
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
              autoComplete="username"
            />

            {usernameHint && !errorUsername && (
              <p className="text-gray-500 dark:text-gray-400 text-[11px] xs:text-xs mt-1">
                {usernameHint}
              </p>
            )}

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
                disabled={isSubmitting}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorPassword) setErrorPassword("");
                }}
                className={[
                  "w-full rounded-lg border px-3 py-2.5 sm:py-2 pr-10 text-xs xs:text-sm outline-none focus:ring-2",
                  "bg-white dark:bg-zinc-800 dark:text-white",
                  errorPassword
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ")}
                autoComplete="new-password"
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPassword((prev) => !prev)}
                className={[
                  "absolute inset-y-0 right-2.5 flex items-center px-1",
                  "text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white",
                  isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {!errorPassword && password && password.length < 8 && (
              <p className="text-gray-500 dark:text-gray-400 text-[11px] xs:text-xs mt-1">
                Min. 8 characters
              </p>
            )}

            {errorPassword && <p className="text-red-500 text-xs mt-1">{errorPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs xs:text-sm font-medium text-primary-black dark:text-white">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPass}
                disabled={isSubmitting}
                onChange={(e) => {
                  setConfirmPass(e.target.value);
                  if (errorConfirm) setErrorConfirm("");
                }}
                className={[
                  "w-full rounded-lg border px-3 py-2.5 sm:py-2 pr-10 text-xs xs:text-sm outline-none focus:ring-2",
                  "bg-white dark:bg-zinc-800 dark:text-white",
                  errorConfirm
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ")}
                autoComplete="new-password"
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmPass((prev) => !prev)}
                className={[
                  "absolute inset-y-0 right-2.5 flex items-center px-1",
                  "text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white",
                  isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                aria-label={showConfirmPass ? "Hide password" : "Show password"}
              >
                {showConfirmPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {errorConfirm && <p className="text-red-500 text-xs mt-1">{errorConfirm}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "mt-2 w-full rounded-lg py-2.5 sm:py-2",
              "text-xs xs:text-sm font-semibold transition-colors",
              isSubmitting
                ? "bg-black/60 text-white cursor-not-allowed"
                : "bg-primary-black dark:bg-primary-yellow text-primary-white dark:text-primary-black hover:bg-primary-yellow hover:text-primary-black dark:hover:bg-white",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-xs xs:text-sm text-center text-primary-black dark:text-white">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
            disabled={isSubmitting}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
