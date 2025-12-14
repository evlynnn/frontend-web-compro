import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import RegisterRequest from "./components/RegisterRequest";
import ResetPasswordRequest from "./components/ResetPasswordRequest";
import Logging from "./components/Logging";

export default function App() {
  const [theme, setTheme] = useState("dark");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const sharedProps = {
    theme,
    setTheme,
    userName: user?.username || "-",
    userRole: user?.role || "-",
    user,
    onLogout: handleLogout,
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword {...sharedProps} />} />

      <Route path="/dashboard" element={<Dashboard {...sharedProps} />} />
      <Route path="/register-request" element={<RegisterRequest {...sharedProps} />} />
      <Route path="/reset-password-request" element={<ResetPasswordRequest {...sharedProps} />} />
      <Route path="/logging" element={<Logging {...sharedProps} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
