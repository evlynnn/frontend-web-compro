const AuthPopup = ({
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
      <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3
          className={`text-lg font-semibold ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {computedTitle}
        </h3>

        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-primary-black py-2 text-sm font-semibold text-white hover:bg-primary-yellow hover:text-primary-black transition-colors"
        >
          {okText}
        </button>
      </div>
    </div>
  );
};

export default AuthPopup;
