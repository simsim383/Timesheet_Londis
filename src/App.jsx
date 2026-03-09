import { useState, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID = "app6DROW7O9mZnmTY";
const AIRTABLE_TABLE_ID = "tbl4sVuVCiDCyXF3O";
const AIRTABLE_TOKEN = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const STORE_NAME = "Londis";
const SESSION_HOURS = 8;

// ─── STAFF & PINS — update names and PINs for your actual team ───────────────
const STAFF = [
  { name: "Sarah",  pin: "1234", emoji: "👩" },
  { name: "John",   pin: "2345", emoji: "👨" },
  { name: "Emma",   pin: "3456", emoji: "👩" },
  { name: "James",  pin: "4567", emoji: "👨" },
  { name: "Lisa",   pin: "5678", emoji: "👩" },
  { name: "Mike",   pin: "6789", emoji: "👨" },
];

// ─── TASKS ───────────────────────────────────────────────────────────────────
const TASK_CATEGORIES = [
  {
    category: "Customer Service",
    emoji: "🛎️",
    color: "#1d4ed8",
    bg: "#eff6ff",
    items: ["Serving"],
  },
  {
    category: "Stacking",
    emoji: "📦",
    color: "#15803d",
    bg: "#f0fdf4",
    items: [
      "Crisp Stacking", "Pop Stacking", "Beers Stacking", "Wine Stacking",
      "Dog Food Stacking", "Toiletries Stacking", "Fridge Stacking",
      "Freezer Stacking", "Grocery Stacking", "Biscuit Stacking",
      "Cards Stacking", "Chocolate/Sweets Stacking", "Mix Ups",
      "Cigarette/Vape Stacking", "Spirits Stacking",
    ],
  },
  {
    category: "Checks",
    emoji: "✅",
    color: "#b45309",
    bg: "#fffbeb",
    items: ["Fridge Date Check / Temp Check", "Product Date Checks"],
  },
  {
    category: "Cleaning",
    emoji: "🧹",
    color: "#6d28d9",
    bg: "#f5f3ff",
    items: ["Fridges Clean", "Mop", "Door Clean / Outside Clean", "Behind Counter Clean", "Stock Room Clean"],
  },
  {
    category: "Admin & Operations",
    emoji: "📋",
    color: "#be185d",
    bg: "#fdf2f8",
    items: [
      "Cash and Carry List", "Magazine Returns", "Newspaper Returns", "Pies",
      "Pricing", "Promotions", "Delivery Unload", "Till Lift / End of Shift Count",
      "Post Office", "Personal Training",
    ],
  },
  {
    category: "Other",
    emoji: "➕",
    color: "#475569",
    bg: "#f8fafc",
    items: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function saveSession(staffName) {
  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  localStorage.setItem("stafflog_session", JSON.stringify({ staffName, expiry }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem("stafflog_session");
    if (!raw) return null;
    const { staffName, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem("stafflog_session"); return null; }
    return staffName;
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem("stafflog_session");
}

async function submitToAirtable(staffName, logs, otherTasks) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const submittedAt = now.toISOString();
  const weekNum = getWeekNumber(now);
  const records = [];

  Object.entries(logs).forEach(([taskName, val]) => {
    const cat = TASK_CATEGORIES.find(g => g.items.includes(taskName));
    const totalMins = parseInt(val.hours || 0) * 60 + parseInt(val.minutes || 0);
    records.push({
      fields: {
        "Staff Name": staffName, "Date": dateStr, "Shift Submitted At": submittedAt,
        "Total Minutes": totalMins, "Task Name": taskName,
        "Task Hours": parseInt(val.hours || 0), "Task Minutes": parseInt(val.minutes || 0),
        "Task Notes": val.notes || "", "Category": cat?.category || "Other",
        "Week Number": weekNum, "Store": STORE_NAME,
      },
    });
  });

  otherTasks.forEach(ot => {
    if (!ot.name || (!ot.hours && !ot.minutes)) return;
    const totalMins = parseInt(ot.hours || 0) * 60 + parseInt(ot.minutes || 0);
    records.push({
      fields: {
        "Staff Name": staffName, "Date": dateStr, "Shift Submitted At": submittedAt,
        "Total Minutes": totalMins, "Task Name": ot.name,
        "Task Hours": parseInt(ot.hours || 0), "Task Minutes": parseInt(ot.minutes || 0),
        "Task Notes": ot.notes || "", "Category": "Other",
        "Week Number": weekNum, "Store": STORE_NAME,
      },
    });
  });

  if (records.length === 0) throw new Error("No tasks to submit");

  for (let i = 0; i < records.length; i += 10) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: records.slice(i, i + 10) }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || "Airtable error"); }
  }
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  // screen: "select-staff" | "pin" | "home" | "category" | "summary" | "submitted"
  const [screen, setScreen] = useState("select-staff");
  const [staffName, setStaffName] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null); // staff object during PIN entry
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [logs, setLogs] = useState({});
  const [otherTasks, setOtherTasks] = useState([]);

  // Modal state
  const [activeTask, setActiveTask] = useState(null);
  const [inputHours, setInputHours] = useState("");
  const [inputMinutes, setInputMinutes] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [inputOtherName, setInputOtherName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // ── Check for existing session on load ──
  useEffect(() => {
    const saved = loadSession();
    if (saved) { setStaffName(saved); setScreen("home"); }
  }, []);

  // ── Totals ──
  const standardMins = Object.values(logs).reduce(
    (a, v) => a + parseInt(v.hours || 0) * 60 + parseInt(v.minutes || 0), 0
  );
  const otherMins = otherTasks.reduce(
    (a, t) => a + parseInt(t.hours || 0) * 60 + parseInt(t.minutes || 0), 0
  );
  const totalMinutes = standardMins + otherMins;
  const totalDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const totalTaskCount = Object.keys(logs).length + otherTasks.filter(t => t.name).length;

  // ── PIN pad handlers ──
  const handlePinPress = (digit) => {
    if (pinEntry.length >= 4) return;
    const next = pinEntry + digit;
    setPinEntry(next);
    setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selectedStaff.pin) {
          setStaffName(selectedStaff.name);
          saveSession(selectedStaff.name);
          setPinEntry("");
          setScreen("home");
        } else {
          setPinError(true);
          setTimeout(() => setPinEntry(""), 600);
        }
      }, 200);
    }
  };

  const handlePinDelete = () => { setPinEntry(p => p.slice(0, -1)); setPinError(false); };

  // ── Task modal ──
  const openStandardTask = (task) => {
    setActiveTask(task);
    const e = logs[task] || {};
    setInputHours(e.hours ?? ""); setInputMinutes(e.minutes ?? "");
    setInputNotes(e.notes ?? ""); setInputOtherName("");
  };

  const openOtherTask = (id) => {
    const e = otherTasks.find(t => t.id === id) || {};
    setActiveTask(`other-${id}`);
    setInputHours(e.hours ?? ""); setInputMinutes(e.minutes ?? "");
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
      const id = activeTask.replace("other-new-", "");
      setOtherTasks(p => [...p, { id, name: inputOtherName.trim(), hours: inputHours || "0", minutes: inputMinutes || "0", notes: inputNotes }]);
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
      await submitToAirtable(staffName, logs, otherTasks);
      setScreen("submitted");
    } catch (e) {
      setSubmitError(e.message || "Something went wrong.");
    } finally { setSubmitting(false); }
  };

  const handleSignOut = () => {
    clearSession(); setStaffName(""); setLogs({}); setOtherTasks([]);
    setScreen("select-staff"); setSubmitError("");
  };

  const resetForNewShift = () => {
    setLogs({}); setOtherTasks([]); setScreen("home"); setSubmitError("");
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: SELECT STAFF
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === "select-staff") {
    return (
      <div style={s.page}>
        <div style={s.authCard}>
          <div style={s.brandRow}>
            <div style={s.brandIcon}>⚡</div>
            <div>
              <div style={s.brandName}>StaffLog</div>
              <div style={s.brandSub}>Londis</div>
            </div>
          </div>
          <p style={s.authDate}>{today}</p>
          <p style={s.authLabel}>Who are you?</p>
          <div style={s.staffGrid}>
            {STAFF.map(member => (
              <button
                key={member.name}
                style={s.staffTile}
                onClick={() => { setSelectedStaff(member); setPinEntry(""); setPinError(false); setScreen("pin"); }}
              >
                <span style={s.staffEmoji}>{member.emoji}</span>
                <span style={s.staffTileName}>{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: PIN ENTRY
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === "pin") {
    return (
      <div style={s.page}>
        <div style={s.authCard}>
          <button style={s.backLink} onClick={() => { setScreen("select-staff"); setPinEntry(""); setPinError(false); }}>
            ← Back
          </button>
          <div style={s.pinAvatar}>{selectedStaff?.emoji}</div>
          <div style={s.pinName}>{selectedStaff?.name}</div>
          <p style={s.pinPrompt}>Enter your PIN</p>

          {/* PIN dots */}
          <div style={s.pinDots}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                ...s.pinDot,
                background: pinError ? "#ef4444" : pinEntry.length > i ? "#111" : "#e5e7eb",
                transform: pinError ? "scale(1.2)" : "scale(1)",
                transition: "all 0.15s",
              }} />
            ))}
          </div>

          {pinError && <p style={s.pinError}>Incorrect PIN. Try again.</p>}

          {/* Number pad */}
          <div style={s.numpad}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              <button
                key={i}
                style={{ ...s.numKey, opacity: k === "" ? 0 : 1, pointerEvents: k === "" ? "none" : "auto" }}
                onClick={() => k === "⌫" ? handlePinDelete() : k && handlePinPress(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: SUBMITTED
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === "submitted") {
    return (
      <div style={s.page}>
        <div style={s.authCard}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
          <div style={s.doneTitle}>Shift Submitted!</div>
          <div style={s.doneName}>{staffName}</div>
          <div style={s.doneDate}>{today}</div>
          <div style={s.doneStat}>
            <span>{totalTaskCount} tasks</span>
            <span style={{ color: "#d1d5db" }}>·</span>
            <span>{totalDisplay} logged</span>
          </div>
          <p style={s.doneFarewell}>Great work today 👋</p>
          <button style={s.btn} onClick={resetForNewShift}>Log Another Shift</button>
          <button style={s.ghostBtn} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: SUMMARY
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const allEntries = [
      ...Object.entries(logs).map(([task, val]) => ({
        task, val, category: TASK_CATEGORIES.find(g => g.items.includes(task))?.category || "Other",
        color: TASK_CATEGORIES.find(g => g.items.includes(task))?.color || "#475569",
      })),
      ...otherTasks.filter(t => t.name).map(t => ({
        task: t.name, val: { hours: t.hours, minutes: t.minutes, notes: t.notes },
        category: "Other", color: "#475569",
      })),
    ];

    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={() => setScreen("home")}>← Back</button>
            <div style={{ textAlign: "right" }}>
              <div style={s.topBarName}>{staffName}</div>
              <div style={s.topBarDate}>{today}</div>
            </div>
          </div>

          <div style={{ padding: "20px 16px 8px" }}>
            <div style={s.pageTitle}>Shift Summary</div>
          </div>

          <div style={s.summaryTotalCard}>
            <div>
              <div style={s.summaryTotalLabel}>Tasks Logged</div>
              <div style={s.summaryTotalNum}>{totalTaskCount}</div>
            </div>
            <div style={s.summaryDivider} />
            <div>
              <div style={s.summaryTotalLabel}>Total Time</div>
              <div style={s.summaryTotalNum}>{totalDisplay}</div>
            </div>
          </div>

          {allEntries.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 48, fontSize: 15 }}>
              No tasks logged yet.
            </p>
          ) : allEntries.map(({ task, val, category, color }, i) => (
            <div key={i} style={s.summaryRow}>
              <div style={{ ...s.summaryAccent, background: color }} />
              <div style={{ flex: 1 }}>
                <div style={s.summaryTaskName}>{task}</div>
                <div style={s.summaryCat}>{category}</div>
                {val.notes ? <div style={s.summaryNote}>"{val.notes}"</div> : null}
              </div>
              <div style={s.summaryTime}>{val.hours}h {val.minutes}m</div>
            </div>
          ))}

          {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}

          {allEntries.length > 0 && (
            <button
              style={{ ...s.btn, margin: "20px 16px 0", width: "calc(100% - 32px)", opacity: submitting ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Shift ✓"}
            </button>
          )}
          <div style={{ height: 48 }} />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: CATEGORY (task list inside a category)
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === "category" && activeCategory) {
    const cat = TASK_CATEGORIES.find(c => c.category === activeCategory);

    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={{ ...s.topBar, borderBottom: `3px solid ${cat.color}` }}>
            <button style={s.backBtn} onClick={() => setScreen("home")}>← Back</button>
            <div style={{ textAlign: "right" }}>
              <div style={{ ...s.topBarName, color: cat.color }}>{cat.emoji} {cat.category}</div>
              <div style={s.topBarDate}>{staffName}</div>
            </div>
          </div>

          <p style={s.hint}>Tap a task to log your time after completing it.</p>

          {/* Standard task items */}
          {cat.items.length > 0 && (
            <div style={{ ...s.taskCard, margin: "8px 16px 0" }}>
              {cat.items.map((task, idx) => {
                const logged = logs[task];
                return (
                  <button
                    key={task}
                    style={{
                      ...s.taskRow,
                      background: logged ? cat.bg : "#fff",
                      borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                    }}
                    onClick={() => openStandardTask(task)}
                  >
                    <div style={{ ...s.taskStatusDot, background: logged ? cat.color : "#e5e7eb" }} />
                    <span style={{ ...s.taskName, color: logged ? "#111" : "#374151" }}>{task}</span>
                    {logged
                      ? <span style={{ ...s.taskBadge, background: cat.color }}>{logged.hours}h {logged.minutes}m</span>
                      : <span style={s.taskArrow}>›</span>
                    }
                  </button>
                );
              })}
            </div>
          )}

          {/* Other category — custom task entry */}
          {cat.category === "Other" && (
            <div style={{ ...s.taskCard, margin: "8px 16px 0" }}>
              {otherTasks.map((t, idx) => (
                <button
                  key={t.id}
                  style={{
                    ...s.taskRow,
                    background: cat.bg,
                    borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                  }}
                  onClick={() => openOtherTask(t.id)}
                >
                  <div style={{ ...s.taskStatusDot, background: cat.color }} />
                  <span style={{ ...s.taskName, color: "#111" }}>{t.name}</span>
                  <span style={{ ...s.taskBadge, background: cat.color }}>{t.hours}h {t.minutes}m</span>
                </button>
              ))}
              <button
                style={{
                  ...s.taskRow,
                  background: "#fafafa",
                  borderTop: otherTasks.length > 0 ? "1px solid #f3f4f6" : "none",
                }}
                onClick={openNewOther}
              >
                <div style={{ ...s.taskStatusDot, background: "#d1d5db" }} />
                <span style={{ ...s.taskName, color: "#9ca3af" }}>Add a task not on the list...</span>
                <span style={{ fontSize: 20, color: "#d1d5db" }}>+</span>
              </button>
            </div>
          )}

          <div style={{ height: 80 }} />
        </div>

        {/* ── MODAL ── */}
        {activeTask && (
          <div style={s.modalOverlay} onClick={() => setActiveTask(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={{ ...s.modalStripe, background: cat.color }} />
              {activeTask.startsWith("other-") ? (
                <>
                  <p style={s.modalLabel}>What task did you do?</p>
                  <input
                    style={s.textInput}
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
                  <input style={s.timeInput} type="number" min="0" max="12" placeholder="0"
                    value={inputHours} onChange={e => setInputHours(e.target.value)} />
                </div>
                <div style={s.timeSep}>:</div>
                <div style={s.timeField}>
                  <label style={s.timeLabel}>Mins</label>
                  <input style={s.timeInput} type="number" min="0" max="59" placeholder="0"
                    value={inputMinutes} onChange={e => setInputMinutes(e.target.value)} />
                </div>
              </div>

              <label style={s.modalLabel}>Notes (optional)</label>
              <input style={s.textInput} type="text" placeholder="Any issues or comments..."
                value={inputNotes} onChange={e => setInputNotes(e.target.value)} />

              <div style={s.modalBtns}>
                {(logs[activeTask] || (activeTask.startsWith("other-") && !activeTask.startsWith("other-new-"))) && (
                  <button style={s.removeBtn} onClick={removeTask}>Remove</button>
                )}
                <button
                  style={{
                    ...s.btn, flex: 1,
                    background: cat.color,
                    opacity: (inputHours || inputMinutes) && (!activeTask.startsWith("other-") || inputOtherName.trim()) ? 1 : 0.3,
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

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: HOME (category tiles)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.homeHeader}>
          <div>
            <div style={s.homeGreeting}>Hello, {staffName} 👋</div>
            <div style={s.homeDate}>{today}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {totalTaskCount > 0 && (
              <button style={s.reviewBtn} onClick={() => setScreen("summary")}>
                Review ({totalTaskCount})
              </button>
            )}
            <button style={s.signOutBtn} onClick={handleSignOut} title="Sign out">⏻</button>
          </div>
        </div>

        {/* Progress bar */}
        {totalTaskCount > 0 && (
          <div style={s.progressBar}>
            <span>⏱ {totalDisplay} logged across {totalTaskCount} task{totalTaskCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        <p style={s.homeHint}>Select a category to log your tasks.</p>

        {/* Category tiles */}
        <div style={s.tileGrid}>
          {TASK_CATEGORIES.map(cat => {
            const doneCount = cat.category === "Other"
              ? otherTasks.filter(t => t.name).length
              : cat.items.filter(t => logs[t]).length;
            const total = cat.category === "Other" ? null : cat.items.length;

            return (
              <button
                key={cat.category}
                style={{ ...s.tile, background: cat.bg, borderColor: doneCount > 0 ? cat.color : "#e5e7eb" }}
                onClick={() => { setActiveCategory(cat.category); setScreen("category"); }}
              >
                <div style={s.tileTop}>
                  <span style={s.tileEmoji}>{cat.emoji}</span>
                  {doneCount > 0 && (
                    <span style={{ ...s.tileBadge, background: cat.color }}>
                      {doneCount}{total ? `/${total}` : ""}
                    </span>
                  )}
                </div>
                <div style={{ ...s.tileName, color: cat.color }}>{cat.category}</div>
                <div style={s.tileSub}>
                  {cat.category === "Other"
                    ? doneCount > 0 ? `${doneCount} added` : "Add custom tasks"
                    : `${doneCount} of ${total} done`}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  container: { width: "100%", maxWidth: 480 },

  // Auth screens
  authCard: {
    background: "#fff", borderRadius: 24, padding: "36px 28px 40px",
    margin: "40px 16px", boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
    maxWidth: 420, width: "100%",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  brandIcon: { fontSize: 28, background: "#111", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 },
  brandSub: { fontSize: 12, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" },
  authDate: { color: "#9ca3af", fontSize: 13, marginBottom: 24, marginTop: 4 },
  authLabel: { fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 16 },

  // Staff grid
  staffGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  staffTile: {
    background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 14,
    padding: "18px 12px", cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 8,
    transition: "all 0.15s",
  },
  staffEmoji: { fontSize: 28 },
  staffTileName: { fontWeight: 700, fontSize: 15, color: "#111" },

  // PIN screen
  backLink: {
    background: "none", border: "none", color: "#6b7280", fontSize: 14,
    fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 24, display: "block",
  },
  pinAvatar: { fontSize: 52, textAlign: "center", marginBottom: 8 },
  pinName: { fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center", marginBottom: 4 },
  pinPrompt: { color: "#9ca3af", fontSize: 14, textAlign: "center", marginBottom: 24 },
  pinDots: { display: "flex", justifyContent: "center", gap: 14, marginBottom: 8 },
  pinDot: { width: 16, height: 16, borderRadius: "50%" },
  pinError: { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 16 },
  numpad: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 24 },
  numKey: {
    background: "#f3f4f6", border: "none", borderRadius: 14, padding: "18px 0",
    fontSize: 22, fontWeight: 700, color: "#111", cursor: "pointer",
    transition: "background 0.1s",
  },

  // Top bar
  topBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 16px 14px", background: "#fff",
    borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, zIndex: 10,
  },
  topBarName: { fontWeight: 700, fontSize: 15, color: "#111" },
  topBarDate: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  backBtn: { background: "none", border: "none", color: "#111", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 },

  // Home screen
  homeHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px 16px 0",
  },
  homeGreeting: { fontSize: 20, fontWeight: 800, color: "#111" },
  homeDate: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
  reviewBtn: {
    background: "#111", color: "#fff", border: "none",
    padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  signOutBtn: {
    background: "#f3f4f6", color: "#6b7280", border: "none",
    width: 36, height: 36, borderRadius: "50%", fontSize: 16, cursor: "pointer",
  },
  progressBar: {
    background: "#111", color: "#fff", fontSize: 13, fontWeight: 600,
    padding: "10px 16px", margin: "14px 16px 0", borderRadius: 12, textAlign: "center",
  },
  homeHint: { color: "#9ca3af", fontSize: 13, padding: "10px 16px 4px" },

  // Category tiles
  tileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "4px 16px 0" },
  tile: {
    border: "2px solid", borderRadius: 16, padding: "18px 14px",
    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
  },
  tileTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  tileEmoji: { fontSize: 26 },
  tileBadge: {
    color: "#fff", fontSize: 11, fontWeight: 700,
    padding: "2px 8px", borderRadius: 20,
  },
  tileName: { fontWeight: 800, fontSize: 14, marginBottom: 4 },
  tileSub: { fontSize: 12, color: "#9ca3af" },

  // Category task list
  hint: { color: "#9ca3af", fontSize: 13, padding: "12px 16px 4px" },
  taskCard: { borderRadius: 14, overflow: "hidden", border: "1px solid #f3f4f6", background: "#fff" },
  taskRow: {
    width: "100%", display: "flex", alignItems: "center", gap: 12,
    padding: "16px 16px", border: "none", cursor: "pointer", textAlign: "left",
  },
  taskStatusDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  taskName: { flex: 1, fontSize: 15, fontWeight: 500 },
  taskBadge: {
    color: "#fff", fontSize: 12, fontWeight: 700,
    padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap",
  },
  taskArrow: { fontSize: 20, color: "#d1d5db" },

  // Summary
  pageTitle: { fontSize: 22, fontWeight: 800, color: "#111" },
  summaryTotalCard: {
    margin: "8px 16px 0", background: "#111", borderRadius: 14,
    padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-around",
  },
  summaryTotalLabel: { color: "#9ca3af", fontSize: 12, fontWeight: 600, marginBottom: 4, textAlign: "center" },
  summaryTotalNum: { color: "#fff", fontSize: 24, fontWeight: 800, textAlign: "center" },
  summaryDivider: { width: 1, height: 40, background: "#374151" },
  summaryRow: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "#fff", margin: "6px 16px 0", padding: "14px 16px",
    borderRadius: 12, border: "1px solid #f3f4f6",
  },
  summaryAccent: { width: 4, borderRadius: 4, alignSelf: "stretch", flexShrink: 0 },
  summaryTaskName: { fontWeight: 700, fontSize: 14, color: "#111" },
  summaryCat: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  summaryNote: { fontSize: 12, color: "#6b7280", marginTop: 3, fontStyle: "italic" },
  summaryTime: { fontWeight: 700, fontSize: 14, color: "#374151", whiteSpace: "nowrap" },

  // Done screen
  doneTitle: { fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 6, textAlign: "center" },
  doneName: { fontSize: 16, fontWeight: 600, color: "#374151", textAlign: "center" },
  doneDate: { fontSize: 13, color: "#9ca3af", marginBottom: 16, textAlign: "center" },
  doneStat: {
    display: "flex", gap: 12, justifyContent: "center",
    fontWeight: 700, fontSize: 17, color: "#111", marginBottom: 8,
  },
  doneFarewell: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginBottom: 24 },

  // Shared
  btn: {
    display: "block", width: "100%", background: "#111", color: "#fff", border: "none",
    padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.2s", marginBottom: 10,
  },
  ghostBtn: {
    display: "block", width: "100%", background: "transparent", color: "#9ca3af",
    border: "1.5px solid #e5e7eb", padding: "14px", borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: 10, padding: "12px 16px", margin: "12px 16px 0", fontSize: 13,
  },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#fff", borderRadius: "20px 20px 0 0", padding: "0 24px 40px",
    width: "100%", maxWidth: 480, boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  modalStripe: { height: 4, margin: "0 -24px 20px", borderRadius: "20px 20px 0 0" },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 4px" },
  modalLabel: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" },
  modalSub: { color: "#9ca3af", fontSize: 13, marginBottom: 16 },
  timeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  timeField: { flex: 1 },
  timeLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6 },
  timeInput: {
    width: "100%", padding: "14px 10px", borderRadius: 10, border: "1.5px solid #e5e7eb",
    fontSize: 24, fontWeight: 800, textAlign: "center", color: "#111", boxSizing: "border-box",
  },
  timeSep: { fontSize: 24, fontWeight: 700, color: "#d1d5db", marginTop: 18 },
  textInput: {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
    fontSize: 15, marginBottom: 16, boxSizing: "border-box", color: "#111",
  },
  modalBtns: { display: "flex", gap: 10, marginTop: 4 },
  removeBtn: {
    background: "#fef2f2", color: "#ef4444", border: "none",
    padding: "16px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
};
