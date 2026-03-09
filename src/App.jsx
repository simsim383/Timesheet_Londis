import { useState, useEffect } from "react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const BRAND = "#E07B39";        // warm amber — professional, energetic, not corporate
const BRAND_DARK = "#C4622A";
const BRAND_LIGHT = "#FDF0E8";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID = "app6DROW7O9mZnmTY";
const AIRTABLE_TABLE_ID = "tbl4sVuVCiDCyXF3O";
const AIRTABLE_TOKEN = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const STORE_NAME = "Londis";
const SESSION_HOURS = 8;

// ─── STAFF — update names/PINs for your team ─────────────────────────────────
const STAFF = [
  { name: "Sarah",  pin: "1234", initials: "SA" },
  { name: "John",   pin: "2345", initials: "JO" },
  { name: "Emma",   pin: "3456", initials: "EM" },
  { name: "James",  pin: "4567", initials: "JA" },
  { name: "Lisa",   pin: "5678", initials: "LI" },
  { name: "Mike",   pin: "6789", initials: "MI" },
];

// ─── TASK CATEGORIES ─────────────────────────────────────────────────────────
const TASK_CATEGORIES = [
  {
    category: "Customer Service", emoji: "🛎️",
    items: ["Serving"],
  },
  {
    category: "Stacking", emoji: "📦",
    items: [
      "Crisp Stacking","Pop Stacking","Beers Stacking","Wine Stacking",
      "Dog Food Stacking","Toiletries Stacking","Fridge Stacking","Freezer Stacking",
      "Grocery Stacking","Biscuit Stacking","Cards Stacking","Chocolate/Sweets Stacking",
      "Mix Ups","Cigarette/Vape Stacking","Spirits Stacking",
    ],
  },
  {
    category: "Checks", emoji: "✅",
    items: ["Fridge Date Check / Temp Check","Product Date Checks"],
  },
  {
    category: "Cleaning", emoji: "🧹",
    items: ["Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean","Stock Room Clean"],
  },
  {
    category: "Admin & Operations", emoji: "📋",
    items: [
      "Cash and Carry List","Magazine Returns","Newspaper Returns","Pies",
      "Pricing","Promotions","Delivery Unload","Till Lift / End of Shift Count",
      "Post Office","Personal Training",
    ],
  },
  { category: "Other", emoji: "➕", items: [] },
];

const ALL_STANDARD_TASKS = TASK_CATEGORIES.flatMap(c => c.items);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getWeekNumber(d) {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 4 - (date.getDay()||7));
  const y = new Date(date.getFullYear(),0,1);
  return Math.ceil((((date-y)/86400000)+1)/7);
}
function saveSession(name) {
  localStorage.setItem("stafflog_v2", JSON.stringify({ name, expiry: Date.now() + SESSION_HOURS*3600000 }));
}
function loadSession() {
  try {
    const d = JSON.parse(localStorage.getItem("stafflog_v2")||"null");
    if (!d || Date.now() > d.expiry) { localStorage.removeItem("stafflog_v2"); return null; }
    return d.name;
  } catch { return null; }
}
function clearSession() { localStorage.removeItem("stafflog_v2"); }

