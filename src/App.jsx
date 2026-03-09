import { useState, useEffect } from "react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const BRAND       = "#E07B39";
const BRAND_DARK  = "#C4622A";
const BRAND_LIGHT = "#FDF0E8";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID    = "app6DROW7O9mZnmTY";
const AIRTABLE_SHIFTS_ID  = "tbl4sVuVCiDCyXF3O"; // timesheet submissions
const AIRTABLE_TASKS_ID   = "tblTl58cC0siAAaSN"; // editable schedules
const AIRTABLE_TOKEN      = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const STORE_NAME          = "Londis";
const SESSION_MINUTES     = 120; // 2 hours
const SHIFT_HOURS         = 6;

// ─── STAFF ───────────────────────────────────────────────────────────────────
const STAFF = [
  { name: "Michelle", pin: "1111", initials: "MI", shift: "morning" },
  { name: "Alyson",   pin: "2222", initials: "AL", shift: "morning" },
  { name: "Susan",    pin: "3333", initials: "SU", shift: "evening" },
];

// ─── DAY NAMES ────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ─── DEFAULT SCHEDULE (fallback if Airtable unreachable) ─────────────────────
// Keyed by day name to match Airtable's "Day" field
const DEFAULT_SCHEDULE = {
  Monday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Fridge Date Check / Temp Check","Pricing"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridges Clean","Product Date Checks"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups","Behind Counter Clean"],
  },
  Tuesday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Chocolate/Sweets Stacking","Promotions"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Cigarette/Vape Stacking","Door Clean / Outside Clean"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Wine Stacking","Delivery Unload","Stock Room Clean"],
  },
  Wednesday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridge Stacking","Mop"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking","Cards Stacking"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups"],
  },
  Thursday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Grocery Stacking","Freezer Stacking"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Chocolate/Sweets Stacking","Product Date Checks"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Behind Counter Clean"],
  },
  Friday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Wine Stacking","Cards Stacking"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Pop Stacking","Delivery Unload"],
  },
  Saturday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Fridge Stacking","Mop"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Freezer Stacking"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Spirits Stacking"],
  },
  Sunday: {
    Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"],
    Alyson:   ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"],
    Susan:    ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns"],
  },
};

// ─── TASK CATEGORIES (for tile view) ─────────────────────────────────────────
const TASK_CATEGORIES = [
  { category: "Customer Service",   emoji: "🛎️", items: ["Serving"] },
  { category: "Stacking",           emoji: "📦", items: ["Crisp Stacking","Pop Stacking","Beers Stacking","Wine Stacking","Dog Food Stacking","Toiletries Stacking","Fridge Stacking","Freezer Stacking","Grocery Stacking","Biscuit Stacking","Cards Stacking","Chocolate/Sweets Stacking","Mix Ups","Cigarette/Vape Stacking","Spirits Stacking"] },
  { category: "Checks",             emoji: "✅", items: ["Fridge Date Check / Temp Check","Product Date Checks"] },
  { category: "Cleaning",           emoji: "🧹", items: ["Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean","Stock Room Clean"] },
  { category: "Admin & Operations", emoji: "📋", items: ["Cash and Carry List","Magazine Returns","Newspaper Returns","Pies","Pricing","Promotions","Delivery Unload","Till Lift / End of Shift Count","Post Office","Personal Training"] },
  { category: "Other",              emoji: "➕", items: [] },
];

// ─── AIRTABLE: FETCH LIVE SCHEDULE ───────────────────────────────────────────
// Pulls from TaskSchedules table. Overrides DEFAULT_SCHEDULE entries.
// Falls back silently to DEFAULT_SCHEDULE on any error.
async function fetchScheduleFromAirtable() {
  let rows = [], offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TASKS_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    if (!r.ok) throw new Error("Schedule fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);

  // Start from a deep copy of the default, then override with Airtable data
  const sched = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  rows.forEach(r => {
    const staff = r.fields["Staff Name"];
    const day   = r.fields["Day"];
    const tasks = r.fields["Tasks"];
    if (staff && day && tasks) {
      try {
        if (!sched[day]) sched[day] = {};
        sched[day][staff] = JSON.parse(tasks);
      } catch {}
    }
  });
  return sched;
}

// ─── AIRTABLE: SUBMIT TIMESHEET ───────────────────────────────────────────────
async function submitToAirtable(staffName, shiftName, logs, otherTasks) {
  const now     = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const wk      = getWeekNumber(now);
  const records = [];

  Object.entries(logs).forEach(([taskName, val]) => {
    records.push({ fields: {
      "Staff Name":        staffName,
      "Date":              dateStr,
      "Shift Submitted At":now.toISOString(),
      "Total Minutes":     parseInt(val.hours || 0) * 60 + parseInt(val.minutes || 0),
      "Task Name":         taskName,
      "Task Hours":        parseInt(val.hours || 0),
      "Task Minutes":      parseInt(val.minutes || 0),
      "Task Notes":        val.notes || "",
      "Category":          getCategoryForTask(taskName),
      "Week Number":       wk,
      "Store":             STORE_NAME,
    }});
  });

  otherTasks.forEach(ot => {
    if (!ot.name || (!ot.hours && !ot.minutes)) return;
    records.push({ fields: {
      "Staff Name":        staffName,
      "Date":              dateStr,
      "Shift Submitted At":now.toISOString(),
      "Total Minutes":     parseInt(ot.hours || 0) * 60 + parseInt(ot.minutes || 0),
      "Task Name":         ot.name,
      "Task Hours":        parseInt(ot.hours || 0),
      "Task Minutes":      parseInt(ot.minutes || 0),
      "Task Notes":        ot.notes || "",
      "Category":          "Other",
      "Week Number":       wk,
      "Store":             STORE_NAME,
    }});
  });

  if (!records.length) throw new Error("No tasks to submit");

  for (let i = 0; i < records.length; i += 10) {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SHIFTS_ID}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ records: records.slice(i, i + 10) }),
      }
    );
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || "Airtable error"); }
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getWeekNumber(d) {
  const date = new Date(d); date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const y = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - y) / 86400000) + 1) / 7);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getTodayDayName() {
  return DAY_NAMES[new Date().getDay()];
}

