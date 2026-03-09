// ─── StaffLog · Staff App · src/App.jsx ──────────────────────────────────────
// Reads task schedule from Airtable TaskSchedules table (tblTl58cC0siAAaSN)
// Falls back to hardcoded DEFAULT_SCHEDULE if Airtable unreachable
import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AT_BASE   = "app6DROW7O9mZnmTY";
const AT_SHIFTS = "tbl4sVuVCiDCyXF3O"; // timesheet submissions
const AT_TASKS  = "tblTl58cC0siAAaSN"; // editable schedules
const AT_TOKEN  = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const STORE     = "Londis";
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

const STAFF = [
  { name:"Michelle", pin:"1111", initials:"MI", shift:"morning" },
  { name:"Alyson",   pin:"2222", initials:"AL", shift:"morning" },
  { name:"Susan",    pin:"3333", initials:"SU", shift:"evening"  },
];

const BRAND = { main:"#E07B39", light:"#FDF0E8", dark:"#C4622A" };

const ALL_TASKS = [
  "Post Office","Till Lift / End of Shift Count","Personal Training","Pies",
  "Magazine Returns","Newspaper Returns","Crisp Stacking","Pop Stacking",
  "Beers Stacking","Wine Stacking","Dog Food Stacking","Toiletries Stacking",
  "Fridge Stacking","Freezer Stacking","Grocery Stacking","Biscuit Stacking",
  "Cards Stacking","Chocolate/Sweets Stacking","Mix Ups","Cigarette/Vape Stacking",
  "Spirits Stacking","Fridge Date Check / Temp Check","Product Date Checks",
  "Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean",
  "Stock Room Clean","Cash and Carry List","Pricing","Promotions",
  "Delivery Unload","Serving",
];

const CATEGORIES = {
  "Post Office":"Admin","Till Lift / End of Shift Count":"Admin","Personal Training":"Admin",
  "Pies":"Food","Magazine Returns":"Stationery","Newspaper Returns":"Stationery",
  "Crisp Stacking":"Stacking","Pop Stacking":"Stacking","Beers Stacking":"Stacking",
  "Wine Stacking":"Stacking","Dog Food Stacking":"Stacking","Toiletries Stacking":"Stacking",
  "Fridge Stacking":"Stacking","Freezer Stacking":"Stacking","Grocery Stacking":"Stacking",
  "Biscuit Stacking":"Stacking","Cards Stacking":"Stacking","Chocolate/Sweets Stacking":"Stacking",
  "Mix Ups":"Stacking","Cigarette/Vape Stacking":"Stacking","Spirits Stacking":"Stacking",
  "Fridge Date Check / Temp Check":"Cleaning & Checks","Product Date Checks":"Cleaning & Checks",
  "Fridges Clean":"Cleaning & Checks","Mop":"Cleaning & Checks",
  "Door Clean / Outside Clean":"Cleaning & Checks","Behind Counter Clean":"Cleaning & Checks",
  "Stock Room Clean":"Cleaning & Checks","Cash and Carry List":"Admin",
  "Pricing":"Admin","Promotions":"Admin","Delivery Unload":"Deliveries","Serving":"Customer Service",
};

