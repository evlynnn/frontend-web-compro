import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCurrent = () => {
  return {
    userName: localStorage.getItem("userName"),
    userRole: localStorage.getItem("userRole"),
  };
};

export const getPendingUsers = async () => {
  try {
    const res = await axios.get(`${baseUrl}/users/pending`, {
      headers: { ...authHeaders() },
    });

    return res.data; 
  } catch (err) {
    console.error("Failed to get Pending:", err?.response || err?.message);
    throw err;
  }
};

export const approveUser = async (userId, role) => {
  try {
    const res = await axios.post(
      `${baseUrl}/users/approve?id=${encodeURIComponent(userId)}`,
      role ? { role } : {},
      { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );

    return res.data;
  } catch (err) {
    console.error("Failed to Approve:", err?.response || err?.message);
    throw err;
  }
};

export const rejectUser = async (userId) => {
  try {
    const res = await axios.post(
      `${baseUrl}/users/approve?id=${encodeURIComponent(userId)}&action=reject`,
      {},
      { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );

    return res.data;
  } catch (err) {
    console.error("Failed to Reject:", err?.response || err?.message);
    throw err;
  }
};


export const getPendingReset = async () => {
  try {
    const res = await axios.get(`${baseUrl}/users/pending`, {
      headers: { ...authHeaders() },
    });

    return res.data?? [];
  } catch (err) {
    console.error("Failed to get Pending:", err?.response || err?.message);
    throw err;
  }
};

export const approveResetRequest = async (userId) => {
  try {
    const res = await axios.post(
      `${baseUrl}/users/approve?id=${encodeURIComponent(userId)}`,
      {}, 
      { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );

    return res.data; 
  } catch (err) {
    console.error("Failed to Approve Reset:", err?.response || err?.message);
    throw err;
  }
};

export const rejectResetRequest = async (userId) => {
  try {
    const res = await axios.post(
      `${baseUrl}/users/approve?id=${encodeURIComponent(userId)}&action=reject`,
      {},
      { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );

    return res.data; 
  } catch (err) {
    console.error("Failed to Reject Reset:", err?.response || err?.message);
    throw err;
  }
};