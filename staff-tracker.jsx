import { useState } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID = "app6DROW7O9mZnmTY";
const AIRTABLE_TABLE_ID = "tbl4sVuVCiDCyXF3O";
const AIRTABLE_TOKEN = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const STORE_NAME = "Londis";

// ─── STAFF LIST ──────────────────────────────────────────────────────────────
const STAFF = ["Select Staff...", "Sarah", "John", "Emma", "James", "Lisa", "Mike"];

// ─── TASKS ───────────────────────────────────────────────────────────────────
const TASKS = [
  { category: "Customer Service", items: ["Serving"] },
  {
    category: "Stacking",
    items: [
      "Crisp Stacking", "Pop Stacking", "Beers Stacking", "Wine Stacking",
      "Dog Food Stacking", "Toiletries Stacking", "Fridge Stacking",
      "Freezer Stacking", "Grocery Stacking", "Biscuit Stacking",
      "Cards Stacking", "Chocolate/Sweets Stacking", "Mix Ups",
      "Cigarette/Vape Stacking", "Spirits Stacking",
    ],
  },
  { category: "Checks", items: ["Fridge Date Check / Temp Check", "Product Date Checks"] },
  {
    category: "Cleaning",
    items: ["Fridges Clean", "Mop", "Door Clean / Outside Clean", "Behind Counter Clean", "Stock Room Clean"],
  },
  {
    category: "Admin & Operations",
    items: [
      "Cash and Carry List", "Magazine Returns", "Newspaper Returns", "Pies",
      "Pricing", "Promotions", "Delivery Unload", "Till Lift / End of Shift Count",
      "Post Office", "Personal Training",
    ],
  },
];

