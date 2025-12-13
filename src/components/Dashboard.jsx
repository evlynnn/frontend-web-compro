import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import Sidebar from "./Sidebar";

const logsFromBackend = [
  { authorized: true, confidence: 0.95, id: 1, name: "Iksan", role: "Aslab", timestamp: "2025-12-13 09:24:31" },
  { authorized: true, confidence: 0.9, id: 2, name: "Akbar", role: "Aslab", timestamp: "2025-12-13 11:18:12" },
  { authorized: false, confidence: 0.11, id: 210, name: "Unknown", role: "Guest", timestamp: "2025-12-13 11:07:18" },
  { authorized: true, confidence: 0.87, id: 3, name: "Bian", role: "Dosen", timestamp: "2025-12-13 13:02:44" },
  { authorized: true, confidence: 0.84, id: 4, name: "Dinda", role: "Aslab", timestamp: "2025-12-11 14:31:55" },
  { authorized: true, confidence: 0.81, id: 5, name: "Raka", role: "Guest", timestamp: "2025-12-10 10:12:01" },
  { authorized: false, confidence: 0.18, id: 6, name: "Unknown", role: "Guest", timestamp: "2025-12-09 18:45:09" },
  { authorized: true, confidence: 0.89, id: 7, name: "Aprilianza", role: "Aslab", timestamp: "2025-12-06 09:10:44" },
  { authorized: true, confidence: 0.86, id: 8, name: "Tama", role: "Dosen", timestamp: "2025-12-05 08:58:03" },
  { authorized: true, confidence: 0.78, id: 9, name: "Nanda", role: "Guest", timestamp: "2025-11-29 16:20:11" },
  { authorized: false, confidence: 0.23, id: 10, name: "Unknown", role: "Guest", timestamp: "2025-11-28 09:11:44" },
  { authorized: true, confidence: 0.92, id: 11, name: "Iksan", role: "Aslab", timestamp: "2025-11-24 08:40:00" },
  { authorized: true, confidence: 0.83, id: 12, name: "Bima", role: "Guest", timestamp: "2025-11-18 12:05:33" },
  { authorized: true, confidence: 0.88, id: 13, name: "Bian", role: "Dosen", timestamp: "2025-11-14 10:14:22" },
  { authorized: false, confidence: 0.16, id: 14, name: "Unknown", role: "Guest", timestamp: "2025-11-12 19:02:10" },
];

const TZ_ID = "Asia/Jakarta";
const pad2 = (n) => String(n).padStart(2, "0");

const parseTimestampWIB = (s) => {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;

  const [, Y, M, D, h, mi, se] = m.map(Number);
  const utcMs = Date.UTC(Y, M - 1, D, h - 7, mi, se);
  const d = new Date(utcMs);
  return isNaN(d.getTime()) ? null : d;
};

const makeDTF = (timeZone, opts) => new Intl.DateTimeFormat("en-GB", { timeZone, ...opts });

const DTF_YMD = makeDTF(TZ_ID, { year: "numeric", month: "2-digit", day: "2-digit" });
const DTF_HH = makeDTF(TZ_ID, { hour: "2-digit", hour12: false });
const DTF_WD = makeDTF(TZ_ID, { weekday: "short" });
const DTF_MON = makeDTF(TZ_ID, { month: "short" });
const DTF_YM = makeDTF(TZ_ID, { year: "numeric", month: "2-digit" });

const ymdInWIB = (d) => {
  const [dd, mm, yy] = DTF_YMD.format(d).split("/");
  return `${yy}-${mm}-${dd}`;
};

const hourKeyInWIB = (d) => `${DTF_HH.format(d)}:00`;

const monthKeyInWIB = (d) => {
  const [mm, yy] = DTF_YM.format(d).split("/");
  return `${yy}-${mm}`;
};

const monthLabelInWIB = (d) => DTF_MON.format(d);

const getTodayKeyWIB = () => ymdInWIB(new Date());

const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

const incBucket = (map, key, isAuthorized) => {
  if (!map[key]) map[key] = { total: 0, authorized: 0, unauthorized: 0 };
  map[key].total += 1;
  if (isAuthorized) map[key].authorized += 1;
  else map[key].unauthorized += 1;
};

