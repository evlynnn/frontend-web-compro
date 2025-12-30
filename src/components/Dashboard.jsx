import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar} from "recharts";
import Sidebar from "./Sidebar";
import CameraStream from "./CameraStream";
import useWebSocket from "../hooks/useWebSocket";
import { getStreamUrl, getCameraStatus, startCamera, stopCamera} from "../services/cameraService";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import { getLogs } from "../services/logService";

const TZ_ID = "Asia/Jakarta";
const pad2 = (n) => String(n).padStart(2, "0");

const makeDTF = (timeZone, opts) => new Intl.DateTimeFormat("en-GB", { timeZone, ...opts });

const DTF_YMD = makeDTF(TZ_ID, { year: "numeric", month: "2-digit", day: "2-digit" });
const DTF_HH = makeDTF(TZ_ID, { hour: "2-digit", hour12: false });
const DTF_WD = makeDTF(TZ_ID, { weekday: "short" });
const DTF_MON = makeDTF(TZ_ID, { month: "short" });
const DTF_YM = makeDTF(TZ_ID, { year: "numeric", month: "2-digit" });

const parseTimestampWIB = (s) => {
  if (!s) return null;
  const str = String(s).trim();

  const native = new Date(str);
  if (!Number.isNaN(native.getTime())) return native;

  const m = str.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/
  );
  if (!m) return null;

  const Y = Number(m[1]);
  const M = Number(m[2]);
  const D = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const se = Number(m[6]);

  const utcMs = Date.UTC(Y, M - 1, D, h - 7, mi, se);
  const d = new Date(utcMs);
  return Number.isNaN(d.getTime()) ? null : d;
};

const DTF_FULL = makeDTF(TZ_ID, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const formatTimestampWIB = (raw) => {
  const d = raw instanceof Date ? raw : parseTimestampWIB(raw);
  if (!d) return raw ? String(raw) : "-";

  const out = DTF_FULL.format(d).replace(",", "");
  const [dd, mm, yy] = out.split(" ")[0].split("/");
  const time = out.split(" ")[1] || "00:00:00";
  return `${yy}-${mm}-${dd} ${time}`;
};

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

const startOfMonthUTC = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));

const addMonthsUTC = (d, n) => {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
};

const buildDailyBuckets = (logs, nowTick, nDays) => {
  const now = new Date(nowTick);
  const days = Array.from({ length: nDays }, (_, i) =>
    addDays(now, -((nDays - 1) - i))
  );

  const buckets = {};
  days.forEach((d) => {
    buckets[ymdInWIB(d)] = { total: 0, authorized: 0, unauthorized: 0 };
  });

  logs.forEach((x) => {
    const k = ymdInWIB(x._date);
    if (buckets[k]) incBucket(buckets, k, x.authorized);
  });

  return days.map((d) => ({
    dayKey: ymdInWIB(d),
    dayLabel: DTF_WD.format(d),
    ...buckets[ymdInWIB(d)],
  }));
};

const buildMonthlyBuckets = (logs, nowTick, nMonths) => {
  if (!logs.length) return [];

  const now = new Date(nowTick);
  const latestMonthStart = startOfMonthUTC(now);

  const months = Array.from({ length: nMonths }, (_, i) =>
    addMonthsUTC(latestMonthStart, -((nMonths - 1) - i))
  );

  const buckets = {};
  months.forEach((d) => {
    buckets[monthKeyInWIB(d)] = { total: 0, authorized: 0, unauthorized: 0 };
  });

  logs.forEach((x) => {
    const k = monthKeyInWIB(x._date);
    if (buckets[k]) incBucket(buckets, k, x.authorized);
  });

  return months.map((d) => ({
    monthKey: monthKeyInWIB(d),
    monthLabel: monthLabelInWIB(d),
    ...buckets[monthKeyInWIB(d)],
  }));
};

const DTF_MD = makeDTF(TZ_ID, { month: "short", day: "2-digit" });

const weekdayIndexWIB = (d) => {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ_ID, weekday: "short" }).format(d);
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[wd] ?? 0;
};

const startOfWeekWIB = (d) => {
  const idx = weekdayIndexWIB(d);
  return addDays(d, -idx);
};

const weekKeyInWIB = (d) => ymdInWIB(startOfWeekWIB(d));

const weekLabelInWIB = (weekStart) => {
  const end = addDays(weekStart, 6);
  const a = DTF_MD.format(weekStart);
  const b = DTF_MD.format(end);
  return `${a}–${b}`;
};

