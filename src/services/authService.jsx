import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const login = async (userData) => {
  try {
    const response = await axios.post(`${baseUrl}/users/login`, userData, {
        headers: { "Content-Type": "application/json" },
    });

    const token = response?.data?.token;
    if (token) localStorage.setItem("token", token);

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