async function submitToAirtable(staffName, logs, otherTasks) {
  const now = new Date();
  const records = [];
  Object.entries(logs).forEach(([taskName, val]) => {
    const cat = TASK_CATEGORIES.find(g => g.items.includes(taskName));
    records.push({ fields: {
      "Staff Name": staffName, "Date": now.toISOString().split("T")[0],
      "Shift Submitted At": now.toISOString(),
      "Total Minutes": parseInt(val.hours||0)*60+parseInt(val.minutes||0),
      "Task Name": taskName, "Task Hours": parseInt(val.hours||0),
      "Task Minutes": parseInt(val.minutes||0), "Task Notes": val.notes||"",
      "Category": cat?.category||"Other", "Week Number": getWeekNumber(now), "Store": STORE_NAME,
    }});
  });
  otherTasks.forEach(ot => {
    if (!ot.name||(!ot.hours&&!ot.minutes)) return;
    records.push({ fields: {
      "Staff Name": staffName, "Date": now.toISOString().split("T")[0],
      "Shift Submitted At": now.toISOString(),
      "Total Minutes": parseInt(ot.hours||0)*60+parseInt(ot.minutes||0),
      "Task Name": ot.name, "Task Hours": parseInt(ot.hours||0),
      "Task Minutes": parseInt(ot.minutes||0), "Task Notes": ot.notes||"",
      "Category": "Other", "Week Number": getWeekNumber(now), "Store": STORE_NAME,
    }});
  });
  if (!records.length) throw new Error("No tasks to submit");
  for (let i=0;i<records.length;i+=10) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,{
      method:"POST", headers:{ Authorization:`Bearer ${AIRTABLE_TOKEN}`, "Content-Type":"application/json" },
      body: JSON.stringify({ records: records.slice(i,i+10) }),
    });
    if (!res.ok) { const e=await res.json(); throw new Error(e?.error?.message||"Airtable error"); }
  }
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]         = useState("select-staff"); // select-staff|pin|home|category|summary|submitted
  const [staffName, setStaffName]   = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pinEntry, setPinEntry]     = useState("");
  const [pinError, setPinError]     = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode]     = useState("tiles"); // tiles | checklist
  const [logs, setLogs]             = useState({});
  const [otherTasks, setOtherTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [inputHours, setInputHours] = useState("");
  const [inputMinutes, setInputMinutes] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [inputOtherName, setInputOtherName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  useEffect(() => {
    const saved = loadSession();
    if (saved) { setStaffName(saved); setScreen("home"); }
  }, []);

  // totals
  const totalMinutes =
    Object.values(logs).reduce((a,v)=>a+parseInt(v.hours||0)*60+parseInt(v.minutes||0),0) +
    otherTasks.reduce((a,t)=>a+parseInt(t.hours||0)*60+parseInt(t.minutes||0),0);
  const totalDisplay = `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m`;
  const totalTaskCount = Object.keys(logs).length + otherTasks.filter(t=>t.name).length;

  // PIN
  const handlePinPress = (d) => {
    if (pinEntry.length >= 4) return;
    const next = pinEntry + d;
    setPinEntry(next); setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selectedStaff.pin) {
          setStaffName(selectedStaff.name); saveSession(selectedStaff.name);
          setPinEntry(""); setScreen("home");
        } else { setPinError(true); setTimeout(()=>setPinEntry(""),700); }
      }, 180);
    }
  };

  // task modal helpers
  const openStandardTask = (task) => {
    const e = logs[task]||{};
    setActiveTask(task); setInputHours(e.hours??""); setInputMinutes(e.minutes??"");
    setInputNotes(e.notes??""); setInputOtherName("");
  };
  const openOtherTask = (id) => {
    const e = otherTasks.find(t=>t.id===id)||{};
    setActiveTask(`other-${id}`); setInputHours(e.hours??""); setInputMinutes(e.minutes??"");
    setInputNotes(e.notes??""); setInputOtherName(e.name??"");
  };
  const openNewOther = () => {
    setActiveTask(`other-new-${Date.now()}`);
    setInputHours(""); setInputMinutes(""); setInputNotes(""); setInputOtherName("");
  };
  const saveTask = () => {
    if (!inputHours && !inputMinutes) return;
    if (activeTask.startsWith("other-new-")) {
      if (!inputOtherName.trim()) return;
      setOtherTasks(p=>[...p,{ id:activeTask.replace("other-new-",""), name:inputOtherName.trim(), hours:inputHours||"0", minutes:inputMinutes||"0", notes:inputNotes }]);
    } else if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-","");
      setOtherTasks(p=>p.map(t=>t.id===id?{...t,name:inputOtherName.trim()||t.name,hours:inputHours||"0",minutes:inputMinutes||"0",notes:inputNotes}:t));
    } else {
      setLogs(p=>({...p,[activeTask]:{hours:inputHours||"0",minutes:inputMinutes||"0",notes:inputNotes}}));
    }
    setActiveTask(null);
  };
  const removeTask = () => {
    if (activeTask.startsWith("other-")) {
      const id = activeTask.replace("other-","").replace("new-","");
      setOtherTasks(p=>p.filter(t=>t.id!==id));
    } else { setLogs(p=>{const n={...p};delete n[activeTask];return n;}); }
    setActiveTask(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError("");
    try { await submitToAirtable(staffName,logs,otherTasks); setScreen("submitted"); }
    catch(e) { setSubmitError(e.message||"Something went wrong."); }
    finally { setSubmitting(false); }
  };
  const handleSignOut = () => { clearSession(); setStaffName(""); setLogs({}); setOtherTasks([]); setScreen("select-staff"); };
  const resetShift = () => { setLogs({}); setOtherTasks([]); setSubmitError(""); setScreen("home"); };

  // active category object
  const catObj = activeCategory ? TASK_CATEGORIES.find(c=>c.category===activeCategory) : null;

  // ── SELECT STAFF ────────────────────────────────────────────────────────────
  if (screen === "select-staff") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        {/* Header */}
        <div style={s.authHeader}>
          <div style={s.logoMark}>⚡</div>
          <div>
            <div style={s.logoName}>StaffLog</div>
            <div style={s.logoStore}>Londis · {today}</div>
          </div>
        </div>
        <h2 style={s.authTitle}>Who are you?</h2>
        <div style={s.staffGrid}>
          {STAFF.map(m => (
            <button key={m.name} style={s.staffTile}
              onClick={()=>{setSelectedStaff(m);setPinEntry("");setPinError(false);setScreen("pin");}}>
              <div style={s.staffAvatar}>{m.initials}</div>
              <div style={s.staffTileName}>{m.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PIN ─────────────────────────────────────────────────────────────────────
  if (screen === "pin") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <button style={s.textBtn} onClick={()=>{setScreen("select-staff");setPinEntry("");setPinError(false);}}>← Back</button>
        <div style={s.pinAvatarLarge}>{selectedStaff?.initials}</div>
        <div style={s.pinStaffName}>{selectedStaff?.name}</div>
        <p style={s.pinSub}>Enter your 4-digit PIN</p>
        <div style={s.pinDots}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              ...s.pinDot,
              background: pinError ? "#ef4444" : pinEntry.length>i ? BRAND : "#e5e7eb",
              transform: pinError ? "scale(1.15)" : "scale(1)",
              transition: "all 0.15s",
            }}/>
          ))}
        </div>
        {pinError && <p style={s.pinErrMsg}>Incorrect PIN — try again</p>}
        <div style={s.numpad}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i)=>(
            <button key={i} style={{...s.numKey, opacity:k===""?0:1, pointerEvents:k===""?"none":"auto"}}
              onClick={()=>k==="⌫"?setPinEntry(p=>p.slice(0,-1)):k&&handlePinPress(k)}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SUBMITTED ───────────────────────────────────────────────────────────────
  if (screen === "submitted") return (
    <div style={s.page}>
      <div style={s.authWrap}>
        <div style={s.successIcon}>✅</div>
        <div style={s.successTitle}>Shift Submitted!</div>
        <div style={s.successName}>{staffName}</div>
        <div style={s.successDate}>{today}</div>
        <div style={s.successStats}>
          <div style={s.successStat}><div style={s.successStatNum}>{totalTaskCount}</div><div style={s.successStatLabel}>Tasks</div></div>
          <div style={s.successStatDivider}/>
          <div style={s.successStat}><div style={s.successStatNum}>{totalDisplay}</div><div style={s.successStatLabel}>Logged</div></div>
        </div>
        <p style={s.successMsg}>Great work today 👋 Your shift has been saved.</p>
        <button style={s.primaryBtn} onClick={resetShift}>Log Another Shift</button>
        <button style={s.outlineBtn} onClick={handleSignOut}>Sign Out</button>
      </div>
    </div>
  );

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const allEntries = [
      ...Object.entries(logs).map(([task,val])=>({ task,val, category: TASK_CATEGORIES.find(g=>g.items.includes(task))?.category||"Other" })),
      ...otherTasks.filter(t=>t.name).map(t=>({ task:t.name, val:{hours:t.hours,minutes:t.minutes,notes:t.notes}, category:"Other" })),
    ];
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={()=>setScreen("home")}>← Back</button>
            <div style={{textAlign:"right"}}>
              <div style={s.topBarName}>{staffName}</div>
              <div style={s.topBarSub}>{today}</div>
            </div>
          </div>

          <div style={s.sectionPad}>
            <div style={s.pageTitle}>Shift Summary</div>
          </div>

          <div style={s.summaryStatsRow}>
            <div style={s.summaryStat}>
              <div style={s.summaryStatNum}>{totalTaskCount}</div>
              <div style={s.summaryStatLabel}>Tasks</div>
            </div>
            <div style={s.summaryStatDivider}/>
            <div style={s.summaryStat}>
              <div style={s.summaryStatNum}>{totalDisplay}</div>
              <div style={s.summaryStatLabel}>Total Time</div>
            </div>
            <div style={s.summaryStatDivider}/>
            <div style={s.summaryStat}>
              <div style={s.summaryStatNum}>{new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
              <div style={s.summaryStatLabel}>Logged At</div>
            </div>
          </div>

          {allEntries.length === 0
            ? <p style={{color:"#9ca3af",textAlign:"center",marginTop:48,fontSize:15}}>No tasks logged yet.</p>
            : allEntries.map(({task,val,category},i)=>(
              <div key={i} style={s.summaryRow}>
                <div style={{...s.summaryPill, background: BRAND_LIGHT, color: BRAND_DARK}}>{category.split(" ")[0]}</div>
                <div style={{flex:1}}>
                  <div style={s.summaryTaskName}>{task}</div>
                  {val.notes?<div style={s.summaryNote}>"{val.notes}"</div>:null}
                </div>
                <div style={s.summaryTime}>{val.hours}h {val.minutes}m</div>
              </div>
            ))
          }

          {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}
          {allEntries.length > 0 && (
            <div style={{padding:"20px 16px 0"}}>
              <button style={{...s.primaryBtn, opacity:submitting?0.6:1}} onClick={handleSubmit} disabled={submitting}>
                {submitting?"Submitting...":"Submit Shift ✓"}
              </button>
            </div>
          )}
          <div style={{height:48}}/>
        </div>
      </div>
    );
  }

  // ── CATEGORY ────────────────────────────────────────────────────────────────
  if (screen === "category" && catObj) {
    const doneInCat = catObj.category==="Other"
      ? otherTasks.filter(t=>t.name).length
      : catObj.items.filter(t=>logs[t]).length;
    const totalInCat = catObj.items.length;
    const pct = totalInCat > 0 ? Math.round((doneInCat/totalInCat)*100) : 0;

    return (
      <div style={s.page}>
        <div style={s.container}>
          {/* Top bar */}
          <div style={s.topBar}>
            <button style={s.backBtn} onClick={()=>setScreen("home")}>← Back</button>
            <div style={{textAlign:"right"}}>
              <div style={s.topBarName}>{catObj.emoji} {catObj.category}</div>
              <div style={s.topBarSub}>{staffName}</div>
            </div>
          </div>

          {/* Progress bar for this category */}
          {catObj.category !== "Other" && (
            <div style={s.catProgressWrap}>
              <div style={s.catProgressHeader}>
                <span style={s.catProgressLabel}>{doneInCat} of {totalInCat} tasks done</span>
                <span style={s.catProgressPct}>{pct}%</span>
              </div>
              <div style={s.catProgressTrack}>
                <div style={{...s.catProgressFill, width:`${pct}%`}}/>
              </div>
            </div>
          )}

          <p style={s.hint}>Tap a task after completing it to log your time.</p>

          <div style={s.taskCard}>
            {catObj.items.map((task,idx)=>{
              const logged = logs[task];
              return (
                <button key={task} style={{
                  ...s.taskRow,
                  background: logged ? BRAND_LIGHT : "#fff",
                  borderTop: idx===0?"none":"1px solid #f3f4f6",
                }} onClick={()=>openStandardTask(task)}>
                  <div style={{...s.taskDot, background: logged?BRAND:"#e5e7eb"}}/>
                  <span style={{...s.taskLabel, fontWeight: logged?700:500, color: logged?"#111":"#374151"}}>{task}</span>
                  {logged
                    ? <span style={s.taskDoneBadge}>{logged.hours}h {logged.minutes}m</span>
                    : <span style={s.taskChevron}>›</span>
                  }
                </button>
              );
            })}

            {catObj.category==="Other" && (
              <>
                {otherTasks.map((t,idx)=>(
                  <button key={t.id} style={{
                    ...s.taskRow, background:BRAND_LIGHT,
                    borderTop: idx===0?"none":"1px solid #f3f4f6",
                  }} onClick={()=>openOtherTask(t.id)}>
                    <div style={{...s.taskDot,background:BRAND}}/>
                    <span style={{...s.taskLabel,fontWeight:700,color:"#111"}}>{t.name}</span>
                    <span style={s.taskDoneBadge}>{t.hours}h {t.minutes}m</span>
                  </button>
                ))}
                <button style={{
                  ...s.taskRow, background:"#fafafa",
                  borderTop: otherTasks.length>0?"1px solid #f3f4f6":"none",
                }} onClick={openNewOther}>
                  <div style={{...s.taskDot,background:"#d1d5db"}}/>
                  <span style={{...s.taskLabel,color:"#9ca3af"}}>Add a task not on the list...</span>
                  <span style={{fontSize:20,color:"#d1d5db"}}>+</span>
                </button>
              </>
            )}
          </div>
          <div style={{height:80}}/>
        </div>

        {/* MODAL */}
        {activeTask && (
          <TaskModal
            activeTask={activeTask} catColor={BRAND} catBg={BRAND_LIGHT}
            inputHours={inputHours} setInputHours={setInputHours}
            inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
            inputNotes={inputNotes} setInputNotes={setInputNotes}
            inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
            logs={logs} otherTasks={otherTasks}
            onSave={saveTask} onRemove={removeTask} onClose={()=>setActiveTask(null)}
          />
        )}
      </div>
    );
  }

  // ── HOME ────────────────────────────────────────────────────────────────────
  // Tile view data
  const tileData = TASK_CATEGORIES.map(cat => {
    const done = cat.category==="Other" ? otherTasks.filter(t=>t.name).length : cat.items.filter(t=>logs[t]).length;
    const total = cat.items.length;
    const pct = total>0 ? done/total : 0;
    return { ...cat, done, total, pct };
  });

  // Checklist view — all tasks flat
  const checklistTasks = [
    ...ALL_STANDARD_TASKS.map(task => ({
      task, logged: logs[task]||null,
      category: TASK_CATEGORIES.find(g=>g.items.includes(task))?.category||"Other",
      emoji: TASK_CATEGORIES.find(g=>g.items.includes(task))?.emoji||"",
      isOther: false,
    })),
    ...otherTasks.filter(t=>t.name).map(t=>({
      task: t.name, logged:{hours:t.hours,minutes:t.minutes,notes:t.notes},
      category:"Other", emoji:"➕", isOther:true, otherId:t.id,
    })),
  ];
  const checklistDone = checklistTasks.filter(t=>t.logged).length;
  const checklistTotal = checklistTasks.length;
  const checklistPct = checklistTotal>0 ? Math.round((checklistDone/checklistTotal)*100) : 0;

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── HOME HEADER ── */}
        <div style={s.homeHeader}>
          <div style={s.homeTitleRow}>
            <div style={s.logoMarkSm}>⚡</div>
            <div>
              <div style={s.homeGreeting}>Hello, {staffName}</div>
              <div style={s.homeDate}>{today}</div>
            </div>
          </div>
          <div style={s.homeActions}>
            {totalTaskCount>0 && (
              <button style={s.reviewChip} onClick={()=>setScreen("summary")}>
                Review ({totalTaskCount})
              </button>
            )}
            <button style={s.signOutChip} onClick={handleSignOut} title="Sign out">⏻</button>
          </div>
        </div>

        {/* ── OVERALL PROGRESS BAR ── */}
        {totalTaskCount > 0 && (
          <div style={s.overallProgress}>
            <div style={s.overallProgressHeader}>
              <span style={s.overallProgressLabel}>⏱ {totalDisplay} logged today</span>
              <span style={s.overallProgressCount}>{totalTaskCount} task{totalTaskCount!==1?"s":""}</span>
            </div>
          </div>
        )}

        {/* ── VIEW TOGGLE ── */}
        <div style={s.toggleRow}>
          <button
            style={{...s.toggleBtn, background:viewMode==="tiles"?BRAND:"#f3f4f6", color:viewMode==="tiles"?"#fff":"#6b7280"}}
            onClick={()=>setViewMode("tiles")}
          >⊞ Categories</button>
          <button
            style={{...s.toggleBtn, background:viewMode==="checklist"?BRAND:"#f3f4f6", color:viewMode==="checklist"?"#fff":"#6b7280"}}
            onClick={()=>setViewMode("checklist")}
          >☑ Checklist</button>
        </div>

        {/* ── TILE VIEW ── */}
        {viewMode==="tiles" && (
          <div style={s.tileGrid}>
            {tileData.map(cat=>(
              <button key={cat.category} style={s.tile}
                onClick={()=>{setActiveCategory(cat.category);setScreen("category");}}>
                <div style={s.tileTopRow}>
                  <span style={s.tileEmoji}>{cat.emoji}</span>
                  {cat.done>0 && (
                    <span style={s.tileDoneBadge}>{cat.done}{cat.total?`/${cat.total}`:""}</span>
                  )}
                </div>
                <div style={s.tileCatName}>{cat.category}</div>
                <div style={s.tileCatSub}>
                  {cat.category==="Other"
                    ? cat.done>0?`${cat.done} added`:"Tap to add tasks"
                    : `${cat.done} of ${cat.total} done`}
                </div>
                {/* Per-tile progress bar */}
                {cat.total > 0 && (
                  <div style={s.tileProgressTrack}>
                    <div style={{...s.tileProgressFill, width:`${cat.pct*100}%`, background: cat.done>0?BRAND:"#e5e7eb"}}/>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── CHECKLIST VIEW ── */}
        {viewMode==="checklist" && (
          <div style={{padding:"0 16px"}}>
            {/* Checklist overall progress */}
            <div style={s.checklistProgress}>
              <div style={s.checklistProgressHeader}>
                <span style={s.checklistProgressLabel}>{checklistDone} of {checklistTotal} tasks done</span>
                <span style={s.checklistProgressPct}>{checklistPct}%</span>
              </div>
              <div style={s.catProgressTrack}>
                <div style={{...s.catProgressFill, width:`${checklistPct}%`}}/>
              </div>
            </div>

            {/* Group by category */}
            {TASK_CATEGORIES.map(cat => {
              const catTasks = cat.category==="Other"
                ? otherTasks.filter(t=>t.name).map(t=>({ task:t.name, logged:{hours:t.hours,minutes:t.minutes,notes:t.notes}, otherId:t.id, isOther:true }))
                : cat.items.map(task=>({ task, logged:logs[task]||null, isOther:false }));

              if (cat.category !== "Other" && catTasks.length===0) return null;

              return (
                <div key={cat.category} style={s.checklistSection}>
                  <div style={s.checklistSectionHeader}>
                    <span>{cat.emoji}</span>
                    <span style={s.checklistSectionTitle}>{cat.category}</span>
                    <span style={s.checklistSectionCount}>
                      {catTasks.filter(t=>t.logged).length}/{cat.category==="Other"?catTasks.length:cat.items.length}
                    </span>
                  </div>

                  <div style={s.taskCard}>
                    {catTasks.map((item,idx)=>(
                      <button key={item.task} style={{
                        ...s.checklistRow,
                        background: item.logged?BRAND_LIGHT:"#fff",
                        borderTop: idx===0?"none":"1px solid #f3f4f6",
                      }} onClick={()=>item.isOther?openOtherTask(item.otherId):openStandardTask(item.task)}>
                        <div style={{
                          ...s.checkboxEl,
                          background:item.logged?BRAND:"transparent",
                          borderColor:item.logged?BRAND:"#d1d5db",
                        }}>
                          {item.logged && <span style={s.checkmark}>✓</span>}
                        </div>
                        <span style={{...s.checklistTaskName, color:item.logged?"#111":"#4b5563", textDecoration:item.logged?"none":"none"}}>
                          {item.task}
                        </span>
                        {item.logged
                          ? <span style={s.checklistTime}>{item.logged.hours}h {item.logged.minutes}m</span>
                          : <span style={s.taskChevron}>›</span>
                        }
                      </button>
                    ))}

                    {cat.category==="Other" && (
                      <button style={{...s.checklistRow,background:"#fafafa",borderTop:catTasks.length>0?"1px solid #f3f4f6":"none"}}
                        onClick={openNewOther}>
                        <div style={{...s.checkboxEl,background:"transparent",borderColor:"#d1d5db"}}>
                          <span style={{color:"#d1d5db",fontSize:14}}>+</span>
                        </div>
                        <span style={{...s.checklistTaskName,color:"#9ca3af"}}>Add a task...</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{height:80}}/>
      </div>

      {/* MODAL — shown from checklist view too */}
      {activeTask && screen==="home" && (
        <TaskModal
          activeTask={activeTask} catColor={BRAND} catBg={BRAND_LIGHT}
          inputHours={inputHours} setInputHours={setInputHours}
          inputMinutes={inputMinutes} setInputMinutes={setInputMinutes}
          inputNotes={inputNotes} setInputNotes={setInputNotes}
          inputOtherName={inputOtherName} setInputOtherName={setInputOtherName}
          logs={logs} otherTasks={otherTasks}
          onSave={saveTask} onRemove={removeTask} onClose={()=>setActiveTask(null)}
        />
      )}
    </div>
  );
}

// ─── TASK MODAL COMPONENT ────────────────────────────────────────────────────
function TaskModal({ activeTask, catColor, catBg, inputHours, setInputHours, inputMinutes, setInputMinutes,
  inputNotes, setInputNotes, inputOtherName, setInputOtherName, logs, otherTasks, onSave, onRemove, onClose }) {

  const isOtherNew = activeTask.startsWith("other-new-");
  const isOther = activeTask.startsWith("other-");
  const isExistingOther = isOther && !isOtherNew;
  const hasExisting = logs[activeTask] || isExistingOther;
  const canSave = (inputHours||inputMinutes) && (!isOther||inputOtherName.trim());

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <div style={{...s.modalAccentBar, background:catColor}}/>

        {isOther ? (
          <>
            <label style={s.modalFieldLabel}>What task did you do?</label>
            <input style={s.modalTextInput} type="text"
              placeholder="e.g. Window cleaning, security check..."
              value={inputOtherName} onChange={e=>setInputOtherName(e.target.value)} autoFocus/>
          </>
        ) : (
          <h3 style={s.modalTitle}>{activeTask}</h3>
        )}

        <p style={s.modalSub}>How long did this take?</p>
        <div style={s.timeRow}>
          <div style={s.timeCol}>
            <label style={s.timeLabel}>Hours</label>
            <input style={s.timeInput} type="number" min="0" max="12" placeholder="0"
              value={inputHours} onChange={e=>setInputHours(e.target.value)}/>
          </div>
          <div style={s.timeSep}>:</div>
          <div style={s.timeCol}>
            <label style={s.timeLabel}>Minutes</label>
            <input style={s.timeInput} type="number" min="0" max="59" placeholder="0"
              value={inputMinutes} onChange={e=>setInputMinutes(e.target.value)}/>
          </div>
        </div>

        <label style={s.modalFieldLabel}>Notes (optional)</label>
        <input style={s.modalTextInput} type="text"
          placeholder="Any issues or comments..."
          value={inputNotes} onChange={e=>setInputNotes(e.target.value)}/>

        <div style={s.modalBtnRow}>
          {hasExisting && (
            <button style={s.removeBtn} onClick={onRemove}>Remove</button>
          )}
          <button style={{...s.primaryBtn, flex:1, opacity:canSave?1:0.35, marginBottom:0, background:catColor}}
            onClick={onSave}>
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight:"100vh", background:"#f9fafb", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", display:"flex", justifyContent:"center" },
  container: { width:"100%", maxWidth:480 },

  // Auth
  authWrap: { background:"#fff", borderRadius:24, padding:"36px 28px 40px", margin:"40px 16px", boxShadow:"0 4px 32px rgba(0,0,0,0.07)", maxWidth:420, width:"100%" },
  authHeader: { display:"flex", alignItems:"center", gap:14, marginBottom:20 },
  logoMark: { width:46,height:46,background:"#111",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 },
  logoName: { fontSize:22,fontWeight:800,color:"#111",letterSpacing:-0.5 },
  logoStore: { fontSize:12,color:"#9ca3af",marginTop:1 },
  authTitle: { fontSize:18,fontWeight:700,color:"#111",marginBottom:16,marginTop:0 },

  // Staff grid
  staffGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  staffTile: { background:"#f9fafb",border:"2px solid #e5e7eb",borderRadius:16,padding:"20px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"all 0.15s" },
  staffAvatar: { width:52,height:52,borderRadius:"50%",background:BRAND,color:"#fff",fontWeight:800,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" },
  staffTileName: { fontWeight:700,fontSize:15,color:"#111" },

  // PIN
  textBtn: { background:"none",border:"none",color:"#9ca3af",fontSize:14,fontWeight:600,cursor:"pointer",padding:0,marginBottom:24,display:"block" },
  pinAvatarLarge: { width:70,height:70,borderRadius:"50%",background:BRAND,color:"#fff",fontWeight:800,fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" },
  pinStaffName: { fontSize:22,fontWeight:800,color:"#111",textAlign:"center",marginBottom:4 },
  pinSub: { color:"#9ca3af",fontSize:14,textAlign:"center",marginBottom:24 },
  pinDots: { display:"flex",justifyContent:"center",gap:14,marginBottom:8 },
  pinDot: { width:16,height:16,borderRadius:"50%" },
  pinErrMsg: { color:"#ef4444",fontSize:13,textAlign:"center",marginBottom:12 },
  numpad: { display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:20 },
  numKey: { background:"#f3f4f6",border:"none",borderRadius:14,padding:"18px 0",fontSize:22,fontWeight:700,color:"#111",cursor:"pointer" },

  // Top bar
  topBar: { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 16px 14px",background:"#fff",borderBottom:"1px solid #f3f4f6",position:"sticky",top:0,zIndex:10 },
  topBarName: { fontWeight:700,fontSize:15,color:"#111" },
  topBarSub: { fontSize:12,color:"#9ca3af",marginTop:2 },
  backBtn: { background:"none",border:"none",color:"#111",fontSize:14,fontWeight:700,cursor:"pointer",padding:0 },

  // Home
  homeHeader: { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 16px 0" },
  homeTitleRow: { display:"flex",alignItems:"center",gap:10 },
  logoMarkSm: { width:36,height:36,background:"#111",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 },
  homeGreeting: { fontSize:17,fontWeight:800,color:"#111" },
  homeDate: { fontSize:11,color:"#9ca3af",marginTop:2 },
  homeActions: { display:"flex",gap:8,alignItems:"center" },
  reviewChip: { background:BRAND,color:"#fff",border:"none",padding:"8px 14px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer" },
  signOutChip: { background:"#f3f4f6",color:"#6b7280",border:"none",width:36,height:36,borderRadius:"50%",fontSize:16,cursor:"pointer" },

  // Overall progress
  overallProgress: { margin:"14px 16px 0",background:BRAND_LIGHT,borderRadius:12,padding:"12px 16px" },
  overallProgressHeader: { display:"flex",justifyContent:"space-between",alignItems:"center" },
  overallProgressLabel: { fontSize:14,fontWeight:700,color:BRAND_DARK },
  overallProgressCount: { fontSize:13,fontWeight:600,color:BRAND },

  // Toggle
  toggleRow: { display:"flex",gap:8,padding:"14px 16px 4px" },
  toggleBtn: { flex:1,border:"none",borderRadius:10,padding:"10px 0",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all 0.18s" },

  // Tile grid
  tileGrid: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"8px 16px 0" },
  tile: { background:"#fff",border:"1.5px solid #f3f4f6",borderRadius:16,padding:"18px 14px",cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",transition:"all 0.15s" },
  tileTopRow: { display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 },
  tileEmoji: { fontSize:26 },
  tileDoneBadge: { background:BRAND,color:"#fff",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20 },
  tileCatName: { fontWeight:800,fontSize:14,color:"#111",marginBottom:3 },
  tileCatSub: { fontSize:12,color:"#9ca3af",marginBottom:10 },
  tileProgressTrack: { height:5,background:"#f3f4f6",borderRadius:99,overflow:"hidden" },
  tileProgressFill: { height:"100%",borderRadius:99,transition:"width 0.4s ease" },

  // Category view progress
  catProgressWrap: { margin:"12px 16px 0",background:"#fff",borderRadius:12,padding:"14px 16px",border:"1px solid #f3f4f6" },
  catProgressHeader: { display:"flex",justifyContent:"space-between",marginBottom:8 },
  catProgressLabel: { fontSize:13,fontWeight:600,color:"#374151" },
  catProgressPct: { fontSize:13,fontWeight:700,color:BRAND },
  catProgressTrack: { height:8,background:"#f3f4f6",borderRadius:99,overflow:"hidden" },
  catProgressFill: { height:"100%",background:BRAND,borderRadius:99,transition:"width 0.4s ease" },

  hint: { color:"#9ca3af",fontSize:13,padding:"10px 16px 4px" },

  // Task list
  taskCard: { margin:"0 16px",borderRadius:14,overflow:"hidden",border:"1px solid #f3f4f6",background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  taskRow: { width:"100%",display:"flex",alignItems:"center",gap:12,padding:"16px",border:"none",cursor:"pointer",textAlign:"left" },
  taskDot: { width:10,height:10,borderRadius:"50%",flexShrink:0 },
  taskLabel: { flex:1,fontSize:15 },
  taskDoneBadge: { background:BRAND,color:"#fff",fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,whiteSpace:"nowrap" },
  taskChevron: { fontSize:20,color:"#d1d5db" },

  // Checklist
  checklistProgress: { background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid #f3f4f6" },
  checklistProgressHeader: { display:"flex",justifyContent:"space-between",marginBottom:8 },
  checklistProgressLabel: { fontSize:13,fontWeight:600,color:"#374151" },
  checklistProgressPct: { fontSize:13,fontWeight:700,color:BRAND },
  checklistSection: { marginBottom:12 },
  checklistSectionHeader: { display:"flex",alignItems:"center",gap:8,marginBottom:6,paddingLeft:4 },
  checklistSectionTitle: { fontWeight:700,fontSize:13,color:"#374151",flex:1 },
  checklistSectionCount: { fontSize:12,color:"#9ca3af" },
  checklistRow: { width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",border:"none",cursor:"pointer",textAlign:"left" },
  checkboxEl: { width:22,height:22,borderRadius:6,border:"2px solid",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" },
  checkmark: { color:"#fff",fontSize:13,fontWeight:700 },
  checklistTaskName: { flex:1,fontSize:14,fontWeight:500 },
  checklistTime: { fontSize:12,fontWeight:700,color:BRAND_DARK,background:BRAND_LIGHT,padding:"3px 8px",borderRadius:20 },

  sectionPad: { padding:"20px 16px 8px" },
  pageTitle: { fontSize:22,fontWeight:800,color:"#111" },

  // Summary
  summaryStatsRow: { display:"flex",margin:"8px 16px 0",background:"#111",borderRadius:14,padding:"18px 0",justifyContent:"space-around" },
  summaryStat: { textAlign:"center" },
  summaryStatNum: { color:"#fff",fontSize:22,fontWeight:800 },
  summaryStatLabel: { color:"#6b7280",fontSize:11,marginTop:2 },
  summaryStatDivider: { width:1,background:"#374151",alignSelf:"stretch" },
  summaryRow: { display:"flex",alignItems:"flex-start",gap:10,background:"#fff",margin:"6px 16px 0",padding:"14px 16px",borderRadius:12,border:"1px solid #f3f4f6" },
  summaryPill: { fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,whiteSpace:"nowrap",alignSelf:"flex-start",marginTop:2 },
  summaryTaskName: { fontWeight:700,fontSize:14,color:"#111",flex:1 },
  summaryNote: { fontSize:12,color:"#6b7280",marginTop:3,fontStyle:"italic" },
  summaryTime: { fontWeight:700,fontSize:14,color:"#374151",whiteSpace:"nowrap" },

  // Done
  successIcon: { fontSize:60,textAlign:"center",marginBottom:12 },
  successTitle: { fontSize:24,fontWeight:800,color:"#111",textAlign:"center",marginBottom:6 },
  successName: { fontSize:16,fontWeight:600,color:"#374151",textAlign:"center" },
  successDate: { fontSize:13,color:"#9ca3af",textAlign:"center",marginBottom:16 },
  successStats: { display:"flex",background:"#f9fafb",borderRadius:14,padding:"16px 0",justifyContent:"space-around",marginBottom:16 },
  successStat: { textAlign:"center" },
  successStatNum: { fontSize:22,fontWeight:800,color:"#111" },
  successStatLabel: { fontSize:12,color:"#9ca3af",marginTop:2 },
  successStatDivider: { width:1,background:"#e5e7eb" },
  successMsg: { color:"#9ca3af",fontSize:13,textAlign:"center",marginBottom:24 },

  // Buttons
  primaryBtn: { display:"block",width:"100%",background:BRAND,color:"#fff",border:"none",padding:"16px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10,transition:"opacity 0.2s" },
  outlineBtn: { display:"block",width:"100%",background:"transparent",color:"#9ca3af",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:12,fontSize:15,fontWeight:600,cursor:"pointer" },

  errorBox: { background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:10,padding:"12px 16px",margin:"12px 16px 0",fontSize:13 },

  // Modal
  modalOverlay: { position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100 },
  modal: { background:"#fff",borderRadius:"20px 20px 0 0",padding:"0 24px 40px",width:"100%",maxWidth:480,boxShadow:"0 -8px 32px rgba(0,0,0,0.15)",overflow:"hidden" },
  modalAccentBar: { height:5,margin:"0 -24px 20px" },
  modalTitle: { fontSize:18,fontWeight:800,color:"#111",margin:"0 0 4px" },
  modalFieldLabel: { display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:8 },
  modalSub: { color:"#9ca3af",fontSize:13,marginBottom:16 },
  modalTextInput: { width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:15,marginBottom:16,boxSizing:"border-box",color:"#111" },
  timeRow: { display:"flex",alignItems:"center",gap:8,marginBottom:16 },
  timeCol: { flex:1 },
  timeLabel: { display:"block",fontSize:12,fontWeight:600,color:"#9ca3af",marginBottom:6 },
  timeInput: { width:"100%",padding:"14px 10px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:24,fontWeight:800,textAlign:"center",color:"#111",boxSizing:"border-box" },
  timeSep: { fontSize:24,fontWeight:700,color:"#d1d5db",marginTop:18 },
  modalBtnRow: { display:"flex",gap:10,marginTop:4 },
  removeBtn: { background:"#fef2f2",color:"#ef4444",border:"none",padding:"16px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer" },
};