const categoryColor = {
  "Customer Service": "#2563eb",
  "Stacking": "#16a34a",
  "Checks": "#d97706",
  "Cleaning": "#7c3aed",
  "Admin & Operations": "#db2777",
  "Other": "#64748b",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function submitToAirtable(staffName, logs, otherTasks) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const submittedAt = now.toISOString();
  const weekNum = getWeekNumber(now);

  const records = [];

  Object.entries(logs).forEach(([taskName, val]) => {
    const category = TASKS.find(g => g.items.includes(taskName))?.category || "Other";
    const totalMins = parseInt(val.hours || 0) * 60 + parseInt(val.minutes || 0);
    records.push({
      fields: {
        "Staff Name": staffName,
        "Date": dateStr,
        "Shift Submitted At": submittedAt,
        "Total Minutes": totalMins,
        "Task Name": taskName,
        "Task Hours": parseInt(val.hours || 0),
        "Task Minutes": parseInt(val.minutes || 0),
        "Task Notes": val.notes || "",
        "Category": category,
        "Week Number": weekNum,
        "Store": STORE_NAME,
      },
    });
  });

  otherTasks.forEach((ot) => {
    if (!ot.name || (!ot.hours && !ot.minutes)) return;
    const totalMins = parseInt(ot.hours || 0) * 60 + parseInt(ot.minutes || 0);
    records.push({
      fields: {
        "Staff Name": staffName,
        "Date": dateStr,
        "Shift Submitted At": submittedAt,
        "Total Minutes": totalMins,
        "Task Name": ot.name,
        "Task Hours": parseInt(ot.hours || 0),
        "Task Minutes": parseInt(ot.minutes || 0),
        "Task Notes": ot.notes || "",
        "Category": "Other",
        "Week Number": weekNum,
        "Store": STORE_NAME,
      },
    });
  });

  if (records.length === 0) throw new Error("No tasks to submit");

  // Airtable allows max 10 records per request
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: batch }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "Airtable submission failed");
    }
  }
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [staff, setStaff] = useState("");
  const [date] = useState(() =>
    new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );

  const [logs, setLogs] = useState({});
  const [otherTasks, setOtherTasks] = useState([]);

  const [activeTask, setActiveTask] = useState(null);
  const [inputHours, setInputHours] = useState("");
  const [inputMinutes, setInputMinutes] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [inputOtherName, setInputOtherName] = useState("");

  const [openCategory, setOpenCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const standardMins = Object.values(logs).reduce(
    (acc, v) => acc + parseInt(v.hours || 0) * 60 + parseInt(v.minutes || 0), 0
  );
  const otherMins = otherTasks.reduce(
    (acc, t) => acc + parseInt(t.hours || 0) * 60 + parseInt(t.minutes || 0), 0
  );
  const totalMinutes = standardMins + otherMins;
  const totalDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const totalTaskCount = Object.keys(logs).length + otherTasks.filter(t => t.name).length;

  const openStandardTask = (task) => {
    setActiveTask(task);
    const existing = logs[task] || {};
    setInputHours(existing.hours ?? "");
    setInputMinutes(existing.minutes ?? "");
    setInputNotes(existing.notes ?? "");
    setInputOtherName("");
  };

  const openOtherTask = (id) => {
    const existing = otherTasks.find(t => t.id === id) || {};
    setActiveTask(`other-${id}`);
    setInputHours(existing.hours ?? "");
    setInputMinutes(existing.minutes ?? "");
    setInputNotes(existing.notes ?? "");
    setInputOtherName(existing.name ?? "");
  };

  const openNewOther = () => {
    const id = Date.now().toString();
    setActiveTask(`other-new-${id}`);
    setInputHours("");
    setInputMinutes("");
    setInputNotes("");
    setInputOtherName("");
  };

  const saveTask = () => {
    if (!inputHours && !inputMinutes) return;

    if (activeTask && activeTask.startsWith("other-new-")) {
      if (!inputOtherName.trim()) return;
      const id = activeTask.replace("other-new-", "");
      setOtherTasks(prev => [...prev, {
        id,
        name: inputOtherName.trim(),
        hours: inputHours || "0",
        minutes: inputMinutes || "0",
        notes: inputNotes,
      }]);
    } else if (activeTask && activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-", "");
      setOtherTasks(prev => prev.map(t =>
        t.id === id
          ? { ...t, name: inputOtherName.trim() || t.name, hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes }
          : t
      ));
    } else {
      setLogs(prev => ({
        ...prev,
        [activeTask]: { hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes },
      }));
    }
    setActiveTask(null);
  };

  const removeTask = () => {
    if (activeTask && activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-", "").replace("new-", "");
      setOtherTasks(prev => prev.filter(t => t.id !== id));
    } else {
      setLogs(prev => { const n = { ...prev }; delete n[activeTask]; return n; });
    }
    setActiveTask(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitToAirtable(staff, logs, otherTasks);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetApp = () => {
    setScreen("login"); setStaff(""); setLogs({});
    setOtherTasks([]); setSubmitted(false); setSubmitError("");
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (screen === "login") {
    return (
      <div style={s.page}>
        <div style={s.loginCard}>
          <div style={s.logo}>
            <span style={s.logoIcon}>⚡</span>
            <span style={s.logoText}>StaffLog</span>
          </div>
          <p style={s.loginSub}>Londis Task Tracker</p>
          <p style={s.loginDate}>{date}</p>
          <label style={s.label}>Who are you?</label>
          <select style={s.select} value={staff} onChange={e => setStaff(e.target.value)}>
            {STAFF.map(n => <option key={n}>{n}</option>)}
          </select>
          <button
            style={{ ...s.btn, opacity: staff && staff !== "Select Staff..." ? 1 : 0.35 }}
            onClick={() => { if (staff && staff !== "Select Staff...") setScreen("tasks"); }}
          >
            Start My Shift →
          </button>
        </div>
      </div>
    );
  }

  // ── SUBMITTED ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.loginCard}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={s.doneTitle}>Shift Submitted!</h2>
          <p style={{ color: "#555", marginBottom: 4 }}>{staff}</p>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>{date}</p>
          <div style={s.doneStat}>
            <span>{totalTaskCount} tasks</span>
            <span style={{ color: "#ccc" }}>·</span>
            <span>{totalDisplay} logged</span>
          </div>
          <p style={{ color: "#aaa", fontSize: 12, marginBottom: 28 }}>
            Your shift has been saved. See you next time 👋
          </p>
          <button style={s.btn} onClick={resetApp}>New Shift</button>
        </div>
      </div>
    );
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const allEntries = [
      ...Object.entries(logs).map(([task, val]) => ({
        task, val, category: TASKS.find(g => g.items.includes(task))?.category || "Other",
      })),
      ...otherTasks.filter(t => t.name).map(t => ({
        task: t.name, val: { hours: t.hours, minutes: t.minutes, notes: t.notes }, category: "Other",
      })),
    ];

    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={() => setScreen("tasks")}>← Back</button>
            <div style={{ textAlign: "right" }}>
              <div style={s.topBarName}>{staff}</div>
              <div style={s.topBarDate}>{date}</div>
            </div>
          </div>

          <h2 style={s.sectionTitle}>Shift Summary</h2>
          <div style={s.summaryTotal}>
            <span>{totalTaskCount} tasks logged</span>
            <strong style={{ marginLeft: "auto" }}>{totalDisplay}</strong>
          </div>

          {allEntries.length === 0 ? (
            <p style={{ color: "#bbb", textAlign: "center", marginTop: 40, fontSize: 14 }}>
              No tasks logged yet. Go back and add some.
            </p>
          ) : allEntries.map(({ task, val, category }, i) => (
            <div key={i} style={s.summaryRow}>
              <div style={{ ...s.summaryDot, background: categoryColor[category] || "#999" }} />
              <div style={{ flex: 1 }}>
                <div style={s.summaryTask}>{task}</div>
                <div style={s.summaryCategory}>{category}</div>
                {val.notes ? <div style={s.summaryNotes}>"{val.notes}"</div> : null}
              </div>
              <div style={s.summaryTime}>{val.hours}h {val.minutes}m</div>
            </div>
          ))}

          {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}

          {allEntries.length > 0 && (
            <button
              style={{ ...s.btn, margin: "20px 12px 0", width: "calc(100% - 24px)", opacity: submitting ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Shift ✓"}
            </button>
          )}
          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // ── TASKS ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topBar}>
          <div>
            <div style={s.topBarName}>{staff}</div>
            <div style={s.topBarDate}>{date}</div>
          </div>
          <button style={s.summaryBtn} onClick={() => setScreen("summary")}>
            Review ({totalTaskCount})
          </button>
        </div>

        {totalTaskCount > 0 && (
          <div style={s.progressPill}>
            ⏱ {totalDisplay} across {totalTaskCount} task{totalTaskCount !== 1 ? "s" : ""}
          </div>
        )}

        <p style={s.hint}>Tap a task after completing it to log your time.</p>

        {TASKS.map(group => (
          <div key={group.category} style={s.categoryBlock}>
            <button
              style={s.categoryHeader}
              onClick={() => setOpenCategory(openCategory === group.category ? null : group.category)}
            >
              <span style={{ ...s.categoryDot, background: categoryColor[group.category] }} />
              <span style={s.categoryLabel}>{group.category}</span>
              <span style={s.categoryCount}>
                {group.items.filter(t => logs[t]).length}/{group.items.length}
              </span>
              <span style={s.chevron}>{openCategory === group.category ? "▲" : "▼"}</span>
            </button>
            {openCategory === group.category && (
              <div style={s.taskList}>
                {group.items.map(task => {
                  const logged = logs[task];
                  return (
                    <button
                      key={task}
                      style={{ ...s.taskRow, background: logged ? "#f0fdf4" : "#fff" }}
                      onClick={() => openStandardTask(task)}
                    >
                      <span style={s.taskCheck}>{logged ? "✅" : "○"}</span>
                      <span style={s.taskName}>{task}</span>
                      {logged && <span style={s.taskTime}>{logged.hours}h {logged.minutes}m</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Other category */}
        <div style={s.categoryBlock}>
          <button
            style={s.categoryHeader}
            onClick={() => setOpenCategory(openCategory === "Other" ? null : "Other")}
          >
            <span style={{ ...s.categoryDot, background: categoryColor["Other"] }} />
            <span style={s.categoryLabel}>Other</span>
            <span style={s.categoryCount}>{otherTasks.filter(t => t.name).length} added</span>
            <span style={s.chevron}>{openCategory === "Other" ? "▲" : "▼"}</span>
          </button>
          {openCategory === "Other" && (
            <div style={s.taskList}>
              {otherTasks.map(t => (
                <button
                  key={t.id}
                  style={{ ...s.taskRow, background: "#f0fdf4" }}
                  onClick={() => openOtherTask(t.id)}
                >
                  <span style={s.taskCheck}>✅</span>
                  <span style={s.taskName}>{t.name}</span>
                  <span style={s.taskTime}>{t.hours}h {t.minutes}m</span>
                </button>
              ))}
              <button style={{ ...s.taskRow, background: "#fafafa" }} onClick={openNewOther}>
                <span style={s.taskCheck}>＋</span>
                <span style={{ ...s.taskName, color: "#888" }}>Add a task not on the list...</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* ── MODAL ── */}
      {activeTask && (
        <div style={s.modalOverlay} onClick={() => setActiveTask(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {activeTask.startsWith("other-") ? (
              <>
                <p style={s.modalLabel}>What task did you do?</p>
                <input
                  style={{ ...s.notesInput, marginBottom: 8 }}
                  type="text"
                  placeholder="e.g. Window cleaning, Security check..."
                  value={inputOtherName}
                  onChange={e => setInputOtherName(e.target.value)}
                  autoFocus
                />
              </>
            ) : (
              <h3 style={s.modalTitle}>{activeTask}</h3>
            )}

            <p style={s.modalSub}>How long did this take?</p>
            <div style={s.timeRow}>
              <div style={s.timeField}>
                <label style={s.timeLabel}>Hours</label>
                <input
                  style={s.timeInput}
                  type="number" min="0" max="12" placeholder="0"
                  value={inputHours}
                  onChange={e => setInputHours(e.target.value)}
                />
              </div>
              <div style={s.timeSep}>:</div>
              <div style={s.timeField}>
                <label style={s.timeLabel}>Minutes</label>
                <input
                  style={s.timeInput}
                  type="number" min="0" max="59" placeholder="0"
                  value={inputMinutes}
                  onChange={e => setInputMinutes(e.target.value)}
                />
              </div>
            </div>

            <label style={s.label}>Notes (optional)</label>
            <input
              style={s.notesInput}
              type="text"
              placeholder="Any issues or comments..."
              value={inputNotes}
              onChange={e => setInputNotes(e.target.value)}
            />

            <div style={s.modalBtns}>
              {(logs[activeTask] || (activeTask.startsWith("other-") && !activeTask.startsWith("other-new-"))) && (
                <button style={s.removeBtn} onClick={removeTask}>Remove</button>
              )}
              <button
                style={{
                  ...s.btn, flex: 1,
                  opacity: (inputHours || inputMinutes) &&
                    (!activeTask.startsWith("other-") || inputOtherName.trim()) ? 1 : 0.35,
                }}
                onClick={saveTask}
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh", background: "#f5f5f0",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "flex", justifyContent: "center",
  },
  container: { width: "100%", maxWidth: 480, padding: "0 0 20px" },
  loginCard: {
    background: "#fff", borderRadius: 20, padding: "40px 28px",
    margin: "60px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    maxWidth: 400, width: "100%", textAlign: "center",
  },
  logo: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -1 },
  loginSub: { color: "#666", fontSize: 14, marginBottom: 4 },
  loginDate: { color: "#999", fontSize: 13, marginBottom: 28 },
  label: { display: "block", fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 8, textAlign: "left" },
  select: {
    width: "100%", padding: "14px 12px", borderRadius: 10,
    border: "1.5px solid #e0e0e0", fontSize: 16, marginBottom: 20,
    background: "#fff", color: "#111",
  },
  btn: {
    width: "100%", background: "#111", color: "#fff", border: "none",
    padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.2s",
  },
  topBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 16px 12px", background: "#fff",
    borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10,
  },
  topBarName: { fontWeight: 700, fontSize: 16, color: "#111" },
  topBarDate: { fontSize: 12, color: "#888", marginTop: 2 },
  summaryBtn: {
    background: "#111", color: "#fff", border: "none",
    padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  backBtn: {
    background: "none", border: "none", color: "#111",
    fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0,
  },
  progressPill: {
    background: "#111", color: "#fff", fontSize: 13, fontWeight: 600,
    padding: "8px 16px", margin: "12px 16px 0", borderRadius: 20, textAlign: "center",
  },
  hint: { color: "#aaa", fontSize: 12, padding: "10px 16px 4px" },
  categoryBlock: {
    margin: "8px 12px 0", borderRadius: 12, overflow: "hidden",
    border: "1px solid #eee", background: "#fff",
  },
  categoryHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "14px", background: "#fff", border: "none", cursor: "pointer", textAlign: "left",
  },
  categoryDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  categoryLabel: { flex: 1, fontWeight: 700, fontSize: 14, color: "#111" },
  categoryCount: { fontSize: 12, color: "#888", fontWeight: 500 },
  chevron: { fontSize: 11, color: "#bbb" },
  taskList: { borderTop: "1px solid #f0f0f0" },
  taskRow: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "13px 14px", border: "none", borderBottom: "1px solid #f5f5f5",
    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
  },
  taskCheck: { fontSize: 16, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 14, color: "#333" },
  taskTime: { fontSize: 12, fontWeight: 700, color: "#16a34a" },
  summaryTotal: {
    background: "#fff", margin: "8px 12px", padding: "14px 16px",
    borderRadius: 12, fontWeight: 600, fontSize: 15, color: "#555",
    border: "1px solid #eee", display: "flex", alignItems: "center",
  },
  summaryRow: {
    display: "flex", alignItems: "flex-start", gap: 10,
    background: "#fff", margin: "6px 12px 0", padding: "14px",
    borderRadius: 12, border: "1px solid #eee",
  },
  summaryDot: { width: 10, height: 10, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  summaryTask: { fontWeight: 600, fontSize: 14, color: "#111" },
  summaryCategory: { fontSize: 11, color: "#aaa", marginTop: 2 },
  summaryNotes: { fontSize: 12, color: "#888", marginTop: 3, fontStyle: "italic" },
  summaryTime: { fontWeight: 700, fontSize: 14, color: "#333", whiteSpace: "nowrap" },
  sectionTitle: { padding: "16px 16px 4px", fontSize: 20, fontWeight: 700, color: "#111", margin: 0 },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: 10, padding: "12px 16px", margin: "12px 12px 0", fontSize: 13,
  },
  doneTitle: { fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 },
  doneStat: {
    display: "flex", gap: 12, justifyContent: "center", alignItems: "center",
    fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 12,
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 24px 40px",
    width: "100%", maxWidth: 480, boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 4px" },
  modalLabel: { fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 },
  modalSub: { color: "#888", fontSize: 13, marginBottom: 20 },
  timeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  timeField: { flex: 1 },
  timeLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 },
  timeInput: {
    width: "100%", padding: "14px 10px", borderRadius: 10,
    border: "1.5px solid #e0e0e0", fontSize: 22, fontWeight: 700,
    textAlign: "center", color: "#111", boxSizing: "border-box",
  },
  timeSep: { fontSize: 24, fontWeight: 700, color: "#ccc", marginTop: 18 },
  notesInput: {
    width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e0e0e0",
    fontSize: 14, marginBottom: 16, boxSizing: "border-box", color: "#333",
  },
  modalBtns: { display: "flex", gap: 10 },
  removeBtn: {
    background: "#fee2e2", color: "#dc2626", border: "none",
    padding: "15px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
};
