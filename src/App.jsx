import { useState, useEffect, useMemo } from "react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const BRAND       = "#E07B39";
const BRAND_DARK  = "#C4622A";
const BRAND_LIGHT = "#FDF0E8";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SESSION_MINUTES    = 120;

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL="https://zdotindfglkiasieqosq.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb3RpbmRmZ2xraWFzaWVxb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjE1OTYsImV4cCI6MjA4ODg5NzU5Nn0.4VUdZQbsGFgnTmjbhp2_GFCV563soIKqbcvgrp7QJdI";
const SB_HDR={"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"};
async function sbGet(t,p=""){const r=await fetch(`${SB_URL}/rest/v1/${t}?${p}`,{headers:SB_HDR});if(!r.ok){const e=await r.json();throw new Error(e?.message||`GET ${t} failed`);}return r.json();}
async function sbPost(t,b){const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:SB_HDR,body:JSON.stringify(b)});if(!r.ok){const e=await r.json();throw new Error(e?.message||`POST ${t} failed`);}return r.json();}

// ─── SECTOR DEFAULT TASK POOLS ───────────────────────────────────────────────
const SECTOR_TASKS = {
  convenience: {
    Monday:    { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Fridge Date Check / Temp Check","Pricing"] },
    Tuesday:   { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Chocolate/Sweets Stacking","Promotions"] },
    Wednesday: { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridge Stacking","Mop"] },
    Thursday:  { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Grocery Stacking","Freezer Stacking"] },
    Friday:    { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking"] },
    Saturday:  { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Fridge Stacking","Mop"] },
    Sunday:    { _all: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"] },
  },
  gym: {
    Monday:    { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Towel Restock","Weights Area Tidy","Cardio Zone Check"] },
    Tuesday:   { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Cleaning Rota","Protein Bar Restock","Membership Queries"] },
    Wednesday: { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Towel Restock","Pool Check","Deep Clean Zone"] },
    Thursday:  { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Weights Area Tidy","Cardio Zone Check","Cleaning Rota"] },
    Friday:    { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Protein Bar Restock","Towel Restock","Weekend Prep"] },
    Saturday:  { _all: ["Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Deep Clean Zone","Weights Area Tidy"] },
    Sunday:    { _all: ["Equipment Check","Locker Room Clean","Reception Cover","Towel Restock"] },
  },
  cafe: {
    Monday:    { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Fridge Temp Check","Pastry Display","Floor Sweep"] },
    Tuesday:   { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Delivery Unload","Window Clean","Milk Restock"] },
    Wednesday: { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Fridge Temp Check","Deep Clean","Syrup Restock"] },
    Thursday:  { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Delivery Unload","Pastry Display","Floor Sweep"] },
    Friday:    { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Weekend Prep","Milk Restock","Fridge Temp Check"] },
    Saturday:  { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Pastry Display","Floor Sweep","Syrup Restock"] },
    Sunday:    { _all: ["Opening Setup","Machine Clean","Stock Count","Till Check","Closing Clean"] },
  },
  bar: {
    Monday:    { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Cellar Check","Till Check"] },
    Tuesday:   { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Fridge Restock","Till Check"] },
    Wednesday: { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Cellar Check","Floor Sweep","Till Check"] },
    Thursday:  { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Deep Clean","Till Check"] },
    Friday:    { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Cellar Check","Floor Sweep","Till Check"] },
    Saturday:  { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Till Check","Closing Clean"] },
    Sunday:    { _all: ["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Closing Clean"] },
  },
  restaurant: {
    Monday:    { _all: ["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Fridge Temp Check","Till Check"] },
    Tuesday:   { _all: ["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Stock Count","Till Check"] },
    Wednesday: { _all: ["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Fridge Temp Check","Till Check"] },
    Thursday:  { _all: ["Opening Setup","Table Setup","Kitchen Prep","Deep Clean","Floor Sweep","Till Check"] },
    Friday:    { _all: ["Opening Setup","Table Setup","Kitchen Prep","Fridge Temp Check","Floor Sweep","Till Check"] },
    Saturday:  { _all: ["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Till Check","Closing Clean"] },
    Sunday:    { _all: ["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Closing Clean"] },
  },
  hotel: {
    Monday:    { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Lost Property Log","Maintenance Check"] },
    Tuesday:   { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Stock Count","Maintenance Check"] },
    Wednesday: { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Deep Clean","Maintenance Check"] },
    Thursday:  { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Lost Property Log","Maintenance Check"] },
    Friday:    { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Stock Count","Maintenance Check"] },
    Saturday:  { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Maintenance Check","Closing Check"] },
    Sunday:    { _all: ["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Closing Check"] },
  },
};

const SECTOR_TASK_CATEGORIES = {
  convenience: [
    { category: "Customer Service", emoji: "🛎️", items: ["Serving"] },
    { category: "Stacking",         emoji: "📦", items: ["Crisp Stacking","Pop Stacking","Beers Stacking","Wine Stacking","Dog Food Stacking","Toiletries Stacking","Fridge Stacking","Freezer Stacking","Grocery Stacking","Biscuit Stacking","Cards Stacking","Chocolate/Sweets Stacking","Mix Ups","Cigarette/Vape Stacking","Spirits Stacking"] },
    { category: "Checks",           emoji: "✅", items: ["Fridge Date Check / Temp Check","Product Date Checks"] },
    { category: "Cleaning",         emoji: "🧹", items: ["Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean","Stock Room Clean"] },
    { category: "Admin & Ops",      emoji: "📋", items: ["Cash and Carry List","Magazine Returns","Newspaper Returns","Pies","Pricing","Promotions","Delivery Unload","Till Lift / End of Shift Count","Post Office","Personal Training"] },
    { category: "Other",            emoji: "➕", items: [] },
  ],
  gym: [
    { category: "Equipment",   emoji: "🏋️", items: ["Equipment Check","Weights Area Tidy","Cardio Zone Check","Pool Check"] },
    { category: "Cleaning",    emoji: "🧹", items: ["Locker Room Clean","Deep Clean Zone","Cleaning Rota"] },
    { category: "Classes",     emoji: "📅", items: ["Class Setup"] },
    { category: "Reception",   emoji: "🛎️", items: ["Reception Cover","Membership Queries"] },
    { category: "Stock",       emoji: "📦", items: ["Towel Restock","Protein Bar Restock"] },
    { category: "Other",       emoji: "➕", items: [] },
  ],
  cafe: [
    { category: "Opening",   emoji: "☀️", items: ["Opening Setup","Till Check","Pastry Display"] },
    { category: "Equipment", emoji: "☕", items: ["Machine Clean"] },
    { category: "Stock",     emoji: "📦", items: ["Stock Count","Milk Restock","Syrup Restock","Delivery Unload"] },
    { category: "Checks",    emoji: "✅", items: ["Fridge Temp Check"] },
    { category: "Cleaning",  emoji: "🧹", items: ["Floor Sweep","Window Clean","Deep Clean","Closing Clean"] },
    { category: "Other",     emoji: "➕", items: [] },
  ],
  bar: [
    { category: "Opening",   emoji: "🔓", items: ["Opening Setup","Till Check"] },
    { category: "Bar",       emoji: "🍺", items: ["Bar Stock Check","Glass Polish","Fridge Restock","Cellar Check"] },
    { category: "Cleaning",  emoji: "🧹", items: ["Floor Sweep","Deep Clean","Closing Clean"] },
    { category: "Other",     emoji: "➕", items: [] },
  ],
  restaurant: [
    { category: "Opening",   emoji: "☀️", items: ["Opening Setup","Table Setup","Till Check"] },
    { category: "Kitchen",   emoji: "🍳", items: ["Kitchen Prep","Fridge Temp Check","Stock Count","Delivery Unload"] },
    { category: "Cleaning",  emoji: "🧹", items: ["Floor Sweep","Deep Clean","Closing Clean","Window Clean"] },
    { category: "Other",     emoji: "➕", items: [] },
  ],
  hotel: [
    { category: "Rooms",       emoji: "🛏️", items: ["Room Checks","Linen Restock","Lost Property Log","Closing Check"] },
    { category: "Reception",   emoji: "🛎️", items: ["Reception Cover","Breakfast Setup"] },
    { category: "Maintenance", emoji: "🔧", items: ["Maintenance Check","Deep Clean"] },
    { category: "Stock",       emoji: "📦", items: ["Stock Count"] },
    { category: "Other",       emoji: "➕", items: [] },
  ],
};

// ─── DAY NAMES ────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getShopIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("shop") || null;
}

function getWeekNumber(d) {
  const date = new Date(d); date.setHours(0,0,0,0);
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

function getCategoryForTask(task, sector, customCats) {
  const cats = customCats || SECTOR_TASK_CATEGORIES[sector] || SECTOR_TASK_CATEGORIES.convenience;
  return cats.find(c => c.items.includes(task))?.category || "Other";
}

// ─── FETCH SHOP CONFIG ────────────────────────────────────────────────────────
async function fetchShopConfig(shopId) {
  const rows = await sbGet("shops", `id=eq.${encodeURIComponent(shopId)}&active=eq.true`);
  if (!rows.length) throw new Error(`Shop "${shopId}" not found. Check the URL.`);
  const row = rows[0];
  // Fetch absences separately
  let absences = {};
  try {
    const absRows = await sbGet("absences", `shop_id=eq.${encodeURIComponent(shopId)}&order=date.desc`);
    absRows.forEach(r => {
      if (!absences[r.staff_name]) absences[r.staff_name] = [];
      absences[r.staff_name].push({ date: r.date, type: "absent", comment: r.comment || "" });
    });
  } catch(e) {}
  return {
    id:             row.id,
    shopId:         row.id,
    shopName:       row.name || shopId,
    sector:         (row.sector || "convenience").toLowerCase(),
    shiftHours:     parseInt(row.shift_hours || 6),
    staff:          Array.isArray(row.staff) ? row.staff : (typeof row.staff === "string" ? JSON.parse(row.staff) : []),
    absences,
    taskCategories: row.task_categories || null,
  };
}

// ─── FETCH CUSTOM TASKS ──────────────────────────────────────────────────────
async function fetchCustomTasksForShop(shopId) {
  try {
    const rows = await sbGet("custom_tasks", `shop_id=eq.${encodeURIComponent(shopId)}&order=category,name`);
    return rows;
  } catch(e) { return []; }
}

// ─── FETCH LIVE SCHEDULE ──────────────────────────────────────────────────────
async function fetchScheduleFromAirtable(shopId, sector, staffNames) {
  const template = SECTOR_TASKS[sector] || SECTOR_TASKS.convenience;
  const sched = JSON.parse(JSON.stringify(template));
  try {
    const rows = await sbGet("task_schedules", `shop_id=eq.${encodeURIComponent(shopId)}&order=staff_name`);
    rows.forEach(row => {
      const { staff_name: staff, day, tasks, shift_start, shift_end, id } = row;
      if (!staff || !day) return;
      try {
        if (!sched[day]) sched[day] = {};
        if (tasks) sched[day][staff] = Array.isArray(tasks) ? tasks : JSON.parse(tasks);
        if (!sched[day]._ids) sched[day]._ids = {};
        sched[day]._ids[staff] = id;
        if (shift_start || shift_end) {
          if (!sched[day]._times) sched[day]._times = {};
          sched[day]._times[staff] = { start: shift_start || "", end: shift_end || "" };
        }
      } catch(e) {}
    });
  } catch(e) { console.warn("fetchSchedule failed:", e); }
  return sched;
}

// ─── SUBMIT TIMESHEET ─────────────────────────────────────────────────────────
async function submitToAirtable(shopId, shopName, sector, staffName, shiftName, logs, otherTasks, incidentNote) {
  const now     = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const wk      = getWeekNumber(now);
  const yr      = now.getFullYear();
  const rows    = [];

  const makeRow = (taskName, hours, minutes, notes) => ({
    shop_id:    shopId,
    staff_name: staffName,
    date:       dateStr,
    week:       wk,
    year:       yr,
    task:       taskName,
    category:   getCategoryForTask(taskName, sector, shopConfig?.taskCategories),
    mins:       parseInt(hours || 0) * 60 + parseInt(minutes || 0),
    notes:      notes || "",
    incident:   !!(incidentNote),
  });

  Object.entries(logs).forEach(([taskName, val]) => {
    rows.push(makeRow(taskName, val.hours, val.minutes, val.notes));
  });
  otherTasks.forEach(ot => {
    if (!ot.name || (!ot.hours && !ot.minutes)) return;
    rows.push(makeRow(ot.name, ot.hours, ot.minutes, ot.notes));
  });

  if (!rows.length) throw new Error("No tasks to submit");
  await sbPost("shifts", rows);
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
const STORAGE_KEY = "stafflog_v4";

function loadAllData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function saveSession(shopId, name) {
  const all = loadAllData();
  all[`session_${shopId}`] = { name, loginTime: Date.now() };
  const dk = `${shopId}_${name}_${todayKey()}`;
  if (!all[dk]) all[dk] = { logs: {}, otherTasks: [] };
  saveAllData(all);
}
function loadSession(shopId) {
  const all = loadAllData();
  const s = all[`session_${shopId}`];
  if (!s) return null;
  const elapsed = (Date.now() - s.loginTime) / 60000;
  if (elapsed > SESSION_MINUTES) {
    delete all[`session_${shopId}`];
    saveAllData(all);
    return null;
  }
  return s.name;
}
function clearSession(shopId) {
  const all = loadAllData();
  delete all[`session_${shopId}`];
  saveAllData(all);
}
function loadTodayData(shopId, name) {
  const all = loadAllData();
  return all[`${shopId}_${name}_${todayKey()}`] || { logs: {}, otherTasks: [] };
}
function saveTodayData(shopId, name, logs, otherTasks) {
  const all = loadAllData();
  all[`${shopId}_${name}_${todayKey()}`] = { logs, otherTasks };
  saveAllData(all);
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen({ message }) {
  return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.authHeader}>
          <div style={s.logoMark}>⚡</div>
          <div>
            <div style={s.logoName}>StaffLog</div>
            <div style={s.logoStore}>Loading…</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0", color: "#9ca3af", fontSize: 15 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid #e5e7eb`, borderTop: `2px solid ${BRAND}`, animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          {message}
        </div>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.authHeader}>
          <div style={s.logoMark}>⚡</div>
          <div>
            <div style={s.logoName}>StaffLog</div>
            <div style={s.logoStore}>Error</div>
          </div>
        </div>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px", color: "#dc2626", fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
          ⚠️ {message}
        </div>
        <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 16 }}>
          Check the URL includes <strong>?shop=your_shop_id</strong> and that the shop exists in our system.
        </p>
      </div>
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Shop config state ──
  const [shopConfig, setShopConfig]         = useState(null);
  const [shopLoading, setShopLoading]       = useState(true);
  const [shopError, setShopError]           = useState(null);

  // ── Auth state ──
  const [screen, setScreen]                 = useState("select-staff");
  const [staffName, setStaffName]           = useState("");
  const [staffShift, setStaffShift]         = useState("");
  const [selectedStaff, setSelectedStaff]   = useState(null);
  const [pinEntry, setPinEntry]             = useState("");
  const [pinError, setPinError]             = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

  // ── Schedule state ──
  const [schedule, setSchedule]             = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError]   = useState(false);

  // ── Task state ──
  const [viewMode, setViewMode]             = useState("checklist");
  const [expandedDay, setExpandedDay]       = useState(null);
  const [weekRefreshing, setWeekRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [logs, setLogs]                     = useState({});
  const [otherTasks, setOtherTasks]         = useState([]);
  const [activeTask, setActiveTask]         = useState(null);
  const [inputHours, setInputHours]         = useState("");
  const [inputMinutes, setInputMinutes]     = useState("");
  const [inputNotes, setInputNotes]         = useState("");
  const [inputOtherName, setInputOtherName] = useState("");
  const [tileSearch, setTileSearch]         = useState("");
  const [shopCustomTasks, setShopCustomTasks] = useState([]);

  // ── Submit state ──
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState("");
  const [incidentNote, setIncidentNote]     = useState("");

  const today   = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });
  const shopId  = getShopIdFromURL();

  // ── Step 1: Load shop config from Airtable ──
  useEffect(() => {
    if (!shopId) {
      setShopError("No shop ID in URL. Add ?shop=your_shop_id to the URL.");
      setShopLoading(false);
      return;
    }
    fetchShopConfig(shopId)
      .then(config => {
        setShopConfig(config);
        setShopLoading(false);
      })
      .catch(err => {
        setShopError(err.message);
        setShopLoading(false);
      });
  }, []);

  // ── Step 2: Load schedule + custom tasks once shop config is ready ──
  useEffect(() => {
    if (!shopConfig) return;
    setScheduleLoading(true);
    Promise.all([
      fetchScheduleFromAirtable(shopConfig.shopId, shopConfig.sector, shopConfig.staff.map(s=>s.name)),
      fetchCustomTasksForShop(shopConfig.shopId),
    ])
      .then(([s, ct]) => { setSchedule(s); setShopCustomTasks(ct); setScheduleLoading(false); })
      .catch(() => {
        setSchedule(SECTOR_TASKS[shopConfig.sector] || SECTOR_TASKS.convenience);
        setScheduleError(true);
        setScheduleLoading(false);
      });
  }, [shopConfig]);

  // ── Step 3: Restore session ──
  useEffect(() => {
    if (!shopConfig) return;
    const saved = loadSession(shopConfig.shopId);
    if (saved) {
      const staffObj = shopConfig.staff.find(s => s.name === saved);
      const data = loadTodayData(shopConfig.shopId, saved);
      setStaffName(saved);
      setStaffShift(staffObj?.shift || "");
      setLogs(data.logs || {});
      setOtherTasks(data.otherTasks || []);
      setScreen("home");
    }
  }, [shopConfig]);

  // ── Auto-save ──
  useEffect(() => {
    if (shopConfig && staffName && screen !== "select-staff" && screen !== "pin") {
      saveTodayData(shopConfig.shopId, staffName, logs, otherTasks);
    }
  }, [logs, otherTasks, staffName, shopConfig]);

  // ── Refresh week data (called when My Week tab is opened) ──
  const refreshWeekData = async () => {
    if (!shopConfig) return;
    setWeekRefreshing(true);
    try {
      const [freshConfig, freshSchedule] = await Promise.all([
        fetchShopConfig(shopConfig.shopId),
        fetchScheduleFromAirtable(shopConfig.shopId, shopConfig.sector, shopConfig.staff.map(s=>s.name)),
      ]);
      setShopConfig(freshConfig);
      setSchedule(freshSchedule);
    } catch {}
    finally { setWeekRefreshing(false); }
  };

  // ── Session expiry check ──
  useEffect(() => {
    if (!shopConfig) return;
    const interval = setInterval(() => {
      if (["home","category","summary"].includes(screen)) {
        const still = loadSession(shopConfig.shopId);
        if (!still) {
          if (staffName) saveTodayData(shopConfig.shopId, staffName, logs, otherTasks);
          setSessionExpiredMsg(true);
          setStaffName(""); setStaffShift("");
          setScreen("select-staff");
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [screen, staffName, logs, otherTasks, shopConfig]);

  // ── Lock on visibility hidden ──
  useEffect(() => {
    if (!shopConfig) return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (staffName) saveTodayData(shopConfig.shopId, staffName, logs, otherTasks);
        clearSession(shopConfig.shopId);
      } else if (document.visibilityState === "visible") {
        const still = loadSession(shopConfig.shopId);
        if (!still && staffName) {
          setSessionExpiredMsg(false);
          setStaffName(""); setStaffShift("");
          setPinEntry(""); setPinError(false);
          setScreen("select-staff");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [staffName, logs, otherTasks, shopConfig]);

  // ── Derived ──
  const staffMemberConfig = shopConfig?.staff?.find(s => s.name === staffName);
  const SHIFT_HOURS = staffMemberConfig?.shiftHours || shopConfig?.shiftHours || 6;
  const sector      = shopConfig?.sector || "convenience";
  const TASK_CATEGORIES = useMemo(() => {
    // Use owner-customised categories if saved, otherwise fall back to sector defaults
    const base = (shopConfig?.taskCategories) || SECTOR_TASK_CATEGORIES[sector] || SECTOR_TASK_CATEGORIES.convenience;
    if (!shopCustomTasks.length) return base;
    // Merge any saved custom tasks into their categories
    const customByCat = {};
    shopCustomTasks.forEach(t => {
      if (!customByCat[t.category]) customByCat[t.category] = [];
      customByCat[t.category].push(t.name);
    });
    const result = base.map(cat => {
      const extras = customByCat[cat.category] || [];
      if (!extras.length) return cat;
      return { ...cat, items: [...cat.items, ...extras.filter(n => !cat.items.includes(n))] };
    });
    Object.entries(customByCat).forEach(([cat, items]) => {
      if (!result.find(c => c.category === cat)) {
        result.splice(result.length - 1, 0, { category: cat, emoji: "📌", items });
      }
    });
    return result;
  }, [sector, shopCustomTasks, shopConfig]);

  const totalMinutes =
    Object.values(logs).reduce((a, v) => a + parseInt(v.hours || 0) * 60 + parseInt(v.minutes || 0), 0) +
    otherTasks.reduce((a, t) => a + parseInt(t.hours || 0) * 60 + parseInt(t.minutes || 0), 0);
  const progressPct    = Math.min((totalMinutes / 60 / SHIFT_HOURS) * 100, 100);
  const totalDisplay   = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const totalTaskCount = Object.keys(logs).length + otherTasks.filter(t => t.name).length;

  const todayDayName = getTodayDayName();
  const todayTasks   = (schedule && staffName) ? (schedule[todayDayName]?.[staffName] || schedule[todayDayName]?._all || []) : [];
  const todayDone    = todayTasks.filter(t => logs[t]).length;

  // ── Upcoming shift & full week view ──
  const ALL_WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const upcomingShift = useMemo(() => {
    if (!schedule) return null;
    const todayIdx = ALL_WEEK_DAYS.indexOf(todayDayName);
    for (let i = 1; i <= 7; i++) {
      const nextDay = ALL_WEEK_DAYS[(todayIdx + i) % 7];
      const tasks = schedule[nextDay]?.[staffName] || schedule[nextDay]?._all || [];
      if (tasks.length > 0) {
        const times = schedule[nextDay]?._times?.[staffName] || null;
        return { day: nextDay, tasks, times };
      }
    }
    return null;
  }, [schedule, staffName, todayDayName]);

  const weekSchedule = useMemo(() => {
    if (!schedule || !shopConfig) return [];
    return ALL_WEEK_DAYS.map(day => {
      const tasks = schedule[day]?.[staffName] || schedule[day]?._all || [];
      const times = schedule[day]?._times?.[staffName] || null;
      // get all absences for this staff member keyed by date
      const absences = shopConfig.absences?.[staffName] || [];
      return { day, tasks, times, absences };
    });
  }, [schedule, staffName, shopConfig]);

  // ── PIN handler ──
  const handlePinPress = (d) => {
    if (pinEntry.length >= 4) return;
    const next = pinEntry + d;
    setPinEntry(next); setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selectedStaff.pin) {
          const data = loadTodayData(shopConfig.shopId, selectedStaff.name);
          setStaffName(selectedStaff.name);
          setStaffShift(selectedStaff.shift);
          setLogs(data.logs || {});
          setOtherTasks(data.otherTasks || []);
          saveSession(shopConfig.shopId, selectedStaff.name);
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
      setOtherTasks(p => [...p, { id: activeTask.replace("other-new-",""), name: inputOtherName.trim(), hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes }]);
    } else if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-","");
      setOtherTasks(p => p.map(t => t.id === id ? { ...t, name: inputOtherName.trim() || t.name, hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes } : t));
    } else {
      setLogs(p => ({ ...p, [activeTask]: { hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes } }));
    }
    setActiveTask(null);
  };
  const removeTask = () => {
    if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-","").replace("new-","");
      setOtherTasks(p => p.filter(t => t.id !== id));
    } else {
      setLogs(p => { const n = { ...p }; delete n[activeTask]; return n; });
    }
    setActiveTask(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError("");
    try {
      await submitToAirtable(shopConfig.shopId, shopConfig.shopName, sector, staffName, staffShift, logs, otherTasks, incidentNote);
      const all = loadAllData();
      delete all[`${shopConfig.shopId}_${staffName}_${todayKey()}`];
      saveAllData(all);
      setScreen("submitted");
    } catch (e) { setSubmitError(e.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const handleSignOut = () => {
    clearSession(shopConfig.shopId);
    setStaffName(""); setStaffShift(""); setLogs({}); setOtherTasks([]);
    setScreen("select-staff"); setSubmitError("");
  };

  const resetShift = () => { setLogs({}); setOtherTasks([]); setSubmitError(""); setIncidentNote(""); setScreen("home"); };

  // ── Guard: loading / error ──
  if (shopLoading) return <LoadingScreen message="Loading shop configuration…" />;
  if (shopError)   return <ErrorScreen message={shopError} />;

  const catObj = activeCategory ? TASK_CATEGORIES.find(c => c.category === activeCategory) : null;

  // ── SELECT STAFF ──────────────────────────────────────────────────────────
  if (screen === "select-staff") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.authHeader}>
          <div style={s.logoMark}>⚡</div>
          <div>
            <div style={s.logoName}>StaffLog</div>
            <div style={s.logoStore}>{shopConfig.shopName} · {today}</div>
          </div>
        </div>

        {sessionExpiredMsg && (
          <div style={s.expiredBanner}>
            🔒 Session expired after 2 hours. Progress saved — log back in.
          </div>
        )}
        {scheduleError && (
          <div style={{ ...s.expiredBanner, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
            📋 Using saved schedule — couldn't reach the server.
          </div>
        )}

        <h2 style={s.authTitle}>Who are you?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shopConfig.staff.map(m => (
            <button key={m.name} style={s.staffTile}
              onClick={() => { setSelectedStaff(m); setPinEntry(""); setPinError(false); setSessionExpiredMsg(false); setScreen("pin"); }}>
              <div style={s.staffAvatar}>{m.initials}</div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={s.staffTileName}>{m.name}</div>
                <div style={s.staffShiftLabel}>{m.shift} shift</div>
              </div>
              <span style={{ fontSize: 24, color: "#d1d5db" }}>›</span>
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
          {[0,1,2,3].map(i => (
            <div key={i} style={{ ...s.pinDot, background: pinError ? "#ef4444" : pinEntry.length > i ? BRAND : "#e5e7eb", transition: "all 0.15s" }} />
          ))}
        </div>
        {pinError && <p style={s.pinErrMsg}>Incorrect PIN — try again</p>}
        <div style={s.numpad}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i) => (
            <button key={i} style={{ ...s.numKey, opacity: k===""?0:1, pointerEvents: k===""?"none":"auto" }}
              onClick={() => k==="⌫" ? setPinEntry(p=>p.slice(0,-1)) : k && handlePinPress(k)}>
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
      ...Object.entries(logs).map(([task, val]) => ({ task, val, category: getCategoryForTask(task, sector, shopConfig?.taskCategories) })),
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
            <div style={s.summaryStatDivider}/>
            <div style={s.summaryStat}><div style={s.summaryStatNum}>{totalDisplay}</div><div style={s.summaryStatLabel}>Time</div></div>
            <div style={s.summaryStatDivider}/>
            <div style={s.summaryStat}><div style={s.summaryStatNum}>{new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div><div style={s.summaryStatLabel}>Now</div></div>
          </div>
          {allEntries.length === 0
            ? <p style={{ color:"#9ca3af",textAlign:"center",marginTop:48,fontSize:15 }}>No tasks logged yet.</p>
            : allEntries.map(({task,val,category},i) => (
              <div key={i} style={s.summaryRow}>
                <div style={{...s.summaryPill,background:BRAND_LIGHT,color:BRAND_DARK}}>{category.split(" ")[0]}</div>
                <div style={{flex:1}}>
                  <div style={s.summaryTaskName}>{task}</div>
                  {val.notes && <div style={s.summaryNote}>"{val.notes}"</div>}
                </div>
                <div style={s.summaryTime}>{val.hours}h {val.minutes}m</div>
              </div>
            ))
          }
          {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}
          {allEntries.length > 0 && (
            <div style={{padding:"20px 16px 0"}}>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:6}}>🚩 Anything to flag?</div>
                <div style={{fontSize:13,color:"#9ca3af",marginBottom:10}}>Optional — report an incident, issue, or anything the manager should know about today's shift.</div>
                <textarea
                  value={incidentNote}
                  onChange={e=>setIncidentNote(e.target.value)}
                  placeholder="e.g. Freezer alarm went off, delivery was short, customer complaint…"
                  style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${incidentNote?"#f97316":"#e5e7eb"}`,fontSize:14,color:"#111",background:incidentNote?"#fff7ed":"#fafafa",boxSizing:"border-box",resize:"none",minHeight:80,outline:"none",fontFamily:"inherit",lineHeight:1.5}}
                />
                {incidentNote&&<div style={{fontSize:12,color:"#f97316",fontWeight:600,marginTop:4}}>⚠️ This will be flagged to your manager</div>}
              </div>
              <button style={{...s.primaryBtn,opacity:submitting?0.6:1}} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Shift ✓"}
              </button>
            </div>
          )}
          <div style={{height:48}}/>
        </div>
      </div>
    );
  }

  // ── CATEGORY DRILL-DOWN ───────────────────────────────────────────────────
  if (screen === "category" && catObj) {
    const doneInCat = catObj.category==="Other"
      ? otherTasks.filter(t=>t.name).length
      : catObj.items.filter(t=>logs[t]).length;
    const pct = catObj.items.length > 0 ? Math.round((doneInCat/catObj.items.length)*100) : 0;
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={() => setScreen("home")}>← Back</button>
            <div style={{textAlign:"right"}}>
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
              <div style={s.progressTrack}><div style={{...s.progressFill,width:`${pct}%`}}/></div>
            </div>
          )}
          <p style={s.hint}>Tap a task after completing it to log your time.</p>
          <div style={s.taskCard}>
            {catObj.items.map((task,idx) => {
              const logged = logs[task];
              return (
                <button key={task} style={{...s.taskRow,background:logged?BRAND_LIGHT:"#fff",borderTop:idx===0?"none":"1px solid #f3f4f6"}}
                  onClick={() => openStandardTask(task)}>
                  <div style={{...s.taskDot,background:logged?BRAND:"#e5e7eb"}}/>
                  <span style={{...s.taskLabel,fontWeight:logged?700:500,color:logged?"#111":"#374151"}}>{task}</span>
                  {logged
                    ? <span style={s.taskDoneBadge}>{logged.hours}h {logged.minutes}m</span>
                    : <span style={s.taskChevron}>›</span>}
                </button>
              );
            })}
            {catObj.category === "Other" && (
              <>
                {otherTasks.map((t,idx) => (
                  <button key={t.id} style={{...s.taskRow,background:BRAND_LIGHT,borderTop:idx===0?"none":"1px solid #f3f4f6"}}
                    onClick={() => openOtherTask(t.id)}>
                    <div style={{...s.taskDot,background:BRAND}}/>
                    <span style={{...s.taskLabel,fontWeight:700}}>{t.name}</span>
                    <span style={s.taskDoneBadge}>{t.hours}h {t.minutes}m</span>
                  </button>
                ))}
                <button style={{...s.taskRow,background:"#fafafa",borderTop:otherTasks.length>0?"1px solid #f3f4f6":"none"}}
                  onClick={openNewOther}>
                  <div style={{...s.taskDot,background:"#d1d5db"}}/>
                  <span style={{...s.taskLabel,color:"#9ca3af"}}>Add a task not on the list…</span>
                  <span style={{fontSize:20,color:"#d1d5db"}}>+</span>
                </button>
              </>
            )}
          </div>
          <div style={{height:80}}/>
        </div>
        {activeTask && (
          <TaskModal activeTask={activeTask} catColor={BRAND}
            inputHours={inputHours} setInputHours={setInputHours}
            inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
            inputNotes={inputNotes} setInputNotes={setInputNotes}
            inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
            logs={logs} onSave={saveTask} onRemove={removeTask} onClose={() => setActiveTask(null)}/>
        )}
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  const tileData = TASK_CATEGORIES.map(cat => {
    const done  = cat.category==="Other" ? otherTasks.filter(t=>t.name).length : cat.items.filter(t=>logs[t]).length;
    const total = cat.items.length;
    return { ...cat, done, total, pct: total>0 ? done/total : 0 };
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
              <div style={s.homeDate}>{shopConfig.shopName} · {today}</div>
            </div>
          </div>
          <div style={s.homeActions}>
            {totalTaskCount > 0 && (
              <button style={s.reviewChip} onClick={() => setScreen("summary")}>Review</button>
            )}
            <button style={s.signOutChip} onClick={handleSignOut} title="Sign out">⏻</button>
          </div>
        </div>

        {scheduleLoading && (
          <div style={{margin:"12px 16px 0",background:"#f9fafb",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#9ca3af",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid #e5e7eb",borderTop:`2px solid ${BRAND}`,animation:"spin 0.8s linear infinite",flexShrink:0}}/>
            Loading your schedule…
          </div>
        )}

        {/* Progress bar */}
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
            <div style={{...s.hoursFill,width:`${progressPct}%`,background:progressPct>=100?"#22c55e":BRAND}}/>
            {Array.from({length:SHIFT_HOURS-1},(_,i) => (
              <div key={i} style={{...s.hourMarker,left:`${((i+1)/SHIFT_HOURS)*100}%`}}/>
            ))}
          </div>
          <div style={s.hoursLabels}>
            <span>0h</span>
            {Array.from({length:SHIFT_HOURS-1},(_,i) => <span key={i}>{i+1}h</span>)}
            <span>{SHIFT_HOURS}h</span>
          </div>
          {progressPct >= 100 && <div style={s.hoursComplete}>🎉 Full shift logged!</div>}
        </div>

        {/* View toggle */}
        <div style={s.toggleRow}>
          <button style={{...s.toggleBtn,background:viewMode==="checklist"?BRAND:"#f3f4f6",color:viewMode==="checklist"?"#fff":"#6b7280"}}
            onClick={() => { setViewMode("checklist"); setTileSearch(""); }}>☑ Today</button>
          <button style={{...s.toggleBtn,background:viewMode==="tiles"?BRAND:"#f3f4f6",color:viewMode==="tiles"?"#fff":"#6b7280"}}
            onClick={() => setViewMode("tiles")}>⊞ Categories</button>
          <button style={{...s.toggleBtn,background:viewMode==="week"?BRAND:"#f3f4f6",color:viewMode==="week"?"#fff":"#6b7280"}}
            onClick={() => { setViewMode("week"); setTileSearch(""); refreshWeekData(); }}>📅 My Week</button>
        </div>

        {/* Checklist view */}
        {viewMode === "checklist" && (
          <div style={{padding:"0 16px"}}>
            <div style={s.checklistHeader}>
              <span style={s.checklistHeaderText}>{todayDone} of {todayTasks.length} today's tasks done</span>
              <span style={s.checklistHeaderPct}>{todayTasks.length>0?Math.round((todayDone/todayTasks.length)*100):0}%</span>
            </div>
            {scheduleLoading ? (
              <div style={{...s.taskCard,padding:"20px 16px",color:"#9ca3af",fontSize:14,textAlign:"center"}}>Loading today's tasks…</div>
            ) : todayTasks.length > 0 ? (
              <div style={s.taskCard}>
                {todayTasks.map((task,idx) => {
                  const logged = logs[task];
                  return (
                    <button key={task} style={{...s.checkRow,background:logged?BRAND_LIGHT:"#fff",borderTop:idx===0?"none":"1px solid #f3f4f6"}}
                      onClick={() => openStandardTask(task)}>
                      <div style={{...s.checkbox,background:logged?BRAND:"transparent",borderColor:logged?BRAND:"#d1d5db"}}>
                        {logged && <span style={s.checkmark}>✓</span>}
                      </div>
                      <span style={{...s.checkTaskName,color:logged?"#111":"#374151",fontWeight:logged?700:500}}>{task}</span>
                      {logged
                        ? <span style={s.checkTimeBadge}>{logged.hours}h {logged.minutes}m</span>
                        : <span style={s.taskChevron}>›</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{color:"#9ca3af",textAlign:"center",padding:"32px 0",fontSize:14}}>No tasks scheduled for today.</p>
            )}
            <div style={{marginTop:16}}>
              <div style={s.checklistHeader}>
                <span style={s.checklistHeaderText}>➕ Additional Tasks</span>
                <span style={s.checklistHeaderPct}>{otherTasks.filter(t=>t.name).length} added</span>
              </div>
              <div style={s.taskCard}>
                {otherTasks.filter(t=>t.name).map((t,idx) => (
                  <button key={t.id} style={{...s.checkRow,background:BRAND_LIGHT,borderTop:idx===0?"none":"1px solid #f3f4f6"}}
                    onClick={() => openOtherTask(t.id)}>
                    <div style={{...s.checkbox,background:BRAND,borderColor:BRAND}}>
                      <span style={s.checkmark}>✓</span>
                    </div>
                    <span style={{...s.checkTaskName,color:"#111",fontWeight:700}}>{t.name}</span>
                    <span style={s.checkTimeBadge}>{t.hours}h {t.minutes}m</span>
                  </button>
                ))}
                <button style={{...s.checkRow,background:"#fafafa",borderTop:otherTasks.filter(t=>t.name).length>0?"1px solid #f3f4f6":"none"}}
                  onClick={openNewOther}>
                  <div style={{...s.checkbox,background:"transparent",borderColor:"#d1d5db"}}>
                    <span style={{color:"#d1d5db",fontSize:14,fontWeight:700}}>+</span>
                  </div>
                  <span style={{...s.checkTaskName,color:"#9ca3af"}}>Add a task not on the list…</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tiles view */}
        {viewMode === "tiles" && (
          <div>
            <div style={{padding:"8px 16px 4px"}}>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#9ca3af",pointerEvents:"none"}}>🔍</span>
                <input type="text" placeholder="Search all tasks…" value={tileSearch} onChange={e=>setTileSearch(e.target.value)}
                  style={{width:"100%",padding:"11px 36px 11px 38px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:16,color:"#111",background:"#fff",boxSizing:"border-box",outline:"none"}}/>
                {tileSearch.length>0 && (
                  <button onClick={()=>setTileSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"#e5e7eb",border:"none",borderRadius:"50%",width:20,height:20,fontSize:11,color:"#6b7280",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
                )}
              </div>
            </div>
            {tileSearch.trim().length>0 ? (() => {
              const q = tileSearch.trim().toLowerCase();
              const allTaskItems = TASK_CATEGORIES.flatMap(cat => cat.items.map(item=>({task:item,category:cat.category,emoji:cat.emoji})));
              const results = allTaskItems.filter(t=>t.task.toLowerCase().includes(q));
              return (
                <div style={{padding:"6px 16px 0"}}>
                  {results.length===0?(
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #f3f4f6",padding:"20px 16px",textAlign:"center"}}>
                      <div style={{fontSize:13,color:"#9ca3af",marginBottom:12}}>No tasks found for "{tileSearch}"</div>
                      <button style={{background:BRAND,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}
                        onClick={()=>{openNewOther();setTileSearch("");}}>+ Log as custom task</button>
                    </div>
                  ):(
                    <div style={s.taskCard}>
                      {results.map((r,idx)=>{
                        const logged=logs[r.task];
                        return (
                          <button key={r.task} style={{...s.checkRow,background:logged?BRAND_LIGHT:"#fff",borderTop:idx===0?"none":"1px solid #f3f4f6"}}
                            onClick={()=>{openStandardTask(r.task);setTileSearch("");}}>
                            <div style={{...s.checkbox,background:logged?BRAND:"transparent",borderColor:logged?BRAND:"#d1d5db"}}>
                              {logged&&<span style={s.checkmark}>✓</span>}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{...s.checkTaskName,color:logged?"#111":"#374151",fontWeight:logged?700:500}}>{r.task}</div>
                              <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{r.emoji} {r.category}</div>
                            </div>
                            {logged?<span style={s.checkTimeBadge}>{logged.hours}h {logged.minutes}m</span>:<span style={s.taskChevron}>›</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })():(
              <div style={s.tileGrid}>
                {tileData.map(cat=>(
                  <button key={cat.category} style={s.tile}
                    onClick={()=>{setActiveCategory(cat.category);setScreen("category");}}>
                    <div style={s.tileTopRow}>
                      <span style={s.tileEmoji}>{cat.emoji}</span>
                      {cat.done>0 && <span style={s.tileDoneBadge}>{cat.done}{cat.total?`/${cat.total}`:""}</span>}
                    </div>
                    <div style={s.tileCatName}>{cat.category}</div>
                    <div style={s.tileCatSub}>
                      {cat.category==="Other"?(cat.done>0?`${cat.done} added`:"Tap to add"):`${cat.done} of ${cat.total} done`}
                    </div>
                    {cat.total>0&&(
                      <div style={s.tileProgressTrack}>
                        <div style={{...s.tileProgressFill,width:`${cat.pct*100}%`,background:cat.done>0?BRAND:"#e5e7eb"}}/>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "week" && (
          <div style={{padding:"8px 16px 0"}}>
            {weekRefreshing && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0 12px",color:"#9ca3af",fontSize:13}}>
                <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid #e5e7eb",borderTop:`2px solid ${BRAND}`,animation:"spin 0.8s linear infinite"}}/>
                Refreshing schedule…
              </div>
            )}

            {/* Next shift banner */}
            {upcomingShift && (
              <div style={{background:BRAND,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>📅</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Next Shift: {upcomingShift.day}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:1}}>
                    {upcomingShift.times?.start?`${upcomingShift.times.start}${upcomingShift.times.end?` – ${upcomingShift.times.end}`:""} · `:""}
                    {upcomingShift.tasks.length} task{upcomingShift.tasks.length!==1?"s":""}
                  </div>
                </div>
              </div>
            )}

            {/* Day rows */}
            {weekSchedule.map(({day, tasks, times}) => {
              const isToday = day === todayDayName;
              const isNext = upcomingShift?.day === day && !isToday;
              const isExpanded = expandedDay === day;
              const hasTasks = tasks.length > 0;
              return (
                <div key={day} style={{marginBottom:8}}>
                  <button
                    onClick={()=>hasTasks?setExpandedDay(isExpanded?null:day):null}
                    style={{width:"100%",background:"#fff",borderRadius:isExpanded?"12px 12px 0 0":12,border:`1.5px solid ${isToday?BRAND:isNext?"#d1d5db":"#f0f0f0"}`,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:hasTasks?"pointer":"default",boxSizing:"border-box",textAlign:"left"}}
                  >
                    <div style={{width:36,height:36,borderRadius:10,background:isToday?BRAND:isNext?BRAND_LIGHT:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:12,fontWeight:800,color:isToday?"#fff":isNext?BRAND_DARK:"#9ca3af"}}>{day.slice(0,3).toUpperCase()}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:isToday?BRAND:"#111",display:"flex",alignItems:"center",gap:6}}>
                        {day}
                        {isToday&&<span style={{background:BRAND,color:"#fff",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:20}}>TODAY</span>}
                      </div>
                      <div style={{fontSize:12,color:"#9ca3af",marginTop:1}}>
                        {times?.start?`🕐 ${times.start}${times.end?` – ${times.end}`:""}  ·  `:""}
                        {hasTasks?`${tasks.length} task${tasks.length!==1?"s":""}  ·  Tap to view`:"No tasks scheduled"}
                      </div>
                    </div>
                    {hasTasks&&<span style={{fontSize:16,color:"#d1d5db",display:"inline-block",transform:isExpanded?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>}
                  </button>
                  {isExpanded&&(
                    <div style={{background:"#fafafa",borderRadius:"0 0 12px 12px",border:`1.5px solid ${isToday?BRAND:"#f0f0f0"}`,borderTop:"none",padding:"4px 0"}}>
                      {tasks.map((t,i)=>(
                        <div key={t} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderTop:i===0?"none":"1px solid #f3f4f6"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:isToday?BRAND:"#d1d5db",flexShrink:0}}/>
                          <span style={{fontSize:14,color:"#374151",fontWeight:500}}>{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Upcoming absences as ranges */}
            {(()=>{
              const now = new Date(); now.setHours(0,0,0,0);
              const allAbs = (shopConfig?.absences?.[staffName]||[])
                .filter(a=> new Date(a.date+"T12:00:00") >= now)
                .sort((a,b)=>a.date.localeCompare(b.date));
              if(!allAbs.length) return null;
              // Group into consecutive ranges
              const groups=[]; let g=null;
              allAbs.forEach(a=>{
                if(g){const prev=new Date(g.to+"T12:00:00");prev.setDate(prev.getDate()+1);if(prev.toISOString().split("T")[0]===a.date&&g.comment===(a.comment||"")){g.to=a.date;g.days++;return;}}
                g={from:a.date,to:a.date,days:1,comment:a.comment||""};groups.push(g);
              });
              return (
                <div style={{marginTop:8,marginBottom:8,background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:"14px 16px"}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#dc2626",marginBottom:10}}>📋 Upcoming Absences</div>
                  {groups.map((g,i)=>{
                    const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
                    const isSingle=g.from===g.to;
                    return (
                      <div key={g.from} style={{padding:"8px 0",borderTop:i===0?"none":"1px solid #fecaca"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#111"}}>
                          {isSingle?fmt(g.from):`${fmt(g.from)} – ${fmt(g.to)}`}
                          {!isSingle&&<span style={{fontSize:11,color:"#9ca3af",marginLeft:6}}>({g.days} days)</span>}
                        </div>
                        {g.comment&&<div style={{fontSize:12,color:"#6b7280",marginTop:2,fontStyle:"italic"}}>"{g.comment}"</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
        <div style={{height:80}}/>
      </div>

      {activeTask && screen==="home" && (
        <TaskModal activeTask={activeTask} catColor={BRAND}
          inputHours={inputHours} setInputHours={setInputHours}
          inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
          inputNotes={inputNotes} setInputNotes={setInputNotes}
          inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
          logs={logs} onSave={saveTask} onRemove={removeTask} onClose={()=>setActiveTask(null)}/>
      )}
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page:             { minHeight:"100vh",background:"#f9fafb",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",display:"flex",justifyContent:"center" },
  container:        { width:"100%",maxWidth:480 },
  authWrap:         { background:"#fff",borderRadius:24,padding:"36px 28px 40px",margin:"40px 16px",boxShadow:"0 4px 32px rgba(0,0,0,0.07)",maxWidth:420,width:"100%" },
  authHeader:       { display:"flex",alignItems:"center",gap:14,marginBottom:20 },
  logoMark:         { width:46,height:46,background:"#111",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 },
  logoName:         { fontSize:24,fontWeight:800,color:"#111",letterSpacing:-0.5 },
  logoStore:        { fontSize:14,color:"#9ca3af",marginTop:1 },
  authTitle:        { fontSize:20,fontWeight:700,color:"#111",marginBottom:16,marginTop:0 },
  expiredBanner:    { background:"#fff7ed",border:"1px solid #fed7aa",color:"#c2410c",borderRadius:10,padding:"12px 14px",fontSize:15,marginBottom:16,lineHeight:1.5 },
  staffTile:        { background:"#f9fafb",border:"2px solid #e5e7eb",borderRadius:16,padding:"18px 20px",cursor:"pointer",display:"flex",flexDirection:"row",alignItems:"center",gap:16,width:"100%",boxSizing:"border-box",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  staffAvatar:      { width:56,height:56,borderRadius:"50%",background:BRAND,color:"#fff",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" },
  staffTileName:    { fontWeight:700,fontSize:17,color:"#111" },
  staffShiftLabel:  { fontSize:13,color:"#9ca3af",textTransform:"capitalize" },
  textBtn:          { background:"none",border:"none",color:"#9ca3af",fontSize:16,fontWeight:600,cursor:"pointer",padding:0,marginBottom:24,display:"block" },
  pinAvatarLarge:   { width:80,height:80,borderRadius:"50%",background:BRAND,color:"#fff",fontWeight:800,fontSize:26,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" },
  pinStaffName:     { fontSize:26,fontWeight:800,color:"#111",textAlign:"center",marginBottom:4 },
  pinSub:           { color:"#9ca3af",fontSize:16,textAlign:"center",marginBottom:24 },
  pinDots:          { display:"flex",justifyContent:"center",gap:14,marginBottom:8 },
  pinDot:           { width:18,height:18,borderRadius:"50%" },
  pinErrMsg:        { color:"#ef4444",fontSize:15,textAlign:"center",marginBottom:12 },
  numpad:           { display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:20 },
  numKey:           { background:"#f3f4f6",border:"none",borderRadius:14,padding:"20px 0",fontSize:26,fontWeight:700,color:"#111",cursor:"pointer" },
  topBar:           { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 16px 14px",background:"#fff",borderBottom:"1px solid #f3f4f6",position:"sticky",top:0,zIndex:10 },
  topBarName:       { fontWeight:700,fontSize:18,color:"#111" },
  topBarSub:        { fontSize:14,color:"#9ca3af",marginTop:2 },
  backBtn:          { background:"none",border:"none",color:"#111",fontSize:17,fontWeight:700,cursor:"pointer",padding:0 },
  homeHeader:       { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 16px 0" },
  homeTitleRow:     { display:"flex",alignItems:"center",gap:10 },
  logoMarkSm:       { width:40,height:40,background:"#111",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 },
  homeGreeting:     { fontSize:20,fontWeight:800,color:"#111" },
  homeDate:         { fontSize:13,color:"#9ca3af",marginTop:2 },
  homeActions:      { display:"flex",gap:8,alignItems:"center" },
  reviewChip:       { background:BRAND,color:"#fff",border:"none",padding:"10px 16px",borderRadius:20,fontSize:15,fontWeight:600,cursor:"pointer" },
  signOutChip:      { background:"#f3f4f6",color:"#6b7280",border:"none",width:40,height:40,borderRadius:"50%",fontSize:18,cursor:"pointer" },
  hoursCard:        { margin:"16px 16px 0",background:"#fff",borderRadius:16,padding:"16px",border:"1px solid #f3f4f6",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  hoursCardHeader:  { display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 },
  hoursCardTitle:   { fontSize:16,fontWeight:800,color:"#111" },
  hoursCardSub:     { fontSize:14,color:"#9ca3af",marginTop:2 },
  hoursCardRight:   { textAlign:"right" },
  hoursLogged:      { fontSize:24,fontWeight:800,color:BRAND },
  hoursTarget:      { fontSize:16,color:"#9ca3af",fontWeight:600 },
  hoursTrack:       { height:16,background:"#f3f4f6",borderRadius:99,overflow:"visible",position:"relative",marginBottom:6 },
  hoursFill:        { height:"100%",borderRadius:99,transition:"width 0.5s ease",position:"relative",zIndex:1 },
  hourMarker:       { position:"absolute",top:0,bottom:0,width:2,background:"#fff",zIndex:2,transform:"translateX(-50%)" },
  hoursLabels:      { display:"flex",justifyContent:"space-between",fontSize:12,color:"#9ca3af",fontWeight:600,marginTop:4 },
  hoursComplete:    { textAlign:"center",fontSize:15,fontWeight:700,color:"#16a34a",marginTop:8 },
  toggleRow:        { display:"flex",gap:8,padding:"14px 16px 4px" },
  toggleBtn:        { flex:1,border:"none",borderRadius:10,padding:"12px 0",fontSize:16,fontWeight:700,cursor:"pointer",transition:"all 0.18s" },
  checklistHeader:  { display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,paddingLeft:2 },
  checklistHeaderText: { fontSize:15,fontWeight:700,color:"#374151" },
  checklistHeaderPct:  { fontSize:15,fontWeight:700,color:BRAND },
  checkRow:         { width:"100%",display:"flex",alignItems:"center",gap:12,padding:"18px 16px",border:"none",cursor:"pointer",textAlign:"left" },
  checkbox:         { width:28,height:28,borderRadius:8,border:"2px solid",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" },
  checkmark:        { color:"#fff",fontSize:15,fontWeight:800 },
  checkTaskName:    { flex:1,fontSize:17 },
  checkTimeBadge:   { fontSize:14,fontWeight:700,color:BRAND_DARK,background:BRAND_LIGHT,padding:"4px 12px",borderRadius:20,whiteSpace:"nowrap" },
  tileGrid:         { display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"8px 16px 0" },
  tile:             { background:"#fff",border:"1.5px solid #f3f4f6",borderRadius:16,padding:"18px 14px",cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,0.05)" },
  tileTopRow:       { display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 },
  tileEmoji:        { fontSize:30 },
  tileDoneBadge:    { background:BRAND,color:"#fff",fontSize:13,fontWeight:700,padding:"3px 10px",borderRadius:20 },
  tileCatName:      { fontWeight:800,fontSize:17,color:"#111",marginBottom:3 },
  tileCatSub:       { fontSize:14,color:"#9ca3af",marginBottom:10 },
  tileProgressTrack:{ height:6,background:"#f3f4f6",borderRadius:99,overflow:"hidden" },
  tileProgressFill: { height:"100%",borderRadius:99,transition:"width 0.4s ease" },
  catProgressWrap:  { margin:"12px 16px 0",background:"#fff",borderRadius:12,padding:"14px 16px",border:"1px solid #f3f4f6" },
  catProgressHeader:{ display:"flex",justifyContent:"space-between",marginBottom:8 },
  catProgressLabel: { fontSize:15,fontWeight:600,color:"#374151" },
  catProgressPct:   { fontSize:15,fontWeight:700,color:BRAND },
  progressTrack:    { height:10,background:"#f3f4f6",borderRadius:99,overflow:"hidden" },
  progressFill:     { height:"100%",background:BRAND,borderRadius:99,transition:"width 0.4s ease" },
  hint:             { color:"#9ca3af",fontSize:15,padding:"10px 16px 4px" },
  taskCard:         { margin:"0 16px",borderRadius:14,overflow:"hidden",border:"1px solid #f3f4f6",background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  taskRow:          { width:"100%",display:"flex",alignItems:"center",gap:12,padding:"18px 16px",border:"none",cursor:"pointer",textAlign:"left" },
  taskDot:          { width:12,height:12,borderRadius:"50%",flexShrink:0 },
  taskLabel:        { flex:1,fontSize:17 },
  taskDoneBadge:    { background:BRAND,color:"#fff",fontSize:14,fontWeight:700,padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap" },
  taskChevron:      { fontSize:22,color:"#d1d5db" },
  sectionPad:       { padding:"20px 16px 8px" },
  pageTitle:        { fontSize:24,fontWeight:800,color:"#111" },
  summaryStatsRow:  { display:"flex",margin:"8px 16px 0",background:"#111",borderRadius:14,padding:"18px 0",justifyContent:"space-around" },
  summaryStat:      { textAlign:"center" },
  summaryStatNum:   { color:"#fff",fontSize:24,fontWeight:800 },
  summaryStatLabel: { color:"#6b7280",fontSize:13,marginTop:2 },
  summaryStatDivider:{ width:1,background:"#374151" },
  summaryRow:       { display:"flex",alignItems:"flex-start",gap:10,background:"#fff",margin:"6px 16px 0",padding:"14px 16px",borderRadius:12,border:"1px solid #f3f4f6" },
  summaryPill:      { fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:20,whiteSpace:"nowrap",alignSelf:"flex-start",marginTop:2 },
  summaryTaskName:  { fontWeight:700,fontSize:16,color:"#111",flex:1 },
  summaryNote:      { fontSize:14,color:"#6b7280",marginTop:3,fontStyle:"italic" },
  summaryTime:      { fontWeight:700,fontSize:16,color:"#374151",whiteSpace:"nowrap" },
  successIcon:      { fontSize:64,textAlign:"center",marginBottom:12 },
  successTitle:     { fontSize:26,fontWeight:800,color:"#111",textAlign:"center",marginBottom:6 },
  successName:      { fontSize:18,fontWeight:600,color:"#374151",textAlign:"center" },
  successDate:      { fontSize:15,color:"#9ca3af",textAlign:"center",marginBottom:16 },
  successStats:     { display:"flex",background:"#f9fafb",borderRadius:14,padding:"16px 0",justifyContent:"space-around",marginBottom:16 },
  successStat:      { textAlign:"center" },
  successStatNum:   { fontSize:24,fontWeight:800,color:"#111" },
  successStatLabel: { fontSize:14,color:"#9ca3af",marginTop:2 },
  successStatDivider:{ width:1,background:"#e5e7eb" },
  successMsg:       { color:"#9ca3af",fontSize:15,textAlign:"center",marginBottom:24 },
  primaryBtn:       { display:"block",width:"100%",background:BRAND,color:"#fff",border:"none",padding:"18px",borderRadius:12,fontSize:18,fontWeight:700,cursor:"pointer",marginBottom:10 },
  outlineBtn:       { display:"block",width:"100%",background:"transparent",color:"#9ca3af",border:"1.5px solid #e5e7eb",padding:"16px",borderRadius:12,fontSize:17,fontWeight:600,cursor:"pointer" },
  errorBox:         { background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:10,padding:"12px 16px",margin:"12px 16px 0",fontSize:15 },
  modalOverlay:     { position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100 },
  modal:            { background:"#fff",borderRadius:"20px 20px 0 0",padding:"0 24px 40px",width:"100%",maxWidth:480,boxShadow:"0 -8px 32px rgba(0,0,0,0.15)",overflow:"hidden" },
  modalAccentBar:   { height:5,margin:"0 -24px 20px" },
  modalTitle:       { fontSize:20,fontWeight:800,color:"#111",margin:"0 0 4px" },
  modalFieldLabel:  { display:"block",fontSize:15,fontWeight:600,color:"#374151",marginBottom:8 },
  modalSub:         { color:"#9ca3af",fontSize:15,marginBottom:16 },
  modalTextInput:   { width:"100%",padding:"14px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:16,marginBottom:16,boxSizing:"border-box",color:"#111" },
  timeRow:          { display:"flex",alignItems:"center",gap:8,marginBottom:16 },
  timeCol:          { flex:1 },
  timeLabel:        { display:"block",fontSize:14,fontWeight:600,color:"#9ca3af",marginBottom:6 },
  timeInput:        { width:"100%",padding:"16px 10px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:28,fontWeight:800,textAlign:"center",color:"#111",boxSizing:"border-box" },
  timeSep:          { fontSize:28,fontWeight:700,color:"#d1d5db",marginTop:20 },
  modalBtnRow:      { display:"flex",gap:10,marginTop:4 },
  removeBtn:        { background:"#fef2f2",color:"#ef4444",border:"none",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer" },
};
