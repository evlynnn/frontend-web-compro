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

  const sharedProps = {
    theme,
    setTheme,
    userName: "Evelyn",
    userRole: "Verificator",
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword {...sharedProps} />} />
      <Route path="/dashboard" element={<Dashboard {...sharedProps} />} />
      <Route path="/register-request" element={<RegisterRequest {...sharedProps} />} />
      <Route path="/reset-password-request" element={<ResetPasswordRequest {...sharedProps} />} />
      <Route path="/logging" element={<Logging {...sharedProps}/>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
