import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";

const initialRequests = [
  { id: 1, username: "akbar", userRole: "Aslab", requestedAt: "2025-12-10 14:21", status: "Pending" },
  { id: 2, username: "aprilianza", userRole: "Tamu", requestedAt: "2025-12-11 09:05", status: "Pending" },
  { id: 3, username: "iksan", userRole: "Dosen", requestedAt: "2025-12-11 16:40", status: "Pending" },
  { id: 4, username: "evlynnn", userRole: "Aslab", requestedAt: "2025-12-12 08:12", status: "Pending" },
];

const APP_ROLE_OPTIONS = ["Administrator", "Verificator"];

const RegisterRequest = (props) => {
  const [requests, setRequests] = useState(initialRequests);

  const [search, setSearch] = useState("");

  const [appRoleModalOpen, setAppRoleModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAppRole, setSelectedAppRole] = useState("");

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => r.username.toLowerCase().includes(q));
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

  const confirmAccept = () => {
    if (!selectedRequest || !selectedAppRole) return;

    setRequests((prev) =>
      prev.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, status: "Accepted", assignedAppRole: selectedAppRole }
          : item
      )
    );

    closeConfirmModal();
  };

  const openRejectConfirm = (req) => {
    setSelectedRejectRequest(req);
    setRejectConfirmOpen(true);
  };

  const closeRejectConfirm = () => {
    setRejectConfirmOpen(false);
    setSelectedRejectRequest(null);
  };

  const confirmReject = () => {
    if (!selectedRejectRequest) return;

    setRequests((prev) =>
      prev.map((item) =>
        item.id === selectedRejectRequest.id ? { ...item, status: "Rejected" } : item
      )
    );

    closeRejectConfirm();
  };

  return (
    <div className="min-h-screen bg-primary-black text-primary-white">
      <Sidebar {...props} />
      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white text-black shadow-sm border border-black/10 p-5 md:p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Register Request</h1>
                <p className="text-sm text-black/60">
                  Validasi pendaftaran user (Accept/Reject). Hak akses aplikasi dipilih saat Accept.
                </p>
              </div>

              {/* Search */}
              <div className="w-full sm:w-[320px]">
                <label className="text-xs text-black/60">Search by username</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="contoh: iksan"
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

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left font-bold text-black/70">Username</th>
                    <th className="px-4 py-3 text-left font-bold text-black/70">Requested At</th>
                    <th className="px-4 py-3 text-left font-bold text-black/70">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-black/70">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/10">
                  {filteredRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.03]">
                      <td className="px-4 py-3 font-medium">{item.username}</td>
                      <td className="px-4 py-3 text-black/70">{item.requestedAt}</td>

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
                          {item.status === "Accepted" && item.assignedAppRole ? (
                            <span className="ml-2 font-normal text-black/60">
                              • {item.assignedAppRole}
                            </span>
                          ) : null}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.status === "Pending" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openAssignAppRoleModal(item)}
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
                        ) : (
                          <div className="text-center text-xs text-black/40">No action</div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-black/50">
                        Tidak ada data yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    Tentukan hak akses aplikasi untuk{" "}
                    <span className="font-semibold text-black">{selectedRequest?.username}</span>
                    <span className="font-normal text-black/50"> (role: {selectedRequest?.userRole})</span>
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
                  <p className="mt-1 text-sm text-black/60">Pastikan data berikut sudah benar:</p>
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
                  <span className="text-black/60">Role</span>
                  <span className="font-semibold">{selectedRequest?.userRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Hak Akses</span>
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
                  <h2 className="text-lg font-semibold">Konfirmasi Penolakan</h2>
                  <p className="mt-1 text-sm text-black/60">
                    Apakah kamu yakin ingin menolak request dengan username{" "}
                    <span className="font-semibold text-black">
                      {selectedRejectRequest?.username}
                    </span>
                    ?
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
    </div>
  );
};

export default RegisterRequest;
