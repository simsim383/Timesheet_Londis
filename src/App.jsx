import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

// ─── THEME & CONFIG ──────────────────────────────────────────────────────────
const T = {
  bg: "#F5F5F7", card: "#FFFFFF", border: "#F0F0F0", text: "#0A0A0A",
  sub: "#6B7280", muted: "#9CA3AF", accent: "#E07B39", accentLight: "#FDF0E8",
  green: "#16A34A", greenLight: "#F0FDF4", red: "#DC2626", redLight: "#FEF2F2",
  amber: "#D97706", amberLight: "#FFFBEB", blue: "#2563EB", blueLight: "#EFF6FF",
  div: "#F3F4F6",
};
const SC = { Michelle: "#E07B39", Alyson: "#2563EB", Susan: "#8B5CF6" };
const STAFF = ["Michelle", "Alyson", "Susan"];
const SHIFTS = { Michelle: "Morning", Alyson: "Morning", Susan: "Evening" };
const WDAYS = [1, 2, 3, 4, 5, 6];
const DNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AT_BASE   = "app6DROW7O9mZnmTY";
const AT_SHIFTS = "tbl4sVuVCiDCyXF3O";
const AT_TASKS  = "tblTl58cC0siAAaSN";
const AT_TOKEN  = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const AT_HDR    = { Authorization: "Bearer " + AT_TOKEN, "Content-Type": "application/json" };

const CATEGORIES = {
  "Post Office": "Admin", "Till Lift / End of Shift Count": "Admin", "Personal Training": "Admin",
  "Pies": "Food", "Magazine Returns": "Stationery", "Newspaper Returns": "Stationery",
  "Crisp Stacking": "Stacking", "Pop Stacking": "Stacking", "Beers Stacking": "Stacking",
  "Wine Stacking": "Stacking", "Dog Food Stacking": "Stacking", "Toiletries Stacking": "Stacking",
  "Fridge Stacking": "Stacking", "Freezer Stacking": "Stacking", "Grocery Stacking": "Stacking",
  "Biscuit Stacking": "Stacking", "Cards Stacking": "Stacking", "Chocolate/Sweets Stacking": "Stacking",
  "Mix Ups": "Stacking", "Cigarette/Vape Stacking": "Stacking", "Spirits Stacking": "Stacking",
  "Fridge Date Check / Temp Check": "Cleaning & Checks", "Product Date Checks": "Cleaning & Checks",
  "Fridges Clean": "Cleaning & Checks", "Mop": "Cleaning & Checks",
  "Door Clean / Outside Clean": "Cleaning & Checks", "Behind Counter Clean": "Cleaning & Checks",
  "Stock Room Clean": "Cleaning & Checks", "Cash and Carry List": "Admin",
  "Pricing": "Admin", "Promotions": "Admin", "Delivery Unload": "Deliveries", "Serving": "Customer Service",
};

const TASK_POOL = [
  "Post Office", "Till Lift / End of Shift Count", "Personal Training", "Pies",
  "Magazine Returns", "Newspaper Returns", "Crisp Stacking", "Pop Stacking",
  "Beers Stacking", "Wine Stacking", "Dog Food Stacking", "Toiletries Stacking",
  "Fridge Stacking", "Freezer Stacking", "Grocery Stacking", "Biscuit Stacking",
  "Cards Stacking", "Chocolate/Sweets Stacking", "Mix Ups", "Cigarette/Vape Stacking",
  "Spirits Stacking", "Fridge Date Check / Temp Check", "Product Date Checks",
  "Fridges Clean", "Mop", "Door Clean / Outside Clean", "Behind Counter Clean",
  "Stock Room Clean", "Cash and Carry List", "Pricing", "Promotions", "Delivery Unload", "Serving",
];