// Fallback schedule (used if Airtable fetch fails)
const DEFAULT_SCHEDULE = {
  Monday:    { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Fridge Date Check / Temp Check","Pricing"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridges Clean","Product Date Checks"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups","Behind Counter Clean"] },
  Tuesday:   { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Chocolate/Sweets Stacking","Promotions"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Cigarette/Vape Stacking","Door Clean / Outside Clean"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Wine Stacking","Delivery Unload","Stock Room Clean"] },
  Wednesday: { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Pop Stacking","Fridge Stacking","Mop"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking","Cards Stacking"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Spirits Stacking","Mix Ups"] },
  Thursday:  { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Grocery Stacking","Freezer Stacking"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Chocolate/Sweets Stacking","Product Date Checks"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Behind Counter Clean"] },
  Friday:    { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Beers Stacking"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Wine Stacking","Cards Stacking"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Pop Stacking","Delivery Unload"] },
  Saturday:  { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Fridge Stacking","Mop"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking","Freezer Stacking"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns","Cigarette/Vape Stacking","Spirits Stacking"] },
  Sunday:    { Michelle:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"], Alyson:["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns"], Susan:["Post Office","Till Lift / End of Shift Count","Personal Training","Newspaper Returns"] },
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ─── FETCH SCHEDULE FROM AIRTABLE ────────────────────────────────────────────
async function fetchSchedule() {
  let rows = [], offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${AT_TASKS}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
    if (!r.ok) throw new Error("Schedule fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);

  // Build schedule object. Rows override DEFAULT_SCHEDULE entries.
  const sched = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  rows.forEach(r => {
    const staff = r.fields["Staff Name"], day = r.fields["Day"], tasks = r.fields["Tasks"];
    if (staff && day && tasks) {
      try {
        if (!sched[day]) sched[day] = {};
        sched[day][staff] = JSON.parse(tasks);
      } catch {}
    }
  });
  return sched;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().split("T")[0];
const todayDayName = () => DAY_NAMES[new Date().getDay()];
const wkNum = ds => {
  const d = new Date(ds); d.setHours(0,0,0,0); d.setDate(d.getDate()+4-(d.getDay()||7));
  const y = new Date(d.getFullYear(),0,1); return Math.ceil((((d-y)/86400000)+1)/7);
};

function getStorageKey(staffName) { return `stafflog_${staffName}_${todayKey()}`; }

function loadTodayData(staffName) {
  try { return JSON.parse(localStorage.getItem(getStorageKey(staffName))) || {}; }
  catch { return {}; }
}
function saveData(staffName, data) {
  localStorage.setItem(getStorageKey(staffName), JSON.stringify(data));
}

// ─── AIRTABLE SUBMIT ─────────────────────────────────────────────────────────
async function submitToAirtable(staffName, shift, tasks) {
  const date = todayKey();
  const wk   = wkNum(date);
  const now  = new Date().toISOString();
  const totalMins = Object.values(tasks).reduce((a,t) => a + (t.hours*60 + t.mins), 0);

  const records = Object.entries(tasks)
    .filter(([,t]) => t.hours > 0 || t.mins > 0)
    .map(([taskName, t]) => ({
      fields: {
        "Staff Name":       staffName,
        "Date":             date,
        "Shift Submitted At": now,
        "Total Minutes":    totalMins,
        "Task Name":        taskName,
        "Task Hours":       t.hours,
        "Task Minutes":     t.mins,
        "Task Notes":       t.notes || "",
        "Category":         CATEGORIES[taskName] || "Other",
        "Week Number":      wk,
        "Store":            STORE,
      }
    }));

  // Batch max 10
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i+10);
    const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHIFTS}`, {
      method: "POST",
      headers: { Authorization:`Bearer ${AT_TOKEN}`, "Content-Type":"application/json" },
      body: JSON.stringify({ records: batch }),
    });
    if (!r.ok) throw new Error("Submit failed");
  }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 0"}}>
      <div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #F0F0F0",borderTop:`3px solid ${BRAND.main}`,animation:"spin 0.8s linear infinite"}}/>
      <p style={{color:"#9CA3AF",marginTop:14,fontSize:14}}>Loading your schedule…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, sessionExpired }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");

  const handlePin = digit => {
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      const match = STAFF.find(s => s.name === selected && s.pin === next);
      if (match) { setError(""); onLogin(match); }
      else { setError("Incorrect PIN"); setTimeout(() => setPin(""), 600); }
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F7",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}>
      <div style={{width:52,height:52,background:"#111",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:16}}>⚡</div>
      <div style={{fontSize:22,fontWeight:800,color:"#0A0A0A",marginBottom:4}}>StaffLog</div>
      <div style={{fontSize:13,color:"#9CA3AF",marginBottom:32}}>{STORE} · {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>

      {sessionExpired && (
        <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#92400E",textAlign:"center",maxWidth:340}}>
          ⏱ Session expired after 2 hours. Your tasks were saved — log back in to continue.
        </div>
      )}

      {!selected ? (
        <>
          <div style={{fontSize:14,color:"#6B7280",marginBottom:16,fontWeight:600}}>Who are you?</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:320}}>
            {STAFF.map(s => (
              <button key={s.name} onClick={() => { setSelected(s.name); setPin(""); setError(""); }}
                style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:BRAND.main,color:"#fff",fontWeight:800,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.initials}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#0A0A0A"}}>{s.name}</div>
                  <div style={{fontSize:12,color:"#9CA3AF",textTransform:"capitalize"}}>{s.shift} shift</div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{fontSize:15,fontWeight:700,color:"#0A0A0A",marginBottom:20}}>Enter PIN for {selected}</div>
          <div style={{display:"flex",gap:12,marginBottom:24}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{width:16,height:16,borderRadius:"50%",background:pin.length>i?BRAND.main:"#E5E7EB"}}/>
            ))}
          </div>
          {error && <div style={{color:"#DC2626",fontSize:13,marginBottom:12,fontWeight:600}}>{error}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:260,width:"100%"}}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
              <button key={i} onClick={() => { if(d==="⌫") setPin(p=>p.slice(0,-1)); else if(d!=="") handlePin(String(d)); }}
                style={{height:60,borderRadius:16,border:"1px solid #F0F0F0",background:d===""?"transparent":"#fff",fontSize:20,fontWeight:700,color:"#0A0A0A",cursor:d===""?"default":"pointer",boxShadow:d===""?"none":"0 2px 6px rgba(0,0,0,0.04)"}}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={() => { setSelected(null); setPin(""); setError(""); }}
            style={{marginTop:20,background:"none",border:"none",color:"#9CA3AF",fontSize:14,cursor:"pointer"}}>← Back</button>
        </>
      )}
    </div>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ taskName, existing, onSave, onClose }) {
  const [hours, setHours]   = useState(existing?.hours || 0);
  const [mins,  setMins]    = useState(existing?.mins  || 0);
  const [notes, setNotes]   = useState(existing?.notes || "");

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:100}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto"}}>
        <div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontSize:17,fontWeight:800,color:"#0A0A0A",marginBottom:20}}>{taskName}</div>

        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1}}>
            <label style={{fontSize:12,fontWeight:700,color:"#9CA3AF",display:"block",marginBottom:6}}>HOURS</label>
            <select value={hours} onChange={e=>setHours(Number(e.target.value))}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:16,color:"#0A0A0A"}}>
              {Array.from({length:9},(_,i)=><option key={i} value={i}>{i}h</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:12,fontWeight:700,color:"#9CA3AF",display:"block",marginBottom:6}}>MINUTES</label>
            <select value={mins} onChange={e=>setMins(Number(e.target.value))}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:16,color:"#0A0A0A"}}>
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m=><option key={m} value={m}>{m}m</option>)}
            </select>
          </div>
        </div>

        <label style={{fontSize:12,fontWeight:700,color:"#9CA3AF",display:"block",marginBottom:6}}>NOTES (optional)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes for the owner…"
          style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,color:"#0A0A0A",minHeight:72,resize:"none",boxSizing:"border-box"}}/>

        <button onClick={() => onSave({ hours, mins, notes })} style={{width:"100%",marginTop:16,padding:"16px",borderRadius:16,background:BRAND.main,color:"#fff",fontSize:16,fontWeight:800,border:"none",cursor:"pointer"}}>
          Save Task
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,       setSession]      = useState(null);     // { staff, loginTime }
  const [sessionExp,    setSessionExp]   = useState(false);
  const [schedule,      setSchedule]     = useState(null);     // loaded from Airtable
  const [schedLoading,  setSchedLoading] = useState(false);
  const [taskData,      setTaskData]     = useState({});       // { taskName: {hours,mins,notes} }
  const [view,          setView]         = useState("checklist"); // "checklist"|"categories"
  const [modal,         setModal]        = useState(null);     // taskName | null
  const [submitting,    setSubmitting]   = useState(false);
  const [submitted,     setSubmitted]    = useState(false);
  const [submitError,   setSubmitError]  = useState("");

  // ── Load schedule from Airtable on mount ──
  useEffect(() => {
    setSchedLoading(true);
    fetchSchedule()
      .then(s => { setSchedule(s); setSchedLoading(false); })
      .catch(() => { setSchedule(DEFAULT_SCHEDULE); setSchedLoading(false); });
  }, []);

  // ── Restore session from localStorage ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("stafflog_session"));
      if (s && Date.now() - s.loginTime < SESSION_TIMEOUT) {
        const staffObj = STAFF.find(x => x.name === s.staffName);
        if (staffObj) {
          setSession({ staff: staffObj, loginTime: s.loginTime });
          setTaskData(loadTodayData(s.staffName));
        }
      } else if (s) {
        localStorage.removeItem("stafflog_session");
        setSessionExp(true);
      }
    } catch {}
  }, []);

  // ── Session timeout watcher ──
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (Date.now() - session.loginTime >= SESSION_TIMEOUT) {
        localStorage.removeItem("stafflog_session");
        setSession(null); setSessionExp(true);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [session]);

  const handleLogin = staffObj => {
    const loginTime = Date.now();
    localStorage.setItem("stafflog_session", JSON.stringify({ staffName: staffObj.name, loginTime }));
    setSession({ staff: staffObj, loginTime });
    setTaskData(loadTodayData(staffObj.name));
    setSessionExp(false); setSubmitted(false); setSubmitError("");
  };

  const handleSignOut = () => {
    localStorage.removeItem("stafflog_session");
    setSession(null);
  };

  const updateTask = (taskName, data) => {
    const updated = { ...taskData, [taskName]: data };
    setTaskData(updated);
    saveData(session.staff.name, updated);
  };

  const handleSubmit = async () => {
    const hasTasks = Object.values(taskData).some(t => t.hours > 0 || t.mins > 0);
    if (!hasTasks) { setSubmitError("Please log time on at least one task before submitting."); return; }
    setSubmitting(true); setSubmitError("");
    try {
      await submitToAirtable(session.staff.name, session.staff.shift, taskData);
      localStorage.removeItem(getStorageKey(session.staff.name));
      setSubmitted(true); setTaskData({});
    } catch (e) {
      setSubmitError("Submission failed. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  // ── Schedule not loaded yet ──
  if (!session) return <LoginScreen onLogin={handleLogin} sessionExpired={sessionExp} />;
  if (schedLoading) return <Spinner />;

  const staffName  = session.staff.name;
  const todayDay   = todayDayName(); // e.g. "Monday"
  const todayTasks = schedule?.[todayDay]?.[staffName] || [];

  // Total hours logged
  const totalMins  = Object.values(taskData).reduce((a, t) => a + (t.hours*60 + t.mins), 0);
  const shiftMins  = 360; // 6 hour shift
  const pct        = Math.min(Math.round((totalMins / shiftMins) * 100), 100);

  // Categories
  const cats = [...new Set(todayTasks.map(t => CATEGORIES[t] || "Other"))];
  const catTasks = cat => todayTasks.filter(t => (CATEGORIES[t] || "Other") === cat);
  const catDone  = cat => catTasks(cat).filter(t => taskData[t]?.hours > 0 || taskData[t]?.mins > 0).length;

  // Additional tasks (all tasks not in today's schedule)
  const additionalPool = ALL_TASKS.filter(t => !todayTasks.includes(t));
  const additionalLogged = additionalPool.filter(t => taskData[t]?.hours > 0 || taskData[t]?.mins > 0);

  if (submitted) return (
    <div style={{minHeight:"100vh",background:"#F5F5F7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 16px",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}>
      <div style={{fontSize:52,marginBottom:16}}>✅</div>
      <div style={{fontSize:22,fontWeight:800,color:"#0A0A0A",marginBottom:8}}>Shift Submitted!</div>
      <div style={{fontSize:14,color:"#6B7280",textAlign:"center",marginBottom:32}}>Great work today, {staffName}. Your timesheet has been sent.</div>
      <button onClick={() => { setSubmitted(false); handleSignOut(); }} style={{background:BRAND.main,color:"#fff",border:"none",borderRadius:16,padding:"16px 32px",fontSize:16,fontWeight:800,cursor:"pointer"}}>Sign Out</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F7",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:"#111",padding:"16px 16px 14px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{staffName}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{todayDay} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long"})}</div>
          </div>
          <button onClick={handleSignOut} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"6px 12px",color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:700,cursor:"pointer"}}>Sign out</button>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700}}>SHIFT PROGRESS</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:700}}>{Math.floor(totalMins/60)}h {totalMins%60}m / 6h</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"#22C55E":BRAND.main,borderRadius:99,transition:"width 0.4s"}}/>
          </div>
          {/* Hour markers */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            {[1,2,3,4,5,6].map(h=>(
              <span key={h} style={{fontSize:9,color:totalMins>=h*60?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)",fontWeight:600}}>{h}h</span>
            ))}
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{display:"flex",gap:8,padding:"12px 16px 0"}}>
        {[{id:"checklist",label:"Today's Tasks"},{id:"categories",label:"All Categories"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{background:view===v.id?BRAND.main:"#fff",color:view===v.id?"#fff":"#6B7280",border:`1px solid ${view===v.id?BRAND.main:"#F0F0F0"}`,borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{padding:"12px 16px 120px"}}>

        {/* ── CHECKLIST VIEW ── */}
        {view==="checklist"&&(
          <>
            <div style={{fontSize:12,color:"#9CA3AF",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:0.8}}>
              {todayDay}'s Schedule · {todayTasks.length} tasks
            </div>
            {todayTasks.map(task=>{
              const done=taskData[task]?.hours>0||taskData[task]?.mins>0;
              return(
                <div key={task} onClick={()=>setModal(task)}
                  style={{background:"#fff",borderRadius:14,border:`1px solid ${done?BRAND.main:"#F0F0F0"}`,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:done?BRAND.main:"#F3F4F6",border:`2px solid ${done?BRAND.main:"#E5E7EB"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {done&&<span style={{fontSize:11,color:"#fff"}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#0A0A0A"}}>{task}</div>
                    {done&&<div style={{fontSize:12,color:BRAND.main,fontWeight:600}}>
                      {taskData[task].hours>0?`${taskData[task].hours}h `:""}{taskData[task].mins>0?`${taskData[task].mins}m`:""}{taskData[task].notes?` · 💬`:""}</div>}
                  </div>
                  <span style={{fontSize:18,color:"#9CA3AF"}}>›</span>
                </div>
              );
            })}

            {/* Additional tasks */}
            <div style={{fontSize:12,color:"#9CA3AF",fontWeight:700,margin:"16px 0 10px",textTransform:"uppercase",letterSpacing:0.8}}>Additional Tasks</div>
            {additionalLogged.map(task=>{
              const done=taskData[task]?.hours>0||taskData[task]?.mins>0;
              return(
                <div key={task} onClick={()=>setModal(task)}
                  style={{background:"#fff",borderRadius:14,border:`1px solid ${done?BRAND.main:"#F0F0F0"}`,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:BRAND.main,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:11,color:"#fff"}}>✓</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#0A0A0A"}}>{task}</div>
                    <div style={{fontSize:12,color:BRAND.main,fontWeight:600}}>{taskData[task].hours>0?`${taskData[task].hours}h `:""}{taskData[task].mins>0?`${taskData[task].mins}m`:""}</div>
                  </div>
                  <span style={{fontSize:18,color:"#9CA3AF"}}>›</span>
                </div>
              );
            })}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {additionalPool.filter(t=>!additionalLogged.includes(t)).map(task=>(
                <button key={task} onClick={()=>setModal(task)} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:20,padding:"7px 14px",fontSize:13,color:"#6B7280",fontWeight:600,cursor:"pointer"}}>+ {task}</button>
              ))}
            </div>
          </>
        )}

        {/* ── CATEGORY VIEW ── */}
        {view==="categories"&&cats.map(cat=>{
          const tasks=catTasks(cat);const done=catDone(cat);
          return(
            <div key={cat} style={{background:"#fff",borderRadius:16,border:"1px solid #F0F0F0",padding:16,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:800,color:"#0A0A0A"}}>{cat}</div>
                <span style={{fontSize:12,fontWeight:700,color:done===tasks.length?BRAND.main:"#9CA3AF"}}>{done}/{tasks.length}</span>
              </div>
              <div style={{height:5,background:"#F3F4F6",borderRadius:99,overflow:"hidden",marginBottom:12}}>
                <div style={{height:"100%",width:`${tasks.length>0?(done/tasks.length)*100:0}%`,background:BRAND.main,borderRadius:99,transition:"width 0.4s"}}/>
              </div>
              {tasks.map(task=>{
                const d=taskData[task]?.hours>0||taskData[task]?.mins>0;
                return(
                  <div key={task} onClick={()=>setModal(task)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:"1px solid #F3F4F6",cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:d?BRAND.main:"#F3F4F6",border:`2px solid ${d?BRAND.main:"#E5E7EB"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {d&&<span style={{fontSize:9,color:"#fff"}}>✓</span>}
                    </div>
                    <span style={{flex:1,fontSize:13,fontWeight:600,color:"#0A0A0A"}}>{task}</span>
                    {d&&<span style={{fontSize:12,color:BRAND.main,fontWeight:600}}>{taskData[task].hours>0?`${taskData[task].hours}h `:""}{taskData[task].mins>0?`${taskData[task].mins}m`:""}</span>}
                    <span style={{fontSize:16,color:"#9CA3AF"}}>›</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Submit bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #F0F0F0",padding:"12px 16px 24px",boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
        {submitError&&<div style={{fontSize:13,color:"#DC2626",marginBottom:8,fontWeight:600}}>{submitError}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:13,color:"#6B7280"}}>
            {Object.values(taskData).filter(t=>t.hours>0||t.mins>0).length} tasks logged · {Math.floor(totalMins/60)}h {totalMins%60}m
          </span>
          <span style={{fontSize:13,fontWeight:700,color:pct>=100?"#16A34A":BRAND.main}}>{pct}%</span>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          style={{width:"100%",padding:"16px",borderRadius:16,background:submitting?"#9CA3AF":BRAND.main,color:"#fff",fontSize:16,fontWeight:800,border:"none",cursor:submitting?"not-allowed":"pointer"}}>
          {submitting?"Submitting…":"Submit Shift"}
        </button>
      </div>

      {/* Task modal */}
      {modal&&<TaskModal taskName={modal} existing={taskData[modal]} onSave={d=>{updateTask(modal,d);setModal(null);}} onClose={()=>setModal(null)}/>}

      <style>{`*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
