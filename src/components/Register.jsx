import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Error States
  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let valid = true;

    // Reset all errors first
    setErrorUsername("");
    setErrorPassword("");
    setErrorConfirm("");

    // Validation
    if (!username.trim()) {
      setErrorUsername("Username cannot be empty");
      valid = false;
    }

    if (!password.trim()) {
      setErrorPassword("Password cannot be empty");
      valid = false;
    }

    if (!confirmPass.trim()) {
      setErrorConfirm("Please confirm your password");
      valid = false;
    } else if (password !== confirmPass) {
      setErrorConfirm("Passwords do not match");
      valid = false;
    }

    if (!valid) return;

    navigate("/"); 
  };

  return (
    <div className="min-h-screen bg-secondary-gray flex items-center justify-center relative overflow-hidden">

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-10 py-10 sm:py-12 bg-primary-white rounded-3xl shadow-xl text-center">

        {/* Logo */}
        <div className="mb-5 flex flex-col items-center">
          <div className="rounded-full p-3 bg-white/60 shadow-sm ring-2 ring-gray-300">
            <img
              src={Logo}
              alt="App Logo"
              className="w-18 h-18 object-contain"
            />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-primary-black mb-2">
          Create your account
        </h1>

        <p className="text-sm text-gray-500 mb-8">
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
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorUsername) setErrorUsername("");
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                ${
                  errorUsername
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-primary-yellow"
                }`}
            />
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorPassword) setErrorPassword("");
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                  ${
                    errorPassword
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-primary-yellow"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {errorPassword && <p className="text-red-500 text-xs mt-1">{errorPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">Confirm Password</label>

            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPass}
                onChange={(e) => {
                  setConfirmPass(e.target.value);
                  if (errorConfirm) setErrorConfirm("");
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                  ${
                    errorConfirm
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-primary-yellow"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPass((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black"
              >
                {showConfirmPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {errorConfirm && <p className="text-red-500 text-xs mt-1">{errorConfirm}</p>}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary-black py-2.5 text-sm font-semibold text-primary-white hover:bg-primary-yellow hover:text-primary-black transition-colors"
          >
            Create Account
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
