import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getStreamUrl = () => `${baseUrl}/camera/stream`;

export const getSnapshotUrl = () => `${baseUrl}/camera/snapshot`;

export const getCameraStatus = async () => {
    try {
        const res = await axios.get(`${baseUrl}/camera/status`, {
            headers: { ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to get camera status:", err?.response || err?.message);
        throw err;
    }
};

export const startCamera = async () => {
    try {
        const res = await axios.post(`${baseUrl}/camera/start`, {}, {
            headers: { ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to start camera:", err?.response || err?.message);
        throw err;
    }
};

export const stopCamera = async () => {
    try {
        const res = await axios.post(`${baseUrl}/camera/stop`, {}, {
            headers: { ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to stop camera:", err?.response || err?.message);
        throw err;
    }
};

export const getCameraConfig = async () => {
    try {
        const res = await axios.get(`${baseUrl}/camera/config`, {
            headers: { ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to get camera config:", err?.response || err?.message);
        throw err;
    }
};

export const updateCameraConfig = async (config) => {
    try {
        const res = await axios.post(`${baseUrl}/camera/config`, config, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to update camera config:", err?.response || err?.message);
        throw err;
    }
};

export const getCameraZones = async () => {
    try {
        const res = await axios.get(`${baseUrl}/camera/zones`, {
            headers: { ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to get camera zones:", err?.response || err?.message);
        throw err;
    }
};

export const updateCameraZones = async (zones) => {
    try {
        const res = await axios.post(`${baseUrl}/camera/zones`, zones, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to update camera zones:", err?.response || err?.message);
        throw err;
    }
};

export const setupDroidCam = async (ip, port = 4747) => {
    try {
        const res = await axios.post(`${baseUrl}/camera/test/droidcam`, { ip, port }, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to setup DroidCam:", err?.response || err?.message);
        throw err;
    }
};

export const setupRTSP = async (url) => {
    try {
        const res = await axios.post(`${baseUrl}/camera/test/rtsp`, { url }, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to setup RTSP:", err?.response || err?.message);
        throw err;
    }
};
