import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const pad2 = (n) => String(n).padStart(2, "0");

const parseTimestamp = (ts) => {
  if (!ts) return null;

  // kalau dari dashboard sudah ada _date (Date object), pakai itu
  if (ts instanceof Date) return ts;

  // kalau timestamp bentuk string "YYYY-MM-DD HH:mm:ss"
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

const fmtMonthInput = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
};

const parseWeekInput = (weekStr) => {
  if (!weekStr) return null;
  const [yPart, wPart] = weekStr.split("-W");
  const year = Number(yPart);
  const week = Number(wPart);
  if (Number.isNaN(year) || Number.isNaN(week)) return null;
  return { year, week };
};

const Logging = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  // logs dikirim dari Dashboard lewat navigate state
  const incomingLogs = useMemo(() => {
    const arr = location.state?.logs;
    return Array.isArray(arr) ? arr : [];
  }, [location.state]);

  // preset (contoh: "today") dikirim dari dashboard
  const preset = location.state?.preset;

  // NORMALISASI FIELD supaya kompatibel dengan data backend/dashboard
  // - Dashboard pakai: name
  // - Logging lama pakai: username
  const logs = useMemo(() => {
    return incomingLogs
      .map((x) => {
        const d = x?._date instanceof Date ? x._date : parseTimestamp(x.timestamp);
        const authorized =
          typeof x?.authorized === "string" ? x.authorized === "true" : !!x?.authorized;

        return {
          ...x,
          username: x.username ?? x.name ?? "-", // pakai username kalau ada, fallback ke name
          timestamp: x._tsDisplay ?? x.timestamp ?? "-", // pakai tampilan dashboard kalau ada
          _date: d,
          authorized,
        };
      })
      .filter((x) => x._date); // buang data timestamp invalid
  }, [incomingLogs]);

  const now = new Date();

  const [period, setPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState(fmtDateInput(now));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const { year, week } = getISOWeek(now);
    return `${year}-W${pad2(week)}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(fmtMonthInput(now));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const availableYears = useMemo(() => {
    const years = new Set();
    logs.forEach((l) => {
      const d = l._date;
      if (d) years.add(d.getFullYear());
    });
    const arr = Array.from(years).sort((a, b) => b - a);
    return arr.length ? arr : [now.getFullYear()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const weekObj = parseWeekInput(selectedWeek);

    return logs
      .filter((item) => {
        if (q && !String(item.username).toLowerCase().includes(q)) return false;

        if (statusFilter === "authorized" && item.authorized !== true) return false;
        if (statusFilter === "unauthorized" && item.authorized !== false) return false;

        if (period === "all") return true;

        const dt = item._date;
        if (!dt) return false;

        if (period === "daily") return fmtDateInput(dt) === selectedDate;

        if (period === "weekly") {
          if (!weekObj) return true;
          const w = getISOWeek(dt);
          return w.year === weekObj.year && w.week === weekObj.week;
        }

        if (period === "monthly") return fmtMonthInput(dt) === selectedMonth;

        if (period === "yearly") return String(dt.getFullYear()) === selectedYear;

        return true;
      })
      .sort((a, b) => b._date - a._date);
  }, [logs, search, statusFilter, period, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const totalCount = filteredLogs.length;
  const authorizedCount = useMemo(() => filteredLogs.filter((x) => x.authorized).length, [filteredLogs]);
  const unauthorizedCount = totalCount - authorizedCount;

  return (
    <div className="min-h-screen bg-primary-black text-primary-white">
      <Sidebar {...props} activeSection="logs" />

      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white text-black shadow-sm border border-black/10 p-5 md:p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold">Door Access Logs</h1>

                  {!incomingLogs.length && (
                    <span className="text-[11px] rounded-full px-2 py-1 bg-yellow-100 text-yellow-700 font-semibold">
                      No data from Dashboard
                    </span>
                  )}
                </div>

                <p className="text-sm text-black/60">
                  Monitoring riwayat akses pintu (Authorized / Unauthorized).
                </p>

                {!incomingLogs.length && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="mt-2 text-[11px] text-primary-yellow font-medium hover:underline"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                  <div className="text-[11px] text-black/50">Total</div>
                  <div className="text-sm font-semibold">{totalCount}</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                  <div className="text-[11px] text-black/50">Authorized</div>
                  <div className="text-sm font-semibold">{authorizedCount}</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                  <div className="text-[11px] text-black/50">Unauthorized</div>
                  <div className="text-sm font-semibold">{unauthorizedCount}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <label className="text-xs text-black/60">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All Data</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs text-black/60">
                  {period === "daily"
                    ? "Select date"
                    : period === "weekly"
                    ? "Select week"
                    : period === "monthly"
                    ? "Select month"
                    : period === "yearly"
                    ? "Select year"
                    : "—"}
                </label>

                <div className="mt-1">
                  {period === "daily" && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    />
                  )}

                  {period === "weekly" && (
                    <input
                      type="week"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    />
                  )}

                  {period === "monthly" && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    />
                  )}

                  {period === "yearly" && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  )}

                  {period === "all" && (
                    <div className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black/50">
                      No date filter
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs text-black/60">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All</option>
                  <option value="authorized">Authorized</option>
                  <option value="unauthorized">Unauthorized</option>
                </select>
              </div>

              <div className="lg:col-span-3">
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

            {/* Table (scroll only body) */}
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
                      <th className="px-4 py-3 text-left font-bold text-black/70">Role</th>
                      <th className="px-4 py-3 text-left font-bold text-black/70">Timestamp</th>
                      <th className="px-4 py-3 text-left font-bold text-black/70">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/10">
                    {filteredLogs.map((item, idx) => (
                      <tr key={item.id ?? `${item.timestamp}-${idx}`} className="hover:bg-black/[0.03]">
                        <td className="px-4 py-3 font-medium">{item.username}</td>
                        <td className="px-4 py-3 text-black/70">{item.role ?? "-"}</td>
                        <td className="px-4 py-3 text-black/70">{item.timestamp}</td>

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

                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-black/50">
                          Tidak ada data yang cocok.
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
