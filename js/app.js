"use strict";
/* 2027 Digital Planner — everything stays on this device (localStorage). */
const KEY = "planner2027.v1";
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const dow = s => pd(s).getDay();
const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], DL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtD = s => { const d = pd(s); return `${DN[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()].slice(0, 3)}`; };
const byId = (a, id) => a.find(x => x.id === id);
const weekStart = ds => addD(ds, -((dow(ds) + 6) % 7));
const HC = ["#3E5C76", "#E07A62", "#5F8A66", "#7D66D6", "#C95C7E", "#D9A23A", "#3BA6A0", "#8C7A6B"];
const THEMES = [["navy", "Navy", "#3E5C76", "#F7F4EF"], ["sage", "Sage", "#5F8A66", "#F2F5EF"], ["blush", "Blush", "#C95C7E", "#FCF3F5"], ["peach", "Peach", "#E07A62", "#FBF6F1"], ["lavender", "Lavender", "#7D66D6", "#F5F2FB"], ["mono", "Classic", "#2E2C2A", "#F4F3F1"], ["dark", "Night", "#FF9A80", "#141218"]];
const COVERS = ["📅", "✨", "🌿", "🌸", "☀️", "🌙", "⭐", "🦋", "📖", "☕", "🎯", "🔥"];
const MOOD = ["", "😞", "😕", "😐", "🙂", "😄"];
const LIST0 = [["📚", "Books to read"], ["🎬", "Movies & shows"], ["✈️", "Places to visit"], ["🛒", "Shopping list"], ["🎁", "Gift ideas"], ["💡", "Ideas"]];

function blank() { const y = new Date().getMonth() >= 10 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  return { v: 1, owner: "", title: `${y} Planner`, theme: "navy", cover: "📅", year: y, onboarded: false, days: {}, events: [], goals: [], habits: [], hlog: {}, weeks: {}, months: {}, years: {}, pages: [], lists: LIST0.map(([e, n]) => ({ id: uid(), e, n, items: [] })), start: 7, end: 21, created: today() }; }
let S; try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
S = Object.assign(blank(), S);
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save — storage is full"); } }
let view = "today", sel = {};
const day = ds => S.days[ds] || (S.days[ds] = { top: ["", "", ""], topOk: [false, false, false], todo: [], sched: {}, notes: "", mood: 0, grat: "" });
const peek = ds => S.days[ds] || { todo: [], top: [], sched: {} };
const evOn = ds => S.events.filter(e => e.d === ds || (e.yearly && e.d.slice(5) === ds.slice(5) && e.d <= ds));
const pname = () => (S.owner ? S.owner + (/s$/i.test(S.owner) ? "' " : "'s ") : "My ") + S.title;

/* ---------- ui ---------- */
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2000); }
function confetti() { const c = document.createElement("div"); c.className = "confetti"; for (let i = 0; i < 50; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = HC[i % 8]; s.style.animationDelay = Math.random() * .5 + "s"; c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 2200); }
function sheet(h) { $("sheetIn").innerHTML = h; $("sheet").classList.add("on"); }
function closeSheet() { $("sheet").classList.remove("on"); }
function head(t, sub, right = "") { return `<div class="head"><div><div class="kick">${esc(S.cover)} ${esc(pname())}</div><h1>${t}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="row">${right}</div></div>`; }
const nav3 = (a, b) => `<button class="btn ghost sm" style="font-size:18px" data-a="${a}" data-v="-1">‹</button><button class="btn ghost sm" data-a="${b}">Today</button><button class="btn ghost sm" style="font-size:18px" data-a="${a}" data-v="1">›</button>`;
function miniMonth(y, m, onlyHL) { const first = `${y}-${pad(m + 1)}-01`, ws = weekStart(first), t0 = today(); let h = `<div class="g">${["M", "T", "W", "T", "F", "S", "S"].map(d => `<span class="h">${d}</span>`).join("")}`;
  for (let i = 0; i < 42; i++) { const d = addD(ws, i); if (i >= 35 && d.slice(5, 7) !== pad(m + 1)) break; const inM = d.slice(5, 7) === pad(m + 1); h += `<span class="${d === t0 ? "t" : inM && evOn(d).length ? "e" : ""}" style="${inM ? "" : "opacity:.25"}">${pd(d).getDate()}</span>`; }
  return h + "</div>"; }

/* ---------- nav ---------- */
const NAV = [["Plan", [["today", "☀️", "Today"], ["week", "🗓️", "Week"], ["month", "📆", "Month"], ["year", "🗺️", "Year"]]],
  ["Grow", [["goals", "🎯", "Goals"], ["habits", "🔁", "Habit tracker"], ["events", "🎂", "Events & birthdays"]]],
  ["Write", [["notes", "📝", "Notes"], ["lists", "📋", "Lists"]]], ["App", [["settings", "🎨", "Personalize"], ["help", "❓", "Help"]]]];
const BNAV = [["today", "☀️", "Today"], ["week", "🗓️", "Week"], ["month", "📆", "Month"], ["goals", "🎯", "Goals"], ["more", "☰", "More"]];
function renderNav() {
  $("snav").innerHTML = `<div class="logo" style="flex-direction:column;align-items:flex-start;gap:0">${S.owner ? `<span class="scr" style="font-size:34px;line-height:1">${esc(S.owner)}${/s$/i.test(S.owner) ? "'" : "'s"}</span>` : ""}<span>${esc(S.cover)} ${S.owner ? "" : "My "}${esc(S.title)}</span></div>` + NAV.map(([g, it]) => `<div class="g">${g}</div>` + it.map(([k, e, n]) => `<button class="${view === k ? "on" : ""}" data-go="${k}"><span>${e}</span>${n}</button>`).join("")).join("");
  const inMore = !BNAV.some(b => b[0] === view);
  $("bnav").innerHTML = BNAV.map(([k, e, n]) => `<button class="${view === k || (k === "more" && inMore) ? "on" : ""}" data-go="${k}"><span class="i">${e}</span>${n}</button>`).join("");
}

