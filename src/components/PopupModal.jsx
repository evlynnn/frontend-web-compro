const PopupModal = ({
  open,
  type = "success",
  title,
  message,
  onClose,
  okText = "OK",
}) => {
  if (!open) return null;

  const isSuccess = type === "success";

  const computedTitle =
    title || (isSuccess ? "Success" : "Something went wrong");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
        <h3
          className={`text-lg font-semibold ${isSuccess ? "text-green-700" : "text-red-700"
            }`}
        >
          {computedTitle}
        </h3>

        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-primary-black dark:bg-primary-yellow py-2 text-sm font-semibold text-white dark:text-primary-black hover:bg-primary-yellow hover:text-primary-black dark:hover:bg-white transition-colors"
        >
          {okText}
        </button>
      </div>
    </div>
  );
};

export default PopupModal;