const Dashboard = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTarget = location.state?.scrollTo; 
  const bootRef = useRef(false); 

  const [recapMode, setRecapMode] = useState("week");
  const [nowTick, setNowTick] = useState(Date.now());
  const hourScrollRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("dashboard_theme");
    return saved === "light" ? "light" : "dark";
  });

  const sectionCameraRef = useRef(null);
  const sectionLogsRef = useRef(null);
  const sectionAnalyticsRef = useRef(null);

  const [activeSection, setActiveSection] = useState(initialTarget || "camera");
  const atBottomRef = useRef(false);

  const scrollToSection = (key, behavior = "smooth") => {
    atBottomRef.current = false;

    const map = {
      camera: sectionCameraRef,
      logs: sectionLogsRef,
      analytics: sectionAnalyticsRef,
    };
    const ref = map[key];
    if (!ref?.current) return;

    setActiveSection(key);
    ref.current.scrollIntoView({ behavior, block: "start" });
  };

  useLayoutEffect(() => {
    bootRef.current = true;

    if (!initialTarget) {
      bootRef.current = false;
      return;
    }

    setActiveSection(initialTarget);

    const map = {
      camera: sectionCameraRef,
      logs: sectionLogsRef,
      analytics: sectionAnalyticsRef,
    };
    const ref = map[initialTarget];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "auto", block: "start" });
    }

    navigate(location.pathname, { replace: true, state: {} });

    bootRef.current = false;
  }, []);

  useEffect(() => {
    const items = [
      { key: "camera", el: sectionCameraRef.current },
      { key: "logs", el: sectionLogsRef.current },
      { key: "analytics", el: sectionAnalyticsRef.current },
    ].filter((x) => x.el);

    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (bootRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target) {
          const found = items.find((i) => i.el === visible.target);
          if (atBottomRef.current) return;
          if (found) setActiveSection(found.key);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    items.forEach((i) => obs.observe(i.el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (bootRef.current) return;

      const doc = document.documentElement;
      const distanceToBottom = doc.scrollHeight - (window.scrollY + window.innerHeight);

      const isAtBottom = distanceToBottom <= 8;
      atBottomRef.current = isAtBottom;

      if (isAtBottom) setActiveSection("analytics");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("dashboard_theme", theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const logs = useMemo(() => {
    return (logsFromBackend || [])
      .map((x) => ({
        ...x,
        _date: parseTimestampWIB(x.timestamp),
        authorized: typeof x.authorized === "string" ? x.authorized === "true" : !!x.authorized,
      }))
      .filter((x) => x._date);
  }, []);

  const todayKey = useMemo(() => getTodayKeyWIB(), [nowTick]);

  const logsToday = useMemo(() => {
    return logs.filter((x) => ymdInWIB(x._date) === todayKey);
  }, [logs, todayKey]);

  const todaySummary = useMemo(() => {
    const total = logsToday.length;
    const authorized = logsToday.filter((x) => x.authorized === true).length;
    const unauthorized = total - authorized;
    return { total, authorized, unauthorized };
  }, [logsToday]);

  const authorizedPeopleToday = useMemo(() => {
    const names = logsToday.filter((x) => x.authorized === true).map((x) => x.name);
    return Array.from(new Set(names));
  }, [logsToday]);

  const accessPerHourToday = useMemo(() => {
    const now = new Date(nowTick);
    const currentHour = Number(DTF_HH.format(now));
    const orderedHours = Array.from({ length: currentHour + 1 }, (_, h) => `${pad2(h)}:00`);

    const buckets = {};
    orderedHours.forEach((k) => (buckets[k] = { total: 0, authorized: 0, unauthorized: 0 }));

    logsToday.forEach((x) => {
      const k = hourKeyInWIB(x._date);
      if (buckets[k]) incBucket(buckets, k, x.authorized);
    });

    return orderedHours.map((time) => ({ time, ...buckets[time] }));
  }, [logsToday, nowTick]);

  const yDomainHour = useMemo(() => {
    const maxVal = Math.max(0, ...accessPerHourToday.map((d) => d.total ?? 0));
    return [0, Math.max(1, maxVal + 1)];
  }, [accessPerHourToday]);

  useEffect(() => {
    const el = hourScrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [accessPerHourToday]);

  const peakHourEntry = useMemo(() => {
    if (!accessPerHourToday.length) return null;
    return accessPerHourToday.reduce((max, cur) => (cur.total > max.total ? cur : max));
  }, [accessPerHourToday]);

  const accessPerDayLast7 = useMemo(() => {
    const now = new Date(nowTick);
    const days = Array.from({ length: 7 }, (_, i) => addDays(now, -(6 - i)));

    const buckets = {};
    days.forEach((d) => (buckets[ymdInWIB(d)] = { total: 0, authorized: 0, unauthorized: 0 }));

    logs.forEach((x) => {
      const k = ymdInWIB(x._date);
      if (buckets[k]) incBucket(buckets, k, x.authorized);
    });

    return days.map((d) => ({
      dayKey: ymdInWIB(d),
      dayLabel: DTF_WD.format(d),
      ...buckets[ymdInWIB(d)],
    }));
  }, [logs, nowTick]);

  const accessPerMonthLast5 = useMemo(() => {
    if (!logs.length) return [];

    const now = new Date(nowTick);
    const nowKey = monthKeyInWIB(now);
    const [yy, mm] = nowKey.split("-").map(Number);
    const latestMonthStart = new Date(Date.UTC(yy, mm - 1, 1, 0, 0, 0));

    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(latestMonthStart);
      d.setUTCMonth(d.getUTCMonth() - (4 - i));
      return d;
    });

    const buckets = {};
    months.forEach((d) => (buckets[monthKeyInWIB(d)] = { total: 0, authorized: 0, unauthorized: 0 }));

    logs.forEach((x) => {
      const k = monthKeyInWIB(x._date);
      if (buckets[k]) incBucket(buckets, k, x.authorized);
    });

    return months.map((d) => ({
      monthKey: monthKeyInWIB(d),
      monthLabel: monthLabelInWIB(d),
      ...buckets[monthKeyInWIB(d)],
    }));
  }, [logs, nowTick]);

  const recapData = recapMode === "week" ? accessPerDayLast7 : accessPerMonthLast5;

  const recentLogs = useMemo(() => {
    return logsToday.slice().sort((a, b) => b._date - a._date).slice(0, 10);
  }, [logsToday]);

  const sidebarProps = {
    ...props, 
    activeSection,
    scrollToSection,
    handleLogout,
    theme,
    setTheme,
  };

  return (
    <div className="min-h-screen bg-primary-black text-primary-white">
      <Sidebar {...sidebarProps} />

      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[2fr,1.1fr]">
          <div className="space-y-6">
            <section
              ref={sectionCameraRef}
              id="camera"
              className="scroll-mt-6 bg-primary-white text-primary-black rounded-3xl p-5 md:p-6 shadow-xl shadow-black/40"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-primary-yellow uppercase tracking-[0.18em]">
                    Live Monitoring
                  </span>
                  <h2 className="text-lg md:text-xl font-bold mt-1">AI Lab Door Camera</h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-500">Camera • Online</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-secondary-gray h-[55vh] md:h-[65vh] lg:h-[65vh]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fcb90b33,transparent_55%),radial-gradient(circle_at_bottom,#00000066,transparent_60%)]" />
                <div className="relative z-10 h-full flex flex-col justify-between p-4">
                  <div className="flex justify-between text-xs text-primary-white/80">
                    <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                      Smart Door • AI Lab
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div
                ref={sectionLogsRef}
                id="logs"
                className="scroll-mt-6 bg-primary-white text-primary-black rounded-3xl p-4 md:p-5 shadow-lg shadow-black/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Recent Door Access</h3>
                  <button className="text-[11px] text-primary-yellow font-medium">View all</button>
                </div>

                <div
                  className="text-[11px] font-semibold text-gray-600 border-b border-gray-300 pb-2 grid"
                  style={{ gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1fr" }}
                >
                  <span>Timestamps</span>
                  <span>Name</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>

                <div className="mt-2 space-y-2 text-xs">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={log.id ?? `${log.timestamp}-${idx}`}
                      className="grid items-center py-1 border-b border-gray-200 last:border-0"
                      style={{ gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1fr" }}
                    >
                      <span className="font-mono text-[11px]">{log.timestamp}</span>
                      <span className="font-medium">{log.name}</span>
                      <span className="text-gray-700">{log.role}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                          log.authorized ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {log.authorized ? "Authorized" : "Unauthorized"}
                      </span>
                    </div>
                  ))}

                  {!recentLogs.length && (
                    <div className="text-xs text-gray-500 py-3">Belum ada log untuk hari ini.</div>
                  )}
                </div>
              </div>

              <div className="bg-primary-white text-primary-black rounded-3xl p-4 md:p-5 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">Door Access Summary</h3>
                    <span className="text-[11px] text-gray-500">
                      Today at AI Lab{" "}
                      {peakHourEntry && (
                        <>
                          • Peak at <span className="font-semibold text-primary-black">{peakHourEntry.time}</span>{" "}
                          ({peakHourEntry.total} access)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] text-gray-500 mb-2">Who’s in the lab today</p>
                  <div className="flex flex-wrap gap-2">
                    {authorizedPeopleToday.length ? (
                      authorizedPeopleToday.slice(0, 10).map((n) => (
                        <span
                          key={n}
                          className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold"
                        >
                          {n}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Belum ada authorized hari ini.</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] mt-3">
                  <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                    <p className="text-gray-500">Total Today</p>
                    <p className="text-sm font-semibold text-primary-black">{todaySummary.total}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                    <p className="text-gray-500">Authorized</p>
                    <p className="text-sm font-semibold text-primary-black">{todaySummary.authorized}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                    <p className="text-gray-500">Unauthorized</p>
                    <p className="text-sm font-semibold text-primary-black">{todaySummary.unauthorized}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] text-gray-500 mb-2">Access per hour (today)</p>

                  <div className="flex h-32 w-full">
                    <div className="w-14 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={accessPerHourToday} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                          <Bar dataKey="total" fill="transparent" isAnimationActive={false} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} domain={yDomainHour} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div ref={hourScrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
                      <div style={{ width: accessPerHourToday.length * 36, height: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={accessPerHourToday}
                            margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
                            barCategoryGap={4}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={0} />
                            <YAxis hide domain={yDomainHour} />
                            <Tooltip />
                            <Bar
                              dataKey="total"
                              fill="var(--color-chart-total)"
                              radius={[6, 6, 0, 0]}
                              barSize={14}
                              isAnimationActive={false}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section
              ref={sectionAnalyticsRef}
              id="analytics"
              className="scroll-mt-6 bg-primary-white text-primary-black rounded-3xl p-5 md:p-6 shadow-xl shadow-black/40"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold">Access Statistics</h2>
                  <p className="text-[11px] text-gray-500">Recap from logs (daily & monthly)</p>
                </div>

                <select
                  value={recapMode}
                  onChange={(e) => setRecapMode(e.target.value)}
                  className="text-[11px] border border-gray-200 rounded-full px-3 py-1 bg-white"
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 5 months</option>
                </select>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recapData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-total)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-chart-total)" stopOpacity={0.05} />
                      </linearGradient>

                      <linearGradient id="gradAuthorized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-authorized)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-chart-authorized)" stopOpacity={0.05} />
                      </linearGradient>

                      <linearGradient id="gradUnauthorized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-unauthorized)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-chart-unauthorized)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={recapMode === "week" ? "dayLabel" : "monthLabel"} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-chart-total)"
                      fill="url(#gradTotal)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="authorized"
                      stroke="var(--color-chart-authorized)"
                      fill="url(#gradAuthorized)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="unauthorized"
                      stroke="var(--color-chart-unauthorized)"
                      fill="url(#gradUnauthorized)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex flex-wrap justify-center items-center gap-4 text-[11px] text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-chart-total)" }} />
                  Total
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: "var(--color-chart-authorized)" }}
                  />
                  Authorized
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: "var(--color-chart-unauthorized)" }}
                  />
                  Unauthorized
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                  <p className="text-gray-500">Total</p>
                  <p className="text-sm font-semibold text-primary-black">{recapData.reduce((s, x) => s + (x.total || 0), 0)}</p>
                </div>
                <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                  <p className="text-gray-500">Authorized</p>
                  <p className="text-sm font-semibold text-primary-black">
                    {recapData.reduce((s, x) => s + (x.authorized || 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary-gray px-3 py-2">
                  <p className="text-gray-500">Unauthorized</p>
                  <p className="text-sm font-semibold text-primary-black">
                    {recapData.reduce((s, x) => s + (x.unauthorized || 0), 0)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
