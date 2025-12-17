import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getLogs = async () => {
  try {
    const res = await axios.get(`${baseUrl}/logs`, {
      headers: { ...authHeaders() },
    });

    return res.data;
  } catch (err) {
    console.error("Failed to get Logs:", err?.response || err?.message);
    throw err;
  }
};

export const getFilteredLogs = async (params = {}) => {
  try {
    const res = await axios.get(`${baseUrl}/logs/filter`, {
      params,
      headers: { ...authHeaders() },
    });

    return res.data;
  } catch (err) {
    console.error("Failed to get Filter Logs:", err?.response || err?.message);
    throw err;
  }
};

export const createLog = async (payload) => {
  try {
    const res = await axios.post(`${baseUrl}/logs`, payload, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });

    return res.data;
  } catch (err) {
    console.error("Failed to Create Logs:", err?.response || err?.message);
    throw err;
  }
};