function getCategoryForTask(task) {
  return TASK_CATEGORIES.find(c => c.items.includes(task))?.category || "Other";
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
const STORAGE_KEY = "stafflog_v3";

function loadAllData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function saveSession(name) {
  const all = loadAllData();
  all.session = { name, loginTime: Date.now() };
  const dk = `${name}_${todayKey()}`;
  if (!all[dk]) all[dk] = { logs: {}, otherTasks: [] };
  saveAllData(all);
}
function loadSession() {
  const all = loadAllData();
  const s = all.session;
  if (!s) return null;
  const elapsed = (Date.now() - s.loginTime) / 60000;
  if (elapsed > SESSION_MINUTES) {
    delete all.session;
    saveAllData(all);
    return null;
  }
  return s.name;
}
function clearSession() {
  const all = loadAllData();
  delete all.session;
  saveAllData(all);
}
function loadTodayData(name) {
  const all = loadAllData();
  const dk = `${name}_${todayKey()}`;
  return all[dk] || { logs: {}, otherTasks: [] };
}
function saveTodayData(name, logs, otherTasks) {
  const all = loadAllData();
  const dk = `${name}_${todayKey()}`;
  all[dk] = { logs, otherTasks };
  saveAllData(all);
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]                     = useState("select-staff");
  const [staffName, setStaffName]               = useState("");
  const [staffShift, setStaffShift]             = useState("");
  const [selectedStaff, setSelectedStaff]       = useState(null);
  const [pinEntry, setPinEntry]                 = useState("");
  const [pinError, setPinError]                 = useState(false);
  const [viewMode, setViewMode]                 = useState("checklist");
  const [activeCategory, setActiveCategory]     = useState(null);
  const [logs, setLogs]                         = useState({});
  const [otherTasks, setOtherTasks]             = useState([]);
  const [activeTask, setActiveTask]             = useState(null);
  const [inputHours, setInputHours]             = useState("");
  const [inputMinutes, setInputMinutes]         = useState("");
  const [inputNotes, setInputNotes]             = useState("");
  const [inputOtherName, setInputOtherName]     = useState("");
  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState("");
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

  // ── Live schedule from Airtable ──
  const [schedule, setSchedule]           = useState(null);   // null = still loading
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(false);

  const today   = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  // ── Fetch live schedule on mount ──
  useEffect(() => {
    setScheduleLoading(true);
    fetchScheduleFromAirtable()
      .then(s => { setSchedule(s); setScheduleLoading(false); })
      .catch(() => {
        setSchedule(DEFAULT_SCHEDULE); // silent fallback
        setScheduleError(true);
        setScheduleLoading(false);
      });
  }, []);

  // ── Restore session on mount ──
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      const staffObj = STAFF.find(s => s.name === saved);
      const data = loadTodayData(saved);
      setStaffName(saved);
      setStaffShift(staffObj?.shift || "");
      setLogs(data.logs || {});
      setOtherTasks(data.otherTasks || []);
      setScreen("home");
    }
  }, []);

  // ── Auto-save on change ──
  useEffect(() => {
    if (staffName && screen !== "select-staff" && screen !== "pin") {
      saveTodayData(staffName, logs, otherTasks);
    }
  }, [logs, otherTasks, staffName]);

  // ── Session expiry check every 60s ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (["home", "category", "summary"].includes(screen)) {
        const still = loadSession();
        if (!still) {
          if (staffName) saveTodayData(staffName, logs, otherTasks);
          setSessionExpiredMsg(true);
          setStaffName(""); setStaffShift("");
          setScreen("select-staff");
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [screen, staffName, logs, otherTasks]);

  // ── Derived totals ──
  const totalMinutes =
    Object.values(logs).reduce((a, v) => a + parseInt(v.hours || 0) * 60 + parseInt(v.minutes || 0), 0) +
    otherTasks.reduce((a, t) => a + parseInt(t.hours || 0) * 60 + parseInt(t.minutes || 0), 0);
  const progressPct    = Math.min((totalMinutes / 60 / SHIFT_HOURS) * 100, 100);
  const totalDisplay   = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const totalTaskCount = Object.keys(logs).length + otherTasks.filter(t => t.name).length;

  // ── Today's tasks from live schedule ──
  const todayDayName = getTodayDayName(); // e.g. "Monday"
  const todayTasks   = (schedule && staffName) ? (schedule[todayDayName]?.[staffName] || []) : [];
  const todayDone    = todayTasks.filter(t => logs[t]).length;

  // ── PIN handler ──
  const handlePinPress = (d) => {
    if (pinEntry.length >= 4) return;
    const next = pinEntry + d;
    setPinEntry(next); setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selectedStaff.pin) {
          const data = loadTodayData(selectedStaff.name);
          setStaffName(selectedStaff.name);
          setStaffShift(selectedStaff.shift);
          setLogs(data.logs || {});
          setOtherTasks(data.otherTasks || []);
          saveSession(selectedStaff.name);
          setPinEntry(""); setScreen("home");
        } else {
          setPinError(true);
          setTimeout(() => setPinEntry(""), 700);
        }
      }, 180);
    }
  };

  // ── Task modal handlers ──
  const openStandardTask = (task) => {
    const e = logs[task] || {};
    setActiveTask(task); setInputHours(e.hours ?? ""); setInputMinutes(e.minutes ?? "");
    setInputNotes(e.notes ?? ""); setInputOtherName("");
  };
  const openOtherTask = (id) => {
    const e = otherTasks.find(t => t.id === id) || {};
    setActiveTask(`other-${id}`); setInputHours(e.hours ?? ""); setInputMinutes(e.minutes ?? "");
    setInputNotes(e.notes ?? ""); setInputOtherName(e.name ?? "");
  };
  const openNewOther = () => {
    setActiveTask(`other-new-${Date.now()}`);
    setInputHours(""); setInputMinutes(""); setInputNotes(""); setInputOtherName("");
  };
  const saveTask = () => {
    if (!inputHours && !inputMinutes) return;
    if (activeTask.startsWith("other-new-")) {
      if (!inputOtherName.trim()) return;
      setOtherTasks(p => [...p, { id: activeTask.replace("other-new-", ""), name: inputOtherName.trim(), hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes }]);
    } else if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-", "");
      setOtherTasks(p => p.map(t => t.id === id ? { ...t, name: inputOtherName.trim() || t.name, hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes } : t));
    } else {
      setLogs(p => ({ ...p, [activeTask]: { hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes } }));
    }
    setActiveTask(null);
  };
  const removeTask = () => {
    if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-", "").replace("new-", "");
      setOtherTasks(p => p.filter(t => t.id !== id));
    } else {
      setLogs(p => { const n = { ...p }; delete n[activeTask]; return n; });
    }
    setActiveTask(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError("");
    try {
      await submitToAirtable(staffName, staffShift, logs, otherTasks);
      const all = loadAllData();
      delete all[`${staffName}_${todayKey()}`];
      saveAllData(all);
      setScreen("submitted");
    } catch (e) { setSubmitError(e.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const handleSignOut = () => {
    clearSession(); setStaffName(""); setStaffShift(""); setLogs({}); setOtherTasks([]);
    setScreen("select-staff"); setSubmitError("");
  };

  const resetShift = () => {
    setLogs({}); setOtherTasks([]); setSubmitError(""); setScreen("home");
  };

  const catObj = activeCategory ? TASK_CATEGORIES.find(c => c.category === activeCategory) : null;

  // ── SELECT STAFF ──────────────────────────────────────────────────────────
  if (screen === "select-staff") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.authHeader}>
          <div style={s.logoMark}>⚡</div>
          <div>
            <div style={s.logoName}>StaffLog</div>
            <div style={s.logoStore}>{STORE_NAME} · {today}</div>
          </div>
        </div>

        {sessionExpiredMsg && (
          <div style={s.expiredBanner}>
            🔒 Your session expired after 2 hours. Your progress has been saved — just log back in.
          </div>
        )}

        {scheduleError && (
          <div style={{ ...s.expiredBanner, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
            📋 Using saved schedule — couldn't reach Airtable right now.
          </div>
        )}

        <h2 style={s.authTitle}>Who are you?</h2>
        <div style={s.staffGrid}>
          {STAFF.map(m => (
            <button key={m.name} style={s.staffTile}
              onClick={() => { setSelectedStaff(m); setPinEntry(""); setPinError(false); setSessionExpiredMsg(false); setScreen("pin"); }}>
              <div style={s.staffAvatar}>{m.initials}</div>
              <div style={s.staffTileName}>{m.name}</div>
              <div style={s.staffShiftLabel}>{m.shift}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PIN ───────────────────────────────────────────────────────────────────
  if (screen === "pin") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <button style={s.textBtn} onClick={() => { setScreen("select-staff"); setPinEntry(""); setPinError(false); }}>← Back</button>
        <div style={s.pinAvatarLarge}>{selectedStaff?.initials}</div>
        <div style={s.pinStaffName}>{selectedStaff?.name}</div>
        <p style={s.pinSub}>Enter your 4-digit PIN</p>
        <div style={s.pinDots}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...s.pinDot, background: pinError ? "#ef4444" : pinEntry.length > i ? BRAND : "#e5e7eb", transform: pinError ? "scale(1.15)" : "scale(1)", transition: "all 0.15s" }} />
          ))}
        </div>
        {pinError && <p style={s.pinErrMsg}>Incorrect PIN — try again</p>}
        <div style={s.numpad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => (
            <button key={i} style={{ ...s.numKey, opacity: k === "" ? 0 : 1, pointerEvents: k === "" ? "none" : "auto" }}
              onClick={() => k === "⌫" ? setPinEntry(p => p.slice(0, -1)) : k && handlePinPress(k)}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SUBMITTED ─────────────────────────────────────────────────────────────
  if (screen === "submitted") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.successIcon}>✅</div>
        <div style={s.successTitle}>Shift Submitted!</div>
        <div style={s.successName}>{staffName}</div>
        <div style={s.successDate}>{today}</div>
        <div style={s.successStats}>
          <div style={s.successStat}><div style={s.successStatNum}>{totalTaskCount}</div><div style={s.successStatLabel}>Tasks</div></div>
          <div style={s.successStatDivider} />
          <div style={s.successStat}><div style={s.successStatNum}>{totalDisplay}</div><div style={s.successStatLabel}>Logged</div></div>
        </div>
        <p style={s.successMsg}>Great work today 👋 Your shift has been saved.</p>
        <button style={s.primaryBtn} onClick={resetShift}>Log Another Shift</button>
        <button style={s.outlineBtn} onClick={handleSignOut}>Sign Out</button>
      </div>
    </div>
  );

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const allEntries = [
      ...Object.entries(logs).map(([task, val]) => ({ task, val, category: getCategoryForTask(task) })),
      ...otherTasks.filter(t => t.name).map(t => ({ task: t.name, val: { hours: t.hours, minutes: t.minutes, notes: t.notes }, category: "Other" })),
    ];
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={() => setScreen("home")}>← Back</button>
            <div style={{ textAlign: "right" }}>
              <div style={s.topBarName}>{staffName}</div>
              <div style={s.topBarSub}>{today}</div>
            </div>
          </div>
          <div style={s.sectionPad}><div style={s.pageTitle}>Shift Summary</div></div>
          <div style={s.summaryStatsRow}>
            <div style={s.summaryStat}><div style={s.summaryStatNum}>{totalTaskCount}</div><div style={s.summaryStatLabel}>Tasks</div></div>
            <div style={s.summaryStatDivider} />
            <div style={s.summaryStat}><div style={s.summaryStatNum}>{totalDisplay}</div><div style={s.summaryStatLabel}>Time</div></div>
            <div style={s.summaryStatDivider} />
            <div style={s.summaryStat}><div style={s.summaryStatNum}>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div><div style={s.summaryStatLabel}>Now</div></div>
          </div>
          {allEntries.length === 0
            ? <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 48, fontSize: 15 }}>No tasks logged yet.</p>
            : allEntries.map(({ task, val, category }, i) => (
              <div key={i} style={s.summaryRow}>
                <div style={{ ...s.summaryPill, background: BRAND_LIGHT, color: BRAND_DARK }}>{category.split(" ")[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.summaryTaskName}>{task}</div>
                  {val.notes && <div style={s.summaryNote}>"{val.notes}"</div>}
                </div>
                <div style={s.summaryTime}>{val.hours}h {val.minutes}m</div>
              </div>
            ))
          }
          {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}
          {allEntries.length > 0 && (
            <div style={{ padding: "20px 16px 0" }}>
              <button style={{ ...s.primaryBtn, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Shift ✓"}
              </button>
            </div>
          )}
          <div style={{ height: 48 }} />
        </div>
      </div>
    );
  }

  // ── CATEGORY DRILL-DOWN ───────────────────────────────────────────────────
  if (screen === "category" && catObj) {
    const doneInCat = catObj.category === "Other"
      ? otherTasks.filter(t => t.name).length
      : catObj.items.filter(t => logs[t]).length;
    const pct = catObj.items.length > 0 ? Math.round((doneInCat / catObj.items.length) * 100) : 0;

    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={() => setScreen("home")}>← Back</button>
            <div style={{ textAlign: "right" }}>
              <div style={s.topBarName}>{catObj.emoji} {catObj.category}</div>
              <div style={s.topBarSub}>{staffName}</div>
            </div>
          </div>

          {catObj.category !== "Other" && (
            <div style={s.catProgressWrap}>
              <div style={s.catProgressHeader}>
                <span style={s.catProgressLabel}>{doneInCat} of {catObj.items.length} done</span>
                <span style={s.catProgressPct}>{pct}%</span>
              </div>
              <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${pct}%` }} /></div>
            </div>
          )}

          <p style={s.hint}>Tap a task after completing it to log your time.</p>

          <div style={s.taskCard}>
            {catObj.items.map((task, idx) => {
              const logged = logs[task];
              return (
                <button key={task} style={{ ...s.taskRow, background: logged ? BRAND_LIGHT : "#fff", borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}
                  onClick={() => openStandardTask(task)}>
                  <div style={{ ...s.taskDot, background: logged ? BRAND : "#e5e7eb" }} />
                  <span style={{ ...s.taskLabel, fontWeight: logged ? 700 : 500, color: logged ? "#111" : "#374151" }}>{task}</span>
                  {logged
                    ? <span style={s.taskDoneBadge}>{logged.hours}h {logged.minutes}m</span>
                    : <span style={s.taskChevron}>›</span>}
                </button>
              );
            })}

            {catObj.category === "Other" && (
              <>
                {otherTasks.map((t, idx) => (
                  <button key={t.id} style={{ ...s.taskRow, background: BRAND_LIGHT, borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}
                    onClick={() => openOtherTask(t.id)}>
                    <div style={{ ...s.taskDot, background: BRAND }} />
                    <span style={{ ...s.taskLabel, fontWeight: 700 }}>{t.name}</span>
                    <span style={s.taskDoneBadge}>{t.hours}h {t.minutes}m</span>
                  </button>
                ))}
                <button style={{ ...s.taskRow, background: "#fafafa", borderTop: otherTasks.length > 0 ? "1px solid #f3f4f6" : "none" }}
                  onClick={openNewOther}>
                  <div style={{ ...s.taskDot, background: "#d1d5db" }} />
                  <span style={{ ...s.taskLabel, color: "#9ca3af" }}>Add a task not on the list...</span>
                  <span style={{ fontSize: 20, color: "#d1d5db" }}>+</span>
                </button>
              </>
            )}
          </div>
          <div style={{ height: 80 }} />
        </div>

        {activeTask && (
          <TaskModal activeTask={activeTask} catColor={BRAND}
            inputHours={inputHours} setInputHours={setInputHours}
            inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
            inputNotes={inputNotes} setInputNotes={setInputNotes}
            inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
            logs={logs} onSave={saveTask} onRemove={removeTask} onClose={() => setActiveTask(null)} />
        )}
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  const tileData = TASK_CATEGORIES.map(cat => {
    const done  = cat.category === "Other" ? otherTasks.filter(t => t.name).length : cat.items.filter(t => logs[t]).length;
    const total = cat.items.length;
    return { ...cat, done, total, pct: total > 0 ? done / total : 0 };
  });

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.homeHeader}>
          <div style={s.homeTitleRow}>
            <div style={s.logoMarkSm}>⚡</div>
            <div>
              <div style={s.homeGreeting}>Hello, {staffName}</div>
              <div style={s.homeDate}>{today}</div>
            </div>
          </div>
          <div style={s.homeActions}>
            {totalTaskCount > 0 && (
              <button style={s.reviewChip} onClick={() => setScreen("summary")}>Review</button>
            )}
            <button style={s.signOutChip} onClick={handleSignOut} title="Sign out">⏻</button>
          </div>
        </div>

        {/* Schedule loading / fallback notice */}
        {scheduleLoading && (
          <div style={{ margin: "12px 16px 0", background: "#f9fafb", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #e5e7eb", borderTop: `2px solid ${BRAND}`, animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            Loading your schedule from Airtable…
          </div>
        )}
        {scheduleError && !scheduleLoading && (
          <div style={{ margin: "12px 16px 0", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#16a34a" }}>
            📋 Using saved schedule (offline mode)
          </div>
        )}

        {/* Hours progress bar */}
        <div style={s.hoursCard}>
          <div style={s.hoursCardHeader}>
            <div>
              <div style={s.hoursCardTitle}>Today's Progress</div>
              <div style={s.hoursCardSub}>{dayName} · {SHIFT_HOURS}h shift</div>
            </div>
            <div style={s.hoursCardRight}>
              <span style={s.hoursLogged}>{totalDisplay}</span>
              <span style={s.hoursTarget}> / {SHIFT_HOURS}h</span>
            </div>
          </div>
          <div style={s.hoursTrack}>
            <div style={{ ...s.hoursFill, width: `${progressPct}%`, background: progressPct >= 100 ? "#22c55e" : BRAND }} />
            {Array.from({ length: SHIFT_HOURS - 1 }, (_, i) => (
              <div key={i} style={{ ...s.hourMarker, left: `${((i + 1) / SHIFT_HOURS) * 100}%` }} />
            ))}
          </div>
          <div style={s.hoursLabels}>
            <span>0h</span>
            {Array.from({ length: SHIFT_HOURS - 1 }, (_, i) => <span key={i}>{i + 1}h</span>)}
            <span>{SHIFT_HOURS}h</span>
          </div>
          {progressPct >= 100 && <div style={s.hoursComplete}>🎉 Full shift logged!</div>}
        </div>

        {/* View toggle */}
        <div style={s.toggleRow}>
          <button style={{ ...s.toggleBtn, background: viewMode === "checklist" ? BRAND : "#f3f4f6", color: viewMode === "checklist" ? "#fff" : "#6b7280" }}
            onClick={() => setViewMode("checklist")}>☑ Today's Tasks</button>
          <button style={{ ...s.toggleBtn, background: viewMode === "tiles" ? BRAND : "#f3f4f6", color: viewMode === "tiles" ? "#fff" : "#6b7280" }}
            onClick={() => setViewMode("tiles")}>⊞ All Categories</button>
        </div>

        {/* ── CHECKLIST VIEW ── */}
        {viewMode === "checklist" && (
          <div style={{ padding: "0 16px" }}>

            {/* Today's schedule header */}
            <div style={s.checklistHeader}>
              <span style={s.checklistHeaderText}>{todayDone} of {todayTasks.length} today's tasks done</span>
              <span style={s.checklistHeaderPct}>{todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0}%</span>
            </div>

            {/* Today's scheduled tasks — pulled live from Airtable */}
            {scheduleLoading ? (
              <div style={{ ...s.taskCard, padding: "20px 16px", color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
                Loading today's tasks…
              </div>
            ) : todayTasks.length > 0 ? (
              <div style={s.taskCard}>
                {todayTasks.map((task, idx) => {
                  const logged = logs[task];
                  return (
                    <button key={task} style={{ ...s.checkRow, background: logged ? BRAND_LIGHT : "#fff", borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}
                      onClick={() => openStandardTask(task)}>
                      <div style={{ ...s.checkbox, background: logged ? BRAND : "transparent", borderColor: logged ? BRAND : "#d1d5db" }}>
                        {logged && <span style={s.checkmark}>✓</span>}
                      </div>
                      <span style={{ ...s.checkTaskName, color: logged ? "#111" : "#374151", fontWeight: logged ? 700 : 500 }}>{task}</span>
                      {logged
                        ? <span style={s.checkTimeBadge}>{logged.hours}h {logged.minutes}m</span>
                        : <span style={s.taskChevron}>›</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0", fontSize: 14 }}>No tasks scheduled today.</p>
            )}

            {/* Additional tasks */}
            <div style={{ marginTop: 16 }}>
              <div style={s.checklistHeader}>
                <span style={s.checklistHeaderText}>➕ Additional Tasks</span>
                <span style={s.checklistHeaderPct}>{otherTasks.filter(t => t.name).length} added</span>
              </div>
              <div style={s.taskCard}>
                {otherTasks.filter(t => t.name).map((t, idx) => (
                  <button key={t.id} style={{ ...s.checkRow, background: BRAND_LIGHT, borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}
                    onClick={() => openOtherTask(t.id)}>
                    <div style={{ ...s.checkbox, background: BRAND, borderColor: BRAND }}>
                      <span style={s.checkmark}>✓</span>
                    </div>
                    <span style={{ ...s.checkTaskName, color: "#111", fontWeight: 700 }}>{t.name}</span>
                    <span style={s.checkTimeBadge}>{t.hours}h {t.minutes}m</span>
                  </button>
                ))}
                <button style={{ ...s.checkRow, background: "#fafafa", borderTop: otherTasks.filter(t => t.name).length > 0 ? "1px solid #f3f4f6" : "none" }}
                  onClick={openNewOther}>
                  <div style={{ ...s.checkbox, background: "transparent", borderColor: "#d1d5db" }}>
                    <span style={{ color: "#d1d5db", fontSize: 14, fontWeight: 700 }}>+</span>
                  </div>
                  <span style={{ ...s.checkTaskName, color: "#9ca3af" }}>Add a task not on the list...</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TILE / CATEGORY VIEW ── */}
        {viewMode === "tiles" && (
          <div style={s.tileGrid}>
            {tileData.map(cat => (
              <button key={cat.category} style={s.tile}
                onClick={() => { setActiveCategory(cat.category); setScreen("category"); }}>
                <div style={s.tileTopRow}>
                  <span style={s.tileEmoji}>{cat.emoji}</span>
                  {cat.done > 0 && <span style={s.tileDoneBadge}>{cat.done}{cat.total ? `/${cat.total}` : ""}</span>}
                </div>
                <div style={s.tileCatName}>{cat.category}</div>
                <div style={s.tileCatSub}>
                  {cat.category === "Other" ? (cat.done > 0 ? `${cat.done} added` : "Tap to add") : `${cat.done} of ${cat.total} done`}
                </div>
                {cat.total > 0 && (
                  <div style={s.tileProgressTrack}>
                    <div style={{ ...s.tileProgressFill, width: `${cat.pct * 100}%`, background: cat.done > 0 ? BRAND : "#e5e7eb" }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* Task modal — home screen */}
      {activeTask && screen === "home" && (
        <TaskModal activeTask={activeTask} catColor={BRAND}
          inputHours={inputHours} setInputHours={setInputHours}
          inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
          inputNotes={inputNotes} setInputNotes={setInputNotes}
          inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
          logs={logs} onSave={saveTask} onRemove={removeTask} onClose={() => setActiveTask(null)} />
      )}

      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ activeTask, catColor, inputHours, setInputHours, inputMinutes, setInputMinutes,
  inputNotes, setInputNotes, inputOtherName, setInputOtherName, logs, onSave, onRemove, onClose }) {
  const isOtherNew      = activeTask.startsWith("other-new-");
  const isOther         = activeTask.startsWith("other-");
  const isExistingOther = isOther && !isOtherNew;
  const hasExisting     = logs[activeTask] || isExistingOther;
  const canSave         = (inputHours || inputMinutes) && (!isOther || inputOtherName.trim());

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ ...s.modalAccentBar, background: catColor }} />
        {isOther ? (
          <>
            <label style={s.modalFieldLabel}>What task did you do?</label>
            <input style={s.modalTextInput} type="text" placeholder="e.g. Window cleaning..." value={inputOtherName} onChange={e => setInputOtherName(e.target.value)} autoFocus />
          </>
        ) : (
          <h3 style={s.modalTitle}>{activeTask}</h3>
        )}
        <p style={s.modalSub}>How long did this take?</p>
        <div style={s.timeRow}>
          <div style={s.timeCol}>
            <label style={s.timeLabel}>Hours</label>
            <input style={s.timeInput} type="number" min="0" max="12" placeholder="0" value={inputHours} onChange={e => setInputHours(e.target.value)} />
          </div>
          <div style={s.timeSep}>:</div>
          <div style={s.timeCol}>
            <label style={s.timeLabel}>Minutes</label>
            <input style={s.timeInput} type="number" min="0" max="59" placeholder="0" value={inputMinutes} onChange={e => setInputMinutes(e.target.value)} />
          </div>
        </div>
        <label style={s.modalFieldLabel}>Notes (optional)</label>
        <input style={s.modalTextInput} type="text" placeholder="Any issues or comments..." value={inputNotes} onChange={e => setInputNotes(e.target.value)} />
        <div style={s.modalBtnRow}>
          {hasExisting && <button style={s.removeBtn} onClick={onRemove}>Remove</button>}
          <button style={{ ...s.primaryBtn, flex: 1, opacity: canSave ? 1 : 0.35, marginBottom: 0, background: catColor }} onClick={onSave}>
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page:             { minHeight: "100vh", background: "#f9fafb", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", display: "flex", justifyContent: "center" },
  container:        { width: "100%", maxWidth: 480 },
  authWrap:         { background: "#fff", borderRadius: 24, padding: "36px 28px 40px", margin: "40px 16px", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", maxWidth: 420, width: "100%" },
  authHeader:       { display: "flex", alignItems: "center", gap: 14, marginBottom: 20 },
  logoMark:         { width: 46, height: 46, background: "#111", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  logoName:         { fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 },
  logoStore:        { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  authTitle:        { fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 16, marginTop: 0 },
  expiredBanner:    { background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  staffGrid:        { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  staffTile:        { background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 16, padding: "18px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  staffAvatar:      { width: 48, height: 48, borderRadius: "50%", background: BRAND, color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  staffTileName:    { fontWeight: 700, fontSize: 14, color: "#111" },
  staffShiftLabel:  { fontSize: 11, color: "#9ca3af", textTransform: "capitalize" },
  textBtn:          { background: "none", border: "none", color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 24, display: "block" },
  pinAvatarLarge:   { width: 70, height: 70, borderRadius: "50%", background: BRAND, color: "#fff", fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  pinStaffName:     { fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center", marginBottom: 4 },
  pinSub:           { color: "#9ca3af", fontSize: 14, textAlign: "center", marginBottom: 24 },
  pinDots:          { display: "flex", justifyContent: "center", gap: 14, marginBottom: 8 },
  pinDot:           { width: 16, height: 16, borderRadius: "50%" },
  pinErrMsg:        { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 },
  numpad:           { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 },
  numKey:           { background: "#f3f4f6", border: "none", borderRadius: 14, padding: "18px 0", fontSize: 22, fontWeight: 700, color: "#111", cursor: "pointer" },
  topBar:           { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 16px 14px", background: "#fff", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, zIndex: 10 },
  topBarName:       { fontWeight: 700, fontSize: 15, color: "#111" },
  topBarSub:        { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  backBtn:          { background: "none", border: "none", color: "#111", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 },
  homeHeader:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 16px 0" },
  homeTitleRow:     { display: "flex", alignItems: "center", gap: 10 },
  logoMarkSm:       { width: 36, height: 36, background: "#111", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  homeGreeting:     { fontSize: 17, fontWeight: 800, color: "#111" },
  homeDate:         { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  homeActions:      { display: "flex", gap: 8, alignItems: "center" },
  reviewChip:       { background: BRAND, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  signOutChip:      { background: "#f3f4f6", color: "#6b7280", border: "none", width: 36, height: 36, borderRadius: "50%", fontSize: 16, cursor: "pointer" },
  hoursCard:        { margin: "16px 16px 0", background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  hoursCardHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  hoursCardTitle:   { fontSize: 14, fontWeight: 800, color: "#111" },
  hoursCardSub:     { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  hoursCardRight:   { textAlign: "right" },
  hoursLogged:      { fontSize: 20, fontWeight: 800, color: BRAND },
  hoursTarget:      { fontSize: 14, color: "#9ca3af", fontWeight: 600 },
  hoursTrack:       { height: 14, background: "#f3f4f6", borderRadius: 99, overflow: "visible", position: "relative", marginBottom: 6 },
  hoursFill:        { height: "100%", borderRadius: 99, transition: "width 0.5s ease", position: "relative", zIndex: 1 },
  hourMarker:       { position: "absolute", top: 0, bottom: 0, width: 2, background: "#fff", zIndex: 2, transform: "translateX(-50%)" },
  hoursLabels:      { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", fontWeight: 600, marginTop: 4 },
  hoursComplete:    { textAlign: "center", fontSize: 13, fontWeight: 700, color: "#16a34a", marginTop: 8 },
  toggleRow:        { display: "flex", gap: 8, padding: "14px 16px 4px" },
  toggleBtn:        { flex: 1, border: "none", borderRadius: 10, padding: "10px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" },
  checklistHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingLeft: 2 },
  checklistHeaderText: { fontSize: 13, fontWeight: 700, color: "#374151" },
  checklistHeaderPct:  { fontSize: 13, fontWeight: 700, color: BRAND },
  checkRow:         { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", border: "none", cursor: "pointer", textAlign: "left" },
  checkbox:         { width: 24, height: 24, borderRadius: 7, border: "2px solid", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  checkmark:        { color: "#fff", fontSize: 13, fontWeight: 800 },
  checkTaskName:    { flex: 1, fontSize: 15 },
  checkTimeBadge:   { fontSize: 12, fontWeight: 700, color: BRAND_DARK, background: BRAND_LIGHT, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  tileGrid:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "8px 16px 0" },
  tile:             { background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 16, padding: "18px 14px", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  tileTopRow:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  tileEmoji:        { fontSize: 26 },
  tileDoneBadge:    { background: BRAND, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  tileCatName:      { fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 3 },
  tileCatSub:       { fontSize: 12, color: "#9ca3af", marginBottom: 10 },
  tileProgressTrack:{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" },
  tileProgressFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  catProgressWrap:  { margin: "12px 16px 0", background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #f3f4f6" },
  catProgressHeader:{ display: "flex", justifyContent: "space-between", marginBottom: 8 },
  catProgressLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
  catProgressPct:   { fontSize: 13, fontWeight: 700, color: BRAND },
  progressTrack:    { height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" },
  progressFill:     { height: "100%", background: BRAND, borderRadius: 99, transition: "width 0.4s ease" },
  hint:             { color: "#9ca3af", fontSize: 13, padding: "10px 16px 4px" },
  taskCard:         { margin: "0 16px", borderRadius: 14, overflow: "hidden", border: "1px solid #f3f4f6", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  taskRow:          { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px", border: "none", cursor: "pointer", textAlign: "left" },
  taskDot:          { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  taskLabel:        { flex: 1, fontSize: 15 },
  taskDoneBadge:    { background: BRAND, color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  taskChevron:      { fontSize: 20, color: "#d1d5db" },
  sectionPad:       { padding: "20px 16px 8px" },
  pageTitle:        { fontSize: 22, fontWeight: 800, color: "#111" },
  summaryStatsRow:  { display: "flex", margin: "8px 16px 0", background: "#111", borderRadius: 14, padding: "18px 0", justifyContent: "space-around" },
  summaryStat:      { textAlign: "center" },
  summaryStatNum:   { color: "#fff", fontSize: 22, fontWeight: 800 },
  summaryStatLabel: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  summaryStatDivider:{ width: 1, background: "#374151" },
  summaryRow:       { display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", margin: "6px 16px 0", padding: "14px 16px", borderRadius: 12, border: "1px solid #f3f4f6" },
  summaryPill:      { fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: 2 },
  summaryTaskName:  { fontWeight: 700, fontSize: 14, color: "#111", flex: 1 },
  summaryNote:      { fontSize: 12, color: "#6b7280", marginTop: 3, fontStyle: "italic" },
  summaryTime:      { fontWeight: 700, fontSize: 14, color: "#374151", whiteSpace: "nowrap" },
  successIcon:      { fontSize: 60, textAlign: "center", marginBottom: 12 },
  successTitle:     { fontSize: 24, fontWeight: 800, color: "#111", textAlign: "center", marginBottom: 6 },
  successName:      { fontSize: 16, fontWeight: 600, color: "#374151", textAlign: "center" },
  successDate:      { fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 16 },
  successStats:     { display: "flex", background: "#f9fafb", borderRadius: 14, padding: "16px 0", justifyContent: "space-around", marginBottom: 16 },
  successStat:      { textAlign: "center" },
  successStatNum:   { fontSize: 22, fontWeight: 800, color: "#111" },
  successStatLabel: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  successStatDivider:{ width: 1, background: "#e5e7eb" },
  successMsg:       { color: "#9ca3af", fontSize: 13, textAlign: "center", marginBottom: 24 },
  primaryBtn:       { display: "block", width: "100%", background: BRAND, color: "#fff", border: "none", padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 },
  outlineBtn:       { display: "block", width: "100%", background: "transparent", color: "#9ca3af", border: "1.5px solid #e5e7eb", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  errorBox:         { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "12px 16px", margin: "12px 16px 0", fontSize: 13 },
  modalOverlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 },
  modal:            { background: "#fff", borderRadius: "20px 20px 0 0", padding: "0 24px 40px", width: "100%", maxWidth: 480, boxShadow: "0 -8px 32px rgba(0,0,0,0.15)", overflow: "hidden" },
  modalAccentBar:   { height: 5, margin: "0 -24px 20px" },
  modalTitle:       { fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 4px" },
  modalFieldLabel:  { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 },
  modalSub:         { color: "#9ca3af", fontSize: 13, marginBottom: 16 },
  modalTextInput:   { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, marginBottom: 16, boxSizing: "border-box", color: "#111" },
  timeRow:          { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  timeCol:          { flex: 1 },
  timeLabel:        { display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6 },
  timeInput:        { width: "100%", padding: "14px 10px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 24, fontWeight: 800, textAlign: "center", color: "#111", boxSizing: "border-box" },
  timeSep:          { fontSize: 24, fontWeight: 700, color: "#d1d5db", marginTop: 18 },
  modalBtnRow:      { display: "flex", gap: 10, marginTop: 4 },
  removeBtn:        { background: "#fef2f2", color: "#ef4444", border: "none", padding: "16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
