import { useEffect, useMemo, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { registerUser } from "../services/authService";

const ModalPopup = ({ open, type = "success", message, onClose }) => {
  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3
          className={`text-lg font-semibold ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {isSuccess ? "Success" : "Failed to Register"}
        </h3>

        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-primary-black py-2 text-sm font-semibold text-white hover:bg-primary-yellow hover:text-primary-black transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

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

  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  const parseRegisterError = (err) => {
    const backendError =
      err?.response?.data?.error ||   
      err?.message;

    const lowered = String(backendError).toLowerCase();

    const usernameTaken =
      lowered.includes("username") &&
      (lowered.includes("exist") || lowered.includes("already") || lowered.includes("duplicate"));

    const msg = usernameTaken
      ? "Username already exists"
      : backendError || "Failed to register. Please try again.";

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

      await registerUser(payload);

      setUsername("");
      setPassword("");
      setConfirmPass("");
      setShowPassword(false);
      setShowConfirmPass(false);

      // ✅ POPUP hanya untuk success
      showModal("success", "User created successfully, wait for verifier approval.");
    } catch (err) {
      const { msg, usernameTaken } = parseRegisterError(err);

      // ✅ ERROR: tidak pakai popup sama sekali
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
    <div className="min-h-screen bg-secondary-gray flex items-center justify-center relative overflow-hidden">
      <ModalPopup
        open={modalOpen}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-10 py-10 sm:py-12 bg-primary-white rounded-3xl shadow-xl text-center">
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center">
          <div className="rounded-full p-3 bg-white/60 shadow-sm ring-2 ring-gray-300">
            <img src={Logo} alt="App Logo" className="w-18 h-18 object-contain" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-primary-black mb-2">
          Create your account
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Register to access the monitoring and analytics dashboard.
        </p>

        {/* FORM */}
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
                const val = (e.target.value || "").toLowerCase();
                setUsername(val);

                if (errorUsername) setErrorUsername("");
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                ${
                  errorUsername
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-primary-yellow"
                } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            />

            {usernameHint && !errorUsername && (
              <p className="text-gray-500 text-xs mt-1">{usernameHint}</p>
            )}

            {errorUsername && <p className="text-red-500 text-xs mt-1">{errorUsername}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">Password</label>

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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                  ${
                    errorPassword
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-primary-yellow"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPassword((prev) => !prev)}
                className={`absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {!errorPassword && password && password.length < 8 && (
              <p className="text-gray-500 text-xs mt-1">Min. 8 characters</p>
            )}

            {errorPassword && <p className="text-red-500 text-xs mt-1">{errorPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">
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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                  ${
                    errorConfirm
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-primary-yellow"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmPass((prev) => !prev)}
                className={`absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {showConfirmPass ? (
                  <VisibilityOff fontSize="small" />
                ) : (
                  <Visibility fontSize="small" />
                )}
              </button>
            </div>

            {errorConfirm && <p className="text-red-500 text-xs mt-1">{errorConfirm}</p>}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors
              ${
                isSubmitting
                  ? "bg-black/60 text-white cursor-not-allowed"
                  : "bg-primary-black text-primary-white hover:bg-primary-yellow hover:text-primary-black"
              }`}
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Redirect to Login */}
        <p className="mt-4 text-sm text-center text-primary-black">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-semibold underline underline-offset-2"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
