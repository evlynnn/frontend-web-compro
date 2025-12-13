import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png"; 

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let valid = true;

    setErrorUsername("");
    setErrorPassword("");

    if (!username.trim()) {
      setErrorUsername("Username cannot be empty");
      valid = false;
    }

    if (!password.trim()) {
      setErrorPassword("Password cannot be empty");
      valid = false;
    }

    if (!valid) return;

    navigate("/dashboard");
    onLogin?.({ username, password });
  };

  return (
    <div className="min-h-screen bg-secondary-gray flex items-center justify-center relative overflow-hidden">
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-10 py-10 sm:py-12 bg-primary-white rounded-3xl shadow-xl text-center">
        
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center">
          <div className="rounded-full p-3 bg-white/60 shadow-sm ring-2 ring-gray-300">
            <img src={Logo} 
            alt="App Logo" 
            className="w-18 h-18 object-contain" 
            />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-primary-black mb-2">
          Sign in to your account
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Please log in to access the monitoring and analytics dashboard.
        </p>

        <form className="space-y-5 text-left" onSubmit={handleSubmit}>

          {/* Username */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">
              Username
            </label>
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
            {errorUsername && (
              <p className="text-red-500 text-xs mt-1">{errorUsername}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">
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
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 
                  ${
                    errorPassword
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-primary-yellow"
                  }`}
              />

              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-primary-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <VisibilityOff fontSize="small" />
                ) : (
                  <Visibility fontSize="small" />
                )}
              </button>
            </div>

            {errorPassword && (
              <p className="text-red-500 text-xs mt-1">{errorPassword}</p>
            )}

            {/* Forgot password */}
            <div className="mt-2 text-right">
              <span className="text-xs text-gray-500">Forgot password? </span>
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-xs font-semibold text-primary-black underline underline-offset-2"
              >
                Reset password
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary-black py-2.5 text-sm font-semibold text-primary-white hover:bg-primary-yellow hover:text-primary-black transition-colors"
          >
            Sign In
          </button>
        </form>

        {/* Register Redirect */}
        <p className="mt-4 text-sm text-center text-primary-black">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold underline underline-offset-2"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;