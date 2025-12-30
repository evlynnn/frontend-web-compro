import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import PopupModal from "./PopupModal";
import { getPendingReset, approveResetRequest, rejectResetRequest } from "../services/userService";
import IconButton from "@mui/material/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const formatRequestedAtParts = (raw) => {
  if (!raw) return { date: "-", time: "" };

  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return { date: String(raw), time: "" };

    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  } catch {
    return { date: String(raw), time: "" };
  }
};

const ResetPasswordRequest = (props) => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setSidebarOpen(mq.matches);
    apply();

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const sidebarProps = {
    ...props,
    activeSection: "reset_password_request",
    handleLogout,
    sidebarOpen,
    setSidebarOpen,
  };

  const openPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message || (type === "success" ? "Success" : "Something went wrong"));
    setPopupOpen(true);
  };

  const closePopup = () => setPopupOpen(false);

  const loadData = async ({ silent = true } = {}) => {
    setLoading(true);
    try {
      const res = await getPendingReset();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const onlyReset = list.filter((u) => u.needReset === true);
      setRequests(onlyReset);

      if (!silent) openPopup("success", "Reset requests were loaded successfully.");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load data";
      openPopup("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ silent: true });
  }, []);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => String(r.username || "").toLowerCase().includes(q));
  }, [requests, search]);

  const openConfirmModal = (req) => {
    setSelectedRequest(req);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setSelectedRequest(null);
  };

  const confirmAccept = async () => {
    if (!selectedRequest?.id) return;

    try {
      const res = await approveResetRequest(selectedRequest.id);
      openPopup("success", res?.message || "Reset request approved.");
      await loadData({ silent: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Approve failed.";
      openPopup("error", msg);
    } finally {
      closeConfirmModal();
    }
  };

  const openRejectConfirm = (req) => {
    setSelectedRejectRequest(req);
    setRejectConfirmOpen(true);
  };

  const closeRejectConfirm = () => {
    setRejectConfirmOpen(false);
    setSelectedRejectRequest(null);
  };

  const confirmReject = async () => {
    if (!selectedRejectRequest?.id) return;

    try {
      const res = await rejectResetRequest(selectedRejectRequest.id);
      setRequests((prev) => prev.filter((x) => x.id !== selectedRejectRequest.id));
      openPopup("success", res?.message || "Reset request rejected.");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Reject failed.";
      openPopup("error", msg);
    } finally {
      closeRejectConfirm();
    }
  };

  return (
    <div className="min-h-screen bg-secondary-gray dark:bg-primary-black text-primary-black dark:text-primary-white transition-colors duration-300 overflow-x-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <Sidebar {...sidebarProps} />

      <header className="fixed top-0 left-0 right-0 z-[9999] md:hidden">
        <div className="h-14 bg-primary-black/80 backdrop-blur-md border-b border-white/10 flex items-center px-3">
          <IconButton
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Open sidebar"
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}
          >
            <MenuRoundedIcon sx={{ color: "#fff" }} />
          </IconButton>

          <span className="ml-2 text-sm font-semibold text-white">Reset Password Requests</span>
        </div>
      </header>

      <main className="px-4 py-6 pt-16 md:pt-8 md:px-8 md:py-8 md:pl-64">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm border border-black/10 dark:border-zinc-700 p-5 md:p-6 space-y-6 transition-colors duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-primary-black dark:text-white">
                  Reset Password Requests
                </h1>
                <p className="text-sm text-black/60 dark:text-gray-400">
                  Review user reset password requests.
                </p>
              </div>

              <div className="w-full sm:w-[320px]">
                <label className="text-xs text-black/60 dark:text-gray-400">Search by username</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search here..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-black/30 dark:placeholder:text-gray-500 dark:text-white"
                  />
                  {search.trim() && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-xs text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      type="button"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading && (
              <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-black/[0.02] dark:bg-zinc-800 px-4 py-3 text-sm text-black/60 dark:text-gray-400">
                Loading data from the database...
              </div>
            )}

            <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <div className="max-h-[420px] overflow-y-auto overflow-x-hidden md:overflow-x-auto rounded-xl">
                <table className="w-full text-sm table-fixed">
                  <thead
                    className="
                      sticky top-0 z-20 bg-white dark:bg-zinc-800
                      border-b border-black/10 dark:border-zinc-700
                      shadow-[0_1px_0_0_rgba(0,0,0,0.08)]
                    "
                  >
                    <tr>
                      <th className="px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
                        Username
                      </th>

                      <th className="hidden md:table-cell px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
                        Role
                      </th>

                      <th className="hidden md:table-cell px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
                        Requested At
                      </th>

                      <th className="px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/10 dark:divide-zinc-700">
                    {filteredRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-black/[0.03] dark:hover:bg-zinc-700/50">
                        <td className="px-4 py-3 text-center font-medium text-primary-black dark:text-white truncate">
                          {item.username}
                        </td>

                        <td className="hidden md:table-cell px-4 py-3 text-center text-black/70 dark:text-gray-400 truncate">
                          {item.role || "-"}
                        </td>

                        <td className="hidden md:table-cell px-4 py-3 text-center text-black/70 dark:text-gray-400">
                          {(() => {
                            const { date, time } = formatRequestedAtParts(item?.updated_at);
                            return (
                              <>
                                <div className="hidden md:block lg:hidden leading-tight">
                                  <div>{date}</div>
                                  {time ? <div>{time}</div> : null}
                                </div>

                                <div className="hidden lg:block whitespace-nowrap">
                                  {time ? `${date} ${time}` : date}
                                </div>
                              </>
                            );
                          })()}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openConfirmModal(item)}
                              className="rounded-lg bg-[var(--color-chart-authorized)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => openRejectConfirm(item)}
                              className="rounded-lg bg-[var(--color-chart-unauthorized)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-black/50 dark:text-gray-400">
                          No reset requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {confirmModalOpen && (
          <div className="fixed inset-0 z-50 md:z-[10050] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeConfirmModal} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 text-black dark:text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black dark:text-white">Confirmation</h2>
                  <p className="mt-1 text-sm text-black/60 dark:text-gray-400">
                    Are you sure you want to accept the reset request from{" "}
                    <span className="font-semibold text-black dark:text-white">{selectedRequest?.username}</span>?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-zinc-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-black/10 dark:border-zinc-700 bg-black/[0.02] dark:bg-zinc-800 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-black/60 dark:text-gray-400">Username</span>
                  <span className="font-semibold text-primary-black dark:text-white">{selectedRequest?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60 dark:text-gray-400">Role</span>
                  <span className="font-semibold text-primary-black dark:text-white">{selectedRequest?.role || "-"}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-primary-black dark:text-white hover:bg-black/[0.03] dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAccept}
                  className="rounded-lg bg-[var(--color-chart-authorized)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Yes, Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectConfirmOpen && (
          <div className="fixed inset-0 z-50 md:z-[10050] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeRejectConfirm} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 text-black dark:text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black dark:text-white">Reject Confirmation</h2>
                  <p className="mt-1 text-sm text-black/60 dark:text-gray-400">
                    Are you sure you want to reject the reset request from{" "}
                    <span className="font-semibold text-black dark:text-white">{selectedRejectRequest?.username}</span>?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRejectConfirm}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-zinc-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectConfirm}
                  className="rounded-lg border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-primary-black dark:text-white hover:bg-black/[0.03] dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="rounded-lg bg-[var(--color-chart-unauthorized)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Yes, Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <PopupModal open={popupOpen} type={popupType} message={popupMessage} onClose={closePopup} />
      </main>
    </div>
  );
};

export default ResetPasswordRequest;
