import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import PopupModal from "./PopupModal";
import { getPendingUsers, approveUser, rejectUser } from "../services/userService";

const APP_ROLE_OPTIONS = ["Administrator", "Verificator"];

const mapUiRoleToBackendRole = (uiRole) => {
  if (uiRole === "Administrator") return "administrator";
  if (uiRole === "Verificator") return "verificator";
  return "";
};

const formatRequestedAt = (raw) => {
  if (!raw) return "-";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  } catch {
    return String(raw);
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
    <div className="min-h-screen bg-primary-black text-primary-white">
      <Sidebar {...props} />
      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white text-black shadow-sm border border-black/10 p-5 md:p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Register Requests</h1>
                <p className="text-sm text-black/60">
                  Review user registration requests. Role is assigned when accepting.
                </p>

                {pageError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-[320px]">
                <label className="text-xs text-black/60">Search by username</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Here..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-black/30"
                  />
                  {search.trim() && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-xs text-black/60 hover:text-black"
                      type="button"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-black/60">
                Loading data from the database...
              </div>
            ) : (
              <div className="rounded-xl border border-black/10 bg-white">
                <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead
                      className="
                        sticky top-0 z-20 bg-white
                        border-b border-black/10
                        shadow-[0_1px_0_0_rgba(0,0,0,0.08)]
                      "
                    >
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-black/70">Username</th>
                        <th className="px-4 py-3 text-left font-bold text-black/70">Requested At</th>
                        <th className="px-4 py-3 text-left font-bold text-black/70">Status</th>
                        <th className="px-4 py-3 text-center font-bold text-black/70">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-black/10">
                      {filteredRequests.map((item) => {
                        const isActing = actionLoadingId === item.id;

                        return (
                          <tr key={item.id} className="hover:bg-black/[0.03]">
                            <td className="px-4 py-3 font-medium">{item.username}</td>
                            <td className="px-4 py-3 text-black/70">{formatRequestedAt(item.requestedAt)}</td>

                            <td className="px-4 py-3">
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                  item.status === "Accepted"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-800",
                                ].join(" ")}
                              >
                                {item.status}
                                {item.needsReset ? (
                                  <span className="ml-2 font-normal text-black/60">• Password Reset Request</span>
                                ) : null}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              {item.status === "Pending" ? (
                                <div className="flex items-center justify-center gap-2">
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
                                <div className="text-center text-xs text-black/40">No action</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredRequests.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-black/50">
                            No matching data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {appRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeAssignAppRoleModal} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-black shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Assign Access Role</h2>
                  <p className="mt-1 text-sm text-black/60">
                    Select the application role for{" "}
                    <span className="font-semibold text-black">{selectedRequest?.username}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAssignAppRoleModal}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 hover:bg-black/[0.04]"
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
                          : "border-black/10 bg-white text-black hover:bg-black/[0.03]",
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
                  className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
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
                      : "bg-black/10 text-black/40 cursor-not-allowed",
                  ].join(" ")}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeConfirmModal} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-black shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Confirmation</h2>
                  <p className="mt-1 text-sm text-black/60">Please confirm the details below:</p>
                </div>
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 hover:bg-black/[0.04]"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Username</span>
                  <span className="font-semibold">{selectedRequest?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Current Status</span>
                  <span className="font-semibold">{selectedRequest?.userRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Assigned Role</span>
                  <span className="font-semibold">{selectedAppRole}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeRejectConfirm} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-black shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Reject Confirmation</h2>
                  <p className="mt-1 text-sm text-black/60">
                    Are you sure you want to reject the request from{" "}
                    <span className="font-semibold text-black">{selectedRejectRequest?.username}</span>?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRejectConfirm}
                  className="rounded-lg px-2 py-1 text-sm text-black/60 hover:bg-black/[0.04]"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectConfirm}
                  className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
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

      <PopupModal
        open={popupOpen}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        onClose={closePopup}
        okText="OK"
      />
    </div>
  );
};

export default RegisterRequest;