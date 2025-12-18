import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const login = async (userData) => {
  try {
    const response = await axios.post(`${baseUrl}/users/login`, userData, {
      headers: { "Content-Type": "application/json" },
    });

    const token = response?.data?.token;
    const user = response?.data?.data;

    if (token) localStorage.setItem("token", token);
    if (user?.username) localStorage.setItem("userName", user.username);
    if (user?.role) localStorage.setItem("userRole", user.role);

    return response.data;
  } catch (err) {
    console.error("Failed to Login:", err?.response || err?.message);
    throw err;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${baseUrl}/users/register`, userData, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (err) {
    console.error("Failed to register user:", err?.response || err?.message);
    throw err; 
  }
};

export const resetRequest = async (userData) => {
  try {
    const response = await axios.post(`${baseUrl}/users/reset_request`, userData, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data; 
  } catch (err) {
    console.error("Failed to reset password:", err?.response || err?.message);
    throw err; 
  }
};

export const logout = async () => {
  try {
    await axios.post(`${baseUrl}/users/logout`,{},{
      headers: {
        ...authHeaders(),
      },
    });

  } catch (err) {
    console.warn("Backend logout failed:", err?.response || err?.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
  }

  return true;
};