/* ---------- screens ---------- */
function scrToday() {
  const ds = sel.date || today(), D = day(ds), evs = evOn(ds), hs = S.habits, dn = D.todo.filter(t => t.ok).length;
  return head(`${DL[dow(ds)]}, ${pd(ds).getDate()} ${MN[pd(ds).getMonth()]}`, ds === today() ? "Today" : pd(ds).getFullYear(), nav3("dshift", "dtoday")) + `
  <div class="g21"><div class="grid" style="align-content:start">
   ${evs.length ? `<div class="note">🎉 ${evs.map(e => `${esc(e.e || "⭐")} <b>${esc(e.t)}</b>`).join(" · ")}</div>` : ""}
   <div class="card"><h3>⭐ Top 3 priorities</h3>${[0, 1, 2].map(i => `<div class="prio"><button class="tick ${D.topOk[i] ? "on" : ""}" data-a="topOk" data-i="${i}">✓</button><input class="i" data-in="top" data-i="${i}" value="${esc(D.top[i])}" placeholder="${["Most important", "Second", "Third"][i]}" style="${D.topOk[i] ? "text-decoration:line-through;color:var(--mut)" : ""}"></div>`).join("")}</div>
   <div class="card"><h3>✅ To-do<span class="sp"></span><span class="chip">${dn}/${D.todo.length}</span></h3>${D.todo.map((t, i) => `<div class="list-it ${t.ok ? "done" : ""}"><button class="tick ${t.ok ? "on" : ""}" data-a="tdOk" data-i="${i}">✓</button><div class="tx">${esc(t.t)}</div>${!t.ok ? `<button class="btn ghost sm" data-a="tdMove" data-i="${i}" title="Move to tomorrow">→</button>` : ""}<button class="btn ghost sm" data-a="tdDel" data-i="${i}">✕</button></div>`).join("")}
    <form data-f="todo" class="row" style="flex-wrap:nowrap;margin-top:8px"><input class="i" id="tdIn" placeholder="Add a to-do…"><button class="btn">Add</button></form></div>
   <div class="card sched"><h3>🕰️ Schedule</h3>${Array.from({ length: S.end - S.start + 1 }, (_, i) => S.start + i).map(h => `<div class="r"><b>${h % 12 || 12}${h < 12 ? "am" : "pm"}</b><input data-in="sched" data-h="${h}" value="${esc(D.sched[h] || "")}" placeholder="·"></div>`).join("")}</div>
  </div><div class="grid" style="align-content:start">
   <div class="card"><h3>🌤️ Mood</h3><div class="moods">${[1, 2, 3, 4, 5].map(m => `<button class="${D.mood === m ? "on" : ""}" data-a="mood" data-v="${m}">${MOOD[m]}</button>`).join("")}</div></div>
   ${hs.length ? `<div class="card"><h3>🔁 Habits</h3>${hs.map(h => { const on = S.hlog[ds] && S.hlog[ds][h.id]; return `<div class="list-it"><button class="tick ${on ? "on" : ""}" style="${on ? `background:${h.c};border-color:${h.c}` : ""}" data-a="hTick" data-id="${h.id}" data-d="${ds}">✓</button><div class="tx">${h.e} ${esc(h.n)}</div></div>`; }).join("")}</div>` : ""}
   <div class="card"><h3>🙏 Grateful for</h3><textarea class="i" rows="3" data-in="grat">${esc(D.grat)}</textarea></div>
   <div class="card"><h3>📝 Notes</h3><textarea class="notepad" style="min-height:220px" data-in="notes">${esc(D.notes)}</textarea></div>
  </div></div>`;
}
function scrWeek() {
  const ws = sel.ws || weekStart(today()), we = addD(ws, 6), W = S.weeks[ws] = S.weeks[ws] || { focus: "", notes: "" }, t0 = today();
  return head(`Week of ${pd(ws).getDate()} ${MN[pd(ws).getMonth()].slice(0, 3)}`, `${fmtD(ws)} – ${fmtD(we)}`, nav3("wshift", "wtoday")) + `
  <div class="card" style="margin-bottom:14px"><div class="row" style="flex-wrap:nowrap"><b style="white-space:nowrap">🎯 This week's focus</b><input class="i" data-in="wfocus" data-ws="${ws}" value="${esc(W.focus)}" placeholder="One thing that would make this week great"></div></div>
  <div class="wk7">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = addD(ws, i), P = peek(d), ev = evOn(d);
    return `<div class="wd ${d === t0 ? "t" : ""}"><h4>${DN[dow(d)].toUpperCase()}<b>${pd(d).getDate()}</b></h4>${ev.map(e => `<div class="it" style="color:var(--br);font-weight:700">${esc(e.e || "⭐")} ${esc(e.t)}</div>`).join("")}
     ${(P.todo || []).map((t, j) => `<div class="it ${t.ok ? "ok" : ""}"><button class="tick ${t.ok ? "on" : ""}" style="width:18px;height:18px;flex:0 0 18px;font-size:10px;border-width:2px" data-a="wkOk" data-d="${d}" data-i="${j}">✓</button>${esc(t.t)}</div>`).join("")}
     <form data-f="wkAdd" data-d="${d}"><input placeholder="+ add"></form><button class="btn ghost sm" data-a="openDay" data-v="${d}" style="margin-top:4px">Open day</button></div>`; }).join("")}</div>
  ${S.habits.length ? `<div class="card hgrid" style="margin-top:14px"><h3>🔁 Habits this week</h3><table><tr><th></th>${[0, 1, 2, 3, 4, 5, 6].map(i => `<th>${DN[dow(addD(ws, i))][0]}</th>`).join("")}</tr>${S.habits.map(h => `<tr><td style="text-align:left;padding-right:10px;white-space:nowrap">${h.e} ${esc(h.n)}</td>${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = addD(ws, i), on = S.hlog[d] && S.hlog[d][h.id]; return `<td class="c"><i class="${on ? "on" : ""}" style="${on ? `background:${h.c}` : ""}" data-a="hTick" data-id="${h.id}" data-d="${d}"></i></td>`; }).join("")}</tr>`).join("")}</table></div>` : ""}
  <div class="card" style="margin-top:14px"><h3>📝 Week notes</h3><textarea class="i" rows="4" data-in="wnotes" data-ws="${ws}">${esc(W.notes)}</textarea></div>`;
}
function scrMonth() {
  const ym = sel.ym || today().slice(0, 7), [y, m] = ym.split("-").map(Number), M = S.months[ym] = S.months[ym] || { goals: "", notes: "" }, ws = weekStart(`${ym}-01`), t0 = today(), cells = [];
  for (let i = 0; i < 42; i++) { const d = addD(ws, i); if (i >= 35 && d.slice(0, 7) !== ym) break; cells.push(d); }
  return head(`${MN[m - 1]} ${y}`, "Month at a glance", nav3("mshift", "mtoday") + `<button class="btn" data-a="addEv">+ Event</button>`) + `
  <div class="card"><div class="mcal">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div class="dh">${d}</div>`).join("")}${cells.map(d => { const ev = evOn(d), P = peek(d), td = (P.todo || []).length;
    return `<button class="d ${d.slice(0, 7) !== ym ? "o" : ""} ${d === t0 ? "t" : ""}" data-a="openDay" data-v="${d}"><b>${pd(d).getDate()}</b>${ev.slice(0, 2).map(e => `<span class="ev">${esc(e.e || "⭐")} ${esc(e.t)}</span>`).join("")}${td ? `<span class="mut" style="font-size:10px">✅ ${(P.todo || []).filter(t => t.ok).length}/${td}</span>` : ""}${P.mood ? `<span style="font-size:12px">${MOOD[P.mood]}</span>` : ""}</button>`; }).join("")}</div></div>
  <div class="g2" style="margin-top:14px"><div class="card"><h3>🎯 Goals for ${MN[m - 1]}</h3><textarea class="i" rows="5" data-in="mgoals" data-ym="${ym}" placeholder="What do you want to achieve this month?">${esc(M.goals)}</textarea></div>
  <div class="card"><h3>📝 Notes</h3><textarea class="i" rows="5" data-in="mnotes" data-ym="${ym}">${esc(M.notes)}</textarea></div></div>`;
}
function scrYear() {
  const y = sel.y || S.year, Y = S.years[y] = S.years[y] || { word: "", goals: "", notes: "" };
  return head(`${y} at a glance`, "Your whole year on one page", `<button class="btn ghost sm" style="font-size:18px" data-a="yshift" data-v="-1">‹</button><button class="btn ghost sm" style="font-size:18px" data-a="yshift" data-v="1">›</button>`) + `
  <div class="g21"><div class="ycal">${MN.map((n, m) => `<button class="mini" data-a="openMonth" data-v="${y}-${pad(m + 1)}"><h4>${n}</h4>${miniMonth(y, m)}</button>`).join("")}</div>
  <div class="grid" style="align-content:start"><div class="card" style="text-align:center"><div class="pick mut">WORD OF THE YEAR</div><div class="word" style="margin:8px 0">${esc(Y.word) || "Grow"}</div><input class="i" data-in="yword" data-y="${y}" value="${esc(Y.word)}" placeholder="One word for ${y}"></div>
   <div class="card"><h3>✨ ${y} intentions</h3><textarea class="i" rows="6" data-in="ygoals" data-y="${y}" placeholder="Big dreams for the year…">${esc(Y.goals)}</textarea></div>
   <div class="card"><h3>🎂 Coming up</h3>${S.events.map(e => ({ e, d: e.yearly ? `${y}-${e.d.slice(5)}` : e.d })).filter(x => x.d.startsWith(y) && x.d >= today()).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 6).map(x => `<div class="sm" style="padding:4px 0">${esc(x.e.e || "⭐")} <b>${esc(x.e.t)}</b> <span class="mut">· ${fmtD(x.d)}</span></div>`).join("") || `<div class="mut sm">Add birthdays and events.</div>`}</div></div></div>`;
}
function scrGoals() {
  return head("Goals", "Big dreams, small steps", `<button class="btn" data-a="addGoal">+ Goal</button>`) + `<div class="g3">${S.goals.map(g => { const p = g.steps.length ? g.steps.filter(s => s.ok).length / g.steps.length : 0;
    return `<div class="card"><div class="row" style="flex-wrap:nowrap"><span style="font-size:30px">${g.e}</span><div style="flex:1"><div class="b" style="font-size:17px">${esc(g.n)}</div><div class="mut xs">${esc(g.q || "")}</div></div><button class="btn ghost sm" data-a="delGoal" data-id="${g.id}">✕</button></div>
     <div class="row" style="margin:10px 0 6px"><div class="pbar" style="flex:1"><i style="width:${p * 100}%;background:var(--br)"></i></div><b class="sm">${Math.round(p * 100)}%</b></div>
     ${g.steps.map((s, i) => `<div class="list-it ${s.ok ? "done" : ""}"><button class="tick ${s.ok ? "on" : ""}" style="width:24px;height:24px;flex:0 0 24px;font-size:12px" data-a="step" data-id="${g.id}" data-i="${i}">✓</button><div class="tx sm">${esc(s.t)}</div></div>`).join("")}
     <form data-f="step" data-id="${g.id}" class="row" style="flex-wrap:nowrap;margin-top:8px"><input class="i" placeholder="Add a step…" style="padding:8px 10px;font-size:14px"><button class="btn ghost sm">+</button></form></div>`; }).join("") || `<div class="card"><div class="empty"><span class="e">🎯</span>What would make this year amazing?</div></div>`}</div>`;
}
function scrHabits() {
  const ym = sel.hym || today().slice(0, 7), [y, m] = ym.split("-").map(Number), nd = new Date(y, m, 0).getDate();
  return head("Habit tracker", `${MN[m - 1]} ${y}`, `<button class="btn ghost sm" style="font-size:18px" data-a="hmshift" data-v="-1">‹</button><button class="btn ghost sm" style="font-size:18px" data-a="hmshift" data-v="1">›</button><button class="btn" data-a="addHabit">+ Habit</button>`) + `
  <div class="card hgrid">${S.habits.length ? `<table><tr><th></th>${Array.from({ length: nd }, (_, i) => `<th>${i + 1}</th>`).join("")}<th>%</th></tr>${S.habits.map(h => { let c = 0; const cells = Array.from({ length: nd }, (_, i) => { const d = `${ym}-${pad(i + 1)}`, on = S.hlog[d] && S.hlog[d][h.id]; if (on) c++; return `<td class="c"><i class="${on ? "on" : ""}" style="${on ? `background:${h.c}` : ""}" data-a="hTick" data-id="${h.id}" data-d="${d}"></i></td>`; }).join("");
    return `<tr><td style="text-align:left;padding-right:10px;white-space:nowrap"><button data-a="delHabit" data-id="${h.id}" title="Remove" style="opacity:.4">✕</button> ${h.e} ${esc(h.n)}</td>${cells}<td><b>${Math.round(c / nd * 100)}</b></td></tr>`; }).join("")}</table>` : `<div class="empty"><span class="e">🔁</span>Add a habit to track it every day.</div>`}</div>`;
}
function scrEvents() {
  const l = S.events.slice().sort((a, b) => a.d.slice(5).localeCompare(b.d.slice(5)));
  return head("Events & birthdays", `${l.length} saved`, `<button class="btn" data-a="addEv">+ Event</button>`) + `<div class="card">${l.map(e => `<div class="list-it"><span style="font-size:22px">${esc(e.e || "⭐")}</span><div class="tx"><b>${esc(e.t)}</b><div class="mut xs">${e.yearly ? `Every year · ${pd(e.d).getDate()} ${MN[pd(e.d).getMonth()]}` : fmtD(e.d) + " " + pd(e.d).getFullYear()}</div></div><button class="btn ghost sm" data-a="delEv" data-id="${e.id}">✕</button></div>`).join("") || `<div class="empty"><span class="e">🎂</span>Add birthdays, anniversaries and plans — they show on every calendar.</div>`}</div>`;
}
function scrNotes() {
  const pg = byId(S.pages, sel.page) || S.pages[0];
  return head("Notes", `${S.pages.length} pages`, `<button class="btn" data-a="newPage">+ Page</button>`) + `<div class="g21 jg"><div class="card">${pg ? `<input class="i" data-in="ptitle" data-id="${pg.id}" value="${esc(pg.t)}" placeholder="Title" style="font-family:Serif;font-size:24px;background:none;border:0;padding:4px"><textarea class="notepad" data-in="pbody" data-id="${pg.id}" placeholder="Start writing…">${esc(pg.b)}</textarea><button class="btn ghost sm" data-a="delPage" data-id="${pg.id}">Delete page</button>` : `<div class="empty">📝 Tap + Page to start.</div>`}</div>
  <div class="card jlist" style="align-self:start">${S.pages.map(p => `<button class="${pg && p.id === pg.id ? "on" : ""}" data-a="openPage" data-id="${p.id}"><b>${esc(p.t || "Untitled")}</b><div class="mut xs">${esc((p.b || "").slice(0, 60))}</div></button>`).join("")}</div></div>`;
}
function scrLists() {
  return head("Lists", "Everything worth remembering", `<button class="btn" data-a="newList">+ List</button>`) + `<div class="g3">${S.lists.map(l => `<div class="card"><h3>${l.e} ${esc(l.n)}<span class="sp"></span><button class="btn ghost sm" data-a="delList" data-id="${l.id}">✕</button></h3>${l.items.map((it, i) => `<div class="list-it ${it.ok ? "done" : ""}"><button class="tick ${it.ok ? "on" : ""}" style="width:24px;height:24px;flex:0 0 24px;font-size:12px" data-a="liOk" data-id="${l.id}" data-i="${i}">✓</button><div class="tx sm">${esc(it.t)}</div><button class="btn ghost sm" data-a="liDel" data-id="${l.id}" data-i="${i}">✕</button></div>`).join("")}
   <form data-f="li" data-id="${l.id}" class="row" style="flex-wrap:nowrap;margin-top:8px"><input class="i" placeholder="Add…" style="padding:8px 10px;font-size:14px"><button class="btn ghost sm">+</button></form></div>`).join("")}</div>`;
}
function scrSettings() {
  return head("Personalize", "Make it yours") + `<div class="g2"><div class="card"><h3>🎨 Your planner</h3>
   <div class="cover" style="margin-bottom:10px"><div class="em">${esc(S.cover)}</div><div>${S.owner ? `<div class="o">${esc(S.owner)}${/s$/i.test(S.owner) ? "'" : "'s"}</div>` : ""}<div class="ti">${S.owner ? "" : "My "}${esc(S.title)}</div></div></div>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>NAME ON THE COVER</span><input class="i" data-set="owner" value="${esc(S.owner)}" placeholder="e.g. Sarah"></label><label class="f"><span>TITLE</span><input class="i" data-set="title" value="${esc(S.title)}" list="tl"><datalist id="tl">${[`${S.year} Planner`, "Daily Planner", "Life Planner", "Weekly Planner", "Digital Planner"].map(t => `<option value="${t}">`).join("")}</datalist></label></div>
   <div class="pick mut" style="margin-bottom:6px">THEME</div><div class="sw" style="margin-bottom:14px">${THEMES.map(([k, n, c, b]) => `<button class="${S.theme === k ? "on" : ""}" data-a="theme" data-v="${k}"><i style="background:linear-gradient(135deg,${b} 50%,${c} 50%)"></i>${n}</button>`).join("")}</div>
   <div class="pick mut" style="margin-bottom:6px">COVER ICON</div><div class="row" style="margin-bottom:14px">${COVERS.map(c => `<button class="chip ${S.cover === c ? "on" : ""}" data-a="cover" data-v="${c}" style="font-size:19px">${c}</button>`).join("")}</div>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>DAY STARTS</span><select class="i" data-set="start">${[5, 6, 7, 8, 9].map(h => `<option ${S.start == h ? "selected" : ""} value="${h}">${h}am</option>`).join("")}</select></label><label class="f"><span>DAY ENDS</span><select class="i" data-set="end">${[18, 19, 20, 21, 22, 23].map(h => `<option ${S.end == h ? "selected" : ""} value="${h}">${h - 12}pm</option>`).join("")}</select></label></div></div>
  <div class="grid" style="align-content:start"><div class="card"><h3>💾 Your data</h3><div class="mut sm" style="margin-bottom:12px">Saved on this device only. Download a backup now and then.</div><div class="row"><button class="btn" data-a="backup">⬇ Download backup</button><button class="btn ghost" data-a="restore">⬆ Restore</button></div><input type="file" id="restoreFile" accept=".json" style="display:none">
   <div class="row" style="margin-top:16px"><button class="btn ghost" data-a="demo">✨ Load example data</button><button class="btn ghost" data-a="erase" style="color:var(--red)">Erase everything</button></div></div>
   <div class="card"><h3>📲 Install on your phone</h3><div class="sm"><b>iPhone/iPad:</b> Safari → Share → Add to Home Screen.<br><b>Android:</b> Chrome → ⋮ → Add to Home screen.<br><b>Computer:</b> Chrome or Edge → install icon.</div></div></div></div>`;
}
function scrHelp() { const q = [["Daily page", "Top 3 priorities, to-dos, an hourly schedule, mood, habits, gratitude and notes. Tap → on a to-do to move it to tomorrow."], ["Week & month", "See everything at once. Add to-dos straight into any day of the week. Tap a day on the month to open it."], ["Year", "12 mini calendars, a word of the year and your big intentions. Tap a month to open it."], ["Events & birthdays", "Yearly events repeat every year automatically and show on every calendar."], ["Where is my data?", "Only on this device. Use Personalize → Download backup to keep a copy or move to a new device."]];
  return head("Help", "Quick answers") + `<div class="g2">${q.map(([a, b]) => `<div class="card"><h3>${a}</h3><div class="sm mut">${b}</div></div>`).join("")}</div>`; }
function scrMore() { return head("More", "Everything in your planner") + NAV.map(([g, it]) => `<div class="pick mut" style="margin:14px 2px 8px">${g.toUpperCase()}</div><div class="tiles">${it.map(([k, e, n]) => `<button class="tile" data-go="${k}"><div class="e">${e}</div><div class="n">${n}</div></button>`).join("")}</div>`).join(""); }
function scrOnboard() {
  return `<div class="onb"><div class="card"><div class="cover" style="margin-bottom:14px"><div class="em">${esc(S.cover)}</div><div>${S.owner ? `<div class="o">${esc(S.owner)}'s</div>` : ""}<div class="ti">${S.owner ? "" : "My "}${esc(S.title)}</div></div></div>
   <h1 style="font-family:Serif;font-weight:400;font-size:30px;margin-bottom:4px">${S.owner ? "Welcome, " + esc(S.owner.split(" ")[0]) + "!" : "Welcome to your planner"}</h1><div class="mut" style="margin-bottom:14px">Your year, month, week and day — all in one calm place.</div>
   <label class="f"><span>YOUR NAME</span><input class="i" id="obN" value="${esc(S.owner)}" placeholder="Your name"></label>
   <div class="pick mut" style="margin-bottom:6px">PICK A THEME</div><div class="sw" style="margin-bottom:16px">${THEMES.map(([k, n, c, b]) => `<button class="${S.theme === k ? "on" : ""}" data-a="obTheme" data-v="${k}"><i style="background:linear-gradient(135deg,${b} 50%,${c} 50%)"></i>${n}</button>`).join("")}</div>
   <div class="row"><button class="btn ghost" data-a="demo">✨ Try with example data</button><span class="sp"></span><button class="btn" data-a="obDone">Start planning ✨</button></div></div></div>`;
}

/* ---------- actions ---------- */
const ACT = {
  close: closeSheet,
  dshift(e) { sel.date = addD(sel.date || today(), +e.dataset.v); render(); }, dtoday() { sel.date = null; render(); },
  wshift(e) { sel.ws = addD(sel.ws || weekStart(today()), 7 * e.dataset.v); render(); }, wtoday() { sel.ws = null; render(); },
  mshift(e) { const [y, m] = (sel.ym || today().slice(0, 7)).split("-").map(Number), d = new Date(y, m - 1 + +e.dataset.v, 1); sel.ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); }, mtoday() { sel.ym = null; render(); },
  hmshift(e) { const [y, m] = (sel.hym || today().slice(0, 7)).split("-").map(Number), d = new Date(y, m - 1 + +e.dataset.v, 1); sel.hym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  yshift(e) { sel.y = (sel.y || S.year) + +e.dataset.v; render(); },
  openDay(e) { view = "today"; sel = { date: e.dataset.v === today() ? null : e.dataset.v }; render(); scrollTo(0, 0); },
  openMonth(e) { view = "month"; sel = { ym: e.dataset.v }; render(); scrollTo(0, 0); },
  topOk(e) { const D = day(sel.date || today()), i = +e.dataset.i; D.topOk[i] = !D.topOk[i]; save(); if (D.topOk.every(Boolean) && D.top.every(Boolean)) { confetti(); toast("Top 3 done! ⭐"); } render(); },
  tdOk(e) { const D = day(sel.date || today()), t = D.todo[+e.dataset.i]; t.ok = !t.ok; save(); if (t.ok) toast("Done ✓"); render(); },
  tdDel(e) { day(sel.date || today()).todo.splice(+e.dataset.i, 1); save(); render(); },
  tdMove(e) { const ds = sel.date || today(), D = day(ds), [t] = D.todo.splice(+e.dataset.i, 1); day(addD(ds, 1)).todo.push(t); save(); toast("Moved to tomorrow →"); render(); },
  wkOk(e) { const t = day(e.dataset.d).todo[+e.dataset.i]; t.ok = !t.ok; save(); render(); },
  mood(e) { const D = day(sel.date || today()), v = +e.dataset.v; D.mood = D.mood === v ? 0 : v; save(); render(); },
  hTick(e) { const ds = e.dataset.d, id = e.dataset.id; S.hlog[ds] = S.hlog[ds] || {}; if (S.hlog[ds][id]) delete S.hlog[ds][id]; else S.hlog[ds][id] = 1; save(); render(); },
  addHabit() { const n = prompt("New habit:"); if (!n) return; S.habits.push({ id: uid(), n, e: prompt("Emoji:", "⭐") || "⭐", c: HC[S.habits.length % 8] }); save(); render(); },
  delHabit(e) { if (confirm("Remove this habit?")) { S.habits = S.habits.filter(h => h.id !== e.dataset.id); save(); render(); } },
  addGoal() { sheet(`<h2>New goal</h2><form data-f="goal"><div class="g2" style="grid-template-columns:80px 1fr;gap:10px"><label class="f"><span>EMOJI</span><input class="i" id="gE" value="🎯" maxlength="4"></label><label class="f"><span>GOAL</span><input class="i" id="gN" required></label></div><label class="f"><span>WHEN</span><select class="i" id="gQ">${["This year", "Q1 · Jan–Mar", "Q2 · Apr–Jun", "Q3 · Jul–Sep", "Q4 · Oct–Dec"].map(q => `<option>${q}</option>`).join("")}</select></label><label class="f"><span>STEPS (ONE PER LINE)</span><textarea class="i" id="gS" rows="4"></textarea></label><div class="row"><button class="btn">Add goal</button><button class="btn ghost" type="button" data-a="close">Cancel</button></div></form>`); },
  delGoal(e) { if (confirm("Delete this goal?")) { S.goals = S.goals.filter(g => g.id !== e.dataset.id); save(); render(); } },
  step(e) { const g = byId(S.goals, e.dataset.id), s = g.steps[+e.dataset.i]; s.ok = !s.ok; save(); if (s.ok && g.steps.every(x => x.ok)) { confetti(); toast("Goal complete! 🏆"); } render(); },
  addEv() { sheet(`<h2>New event</h2><form data-f="ev"><div class="g2" style="grid-template-columns:80px 1fr;gap:10px"><label class="f"><span>EMOJI</span><input class="i" id="eE" value="🎂" maxlength="4"></label><label class="f"><span>WHAT</span><input class="i" id="eT" required placeholder="Mum's birthday"></label></div><label class="f"><span>DATE</span><input class="i" type="date" id="eD" value="${sel.date || today()}"></label><label class="row" style="margin-bottom:14px"><input type="checkbox" id="eY"> <span class="sm">Repeats every year</span></label><div class="row"><button class="btn">Add</button><button class="btn ghost" type="button" data-a="close">Cancel</button></div></form>`); },
  delEv(e) { S.events = S.events.filter(x => x.id !== e.dataset.id); save(); render(); },
  newPage() { const p = { id: uid(), t: "", b: "" }; S.pages.unshift(p); sel.page = p.id; save(); render(); }, openPage(e) { sel.page = e.dataset.id; render(); }, delPage(e) { if (confirm("Delete this page?")) { S.pages = S.pages.filter(p => p.id !== e.dataset.id); sel.page = null; save(); render(); } },
  newList() { const n = prompt("List name:"); if (!n) return; S.lists.push({ id: uid(), e: prompt("Emoji:", "📋") || "📋", n, items: [] }); save(); render(); },
  delList(e) { if (confirm("Delete this list?")) { S.lists = S.lists.filter(l => l.id !== e.dataset.id); save(); render(); } },
  liOk(e) { const it = byId(S.lists, e.dataset.id).items[+e.dataset.i]; it.ok = !it.ok; save(); render(); }, liDel(e) { byId(S.lists, e.dataset.id).items.splice(+e.dataset.i, 1); save(); render(); },
  theme(e) { S.theme = e.dataset.v; applyTheme(); save(); render(); }, cover(e) { S.cover = e.dataset.v; save(); render(); },
  backup() { const b = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `planner-backup-${today()}.json`; a.click(); toast("Backup downloaded ⬇"); }, restore() { $("restoreFile").click(); },
  demo() { if (S.onboarded && Object.keys(S.days).length && !confirm("Replace everything with example data?")) return; const keep = { owner: S.owner, theme: S.theme, cover: S.cover, applied: S.applied }; S = demoData(); if (keep.owner || keep.applied) Object.assign(S, keep); save(); applyTheme(); view = "today"; sel = {}; render(); toast("Example data loaded ✨"); },
  erase() { if (!confirm("Erase everything on this device? There's no undo.")) return; localStorage.removeItem(KEY); S = blank(); sel = {}; view = "today"; applyTheme(); render(); },
  obTheme(e) { const n = $("obN"); if (n) S.owner = n.value.trim(); S.theme = e.dataset.v; applyTheme(); render(); },
  obDone() { S.owner = $("obN").value.trim(); S.onboarded = true; save(); render(); confetti(); toast("Your planner is ready " + S.cover); }
};
const FORMS = {
  todo() { const v = $("tdIn").value.trim(); if (!v) return; day(sel.date || today()).todo.push({ t: v, ok: false }); save(); render(); setTimeout(() => $("tdIn") && $("tdIn").focus(), 0); },
  wkAdd(f) { const i = f.querySelector("input"), v = i.value.trim(); if (!v) return; day(f.dataset.d).todo.push({ t: v, ok: false }); save(); render(); },
  goal() { const n = $("gN").value.trim(); if (!n) return; S.goals.push({ id: uid(), n, e: $("gE").value.trim() || "🎯", q: $("gQ").value, steps: $("gS").value.split("\n").map(s => s.trim()).filter(Boolean).map(t => ({ t, ok: false })) }); save(); closeSheet(); render(); },
  step(f) { const i = f.querySelector("input"), v = i.value.trim(); if (!v) return; byId(S.goals, f.dataset.id).steps.push({ t: v, ok: false }); save(); render(); },
  ev() { const t = $("eT").value.trim(); if (!t) return; S.events.push({ id: uid(), t, e: $("eE").value.trim() || "⭐", d: $("eD").value || today(), yearly: $("eY").checked }); save(); closeSheet(); render(); },
  li(f) { const i = f.querySelector("input"), v = i.value.trim(); if (!v) return; byId(S.lists, f.dataset.id).items.push({ t: v, ok: false }); save(); render(); }
};

/* ---------- events ---------- */
document.addEventListener("click", ev => { if (ev.target.id === "sheet") return closeSheet();
  const g = ev.target.closest("[data-go]"); if (g) { view = g.dataset.go; sel = {}; closeSheet(); render(); scrollTo(0, 0); return; }
  const a = ev.target.closest("[data-a]"); if (a && ACT[a.dataset.a]) { ev.preventDefault(); ACT[a.dataset.a](a, ev); } });
document.addEventListener("submit", ev => { const f = ev.target.closest("[data-f]"); if (f && FORMS[f.dataset.f]) { ev.preventDefault(); FORMS[f.dataset.f](f); } });
let tmr;
document.addEventListener("input", ev => { const el = ev.target, k = el.dataset.in; if (!k) return; const ds = sel.date || today();
  if (k === "top") day(ds).top[+el.dataset.i] = el.value; if (k === "sched") day(ds).sched[el.dataset.h] = el.value; if (k === "notes") day(ds).notes = el.value; if (k === "grat") day(ds).grat = el.value;
  if (k === "wfocus") S.weeks[el.dataset.ws].focus = el.value; if (k === "wnotes") S.weeks[el.dataset.ws].notes = el.value;
  if (k === "mgoals") S.months[el.dataset.ym].goals = el.value; if (k === "mnotes") S.months[el.dataset.ym].notes = el.value;
  if (k === "ygoals") S.years[el.dataset.y].goals = el.value; if (k === "yword") { S.years[el.dataset.y].word = el.value; const w = document.querySelector(".word"); if (w) w.textContent = el.value || "Grow"; }
  if (k === "ptitle" || k === "pbody") { const p = byId(S.pages, el.dataset.id); p[k === "ptitle" ? "t" : "b"] = el.value; }
  clearTimeout(tmr); tmr = setTimeout(save, 350); });
document.addEventListener("change", ev => { const el = ev.target; const s = el.closest("[data-set]"); if (s) { const k = s.dataset.set; S[k] = k === "start" || k === "end" ? +s.value : s.value.trim(); save(); render(); return; }
  if (el.id === "restoreFile") { const file = el.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !d.days) throw 0; S = Object.assign(blank(), d); save(); applyTheme(); render(); toast("Backup restored ✓"); } catch (e) { toast("That file isn't a planner backup"); } }; r.readAsText(file); } });
document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeSheet(); });
function applyTheme() { document.documentElement.dataset.theme = S.theme === "navy" ? "" : S.theme; const t = THEMES.find(x => x[0] === S.theme) || THEMES[0]; document.querySelector('meta[name="theme-color"]').content = t[3]; }
const SCR = { today: scrToday, week: scrWeek, month: scrMonth, year: scrYear, goals: scrGoals, habits: scrHabits, events: scrEvents, notes: scrNotes, lists: scrLists, settings: scrSettings, help: scrHelp, more: scrMore };
function render() { if (!S.onboarded) { $("snav").style.display = "none"; $("bnav").style.display = "none"; $("main").innerHTML = scrOnboard(); return; }
  $("snav").style.display = ""; $("bnav").style.display = ""; if (!SCR[view]) view = "today"; renderNav(); $("main").innerHTML = SCR[view](); }

/* ---------- example data ---------- */
function demoData() {
  const s = blank(), t = today(); let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  Object.assign(s, { owner: "Sarah", onboarded: true });
  s.habits = [["Drink water", "💧"], ["Read 10 pages", "📖"], ["Move 30 min", "🏃"], ["No phone in bed", "📵"], ["Journal", "✍️"]].map(([n, e], i) => ({ id: "h" + i, n, e, c: HC[i] }));
  const TD = ["Reply to emails", "Grocery shop", "Call the dentist", "Laundry", "Finish report", "Gym", "Pay rent", "Plan weekend", "Book haircut", "Water plants", "Meal prep", "Team meeting"];
  for (let i = -40; i <= 10; i++) { const d = addD(t, i); if (i <= 0) s.habits.forEach(h => { if (rnd() < .68) { s.hlog[d] = s.hlog[d] || {}; s.hlog[d][h.id] = 1; } });
    const n = Math.floor(rnd() * 3) + (i >= -6 && i <= 6 ? 2 : 0); if (n) s.days[d] = { top: ["", "", ""], topOk: [false, false, false], todo: Array.from({ length: n }, () => ({ t: TD[Math.floor(rnd() * TD.length)], ok: i < 0 ? rnd() < .8 : false })), sched: {}, notes: "", mood: i <= 0 && rnd() < .8 ? 3 + Math.floor(rnd() * 3) : 0, grat: "" }; }
  s.days[t] = { top: ["Finish the project proposal", "30-minute walk", "Call Mum"], topOk: [true, false, false], todo: [{ t: "Reply to Jess", ok: true }, { t: "Grocery shop", ok: false }, { t: "Book dentist", ok: false }, { t: "Laundry", ok: true }], sched: { 8: "Morning routine ☕", 9: "Deep work — proposal", 12: "Lunch with Amy", 14: "Team meeting", 17: "Gym 🏃", 19: "Cook dinner", 21: "Read 📖" }, notes: "Ideas for the weekend: farmers market, call Grandma, finish my book.", mood: 4, grat: "Sunny morning, good coffee, a kind message from Amy." };
  const y = s.year;
  s.events = [["Mum's birthday", `${y}-03-14`, "🎂", 1], ["Anniversary", `${y}-06-21`, "💕", 1], ["Holiday to Spain", `${y}-08-02`, "✈️", 0], ["Leo's birthday", `${y}-10-09`, "🎈", 1], ["Christmas", `${y}-12-25`, "🎄", 1], ["Dentist", addD(t, 3), "🦷", 0], ["Dinner with friends", addD(t, 5), "🍝", 0], ["Concert", addD(t, 12), "🎶", 0]].map(([tt, d, e, yr], i) => ({ id: "e" + i, t: tt, d, e, yearly: !!yr }));
  s.goals = [["Run a half marathon", "🏃", "This year", [["Run 5K", 1], ["Run 10K", 1], ["Run 15K", 0], ["Race day!", 0]]], ["Read 24 books", "📚", "This year", [["6 books", 1], ["12 books", 0], ["18 books", 0], ["24 books", 0]]], ["Save $5,000", "💰", "This year", [["$1,000", 1], ["$2,500", 1], ["$5,000", 0]]], ["Learn to bake bread", "🍞", "Q1 · Jan–Mar", [["Buy a starter", 1], ["First loaf", 0]]], ["Redecorate bedroom", "🛋️", "Q2 · Apr–Jun", [["Pick colours", 0], ["Paint", 0], ["New bedding", 0]]], ["Weekend in Paris", "🗼", "Q3 · Jul–Sep", [["Book train", 0], ["Book hotel", 0]]]].map(([n, e, q, st], i) => ({ id: "g" + i, n, e, q, steps: st.map(([tt, ok]) => ({ t: tt, ok: !!ok })) }));
  s.years[y] = { word: "Bloom", goals: "• Feel healthier and stronger\n• More time with family\n• Travel somewhere new\n• Build my savings", notes: "" };
  s.months[t.slice(0, 7)] = { goals: "Finish the proposal · 12 runs · read 2 books", notes: "Book Christmas train tickets early!" };
  s.weeks[weekStart(t)] = { focus: "Finish the proposal and rest on Sunday", notes: "" };
  s.lists[0].items = ["Atomic Habits", "The Midnight Library", "Lessons in Chemistry"].map((x, i) => ({ t: x, ok: i === 0 })); s.lists[2].items = ["Lisbon", "Kyoto", "Iceland"].map(x => ({ t: x, ok: false })); s.lists[3].items = ["Milk", "Eggs", "Bread", "Avocados"].map((x, i) => ({ t: x, ok: i < 1 }));
  s.pages = [{ id: "n1", t: "Holiday ideas", b: "Lisbon in May?\nPack light — one carry-on.\nBook the food tour!" }, { id: "n2", t: "Meeting notes", b: "Proposal due Friday.\nAsk Jen about the budget." }];
  return s;
}

/* ---------- boot ---------- */
(function () { try { const q = new URLSearchParams(location.search), sig = ["name", "theme", "title", "cover"].map(k => q.get(k) || "").join("|");
  if (sig.replace(/\|/g, "") && S.applied !== sig) { if (q.get("name")) S.owner = q.get("name").slice(0, 40); if (THEMES.some(t => t[0] === q.get("theme"))) S.theme = q.get("theme"); if (q.get("title")) S.title = q.get("title").slice(0, 40); if (q.get("cover")) S.cover = q.get("cover").slice(0, 4); S.applied = sig; save(); } } catch (e) { } })();
applyTheme(); render();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
