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
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message 

      setErrorUsername(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-gray flex items-center justify-center relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-6 sm:px-10 py-10 sm:py-12 bg-primary-white rounded-3xl shadow-xl text-center">
        <div className="mb-5 flex flex-col items-center">
          <div className="rounded-full p-3 bg-white/60 shadow-sm ring-2 ring-gray-300">
            <img src={Logo} alt="App Logo" className="w-18 h-18 object-contain" />
          </div>
        </div>

        {!submitted ? (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-black mb-2">
              Reset Password
            </h1>

            <p className="text-sm text-gray-500 mb-8">
              Submit a reset request. Your new password will be applied after approval by the Verificator.
            </p>

            <form className="space-y-5 text-left" onSubmit={handleSubmit}>
              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorUsername) setErrorUsername("");
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                    ${errorUsername ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary-yellow"}
                    ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                {errorUsername && <p className="text-red-500 text-xs mt-1">{errorUsername}</p>}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">New Password</label>

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
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                      ${errorNewPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary-yellow"}
                      ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className={`absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black ${
                      isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                </div>

                {errorNewPassword && <p className="text-red-500 text-xs mt-1">{errorNewPassword}</p>}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">Confirm New Password</label>

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
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                      ${errorConfirm ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary-yellow"}
                      ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmNewPass((prev) => !prev)}
                    className={`absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black ${
                      isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    aria-label={showConfirmNewPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                </div>

                {errorConfirm && <p className="text-red-500 text-xs mt-1">{errorConfirm}</p>}
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors
                  ${
                    isSubmitting
                      ? "bg-black/60 text-primary-white cursor-not-allowed"
                      : "bg-primary-black text-primary-white hover:bg-primary-yellow hover:text-primary-black"
                  }`}
              >
                {isSubmitting ? "Sending Request..." : "Reset Password"}
              </button>
            </form>

            <p className="mt-4 text-sm text-center text-primary-black">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-semibold underline underline-offset-2"
                disabled={isSubmitting}
              >
                Back to Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-black mb-2">
              Request Sent ✅
            </h1>

            <div className="mt-6 text-left rounded-2xl bg-secondary-gray/60 p-4">
              <p className="text-sm text-primary-black font-semibold">
                {successMessage || "Your password reset request has been submitted."}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                It is now waiting for approval from the <span className="font-semibold">Verificator</span>.
              </p>

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  <span className="font-semibold text-primary-black">Username:</span>{" "}
                  {username || "-"}
                </p>
                <p className="mt-1">You will be able to sign in after approval.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 w-full rounded-lg bg-primary-black py-2.5 text-sm font-semibold text-primary-white hover:bg-primary-yellow hover:text-primary-black transition-colors"
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
