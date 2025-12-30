import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import PopupModal from "./PopupModal";
import { getPendingUsers, approveUser, rejectUser } from "../services/userService";
import IconButton from "@mui/material/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const APP_ROLE_OPTIONS = ["Administrator", "Verificator"];

const mapUiRoleToBackendRole = (uiRole) => {
  if (uiRole === "Administrator") return "administrator";
  if (uiRole === "Verificator") return "verificator";
  return "";
};

const formatRequestedAt = (raw) => {
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

const RegisterRequest = (props) => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");

  const [appRoleModalOpen, setAppRoleModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAppRole, setSelectedAppRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupTitle, setPopupTitle] = useState("");
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

  const sidebarProps = {
    ...props,
    activeSection: "register_request",
    sidebarOpen,
    setSidebarOpen,
  };

  const showPopup = ({ type = "success", title = "", message = "" }) => {
    setPopupType(type);
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  const closePopup = () => setPopupOpen(false);

  const extractErrMsg = (err, fallback = "Something went wrong") => {
    return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;
  };

  const fetchPending = async ({ silent = false } = {}) => {
    setLoading(true);
    setPageError("");
    try {
      const res = await getPendingUsers();
      const users = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

      const normalized = users.map((u) => ({
        id: u.id,
        username: u.username,
        userRole: u.role,
        requestedAt: u.created_at || u.createdAt || u.CreatedAt || u.requested_at || u.requestedAt,
        needsReset: !!(u.needs_reset ?? u.needsReset),
        status:
          u.role === "rejected" || u.role === "Rejected"
            ? "Rejected"
            : u.role !== "pending" && !(u.needs_reset ?? u.needsReset)
              ? "Accepted"
              : "Pending",
      }));

      const onlyPendingAction = normalized.filter((x) => x.userRole === "pending" || x.needsReset === true);

      setRequests(onlyPendingAction);

      if (!silent) {
        showPopup({
          type: "success",
          title: "Loaded",
          message: "Register requests were loaded successfully.",
        });
      }
    } catch (err) {
      const msg = extractErrMsg(err, "Failed to load pending users");
      setPageError(msg);

      showPopup({
        type: "error",
        title: "Failed",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending({ silent: true });
  }, []);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => (r.username || "").toLowerCase().includes(q));
  }, [requests, search]);

  const openAssignAppRoleModal = (req) => {
    setSelectedRequest(req);
    setSelectedAppRole("");
    setAppRoleModalOpen(true);
  };

  const closeAssignAppRoleModal = () => {
    setAppRoleModalOpen(false);
    setSelectedRequest(null);
    setSelectedAppRole("");
  };

  const proceedToConfirm = () => {
    if (!selectedAppRole || !selectedRequest) return;
    setAppRoleModalOpen(false);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setSelectedRequest(null);
    setSelectedAppRole("");
  };

  const confirmAccept = async () => {
    if (!selectedRequest || !selectedAppRole) return;

    const backendRole = mapUiRoleToBackendRole(selectedAppRole);
    if (!backendRole) return;

    setActionLoadingId(selectedRequest.id);
    try {
      const res = await approveUser(selectedRequest.id, backendRole);

      await fetchPending({ silent: true });

      showPopup({
        type: "success",
        title: "Success",
        message: res?.message || `User "${selectedRequest.username}" was approved as ${backendRole}.`,
      });

      closeConfirmModal();
    } catch (err) {
      const msg = extractErrMsg(err, "Approve failed");
      setPageError(msg);

      showPopup({
        type: "error",
        title: "Failed",
        message: msg,
      });

      closeConfirmModal();
    } finally {
      setActionLoadingId(null);
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
    if (!selectedRejectRequest) return;

    setActionLoadingId(selectedRejectRequest.id);
    try {
      const res = await rejectUser(selectedRejectRequest.id);

      await fetchPending({ silent: true });

      showPopup({
        type: "success",
        title: "Success",
        message: res?.message || `User "${selectedRejectRequest.username}" was rejected successfully.`,
      });

      closeRejectConfirm();
    } catch (err) {
      const msg = extractErrMsg(err, "Reject failed");
      setPageError(msg);

      showPopup({
        type: "error",
        title: "Failed",
        message: msg,
      });

      closeRejectConfirm();
    } finally {
      setActionLoadingId(null);
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

          <span className="ml-2 text-sm font-semibold text-white">Register Requests</span>
        </div>
      </header>

      <main className="px-4 py-6 pt-16 md:pt-8 md:px-8 md:py-8 md:pl-64">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm border border-black/10 dark:border-zinc-700 p-5 md:p-6 space-y-6 transition-colors duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-primary-black dark:text-white">Register Requests</h1>
                <p className="text-sm text-black/60 dark:text-gray-400">
                  Review user registration requests. Role is assigned when accepting.
                </p>

                {pageError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                  </div>
                )}
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
      Requested At
    </th>

    <th className="px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
      Status
    </th>

    <th className="px-4 py-3 text-center font-bold text-black/70 dark:text-gray-300">
      Action
    </th>
  </tr>
                  </thead>

                  <tbody className="divide-y divide-black/10 dark:divide-zinc-700">
                    {filteredRequests.map((item) => {
                      const isActing = actionLoadingId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-black/[0.03] dark:hover:bg-zinc-700/50">
                          <td className="px-4 py-3 text-center font-medium truncate text-primary-black dark:text-white">
                            {item.username}
                          </td>

                          <td className="hidden md:table-cell px-4 py-3 text-center text-black/70 dark:text-gray-400">
                            {(() => {
                              const { date, time } = formatRequestedAt(item.requestedAt);

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
                            <span
                              className={[
                                "inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
                                item.status === "Accepted"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-800",
                              ].join(" ")}
                            >
                              {item.status}

                              {item.needsReset ? (
                                <span className="ml-2 hidden md:inline font-normal text-black/60 dark:text-gray-500">
                                  • Password Reset Request
                                </span>
                              ) : null}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {item.status === "Pending" ? (
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openAssignAppRoleModal(item)}
                                  disabled={isActing}
                                  className={[
                                    "rounded-lg bg-[var(--color-chart-authorized)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95",
                                    isActing ? "opacity-60 cursor-not-allowed" : "",
                                  ].join(" ")}
                                >
                                  {isActing ? "Processing..." : "Accept"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openRejectConfirm(item)}
                                  disabled={isActing}
                                  className={[
                                    "rounded-lg bg-[var(--color-chart-unauthorized)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95",
                                    isActing ? "opacity-60 cursor-not-allowed" : "",
                                  ].join(" ")}
                                >
                                  {isActing ? "Processing..." : "Reject"}
                                </button>
                              </div>
                            ) : (
                              <div className="text-center text-xs text-black/40 dark:text-gray-500">No action</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-black/50 dark:text-gray-400">
                          No register requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {appRoleModalOpen && (
          <div className="fixed inset-0 z-50 md:z-[10050] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeAssignAppRoleModal} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 text-black dark:text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black dark:text-white">Assign Access Role</h2>
                  <p className="mt-1 text-sm text-black/60 dark:text-gray-400">
                    Select the application role for{" "}
                    <span className="font-semibold text-black dark:text-white">{selectedRequest?.username}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAssignAppRoleModal}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-zinc-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                {APP_ROLE_OPTIONS.map((r) => {
                  const active = selectedAppRole === r;

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedAppRole(r)}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                        active
                          ? "border-[var(--color-primary-yellow)] bg-[var(--color-primary-yellow)] text-black"
                          : "border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-black/[0.03] dark:hover:bg-zinc-700",
                      ].join(" ")}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAssignAppRoleModal}
                  className="rounded-lg border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-primary-black dark:text-white hover:bg-black/[0.03] dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={proceedToConfirm}
                  disabled={!selectedAppRole}
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-semibold text-white",
                    selectedAppRole
                      ? "bg-[var(--color-chart-authorized)] hover:brightness-95"
                      : "bg-black/10 dark:bg-zinc-700 text-black/40 dark:text-gray-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmModalOpen && (
          <div className="fixed inset-0 z-50 md:z-[10050] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeConfirmModal} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 text-black dark:text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black dark:text-white">Confirmation</h2>
                  <p className="mt-1 text-sm text-black/60 dark:text-gray-400">Please confirm the details below:</p>
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
                  <span className="text-black/60 dark:text-gray-400">Current Status</span>
                  <span className="font-semibold text-primary-black dark:text-white">{selectedRequest?.userRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60 dark:text-gray-400">Assigned Role</span>
                  <span className="font-semibold text-primary-black dark:text-white">{selectedAppRole}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-primary-black dark:text-white hover:bg-black/[0.03] dark:hover:bg-zinc-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirmAccept}
                  className="rounded-lg bg-[var(--color-chart-authorized)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Confirm Accept
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
                    Are you sure you want to reject the request from{" "}
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
      </main>

      <PopupModal open={popupOpen} type={popupType} title={popupTitle} message={popupMessage} onClose={closePopup} />
    </div>
  );
};

export default RegisterRequest;