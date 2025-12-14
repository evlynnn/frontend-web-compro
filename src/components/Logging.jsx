import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";

const initialLogs = [
  { id: 101, username: "akbar", role: "Aslab", authorized: true, confidence: 0.95, timestamp: "2025-12-13 08:12:10" },
  { id: 102, username: "iksan", role: "Dosen", authorized: true, confidence: 0.9, timestamp: "2025-12-13 10:05:44" },
  { id: 103, username: "unknown", role: "Tamu", authorized: false, confidence: 0.13, timestamp: "2025-12-13 12:21:09" },
  { id: 104, username: "aprilianza", role: "Tamu", authorized: false, confidence: 0.22, timestamp: "2025-12-12 16:40:12" },
  { id: 105, username: "evlynnn", role: "Aslab", authorized: true, confidence: 0.88, timestamp: "2025-12-11 09:05:31" },
  { id: 106, username: "akbar", role: "Aslab", authorized: true, confidence: 0.91, timestamp: "2025-12-10 14:21:05" },
  { id: 107, username: "iksan", role: "Dosen", authorized: false, confidence: 0.31, timestamp: "2025-12-05 18:02:11" },
  { id: 108, username: "aprilianza", role: "Tamu", authorized: true, confidence: 0.86, timestamp: "2025-12-03 07:44:19" },
  { id: 109, username: "akbar", role: "Aslab", authorized: true, confidence: 0.93, timestamp: "2025-11-26 20:11:03" },
  { id: 110, username: "unknown", role: "Tamu", authorized: false, confidence: 0.1, timestamp: "2025-11-14 02:18:40" },
  { id: 111, username: "evlynnn", role: "Aslab", authorized: true, confidence: 0.89, timestamp: "2025-08-12 11:02:58" },
  { id: 112, username: "iksan", role: "Dosen", authorized: true, confidence: 0.92, timestamp: "2025-03-21 13:27:10" },
];

const pad2 = (n) => String(n).padStart(2, "0");

const parseTimestamp = (ts) => {
  if (!ts) return null;
  const [datePart, timePart] = ts.split(" ");
  if (!datePart || !timePart) return null;
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
  const [logs] = useState(initialLogs);

  const [period, setPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const now = new Date();
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
      const d = parseTimestamp(l.timestamp);
      if (d) years.add(d.getFullYear());
    });
    const arr = Array.from(years).sort((a, b) => b - a);
    return arr.length ? arr : [now.getFullYear()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const weekObj = parseWeekInput(selectedWeek);

    return logs.filter((item) => {
      if (q && !item.username.toLowerCase().includes(q)) return false;

      if (statusFilter === "authorized" && item.authorized !== true) return false;
      if (statusFilter === "unauthorized" && item.authorized !== false) return false;

      if (period === "all") return true;

      const dt = parseTimestamp(item.timestamp);
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
    });
  }, [logs, search, statusFilter, period, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const totalCount = filteredLogs.length;
  const authorizedCount = useMemo(() => filteredLogs.filter((x) => x.authorized).length, [filteredLogs]);
  const unauthorizedCount = totalCount - authorizedCount;

  return (
    <div className="min-h-screen bg-primary-black text-primary-white">
      {/* ✅ ini yang bikin menu "Door Access Logs" jadi kuning */}
      <Sidebar {...props} activeSection="logs" />

      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-white text-black shadow-sm border border-black/10 p-5 md:p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Door Access Logs</h1>
                <p className="text-sm text-black/60">
                  Monitoring riwayat akses pintu (Authorized / Unauthorized).
                </p>
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
                    {filteredLogs.map((item) => (
                      <tr key={item.id} className="hover:bg-black/[0.03]">
                        <td className="px-4 py-3 font-medium">{item.username}</td>
                        <td className="px-4 py-3 text-black/70">{item.role}</td>
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
