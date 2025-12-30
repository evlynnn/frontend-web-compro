import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getFilteredLogs } from "../services/logService";
import IconButton from "@mui/material/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const pad2 = (n) => String(n).padStart(2, "0");

const parseTimestamp = (ts) => {
  if (!ts) return null;
  if (ts instanceof Date) return ts;

  const s = String(ts).trim();
  const parts = s.split(" ");
  if (parts.length < 2) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const [datePart, timePart] = parts;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm, ss] = timePart.split(":").map(Number);

  if ([y, m, d, hh, mm].some((v) => Number.isNaN(v))) return null;
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
};

const fmtDateInput = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const Logging = (props) => {
  const location = useLocation();

  const incomingLogs = useMemo(() => {
    const arr = location.state?.logs;
    return Array.isArray(arr) ? arr : [];
  }, [location.state]);

  const now = new Date();

  const [period, setPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState(fmtDateInput(now));
  const [startDate, setStartDate] = useState(fmtDateInput(now));
  const [endDate, setEndDate] = useState(fmtDateInput(now));

  const [apiLogs, setApiLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

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

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (period === "all") {
      setLoading(false);
      setErrMsg("");
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const params = {};

        const name = debouncedSearch.trim();
        if (name) params.name = name;

        if (period === "today") {
          params.period = "today";
        } else if (period === "date") {
          params.period = "date";
          params.date = selectedDate;
        } else if (period === "range") {
          params.period = "range";
          params.start = startDate;
          params.end = endDate;
        }

        const data = await getFilteredLogs(params, signal);
        if (!data) return;

        const list = Array.isArray(data?.data) ? data.data : [];
        setApiLogs(list);
      } catch (e) {
        if (e.name === "CanceledError") return;

        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch logs";

        setErrMsg(msg);
        setApiLogs([]);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [period, selectedDate, startDate, endDate, debouncedSearch]);

  const sourceLogs = useMemo(() => {
    return period === "all" ? incomingLogs : apiLogs;
  }, [period, incomingLogs, apiLogs]);

  const logs = useMemo(() => {
    return sourceLogs
      .map((x) => {
        const d = x?._date instanceof Date ? x._date : parseTimestamp(x.timestamp);
        const authorized =
          typeof x?.authorized === "string" ? x.authorized === "true" : !!x?.authorized;

        return {
          ...x,
          username: x.username ?? x.name ?? "-",
          timestamp: x._tsDisplay ?? x.timestamp ?? "-",
          _date: d,
          authorized,
        };
      })
      .filter((x) => x._date);
  }, [sourceLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs
      .filter((item) => {
        if (q && !String(item.username).toLowerCase().includes(q)) return false;

        if (statusFilter === "authorized" && item.authorized !== true) return false;
        if (statusFilter === "unauthorized" && item.authorized !== false) return false;

        return true;
      })
      .sort((a, b) => b._date - a._date);
  }, [logs, search, statusFilter]);

  const totalCount = filteredLogs.length;
  const authorizedCount = useMemo(
    () => filteredLogs.filter((x) => x.authorized).length,
    [filteredLogs]
  );
  const unauthorizedCount = totalCount - authorizedCount;
  const showNoIncomingBadge = period === "all" && !incomingLogs.length;

  const sidebarProps = {
    ...props,
    activeSection: "logs",
    handleLogout,
    sidebarOpen,
    setSidebarOpen,
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
            sx={{
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
            }}
          >
            <MenuRoundedIcon sx={{ color: "#fff" }} />
          </IconButton>

          <span className="ml-2 text-sm font-semibold text-white">Door Access Logs</span>
        </div>
      </header>

      <main className="px-4 py-6 pt-16 md:pt-8 md:px-8 md:py-8 md:pl-64">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm border border-black/10 dark:border-zinc-700 p-5 md:p-6 space-y-6 transition-colors duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-semibold text-primary-black dark:text-white">
                    Door Access Logs
                  </h1>

                  {showNoIncomingBadge && (
                    <span className="text-[11px] rounded-full px-2 py-1 bg-yellow-100 text-yellow-700 font-semibold">
                      No data
                    </span>
                  )}

                  {period !== "all" && loading && (
                    <span className="text-[11px] rounded-full px-2 py-1 bg-blue-100 text-blue-700 font-semibold">
                      Loading...
                    </span>
                  )}

                  {period !== "all" && !loading && errMsg && (
                    <span className="text-[11px] rounded-full px-2 py-1 bg-red-100 text-red-700 font-semibold">
                      {errMsg}
                    </span>
                  )}
                </div>

                <p className="text-sm text-black/60 dark:text-gray-400">
                  Monitor the door access history (Authorized / Unauthorized).
                </p>
              </div>

              <div className="grid gap-2 grid-cols-3 md:grid-cols-2 lg:grid-cols-3 w-full md:w-auto">
                <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2">
                  <div className="text-[11px] text-black/50 dark:text-gray-400">Total</div>
                  <div className="text-sm font-semibold text-primary-black dark:text-white">{totalCount}</div>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2">
                  <div className="text-[11px] text-black/50 dark:text-gray-400">Authorized</div>
                  <div className="text-sm font-semibold text-primary-black dark:text-white">{authorizedCount}</div>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 md:col-span-2 lg:col-span-1">
                  <div className="text-[11px] text-black/50 dark:text-gray-400">Unauthorized</div>
                  <div className="text-sm font-semibold text-primary-black dark:text-white">{unauthorizedCount}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <label className="text-xs text-black/60 dark:text-gray-400">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All Logs</option>
                  <option value="today">Today</option>
                  <option value="date">By Date</option>
                  <option value="range">Date Range</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs text-black/60 dark:text-gray-400">
                  {period === "date" ? "Select date" : period === "range" ? "Select start/end" : "—"}
                </label>

                <div className="mt-1 space-y-2">
                  {period === "date" && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white px-3 py-2 text-sm outline-none"
                    />
                  )}

                  {period === "range" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white px-3 py-2 text-sm outline-none"
                        title="Start date"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white px-3 py-2 text-sm outline-none"
                        title="End date"
                      />
                    </div>
                  )}

                  {(period === "all" || period === "today") && (
                    <div className="w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-black/[0.02] dark:bg-zinc-800 px-3 py-2 text-sm text-black/50 dark:text-gray-400">
                      {period === "all" ? "No date filter" : "Today"}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 md:col-span-1">
                <label className="text-xs text-black/60 dark:text-gray-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All</option>
                  <option value="authorized">Authorized</option>
                  <option value="unauthorized">Unauthorized</option>
                </select>
              </div>

              <div className="lg:col-span-3 md:col-span-1">
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

            {/* Table */}
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
                      <th className="px-4 py-3 text-left font-bold text-black/70 dark:text-gray-300">
                        Username
                      </th>

                      <th className="hidden md:table-cell px-4 py-3 text-left font-bold text-black/70 dark:text-gray-300">
                        Role
                      </th>

                      <th className="px-4 py-3 text-left font-bold text-black/70 dark:text-gray-300">
                        Timestamp
                      </th>

                      <th className="px-4 py-3 text-left font-bold text-black/70 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/10 dark:divide-zinc-700">
                    {filteredLogs.map((item, idx) => (
                      <tr
                        key={item.id ?? `${item.timestamp}-${idx}`}
                        className="hover:bg-black/[0.03] dark:hover:bg-zinc-700/50"
                      >
                        <td className="px-4 py-3 font-medium text-primary-black dark:text-white">
                          {item.username}
                        </td>

                        <td className="hidden md:table-cell px-4 py-3 text-black/70 dark:text-gray-400">
                          {item.role ?? "-"}
                        </td>

                        <td className="px-4 py-3 text-[11px] md:text-sm text-black/70 dark:text-gray-400">
                          {item.timestamp}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                              item.authorized ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                            ].join(" ")}
                          >
                            {item.authorized ? "Authorized" : "Unauthorized"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-black/50 dark:text-gray-400">
                          No matching data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Logging;
