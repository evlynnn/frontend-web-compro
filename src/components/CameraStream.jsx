import { useRef, useEffect } from "react";

const CameraStream = ({ streamUrl, isStreaming, onError }) => {
    const imgRef = useRef(null);
    const hasErrorRef = useRef(false);

    // Update src only when streamUrl actually changes (refresh button)
    useEffect(() => {
        if (isStreaming && imgRef.current) {
            hasErrorRef.current = false;
            imgRef.current.src = streamUrl;
        }
    }, [streamUrl]); // Only depend on streamUrl, not isStreaming

    return (
        <img
            ref={imgRef}
            alt="Camera Stream"
            style={{
                display: isStreaming ? "block" : "none",
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "black"
            }}
            onError={() => {
                if (!hasErrorRef.current && isStreaming) {
                    hasErrorRef.current = true;
                    console.warn("[CameraStream] Error loading stream");
                    if (typeof onError === "function") {
                        onError();
                    }
                }
            }}
        />
    );
};

export default CameraStream;