const buildWeeklyBucketsLast30Days = (logs, nowTick) => {
  const now = new Date(nowTick);
  const start = addDays(now, -29); 

  const firstWeekStart = startOfWeekWIB(start);
  const lastWeekStart = startOfWeekWIB(now);

  const weeks = [];
  for (let cur = new Date(firstWeekStart); cur <= lastWeekStart; cur = addDays(cur, 7)) {
    weeks.push(new Date(cur));
  }

  const buckets = {};
  weeks.forEach((ws) => {
    buckets[weekKeyInWIB(ws)] = { total: 0, authorized: 0, unauthorized: 0 };
  });

  logs.forEach((x) => {
    if (!x._date) return;
    if (x._date < start || x._date > now) return;

    const k = weekKeyInWIB(x._date);
    if (buckets[k]) incBucket(buckets, k, x.authorized);
  });

  return weeks.map((ws) => ({
    weekKey: weekKeyInWIB(ws),
    weekLabel: weekLabelInWIB(ws),
    ...buckets[weekKeyInWIB(ws)],
  }));
};

const buildJanToDecThisYearBuckets = (logs, nowTick) => {
  const now = new Date(nowTick);

  const yearNowWIB = Number(ymdInWIB(now).slice(0, 4));

  const months = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(yearNowWIB, i, 1, 0, 0, 0)));

  const buckets = {};
  months.forEach((d) => {
    buckets[monthKeyInWIB(d)] = { total: 0, authorized: 0, unauthorized: 0 };
  });

  logs.forEach((x) => {
    if (!x._date) return;
    const yWIB = Number(ymdInWIB(x._date).slice(0, 4));
    if (yWIB !== yearNowWIB) return;

    const k = monthKeyInWIB(x._date);
    if (buckets[k]) incBucket(buckets, k, x.authorized);
  });

  return months.map((d) => ({
    monthKey: monthKeyInWIB(d),
    monthLabel: monthLabelInWIB(d), 
    ...buckets[monthKeyInWIB(d)],
  }));
};

