import { useEffect, useRef, useState, useCallback } from "react";

const useWebSocket = (onDetection) => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const wsUrl = baseUrl?.replace(/^http/, "ws") + "/ws";

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("[WebSocket] Connected");
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "detection") {
                        setLastEvent(data);
                        if (typeof onDetection === "function") {
                            onDetection(data);
                        }
                    }
                } catch (err) {
                    console.error("[WebSocket] Failed to parse message:", err);
                }
            };

            ws.onerror = (err) => {
                console.error("[WebSocket] Error:", err);
            };

            ws.onclose = () => {
                console.log("[WebSocket] Disconnected");
                setIsConnected(false);
                wsRef.current = null;

                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log("[WebSocket] Attempting reconnect...");
                    connect();
                }, 3000);
            };

            wsRef.current = ws;
        } catch (err) {
            console.error("[WebSocket] Connection failed:", err);
        }
    }, [wsUrl, onDetection]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { isConnected, lastEvent, reconnect: connect, disconnect };
};

export default useWebSocket;
