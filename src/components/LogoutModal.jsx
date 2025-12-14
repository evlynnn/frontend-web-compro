const LogoutModal = ({ open, onClose, onConfirm, theme = "dark" }) => {
  if (!open) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        aria-label="Close logout confirmation"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative w-full max-w-sm rounded-2xl border shadow-xl",
          "p-5",
          isDark
            ? "bg-primary-black border-white/10 text-white"
            : "bg-white border-black/10 text-primary-black",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center",
              isDark ? "bg-white/5" : "bg-black/5",
            ].join(" ")}
          >
            <span className={isDark ? "text-red-400" : "text-red-600"}>!</span>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold">Confirm Logout</h3>
            <p className={["mt-1 text-sm", isDark ? "text-white/70" : "text-black/70"].join(" ")}>
              Are you sure you want to logout?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={[
              "px-4 py-2 rounded-xl font-semibold transition",
              isDark
                ? "bg-white/5 text-white/80 hover:bg-white/10"
                : "bg-black/5 text-black/80 hover:bg-black/10",
            ].join(" ")}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl font-semibold transition bg-red-500/15 text-red-400 hover:bg-red-500/25"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