const Dashboard = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTarget = location.state?.scrollTo;
  const bootRef = useRef(false);

  const [logsFromBackend, setLogsFromBackend] = useState([]);

  const [recapMode, setRecapMode] = useState("all");
  const [nowTick, setNowTick] = useState(Date.now());
  const hourScrollRef = useRef(null);

  const { theme, setTheme } = props;

  const sectionCameraRef = useRef(null);
  const sectionLogsRef = useRef(null);
  const sectionAnalyticsRef = useRef(null);

  const [activeSection, setActiveSection] = useState(initialTarget || "camera");
  const atBottomRef = useRef(false);

  // Camera state
  const [cameraStatus, setCameraStatus] = useState({ online: false, streaming: false });
  const [cameraLoading, setCameraLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [streamUrl, setStreamUrl] = useState(`${getStreamUrl()}?t=${Date.now()}`);
  const [detectionEvents, setDetectionEvents] = useState([]);

  // WebSocket for real-time detection events
  const handleDetection = useCallback((event) => {
    setDetectionEvents((prev) => [event, ...prev].slice(0, 10));
  }, []);

  const { isConnected: wsConnected, lastEvent } = useWebSocket(handleDetection);

  useEffect(() => {
    let alive = true;

    const fetchLogs = async () => {
      try {
        const res = await getLogs();
        console.log(res)
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!alive) return;
        setLogsFromBackend(data);
      } catch (err) {
        console.error("Failed to fetch logs:", err?.response || err?.message || err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (cameraStatus.streaming) return;

    const fetchStatus = async () => {
      try {
        const res = await getCameraStatus();
        const isRunning = res?.status?.is_running;
        if (isRunning && !cameraStatus.streaming) {
          setCameraStatus({ ...res, streaming: true });
          setStreamUrl(`${getStreamUrl()}?t=${Date.now()}`);
          setStreamError(false);
        } else {
          setCameraStatus(res);
        }
      } catch (err) {
        console.error("Failed to fetch camera status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [cameraStatus.streaming]);

  const handleStartCamera = async () => {
    setCameraLoading(true);
    try {
      await startCamera();
      setStreamUrl(`${getStreamUrl()}?t=${Date.now()}`);
      setStreamError(false);
      setCameraStatus((prev) => ({ ...prev, streaming: true }));
    } catch (err) {
      console.error("Failed to start camera:", err);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleStopCamera = async () => {
    setCameraLoading(true);
    try {
      await stopCamera();
      setCameraStatus((prev) => ({ ...prev, streaming: false }));
    } catch (err) {
      console.error("Failed to stop camera:", err);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleRefreshStream = () => {
    setStreamUrl(`${getStreamUrl()}?t=${Date.now()}`);
    setStreamError(false);
  };

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


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const logs = useMemo(() => {
    return (logsFromBackend || [])
      .map((x) => {
        const d = parseTimestampWIB(x.timestamp);
        return {
          ...x,
          _date: d,
          _tsDisplay: formatTimestampWIB(d || x.timestamp),
          authorized: typeof x.authorized === "string" ? x.authorized === "true" : !!x.authorized,
        };
      })
      .filter((x) => x._date);
  }, [logsFromBackend]);

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

  const recapData = useMemo(() => {
    if (recapMode === "7d") return buildDailyBuckets(logs, nowTick, 7);
    if (recapMode === "1m") return buildWeeklyBucketsLast30Days(logs, nowTick);
    if (recapMode === "3m") return buildMonthlyBuckets(logs, nowTick, 3);
    if (recapMode === "6m") return buildMonthlyBuckets(logs, nowTick, 6);
    if (recapMode === "1y") return buildMonthlyBuckets(logs, nowTick, 12);
    return buildJanToDecThisYearBuckets(logs, nowTick);
  }, [recapMode, logs, nowTick]);

  const recentLogs = useMemo(() => {
    return logsToday.slice().sort((a, b) => b._date - a._date).slice(0, 10);
  }, [logsToday]);

  const sidebarProps = {
  ...props,
  activeSection,
  scrollToSection,
  handleLogout,
};

  return (
    <div className="min-h-screen bg-primary-black dark:bg-primary-black text-primary-white transition-colors duration-300">
      <Sidebar {...sidebarProps} />

      <main className="ml-60 md:ml-64 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[2fr,1.1fr]">
          <div className="space-y-6">
            <section
              ref={sectionCameraRef}
              id="camera"
              className="scroll-mt-6 bg-primary-white dark:bg-zinc-900 text-primary-black dark:text-white rounded-3xl p-5 md:p-6 shadow-xl shadow-black/40 transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-primary-yellow uppercase tracking-[0.18em]">
                    Live Monitoring
                  </span>
                  <h2 className="text-lg md:text-xl font-bold mt-1 text-primary-black dark:text-white">AI Lab Door Camera</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${cameraStatus.streaming ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                    />
                    <span className="text-gray-500 dark:text-gray-400">
                      Camera • {cameraStatus.streaming ? "Streaming" : "Offline"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${wsConnected ? "bg-blue-500" : "bg-gray-400"
                        }`}
                    />
                    <span className="text-gray-500 dark:text-gray-400">
                      WS • {wsConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-secondary-gray dark:bg-zinc-800 h-[55vh] md:h-[65vh] lg:h-[65vh]">
                <CameraStream
                  streamUrl={streamUrl}
                  isStreaming={cameraStatus.streaming && !streamError}
                  onError={() => setStreamError(true)}
                />
                {(!cameraStatus.streaming || streamError) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center text-white/60">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm">{streamError ? "Stream error" : "Camera is offline"}</p>
                      <p className="text-xs mt-1">
                        {streamError ? "Click Refresh to retry" : "Click Start to begin streaming"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,#fcb90b15,transparent_55%)]" />

                <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4">
                  <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs text-primary-white/80">
                    Smart Door • AI Lab
                  </span>

                  {lastEvent && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold animate-pulse ${lastEvent.data?.authorized
                        ? "bg-emerald-500/80 text-white"
                        : "bg-red-500/80 text-white"
                        }`}
                    >
                      <NotificationsActiveRoundedIcon sx={{ fontSize: 14 }} />
                      <span>
                        {lastEvent.data?.name || "Detection"} -{" "}
                        {lastEvent.data?.authorized ? "Authorized" : "Unauthorized"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                  <div className="flex items-center justify-center gap-2">
                    {!cameraStatus.streaming ? (
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        disabled={cameraLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition disabled:opacity-50"
                      >
                        <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
                        {cameraLoading ? "Starting..." : "Start Camera"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleStopCamera}
                          disabled={cameraLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
                        >
                          <StopRoundedIcon sx={{ fontSize: 18 }} />
                          {cameraLoading ? "Stopping..." : "Stop"}
                        </button>
                        <button
                          type="button"
                          onClick={handleRefreshStream}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition"
                        >
                          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {detectionEvents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Recent Detections (Live)</h4>
                  <div className="flex flex-wrap gap-2">
                    {detectionEvents.slice(0, 5).map((evt, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${evt.data?.authorized
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                          }`}
                      >
                        {evt.data?.name || "Unknown"} • {evt.data?.confidence ? `${(evt.data.confidence * 100).toFixed(0)}%` : "N/A"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div
                ref={sectionLogsRef}
                id="logs"
                className="scroll-mt-6 bg-primary-white dark:bg-zinc-900 text-primary-black dark:text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-black/40 transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary-black dark:text-white">Recent Door Access</h3>
                  <button
                    type="button"
                    onClick={() => navigate("/logging", { state: { preset: "today", logs } })}
                    className="text-[11px] text-primary-yellow font-medium hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div
                  className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-zinc-700 pb-2 grid"
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
                      key={log.id ?? `${log._tsDisplay}-${idx}`}
                      className="grid items-center py-1 border-b border-gray-200 dark:border-zinc-700 last:border-0"
                      style={{ gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1fr" }}
                    >
                      <span className="font-mono text-[11px] text-primary-black dark:text-white">{log._tsDisplay}</span>
                      <span className="font-medium text-primary-black dark:text-white">{log.name}</span>
                      <span className="text-gray-700 dark:text-gray-400">{log.role}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${log.authorized ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                          }`}
                      >
                        {log.authorized ? "Authorized" : "Unauthorized"}
                      </span>
                    </div>
                  ))}

                  {!recentLogs.length && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 py-3">Belum ada log untuk hari ini.</div>
                  )}
                </div>
              </div>

              <div className="bg-primary-white dark:bg-zinc-900 text-primary-black dark:text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-black/40 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-primary-black dark:text-white">Door Access Summary</h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Today at AI Lab{" "}
                      {peakHourEntry && (
                        <>
                          • Peak at <span className="font-semibold text-primary-black dark:text-white">{peakHourEntry.time}</span>{" "}
                          ({peakHourEntry.total} access)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Who's in the lab today</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {authorizedPeopleToday.length ? (
                    authorizedPeopleToday.slice(0, 10).map((n) => (
                      <span
                        key={n}
                        className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold"
                      >
                        {n}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Belum ada authorized hari ini.</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] mt-3">
                  <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400">Total Today</p>
                    <p className="text-sm font-semibold text-primary-black dark:text-white">{todaySummary.total}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400">Authorized</p>
                    <p className="text-sm font-semibold text-primary-black dark:text-white">{todaySummary.authorized}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400">Unauthorized</p>
                    <p className="text-sm font-semibold text-primary-black dark:text-white">{todaySummary.unauthorized}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Access per hour (today)</p>

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
              className="scroll-mt-6 bg-primary-white dark:bg-zinc-900 text-primary-black dark:text-white rounded-3xl p-5 md:p-6 shadow-xl shadow-black/40 transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-primary-black dark:text-white">Access Statistics</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Recap from logs (daily & monthly)</p>
                </div>

                <select
                  value={recapMode}
                  onChange={(e) => setRecapMode(e.target.value)}
                  className="text-[11px] border border-gray-200 dark:border-zinc-700 rounded-full px-3 py-1 bg-white dark:bg-zinc-800 dark:text-white"
                >
                  <option value="all">All logs</option>
                  <option value="7d">Last 7 days</option>
                  <option value="1m">Last 1 month</option>
                  <option value="3m">Last 3 months</option>
                  <option value="6m">Last 6 months</option>
                  <option value="1y">Last 1 year</option>
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
                    <XAxis
                      dataKey={
                        recapMode === "7d"
                          ? "dayLabel"
                          : recapMode === "1m"
                          ? "weekLabel"
                          : "monthLabel"
                      }
                      tick={{ fontSize: 11 }}
                    />
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

              <div className="mt-3 flex flex-wrap justify-center items-center gap-4 text-[11px] text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-chart-total)" }} />
                  Total
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-chart-authorized)" }} />
                  Authorized
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-chart-unauthorized)" }} />
                  Unauthorized
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-sm font-semibold text-primary-black dark:text-white">
                    {recapData.reduce((s, x) => s + (x.total || 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                  <p className="text-gray-500 dark:text-gray-400">Authorized</p>
                  <p className="text-sm font-semibold text-primary-black dark:text-white">
                    {recapData.reduce((s, x) => s + (x.authorized || 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary-gray dark:bg-zinc-800 px-3 py-2">
                  <p className="text-gray-500 dark:text-gray-400">Unauthorized</p>
                  <p className="text-sm font-semibold text-primary-black dark:text-white">
                    {recapData.reduce((s, x) => s + (x.unauthorized || 0), 0)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div >
      </main >
    </div >
  );
};

export default Dashboard;