const DEFAULT_SCHEDULE = {
  Monday:    { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Fridge Date Check / Temp Check","Pricing"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridges Clean","Product Date Checks"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups","Behind Counter Clean"] },
  Tuesday:   { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Chocolate/Sweets Stacking","Promotions"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Cigarette/Vape Stacking","Door Clean / Outside Clean"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Wine Stacking","Delivery Unload","Stock Room Clean"] },
  Wednesday: { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridge Stacking","Mop"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking","Cards Stacking"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups"] },
  Thursday:  { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Grocery Stacking","Freezer Stacking"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Chocolate/Sweets Stacking","Product Date Checks"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Behind Counter Clean"] },
  Friday:    { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Wine Stacking","Cards Stacking"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Pop Stacking","Delivery Unload"] },
  Saturday:  { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Fridge Stacking","Mop"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Freezer Stacking"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Spirits Stacking"] },
  Sunday:    { Michelle: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"], Alyson: ["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"], Susan: ["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns"] },
};

// ─── AIRTABLE: FETCH TIMESHEETS ───────────────────────────────────────────────
async function fetchShifts() {
  let rows = [], offset = null;
  do {
    const url = new URL("https://api.airtable.com/v0/" + AT_BASE + "/" + AT_SHIFTS);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: "Bearer " + AT_TOKEN } });
    if (!r.ok) throw new Error("Fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);
  return rows;
}

function cook(raw) {
  return raw.map(r => ({
    id: r.id,
    staff: r.fields["Staff Name"] || "",
    date: r.fields["Date"] || "",
    task: r.fields["Task Name"] || "",
    category: r.fields["Category"] || "",
    mins: Number(r.fields["Total Minutes"] || 0),
    notes: r.fields["Task Notes"] || "",
    week: Number(r.fields["Week Number"] || 0),
  })).filter(r => r.staff && r.date);
}

// ─── AIRTABLE: FETCH & SAVE SCHEDULE ─────────────────────────────────────────
// Fetches the TaskSchedules table. Records override DEFAULT_SCHEDULE.
// Stores Airtable record IDs in sched[day]._ids[staff] for PATCH vs POST logic.
async function fetchScheduleFromAirtable() {
  let rows = [], offset = null;
  do {
    const url = new URL("https://api.airtable.com/v0/" + AT_BASE + "/" + AT_TASKS);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: "Bearer " + AT_TOKEN } });
    if (!r.ok) throw new Error("Schedule fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);

  const sched = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  rows.forEach(r => {
    const staff = r.fields["Staff Name"], day = r.fields["Day"], tasks = r.fields["Tasks"];
    if (staff && day && tasks) {
      try {
        if (!sched[day]) sched[day] = {};
        sched[day][staff] = JSON.parse(tasks);
        if (!sched[day]._ids) sched[day]._ids = {};
        sched[day]._ids[staff] = r.id;
      } catch (e) {}
    }
  });
  return sched;
}

// PATCH existing record or POST new one. Returns the record ID.
function saveScheduleToAirtable(day, staff, tasks, existingId) {
  const fields = {
    "Staff Name": staff,
    "Day": day,
    "Tasks": JSON.stringify(tasks),
    "Last Updated": new Date().toISOString().split("T")[0],
  };
  if (existingId) {
    return fetch("https://api.airtable.com/v0/" + AT_BASE + "/" + AT_TASKS + "/" + existingId, {
      method: "PATCH", headers: AT_HDR, body: JSON.stringify({ fields }),
    }).then(r => { if (!r.ok) throw new Error("Save failed"); return existingId; });
  } else {
    return fetch("https://api.airtable.com/v0/" + AT_BASE + "/" + AT_TASKS, {
      method: "POST", headers: AT_HDR, body: JSON.stringify({ fields }),
    }).then(r => { if (!r.ok) throw new Error("Create failed"); return r.json(); })
      .then(d => d.id);
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = m => { if (!m) return "0m"; const h = Math.floor(m / 60), mn = m % 60; return h > 0 ? (h + "h" + (mn > 0 ? " " + mn + "m" : "")) : (mn + "m"); };
const avgArr = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
const pctChg = (a, b) => b ? Math.round(((a - b) / b) * 100) : null;

function wkNum(ds) {
  const d = new Date(ds); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const y = new Date(d.getFullYear(), 0, 1); return Math.ceil((((d - y) / 86400000) + 1) / 7);
}
const curWk = () => wkNum(new Date().toISOString().split("T")[0]);
const prvWk = () => { const d = new Date(); d.setDate(d.getDate() - 7); return wkNum(d.toISOString().split("T")[0]); };
const todayStr = () => new Date().toISOString().split("T")[0];

function expDaysArr(n) {
  n = n || 30; const res = [], t = new Date();
  for (let i = 1; i <= n; i++) { const d = new Date(t); d.setDate(t.getDate() - i); if (WDAYS.includes(d.getDay())) res.push(d.toISOString().split("T")[0]); }
  return res;
}

function filterPeriod(recs, period) {
  const now = new Date();
  if (period === "today") { const t = todayStr(); return recs.filter(r => r.date === t); }
  if (period === "week") { const wk = curWk(); return recs.filter(r => r.week === wk); }
  if (period === "month") { const y = now.getFullYear(), m = now.getMonth(); return recs.filter(r => { const d = new Date(r.date); return d.getFullYear() === y && d.getMonth() === m; }); }
  return recs;
}
function filterPrev(recs, period) {
  const now = new Date();
  if (period === "today") { const prev = new Date(now); prev.setDate(now.getDate() - 1); return recs.filter(r => r.date === prev.toISOString().split("T")[0]); }
  if (period === "week") { const pw = prvWk(); return recs.filter(r => r.week === pw); }
  if (period === "month") { const y = now.getFullYear(), m = now.getMonth() - 1; return recs.filter(r => { const d = new Date(r.date); return d.getFullYear() === (m < 0 ? y - 1 : y) && d.getMonth() === (m < 0 ? 11 : m); }); }
  return [];
}

function staffDatesMap(recs) {
  const m = {}; STAFF.forEach(n => { m[n] = new Set(); });
  recs.forEach(r => { if (m[r.staff]) m[r.staff].add(r.date); });
  return m;
}
function shiftTotals(recs, name) {
  const m = {};
  recs.filter(r => r.staff === name).forEach(r => { m[r.date] = (m[r.date] || 0) + r.mins; });
  return m;
}
function teamTaskAvg(recs, task) {
  const v = recs.filter(r => r.task === task && r.mins > 0).map(r => r.mins);
  return v.length ? avgArr(v) : null;
}
function staffTaskAvg(recs, name, task) {
  const v = recs.filter(r => r.staff === name && r.task === task && r.mins > 0).map(r => r.mins);
  return v.length ? avgArr(v) : null;
}
function consistScore(recs, name) {
  const v = Object.values(shiftTotals(recs, name));
  if (v.length < 2) return null;
  const m = avgArr(v), cv = Math.sqrt(v.reduce((a, b) => a + Math.pow(b - m, 2), 0) / v.length) / m;
  return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
}
function wkMins(recs, name, wk) {
  return recs.filter(r => r.staff === name && r.week === wk && r.mins > 0).reduce((a, r) => a + r.mins, 0);
}
function bestDayFor(recs, task) {
  const m = {};
  recs.filter(r => r.task === task && r.mins > 0).forEach(r => { const d = DNAMES[new Date(r.date).getDay()]; if (!m[d]) m[d] = []; m[d].push(r.mins); });
  const s = Object.entries(m).map(e => ({ day: e[0], avg: avgArr(e[1]), n: e[1].length })).filter(x => x.n >= 1).sort((a, b) => a.avg - b.avg);
  return s[0] || null;
}
function taskDayTrendData(recs, task) {
  const m = {};
  recs.filter(r => r.task === task && r.mins > 0).forEach(r => { const d = DNAMES[new Date(r.date).getDay()]; if (!m[d]) m[d] = []; m[d].push(r.mins); });
  return DNAMES.slice(1, 7).map(d => ({ day: d, mins: m[d] ? avgArr(m[d]) : null, n: m[d] ? m[d].length : 0 }));
}

function genSummary(recs, period) {
  if (!recs.length) return [{ type: "info", text: "No data for this period yet. Once staff submit shifts, insights will appear here." }];
  const pts = [];
  const catMap = {};
  recs.filter(r => r.mins > 0).forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.mins; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  if (topCat) pts.push({ type: "insight", text: "Most time this " + period + " was spent on " + topCat[0] + " — " + fmt(topCat[1]) + " logged." });
  const allTasks = [...new Set(recs.map(r => r.task))];
  let wd = 0, wi = null;
  allTasks.forEach(task => {
    const ta = teamTaskAvg(recs, task); if (!ta) return;
    STAFF.forEach(n => {
      const sa = staffTaskAvg(recs, n, task); if (!sa) return;
      const d = Math.round(((sa - ta) / ta) * 100);
      if (d > wd && d > 25) { wd = d; wi = { n, task, d, sa, ta }; }
    });
  });
  if (wi) pts.push({ type: "flag", text: wi.n + " is " + wi.d + "% slower than average on \"" + wi.task + "\" — " + wi.sa + "m vs " + wi.ta + "m team avg." });
  const staffMins = STAFF.map(n => ({ n, total: recs.filter(r => r.staff === n && r.mins > 0).reduce((a, r) => a + r.mins, 0) })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  if (staffMins.length > 0) pts.push({ type: "good", text: staffMins[0].n + " logged the most time this " + period + " — " + fmt(staffMins[0].total) + "." });
  if (period !== "today") {
    ["Personal Training", "Post Office"].forEach(task => {
      const b = bestDayFor(recs, task);
      if (b) pts.push({ type: "insight", text: "\"" + task + "\" gets done fastest on " + b.day + "s — avg " + b.avg + " mins." });
    });
  }
  const today = todayStr();
  const notIn = WDAYS.includes(new Date().getDay()) ? STAFF.filter(n => !staffDatesMap(recs)[n].has(today)) : [];
  if (notIn.length && (period === "today" || period === "week")) pts.push({ type: "flag", text: notIn.join(", ") + (notIn.length === 1 ? " has" : " have") + " not submitted today." });
  if (!pts.length) pts.push({ type: "info", text: "Everything looks steady. More submissions will surface deeper patterns." });
  return pts;
}

function genStaffInsights(name, recs, allRecs, period) {
  const pts = [];
  const sRecs = recs.filter(r => r.staff === name && r.mins > 0);
  if (!sRecs.length) return [
    { type: "info", text: "No data for this period yet — insights appear once shifts are submitted." },
    { type: "info", text: "Try switching to This Week or This Month to see broader patterns." },
    { type: "info", text: "Once data flows in, you will see task speed, output targets, and standout strengths here." },
  ];
  const taskMap = {};
  sRecs.forEach(r => { if (!taskMap[r.task]) taskMap[r.task] = []; taskMap[r.task].push(r.mins); });
  const taskComps = Object.entries(taskMap).map(e => {
    const sa = avgArr(e[1]), ta = teamTaskAvg(allRecs, e[0]);
    const diff = ta ? Math.round(((sa - ta) / ta) * 100) : null;
    return { task: e[0], sa, ta, diff, count: e[1].length };
  }).filter(t => t.diff !== null);
  const faster = taskComps.filter(t => t.diff < -10).sort((a, b) => a.diff - b.diff);
  const slower = taskComps.filter(t => t.diff > 10).sort((a, b) => b.diff - a.diff);
  if (faster.length > 0) {
    const f = faster[0];
    pts.push({ type: "good", text: "Standout speed: " + name + " completes \"" + f.task + "\" " + Math.abs(f.diff) + "% faster than the team average (" + f.sa + "m vs " + f.ta + "m). A real strength worth recognising." });
  } else {
    pts.push({ type: "insight", text: "No tasks significantly faster than team average this " + period + ". With more data this will surface " + name + "'s strongest areas." });
  }
  if (slower.length > 0) {
    const s = slower[0];
    pts.push({ type: "flag", text: "Watch point: \"" + s.task + "\" is taking " + s.diff + "% longer than average (" + s.sa + "m vs " + s.ta + "m team avg). A quick conversation could help speed this up." });
  } else {
    pts.push({ type: "good", text: "No tasks flagged as significantly slower than the team this " + period + ". " + name + " is performing consistently across all logged tasks." });
  }
  const totalMins = sRecs.reduce((a, r) => a + r.mins, 0);
  const bench = { today: 360, week: 1800, month: 7200 }[period] || 360;
  const benchPct = Math.round((totalMins / bench) * 100);
  if (benchPct >= 90) pts.push({ type: "good", text: "Output: " + name + " has logged " + fmt(totalMins) + " this " + period + " — " + benchPct + "% of the expected shift target. Excellent effort." });
  else if (benchPct >= 55) pts.push({ type: "insight", text: "Output: " + name + " has logged " + fmt(totalMins) + " this " + period + " — " + benchPct + "% of the expected target. On track, though there is room to grow." });
  else pts.push({ type: "warn", text: "Output: Only " + fmt(totalMins) + " logged this " + period + " (" + benchPct + "% of target). This may be a missing submission or a shorter shift — worth checking in." });
  return pts.slice(0, 3);
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Card({ children, style, onPress }) {
  return <div onClick={onPress} style={{ background: T.card, borderRadius: 16, border: "1px solid " + T.border, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: 16, ...(style || {}), cursor: onPress ? "pointer" : "default" }}>{children}</div>;
}
function Lbl({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>{children}</div>;
}
function Badge({ label, type }) {
  const m = { good: { bg: T.greenLight, c: T.green }, warn: { bg: T.amberLight, c: T.amber }, flag: { bg: T.redLight, c: T.red }, neutral: { bg: T.accentLight, c: T.accent }, blue: { bg: T.blueLight, c: T.blue } };
  const s = m[type || "neutral"] || m.neutral;
  return <span style={{ background: s.bg, color: s.c, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>;
}
function Chip({ p }) {
  if (p === null || p === undefined) return <span style={{ fontSize: 12, color: T.muted }}>—</span>;
  return <span style={{ fontSize: 12, fontWeight: 700, color: p >= 0 ? T.green : T.red }}>{p >= 0 ? "▲" : "▼"} {Math.abs(p)}%</span>;
}
function PBar({ val, max, color, h }) {
  h = h || 6; const w = max > 0 ? Math.min((val / max) * 100, 100) : 0;
  return <div style={{ height: h, background: T.div, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: w + "%", background: color, borderRadius: 99, transition: "width 0.5s" }} /></div>;
}
function Avatar({ name, size }) {
  size = size || 36;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: SC[name] || T.accent, color: "#fff", fontWeight: 800, fontSize: size * 0.34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{name.slice(0, 2).toUpperCase()}</div>;
}
function InsightRow({ item }) {
  const icons = { good: "✅", warn: "⚠️", flag: "🚨", insight: "💡", info: "📊" };
  const cols = { good: T.green, warn: T.amber, flag: T.red, insight: T.blue, info: T.sub };
  return <div style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid " + T.div }}><span style={{ fontSize: 18, flexShrink: 0 }}>{icons[item.type] || "•"}</span><p style={{ margin: 0, fontSize: 14, color: cols[item.type] || T.sub, lineHeight: 1.6, fontWeight: 500 }}>{item.text}</p></div>;
}
function NoteTag({ note }) {
  if (!note) return null;
  return <span style={{ background: T.blueLight, color: T.blue, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 4, wordBreak: "break-word" }}>💬 {note}</span>;
}
function PeriodToggle({ period, setPeriod }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "12px 16px 0", overflowX: "auto" }}>
      {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }].map(o => (
        <button key={o.id} onClick={() => setPeriod(o.id)} style={{ background: period === o.id ? "#111" : "#fff", color: period === o.id ? "#fff" : T.sub, border: "1px solid " + (period === o.id ? "#111" : T.border), borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{o.label}</button>
      ))}
    </div>
  );
}

function SnapshotCard({ recs, prevRecs, period, sdm }) {
  const today = todayStr();
  const totalMins = recs.filter(r => r.mins > 0).reduce((a, r) => a + r.mins, 0);
  const prevMins = prevRecs.filter(r => r.mins > 0).reduce((a, r) => a + r.mins, 0);
  const taskCount = [...new Set(recs.filter(r => r.mins > 0).map(r => r.task))].length;
  const activeStaff = [...new Set(recs.filter(r => r.mins > 0).map(r => r.staff))].length;
  const allR = recs.filter(r => r.mins > 0);
  const avgTask = allR.length ? avgArr(allR.map(r => r.mins)) : 0;
  const catMap = {}; allR.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.mins; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const isWorkDay = WDAYS.includes(new Date().getDay());
  const notIn = period === "today" && isWorkDay ? STAFF.filter(n => !sdm[n].has(today)) : [];
  const live = period === "today" && activeStaff > 0;
  const mChg = pctChg(totalMins, prevMins);
  const dateLabel = period === "today" ? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : period === "week" ? "Week " + curWk() : new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const headline = period === "today" ? (live ? "Live Data" : "Waiting for submissions") : (fmt(totalMins) + " logged");
  return (
    <Card style={{ background: "#111", border: "none", margin: "12px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 }}>{dateLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{headline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {live && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />}
          {mChg !== null && <Chip p={mChg} />}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: notIn.length ? 10 : 0 }}>
        {[{ l: "HOURS LOGGED", val: fmt(totalMins), dim: !totalMins }, { l: "TASKS DONE", val: taskCount || "—", dim: !taskCount }, { l: "STAFF IN", val: activeStaff + "/" + STAFF.length, dim: !activeStaff }, { l: "AVG TASK", val: avgTask ? avgTask + "m" : "—", dim: !avgTask }].map(k => (
          <div key={k.l} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{k.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.dim ? "rgba(255,255,255,0.2)" : "#fff" }}>{k.val}</div>
          </div>
        ))}
      </div>
      {topCat && <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 12px", marginTop: 8, marginBottom: notIn.length ? 8 : 0 }}><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>MOST TIME ON</div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{topCat[0]} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>· {fmt(topCat[1])}</span></div></div>}
      {notIn.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(220,38,38,0.2)", borderRadius: 10, padding: "8px 12px", marginTop: 8 }}><span style={{ fontSize: 14 }}>🚨</span><span style={{ fontSize: 13, color: "#FCA5A5", fontWeight: 600 }}>Not submitted: {notIn.join(", ")}</span></div>}
    </Card>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ allRecs, expDays }) {
  const [period, setPeriod] = useState("today");
  const recs = useMemo(() => filterPeriod(allRecs, period), [allRecs, period]);
  const prevRecs = useMemo(() => filterPrev(allRecs, period), [allRecs, period]);
  const sdm = useMemo(() => staffDatesMap(allRecs), [allRecs]);
  const summary = useMemo(() => genSummary(recs, period), [recs, period]);
  const staffBreak = STAFF.map(n => ({ n, mins: recs.filter(r => r.staff === n && r.mins > 0).reduce((a, r) => a + r.mins, 0), prevMins: prevRecs.filter(r => r.staff === n && r.mins > 0).reduce((a, r) => a + r.mins, 0) }));
  const maxMins = Math.max(...staffBreak.map(s => s.mins), 1);
  const catMap = {}; recs.filter(r => r.mins > 0).forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.mins; });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catTotal = catData.reduce((a, b) => a + b[1], 0);
  const chartData = staffBreak.map(s => ({ name: s.n, Current: +(s.mins / 60).toFixed(1), Previous: +(s.prevMins / 60).toFixed(1) }));
  const pLabel = { today: "Today", week: "This Week", month: "This Month" }[period];
  const prLabel = { today: "Yesterday", week: "Last Week", month: "Last Month" }[period];
  return (
    <div style={{ paddingBottom: 90 }}>
      <PeriodToggle period={period} setPeriod={setPeriod} />
      <SnapshotCard recs={recs} prevRecs={prevRecs} period={period} sdm={sdm} />
      <div style={{ padding: "14px 16px 0" }}>
        <Lbl>Staff Hours · {pLabel}</Lbl>
        {staffBreak.map(s => {
          const chg = pctChg(s.mins, s.prevMins);
          return (
            <div key={s.n} style={{ background: T.card, borderRadius: 14, border: "1px solid " + T.border, padding: 14, marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar name={s.n} size={36} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{s.n}</div><div style={{ fontSize: 11, color: T.muted }}>{SHIFTS[s.n]}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 800, color: SC[s.n] }}>{fmt(s.mins) || "—"}</div><Chip p={chg} /></div>
              </div>
              <PBar val={s.mins} max={maxMins} color={SC[s.n]} h={7} />
            </div>
          );
        })}
        {chartData.some(d => d.Current > 0 || d.Previous > 0) && (
          <>
            <Lbl>{pLabel} vs {prLabel}</Lbl>
            <Card style={{ marginBottom: 14, padding: "16px 8px 8px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.div} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.sub, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} width={24} />
                  <Tooltip formatter={v => [v + "h"]} contentStyle={{ borderRadius: 12, border: "1px solid " + T.border, fontSize: 13 }} />
                  <Bar dataKey="Current" radius={[6, 6, 0, 0]}>{chartData.map(s => <Cell key={s.name} fill={SC[s.name]} />)}</Bar>
                  <Bar dataKey="Previous" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
        {catData.length > 0 && (
          <>
            <Lbl>Time by Category</Lbl>
            <Card style={{ marginBottom: 14 }}>
              {catData.map(e => {
                const p = Math.round((e[1] / catTotal) * 100);
                return (
                  <div key={e[0]} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{e[0]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(e[1])} <span style={{ color: T.muted, fontWeight: 400 }}>({p}%)</span></span>
                    </div>
                    <PBar val={p} max={100} color={T.accent} h={7} />
                  </div>
                );
              })}
            </Card>
          </>
        )}
        <Lbl>Intelligence · {pLabel}</Lbl>
        <Card style={{ marginBottom: 14 }}>{summary.map((item, i) => <InsightRow key={i} item={item} />)}</Card>
      </div>
    </div>
  );
}

// ─── STAFF TAB ────────────────────────────────────────────────────────────────
function StaffTab({ allRecs, expDays, onNav }) {
  const [period, setPeriod] = useState("week");
  const recs = useMemo(() => filterPeriod(allRecs, period), [allRecs, period]);
  const prevRecs = useMemo(() => filterPrev(allRecs, period), [allRecs, period]);
  const sdm = useMemo(() => staffDatesMap(allRecs), [allRecs]);
  const today = todayStr();
  const isWorkDay = WDAYS.includes(new Date().getDay());
  return (
    <div style={{ paddingBottom: 90 }}>
      <PeriodToggle period={period} setPeriod={setPeriod} />
      <div style={{ padding: "14px 16px 0" }}>
        {STAFF.map(n => {
          const curr = recs.filter(r => r.staff === n && r.mins > 0).reduce((a, r) => a + r.mins, 0);
          const prev = prevRecs.filter(r => r.staff === n && r.mins > 0).reduce((a, r) => a + r.mins, 0);
          const sc = consistScore(allRecs, n);
          const miss30 = expDays.filter(d => !sdm[n].has(d)).length;
          const sub = sdm[n].has(today);
          const allStaffMax = Math.max(...STAFF.map(nm => recs.filter(r => r.staff === nm && r.mins > 0).reduce((a, r) => a + r.mins, 0)), 1);
          return (
            <Card key={n} style={{ marginBottom: 12 }} onPress={() => onNav("staffDetail", n)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar name={n} size={50} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{n}</span>
                    <Badge label={SHIFTS[n]} type="neutral" />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {sub ? <Badge label="✓ Submitted Today" type="good" /> : isWorkDay ? <Badge label="Not submitted" type="flag" /> : null}
                    {miss30 > 0 && <Badge label={miss30 + " missing"} type="warn" />}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: T.muted }}>›</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[{ l: "HOURS", val: fmt(curr) || "—", col: SC[n] }, { l: "VS PREV", val: <Chip p={pctChg(curr, prev)} />, col: T.sub }, { l: "CONSIST.", val: sc !== null ? sc + "/100" : "—", col: sc > 70 ? T.green : sc > 40 ? T.amber : T.red }].map(k => (
                  <div key={k.l} style={{ background: T.bg, borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 3 }}>{k.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: k.col }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <PBar val={curr} max={allStaffMax} color={SC[n]} h={6} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── STAFF DETAIL ─────────────────────────────────────────────────────────────
function StaffDetail({ name, allRecs, expDays, onNav }) {
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("week");
  const color = SC[name];
  const recs = useMemo(() => filterPeriod(allRecs, period), [allRecs, period]);
  const prevRecs = useMemo(() => filterPrev(allRecs, period), [allRecs, period]);
  const sRecs = useMemo(() => recs.filter(r => r.staff === name), [recs, name]);
  const sdm = useMemo(() => staffDatesMap(allRecs), [allRecs]);
  const today = todayStr();
  const curr = sRecs.filter(r => r.mins > 0).reduce((a, r) => a + r.mins, 0);
  const prev = prevRecs.filter(r => r.staff === name && r.mins > 0).reduce((a, r) => a + r.mins, 0);
  const sc = consistScore(allRecs, name);
  const miss30 = expDays.filter(d => !sdm[name].has(d));
  const sub = sdm[name].has(today);
  const sm = useMemo(() => shiftTotals(allRecs, name), [allRecs, name]);
  const avgShift = Object.values(sm).length ? avgArr(Object.values(sm)) : 0;
  const myTasks = useMemo(() => {
    const m = {};
    sRecs.filter(r => r.mins > 0).forEach(r => { if (!m[r.task]) m[r.task] = { task: r.task, cat: r.category, vals: [], notes: [] }; m[r.task].vals.push(r.mins); if (r.notes) m[r.task].notes.push({ date: r.date, note: r.notes, mins: r.mins }); });
    return Object.values(m).map(t => { const ta = teamTaskAvg(recs, t.task), sa = avgArr(t.vals), d = ta ? Math.round(((sa - ta) / ta) * 100) : 0; return { ...t, avg: sa, teamAvg: ta, diff: d, count: t.vals.length }; }).sort((a, b) => b.diff - a.diff);
  }, [sRecs]);
  const catBreak = useMemo(() => {
    const m = {}; sRecs.filter(r => r.mins > 0).forEach(r => { m[r.category] = (m[r.category] || 0) + r.mins; });
    const tot = Object.values(m).reduce((a, b) => a + b, 0);
    return Object.entries(m).map(e => ({ c: e[0], v: e[1], p: Math.round((e[1] / tot) * 100) })).sort((a, b) => b.v - a.v);
  }, [sRecs]);
  const heatRows = useMemo(() => {
    const tasks = [...new Set(allRecs.filter(r => r.staff === name).map(r => r.task))];
    return tasks.map(task => ({ task, cells: DNAMES.slice(1, 7).map(day => { const done = allRecs.filter(r => r.staff === name && r.task === task && DNAMES[new Date(r.date).getDay()] === day && r.mins > 0); return { done: done.length > 0, count: done.length, avgMins: done.length ? avgArr(done.map(d => d.mins)) : 0 }; }) }));
  }, [allRecs, name]);
  const wkTrend = useMemo(() => {
    const wks = [...new Set(allRecs.filter(r => r.staff === name).map(r => "W" + r.week))].sort();
    return wks.map(wk => ({ week: wk, hours: +(wkMins(allRecs, name, +wk.slice(1)) / 60).toFixed(1) }));
  }, [allRecs, name]);
  const tabs = ["overview", "tasks", "heatmap", "trends"];
  const insights = useMemo(() => genStaffInsights(name, recs, allRecs, period), [name, recs, allRecs, period]);
  return (
    <div style={{ paddingBottom: 90 }}>
      <PeriodToggle period={period} setPeriod={setPeriod} />
      <div style={{ padding: "12px 16px 0" }}>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <Avatar name={name} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <Badge label={SHIFTS[name]} type="neutral" />
                {sub ? <Badge label="✓ Today" type="good" /> : <Badge label="Not submitted today" type="flag" />}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[{ l: "PERIOD HRS", v: fmt(curr) || "—", s: <Chip p={pctChg(curr, prev)} />, col: color }, { l: "AVG SHIFT", v: fmt(avgShift) || "—", s: "all time", col: color }, { l: "CONSISTENCY", v: sc !== null ? sc + "/100" : "—", s: "reliability", col: sc > 70 ? T.green : sc > 40 ? T.amber : T.red }].map(k => (
              <div key={k.l} style={{ background: T.bg, borderRadius: 12, padding: "10px 8px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{k.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: k.col }}>{k.v}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{k.s}</div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map(t => <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? color : T.card, color: tab === t ? "#fff" : T.sub, border: "1px solid " + (tab === t ? color : T.border), borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>
        {tab === "overview" && (
          <>
            <Card style={{ marginBottom: 14 }}>
              {[{ l: "This Period", v: curr, col: color }, { l: "Previous", v: prev, col: "#E5E7EB" }].map(row => (
                <div key={row.l} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{row.l}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{fmt(row.v) || "0m"}</span></div>
                  <PBar val={row.v} max={Math.max(curr, prev, 1)} color={row.col} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}><Chip p={pctChg(curr, prev)} /></div>
            </Card>
            <Lbl>Time by Category</Lbl>
            <Card style={{ marginBottom: 14 }}>
              {catBreak.map(c => (
                <div key={c.c} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{c.c}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(c.v)} <span style={{ color: T.muted, fontWeight: 400 }}>({c.p}%)</span></span></div>
                  <PBar val={c.p} max={100} color={color} />
                </div>
              ))}
              {!catBreak.length && <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>No data for this period.</p>}
            </Card>
            {miss30.length > 0 && (
              <>
                <Lbl>Missing Submissions</Lbl>
                <Card style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.red, marginBottom: 8 }}>{miss30.length} <span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>days</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {miss30.slice(0, 8).map(d => <span key={d} style={{ background: T.redLight, color: T.red, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>)}
                    {miss30.length > 8 && <span style={{ fontSize: 12, color: T.muted, padding: "4px 8px" }}>+{miss30.length - 8} more</span>}
                  </div>
                </Card>
              </>
            )}
            <Lbl>Owner Insights · {period === "today" ? "Today" : period === "week" ? "This Week" : "This Month"}</Lbl>
            <Card style={{ marginBottom: 14 }}>{insights.map((item, i) => <InsightRow key={i} item={item} />)}</Card>
          </>
        )}
        {tab === "tasks" && (
          <>
            <Lbl>All Tasks · Tap for detail</Lbl>
            {myTasks.map(t => (
              <Card key={t.task} style={{ marginBottom: 8 }} onPress={() => onNav("taskDetail", { task: t.task, staff: name })}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.task}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{t.cat} · {t.count} sessions</div>
                    {t.notes.length > 0 && <NoteTag note={t.notes[t.notes.length - 1].note} />}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.diff > 0 ? T.red : t.diff < 0 ? T.green : T.text }}>{t.avg}m</div>
                    {t.teamAvg && <div style={{ fontSize: 11, color: T.muted }}>avg {t.teamAvg}m</div>}
                  </div>
                  {t.diff !== 0 && <Badge label={t.diff > 0 ? t.diff + "% slower" : Math.abs(t.diff) + "% faster"} type={t.diff > 0 ? "flag" : "good"} />}
                  <span style={{ fontSize: 16, color: T.muted }}>›</span>
                </div>
              </Card>
            ))}
            {!myTasks.length && <p style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "32px 0" }}>No tasks for this period.</p>}
          </>
        )}
        {tab === "heatmap" && (
          <>
            <Lbl>Task Completion Heatmap (All Time)</Lbl>
            <Card style={{ marginBottom: 14, overflowX: "auto" }}>
              {heatRows.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
                    <thead><tr>
                      <th style={{ textAlign: "left", color: T.muted, fontWeight: 700, paddingRight: 8, paddingBottom: 6, whiteSpace: "nowrap" }}>Task</th>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <th key={d} style={{ color: T.muted, fontWeight: 700, paddingBottom: 6, textAlign: "center", minWidth: 34 }}>{d}</th>)}
                    </tr></thead>
                    <tbody>{heatRows.map(row => (
                      <tr key={row.task}>
                        <td style={{ paddingRight: 8, paddingBottom: 4, color: T.sub, fontWeight: 600, whiteSpace: "nowrap", fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{row.task}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} style={{ textAlign: "center", paddingBottom: 4 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, margin: "0 auto", background: cell.done ? (cell.avgMins > 60 ? "#FEE2E2" : cell.avgMins > 30 ? "#FEF3C7" : "#DCFCE7") : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, border: cell.done ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                              {cell.done ? (cell.avgMins > 60 ? "🔴" : cell.avgMins > 30 ? "🟡" : "🟢") : ""}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                  <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: T.muted }}><span>🟢 &lt;30m</span><span>🟡 30–60m</span><span>🔴 &gt;60m</span></div>
                </div>
              ) : <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>No data yet.</p>}
            </Card>
          </>
        )}
        {tab === "trends" && (
          <>
            {wkTrend.length > 1 && (
              <>
                <Lbl>Weekly Hours Trend (All Time)</Lbl>
                <Card style={{ marginBottom: 14, padding: "16px 8px 8px" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={wkTrend} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.div} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: T.muted }} />
                      <YAxis tick={{ fontSize: 11, fill: T.muted }} width={24} />
                      <Tooltip formatter={v => [v + "h"]} contentStyle={{ borderRadius: 12, border: "1px solid " + T.border, fontSize: 13 }} />
                      <Line type="monotone" dataKey="hours" stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
            <Lbl>Recent Shifts</Lbl>
            <Card>
              {Object.entries(sm).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).map((e, i) => (
                <div key={e[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid " + T.div }}>
                  <span style={{ fontSize: 14, color: T.sub }}>{new Date(e[0]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: e[1] >= 300 ? T.green : e[1] >= 180 ? color : T.red }}>{fmt(e[1])}</span>
                </div>
              ))}
              {!Object.keys(sm).length && <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>No shifts yet.</p>}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TASK DETAIL ──────────────────────────────────────────────────────────────
function TaskDetail({ task, staffName, allRecs }) {
  const color = SC[staffName];
  const sRecs = allRecs.filter(r => r.staff === staffName && r.task === task && r.mins > 0);
  const ta = teamTaskAvg(allRecs, task);
  const sa = staffTaskAvg(allRecs, staffName, task);
  const diff = ta && sa ? Math.round(((sa - ta) / ta) * 100) : null;
  const best = bestDayFor(allRecs.filter(r => r.staff === staffName), task);
  const dayTrend = taskDayTrendData(allRecs.filter(r => r.staff === staffName), task).filter(d => d.mins !== null);
  const allAvgs = STAFF.map(n => ({ n, avg: staffTaskAvg(allRecs, n, task) || 0 })).filter(s => s.avg > 0);
  const sessions = sRecs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  return (
    <div style={{ padding: "12px 16px 90px" }}>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{task}</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>{staffName} · {sRecs.length} sessions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[{ l: "STAFF AVG", v: sa ? sa + "m" : "—", col: color }, { l: "TEAM AVG", v: ta ? ta + "m" : "—", col: T.sub }, { l: "DIFF", v: diff !== null ? (diff > 0 ? "+" : "") + diff + "%" : "—", col: diff > 15 ? T.red : diff < -15 ? T.green : T.text }].map(s => (
            <div key={s.l} style={{ background: T.bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.col }}>{s.v}</div>
            </div>
          ))}
        </div>
      </Card>
      {allAvgs.length > 1 && (
        <>
          <Lbl>All Staff Comparison</Lbl>
          <Card style={{ marginBottom: 14, padding: "16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={allAvgs.map(s => ({ name: s.n, mins: s.avg }))} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.div} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.sub, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11, fill: T.muted }} width={24} />
                <Tooltip formatter={v => [v + " mins"]} contentStyle={{ borderRadius: 12, border: "1px solid " + T.border, fontSize: 13 }} />
                <Bar dataKey="mins" radius={[6, 6, 0, 0]}>{allAvgs.map(s => <Cell key={s.n} fill={SC[s.n] || T.accent} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
      {dayTrend.length > 1 && (
        <>
          <Lbl>Avg Time by Day</Lbl>
          <Card style={{ marginBottom: 14, padding: "16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dayTrend} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.div} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.sub }} />
                <YAxis tick={{ fontSize: 11, fill: T.muted }} width={24} />
                <Tooltip formatter={v => [v + " mins"]} contentStyle={{ borderRadius: 12, border: "1px solid " + T.border, fontSize: 13 }} />
                <Bar dataKey="mins" radius={[6, 6, 0, 0]}>{dayTrend.map((d, i) => <Cell key={i} fill={best && d.day === best.day ? "#22C55E" : d.mins > 60 ? "#FCA5A5" : d.mins > 30 ? "#FCD34D" : color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            {best && <div style={{ fontSize: 12, color: T.green, fontWeight: 600, textAlign: "center", marginTop: 6 }}>Fastest on {best.day}s</div>}
          </Card>
        </>
      )}
      <Lbl>Session History with Notes</Lbl>
      <Card>
        {sessions.map((s, i) => (
          <div key={i} style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid " + T.div }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: T.sub }}>{new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: ta && s.mins > ta * 1.3 ? T.red : ta && s.mins < ta * 0.7 ? T.green : T.text }}>{s.mins}m</span>
            </div>
            {s.notes && <NoteTag note={s.notes} />}
          </div>
        ))}
        {!sessions.length && <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>No sessions yet.</p>}
      </Card>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: "#E5E7EB", margin: "0 auto 20px" }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 8, textAlign: "center" }}>Remove Task?</div>
        <div style={{ fontSize: 14, color: T.sub, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bg, color: T.sub, fontSize: 15, fontWeight: 700, border: "1px solid " + T.border, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.red, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── ACTIONS TAB ──────────────────────────────────────────────────────────────
// Fetches the live TaskSchedules table from Airtable on staff selection.
// Uses record IDs to PATCH existing rows or POST new ones — changes sync instantly.
function ActionsTab() {
  const [selStaff, setSelStaff] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingS, setLoadingS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "ok" | "err" | null
  const [selDay, setSelDay] = useState(ALL_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [confirmTask, setConfirmTask] = useState(null);

  // Fetch fresh schedule from Airtable whenever a staff member is selected
  useEffect(() => {
    if (!selStaff) return;
    setLoadingS(true);
    setSchedule(null);
    fetchScheduleFromAirtable()
      .then(s => { setSchedule(s); setLoadingS(false); })
      .catch(() => { setSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))); setLoadingS(false); });
  }, [selStaff]);

  const curDay = selDay;
  const todayTasks = schedule && selStaff && schedule[curDay] ? schedule[curDay][selStaff] || [] : [];
  const unusedTasks = TASK_POOL.filter(t => !todayTasks.includes(t));
  const existingId = schedule && schedule[curDay] && schedule[curDay]._ids ? schedule[curDay]._ids[selStaff] || null : null;

  function persistChange(newTasks) {
    setSaving(true); setSaveStatus(null);
    saveScheduleToAirtable(curDay, selStaff, newTasks, existingId)
      .then(newId => {
        setSchedule(prev => {
          const u = JSON.parse(JSON.stringify(prev));
          if (!u[curDay]._ids) u[curDay]._ids = {};
          u[curDay]._ids[selStaff] = newId;
          return u;
        });
        setSaveStatus("ok"); setSaving(false);
        setTimeout(() => setSaveStatus(null), 2500);
      })
      .catch(() => {
        setSaveStatus("err"); setSaving(false);
        setTimeout(() => setSaveStatus(null), 2500);
      });
  }

  function removeTask(task) {
    const newTasks = (schedule[curDay] && schedule[curDay][selStaff] ? schedule[curDay][selStaff] : []).filter(t => t !== task);
    setSchedule(prev => { const u = JSON.parse(JSON.stringify(prev)); u[curDay][selStaff] = newTasks; return u; });
    persistChange(newTasks);
  }

  function addTask(t) {
    if (!t.trim()) return;
    const existing = schedule && schedule[curDay] && schedule[curDay][selStaff] ? schedule[curDay][selStaff] : [];
    if (existing.includes(t)) { setNewTask(""); setAdding(false); return; }
    const newTasks = [...existing, t];
    setSchedule(prev => { const u = JSON.parse(JSON.stringify(prev)); if (!u[curDay]) u[curDay] = {}; u[curDay][selStaff] = newTasks; return u; });
    persistChange(newTasks);
    setNewTask(""); setAdding(false);
  }

  // Staff selection screen
  if (!selStaff) return (
    <div style={{ padding: "16px 16px 90px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>Actions</div>
      <div style={{ fontSize: 14, color: T.sub, marginBottom: 20 }}>Edit each staff member's daily task schedule. Changes sync to Airtable instantly.</div>
      {STAFF.map(n => (
        <Card key={n} style={{ marginBottom: 10 }} onPress={() => setSelStaff(n)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={n} size={46} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{n}</div>
              <div style={{ fontSize: 13, color: T.muted }}>{SHIFTS[n]} shift · Tap to edit schedule</div>
            </div>
            <span style={{ fontSize: 20, color: T.muted }}>›</span>
          </div>
        </Card>
      ))}
      <div style={{ marginTop: 20, background: T.greenLight, borderRadius: 12, padding: "14px 16px", border: "1px solid #BBF7D0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 4 }}>✅ Airtable Sync Active</div>
        <div style={{ fontSize: 13, color: T.green, lineHeight: 1.6 }}>Schedules are pulled live from your TaskSchedules table. Staff see updates next time they open the app.</div>
      </div>
    </div>
  );

  // Schedule editor
  return (
    <div style={{ padding: "0 16px 90px" }}>
      {/* Sub-header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0 12px" }}>
        <button onClick={() => { setSelStaff(null); setAdding(false); }} style={{ background: T.bg, border: "1px solid " + T.border, borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: T.text, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>← Back</button>
        <Avatar name={selStaff} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{selStaff} Schedule</div>
          <div style={{ fontSize: 12, color: T.muted }}>{SHIFTS[selStaff]} shift</div>
        </div>
        {saving && <span style={{ fontSize: 12, color: T.muted }}>Saving…</span>}
        {saveStatus === "ok" && <span style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>✓ Synced</span>}
        {saveStatus === "err" && <span style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>⚠ Failed</span>}
      </div>

      {/* Day picker */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {ALL_DAYS.map(d => (
          <button key={d} onClick={() => { setSelDay(d); setAdding(false); }} style={{ background: selDay === d ? SC[selStaff] : "#fff", color: selDay === d ? "#fff" : T.sub, border: "1px solid " + (selDay === d ? SC[selStaff] : T.border), borderRadius: 20, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{d.slice(0, 3)}</button>
        ))}
      </div>

      {/* Loading state */}
      {loadingS ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 0", color: T.muted, fontSize: 14 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + T.div, borderTop: "2px solid " + T.accent, animation: "spin 0.8s linear infinite" }} />
          Loading from Airtable…
        </div>
      ) : (
        <>
          {/* Add task row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Lbl>{curDay} Tasks ({todayTasks.length})</Lbl>
            <button onClick={() => setAdding(true)} style={{ background: SC[selStaff], color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>

          {/* Add task panel */}
          {adding && (
            <Card style={{ marginBottom: 12, border: "1px solid " + SC[selStaff] }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Add task for {curDay}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {unusedTasks.slice(0, 12).map(t => (
                  <button key={t} onClick={() => addTask(t)} style={{ background: T.bg, border: "1px solid " + T.border, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: T.sub, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTask(newTask); }} placeholder="Or type a custom task…" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid " + T.border, fontSize: 14, color: T.text }} />
                <button onClick={() => addTask(newTask)} style={{ background: SC[selStaff], color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Add</button>
              </div>
              <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", marginTop: 8, padding: 0 }}>Cancel</button>
            </Card>
          )}

          {/* Task list */}
          <Card>
            {todayTasks.length === 0 && <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>No tasks for {curDay}. Tap + Add.</p>}
            {todayTasks.map((task, i) => (
              <div key={task} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid " + T.div }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: SC[selStaff], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{task}</span>
                <button onClick={() => setConfirmTask(task)} disabled={saving} style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>Remove</button>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Confirm remove modal */}
      {confirmTask && (
        <ConfirmModal
          message={"Remove \"" + confirmTask + "\" from " + selStaff + "'s " + curDay + " schedule?"}
          onConfirm={() => { removeTask(confirmTask); setConfirmTask(null); }}
          onCancel={() => setConfirmTask(null)}
        />
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [bottomTab, setBottomTab] = useState("home");
  const [subNav, setSubNav] = useState(null);
  const [allRecs, setAllRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const expDays = useMemo(() => expDaysArr(30), []);

  const load = () => {
    setLoading(true); setError(null);
    fetchShifts()
      .then(r => { setAllRecs(cook(r)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  function onNav(type, data) { setSubNav({ type, ...(typeof data === "string" ? { staff: data } : data) }); window.scrollTo(0, 0); }
  function goBack() { if (subNav && subNav.type === "taskDetail") setSubNav({ type: "staffDetail", staff: subNav.staff }); else setSubNav(null); window.scrollTo(0, 0); }

  const isSubPage = !!subNav;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const subTitle = subNav && subNav.type === "staffDetail" ? subNav.staff : (subNav && subNav.task && subNav.task.length > 22 ? subNav.task.slice(0, 21) + "…" : subNav && subNav.task);
  const subSub = subNav && subNav.type === "staffDetail" ? (SHIFTS[subNav.staff] + " · " + subNav.staff) : subNav && subNav.staff;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", maxWidth: 480, margin: "0 auto" }}>
      {/* Top nav bar */}
      <div style={{ background: "#111", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isSubPage && <button onClick={goBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>← Back</button>}
            <div>
              {!isSubPage ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Londis · Horden</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{greeting} · {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{subTitle}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{subSub}</div>
                </>
              )}
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>{loading ? "…" : "↻"}</button>
        </div>
      </div>

      {/* Content */}
      {loading && !allRecs.length ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid " + T.div, borderTop: "3px solid " + T.accent, animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: T.muted, marginTop: 16, fontSize: 15 }}>Loading staff data…</p>
        </div>
      ) : error ? (
        <div style={{ margin: 16, background: T.redLight, border: "1px solid #FECACA", borderRadius: 14, padding: 20, color: T.red, fontSize: 14 }}>
          ⚠️ {error}
          <button onClick={load} style={{ marginLeft: 12, background: "none", border: "1px solid " + T.red, color: T.red, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 13 }}>Retry</button>
        </div>
      ) : isSubPage ? (
        subNav.type === "staffDetail"
          ? <StaffDetail name={subNav.staff} allRecs={allRecs} expDays={expDays} onNav={onNav} />
          : <TaskDetail task={subNav.task} staffName={subNav.staff} allRecs={allRecs} />
      ) : bottomTab === "home" ? <HomeTab allRecs={allRecs} expDays={expDays} />
        : bottomTab === "staff" ? <StaffTab allRecs={allRecs} expDays={expDays} onNav={onNav} />
          : <ActionsTab />
      }

      {/* Bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid " + T.border, display: "flex", zIndex: 20, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {[{ id: "home", icon: "🏠", label: "Home" }, { id: "staff", icon: "👥", label: "Staff" }, { id: "actions", icon: "✏️", label: "Actions" }].map(tab => (
          <button key={tab.id} onClick={() => { setBottomTab(tab.id); setSubNav(null); window.scrollTo(0, 0); }} style={{ flex: 1, background: "none", border: "none", padding: "12px 0 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: bottomTab === tab.id ? T.accent : T.muted }}>{tab.label}</span>
            {bottomTab === tab.id && !isSubPage && <div style={{ width: 20, height: 3, borderRadius: 99, background: T.accent, marginTop: 1 }} />}
          </button>
        ))}
      </div>

      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}"}</style>
    </div>
  );
}
