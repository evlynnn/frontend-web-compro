import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { resetRequest } from "../services/authService";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);

  const [errorUsername, setErrorUsername] = useState("");
  const [errorNewPassword, setErrorNewPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;

    setErrorUsername("");
    setErrorNewPassword("");
    setErrorConfirm("");

    if (!username.trim()) {
      setErrorUsername("Username cannot be empty");
      valid = false;
    }

    if (!newPassword.trim()) {
      setErrorNewPassword("New password cannot be empty");
      valid = false;
    } else if (newPassword.length < 8) {
      setErrorNewPassword("Password must be at least 8 characters");
      valid = false;
    }

    if (!confirmNewPass.trim()) {
      setErrorConfirm("Please confirm your new password");
      valid = false;
    } else if (newPassword !== confirmNewPass) {
      setErrorConfirm("Passwords do not match");
      valid = false;
    }

    if (!valid) return;

    try {
      setIsSubmitting(true);

      const payload = {
        username: username.trim(),
        password: newPassword,
        confirmPassword: confirmNewPass,
      };

      const res = await resetRequest(payload);

      setSuccessMessage(res?.message);
      setSubmitted(true);
    } catch (err) {
      const backendMsg =
        err?.response?.data?.error || err?.response?.data?.message || err?.message;

      setErrorUsername(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-gray dark:bg-primary-black flex items-center justify-center px-4 xs:px-5 sm:px-6 py-8 sm:py-10 relative overflow-hidden transition-colors duration-300">
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

        {!submitted ? (
          <>
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-primary-black dark:text-white mb-2">
              Reset Password
            </h1>

            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
              Submit a reset request. Your new password will be applied after approval by the Verificator.
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
                    setUsername(e.target.value);
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
                />

                {errorUsername && <p className="text-red-500 text-xs mt-1">{errorUsername}</p>}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs xs:text-sm font-medium text-primary-black dark:text-white">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorNewPassword) setErrorNewPassword("");
                    }}
                    className={[
                      "w-full rounded-lg border px-3 py-2.5 sm:py-2 pr-10 text-xs xs:text-sm outline-none focus:ring-2",
                      "bg-white dark:bg-zinc-800 dark:text-white",
                      errorNewPassword
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 dark:border-zinc-700 focus:ring-primary-yellow",
                      isSubmitting ? "opacity-70 cursor-not-allowed" : "",
                    ].join(" ")}
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className={[
                      "absolute inset-y-0 right-2.5 flex items-center px-1",
                      "text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white",
                      isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </button>
                </div>

                {errorNewPassword && (
                  <p className="text-red-500 text-xs mt-1">{errorNewPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs xs:text-sm font-medium text-primary-black dark:text-white">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmNewPass ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmNewPass}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setConfirmNewPass(e.target.value);
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
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmNewPass((prev) => !prev)}
                    className={[
                      "absolute inset-y-0 right-2.5 flex items-center px-1",
                      "text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white",
                      isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-label={showConfirmNewPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPass ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </button>
                </div>

                {errorConfirm && <p className="text-red-500 text-xs mt-1">{errorConfirm}</p>}
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  "mt-2 w-full rounded-lg py-2.5 sm:py-2",
                  "text-xs xs:text-sm font-semibold transition-colors",
                  isSubmitting
                    ? "bg-black/60 text-primary-white cursor-not-allowed"
                    : "bg-primary-black dark:bg-primary-yellow text-primary-white dark:text-primary-black hover:bg-primary-yellow hover:text-primary-black dark:hover:bg-white",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {isSubmitting ? "Sending Request..." : "Reset Password"}
              </button>
            </form>

            <p className="mt-4 text-xs xs:text-sm text-center text-primary-black dark:text-white">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-semibold underline underline-offset-2 disabled:opacity-60"
                disabled={isSubmitting}
              >
                Back to Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-primary-black dark:text-white mb-2">
              Request Sent ✅
            </h1>

            <div className="mt-5 sm:mt-6 text-left rounded-2xl bg-secondary-gray/60 dark:bg-zinc-800 p-4 sm:p-5">
              <p className="text-xs xs:text-sm text-primary-black dark:text-white font-semibold">
                {successMessage || "Your password reset request has been submitted."}
              </p>

              <p className="text-[11px] xs:text-sm text-gray-600 dark:text-gray-400 mt-1">
                It is now waiting for approval from the{" "}
                <span className="font-semibold">Verificator</span>.
              </p>

              <div className="mt-4 text-[11px] xs:text-xs text-gray-500 dark:text-gray-400">
                <p className="break-words">
                  <span className="font-semibold text-primary-black dark:text-white">Username:</span>{" "}
                  {username || "-"}
                </p>
                <p className="mt-1">You will be able to sign in after approval.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className={[
                "mt-6 w-full rounded-lg py-2.5 sm:py-2",
                "text-xs xs:text-sm font-semibold transition-colors",
                "bg-primary-black dark:bg-primary-yellow text-primary-white dark:text-primary-black",
                "hover:bg-primary-yellow hover:text-primary-black dark:hover:bg-white",
              ].join(" ")}
            >
              Back to Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
