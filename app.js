/* FlowCast Period Tracker
   - Local-only storage (privacy)
   - Predict next period and fertile window
   - Simple 2-month calendar visualization
   - Symptom tagging + history
*/
(function () {
  const $ = (sel) => document.querySelector(sel);
  const state = {
    entries: load('entries') ?? [], // {date: 'YYYY-MM-DD', cycleLen, periodLen, notes}
    symptoms: load('symptoms') ?? [] // {date, tag}
  };

  // ---------- Helpers ----------
  function load(key) { try { return JSON.parse(localStorage.getItem('flowcast_'+key)); } catch { return null; } }
  function save(key, val) { localStorage.setItem('flowcast_'+key, JSON.stringify(val)); }
  function fmt(d) { return new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); }
  function toDate(str) { const [y,m,dd]=str.split('-').map(Number); return new Date(y, m-1, dd); }
  function addDays(date, days) { const d=new Date(date); d.setDate(d.getDate()+days); return d; }
  function range(start, end) { const a=[]; let d=new Date(start); while (d<=end) { a.push(new Date(d)); d.setDate(d.getDate()+1);} return a; }

  function latestEntry() {
    if (!state.entries.length) return null;
    return state.entries.map(e => ({...e, _d: toDate(e.date)})).sort((a,b)=>b._d-a._d)[0];
  }

  // ---------- Predictions ----------
  function predict(entry) {
    const cycle = Number(entry.cycleLen || 28);
    const periodLen = Number(entry.periodLen || 5);
    const lastStart = toDate(entry.date);

    const nextStart = addDays(lastStart, cycle);
    const nextEnd = addDays(nextStart, periodLen-1);

    const luteal = 14; // simple assumption
    const ovulation = addDays(lastStart, cycle - luteal);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);

    return { nextStart, nextEnd, ovulation, fertileStart, fertileEnd, periodLen, cycle };
  }

  function renderSummary(p) {
    if (!p) {
      $('#predSummary').innerHTML = '<p class="text-slate-500">Add at least one entry to see predictions.</p>';
      return;
    }
    $('#predSummary').innerHTML = `
      <ul class="space-y-1">
        <li><strong>Next period:</strong> ${fmt(p.nextStart)} → ${fmt(p.nextEnd)} (~${p.periodLen} days)</li>
        <li><strong>Fertile window:</strong> ${fmt(p.fertileStart)} → ${fmt(p.fertileEnd)} (ovulation ~ ${fmt(p.ovulation)})</li>
        <li><strong>Avg cycle:</strong> ${p.cycle} days</li>
      </ul>
      <p class="mt-2 text-xs text-slate-500">Predictions are estimates and can vary. Consult a healthcare professional for medical advice.</p>
    `;
  }

  // ---------- Calendars ----------
  function calendarFor(year, month, highlightRanges) {
    // month: 0-11
    const first = new Date(year, month, 1);
    const last = new Date(year, month+1, 0);
    const startWeekday = (first.getDay()+6)%7; // make Monday=0
    const days = last.getDate();
    const cells = [];
    for (let i=0; i<startWeekday; i++) cells.push(null);
    for (let d=1; d<=days; d++) cells.push(new Date(year, month, d));

    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let html = `<div class="grid grid-cols-7 gap-1">`;
    for (const w of weekdays) html += `<div class="text-center font-medium">${w}</div>`;

    const inAny = (date, [s,e]) => date && (date >= stripTime(s) && date <= stripTime(e));
    function stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

    for (const c of cells) {
      if (!c) { html += `<div class="h-8"></div>`; continue; }
      let cls = "h-8 rounded grid place-items-center border text-[11px]";
      let badge = "";
      if (highlightRanges?.period && inAny(c, highlightRanges.period)) {
        cls += " bg-brand-100 border-brand-200";
        badge = "";
      }
      if (highlightRanges?.fertile && inAny(c, highlightRanges.fertile)) {
        cls += " ring-1 ring-emerald-400";
      }
      const today = stripTime(new Date());
      if (stripTime(c).getTime() === today.getTime()) cls += " font-semibold";
      html += `<div class="${cls}">${c.getDate()}</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderCalendars(p) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const rangesThis = {
      period: p ? [p.nextStart, p.nextEnd] : null,
      fertile: p ? [p.fertileStart, p.fertileEnd] : null,
    };
    const nextMonth = (m+1) % 12;
    const nextYear = m===11 ? y+1 : y;
    $('#calThis').innerHTML = calendarFor(y, m, rangesThis);
    $('#calNext').innerHTML = calendarFor(nextYear, nextMonth, rangesThis);
  }

  // ---------- History & Symptoms ----------
  function renderHistory() {
    const list = $('#history');
    if (!state.entries.length) { list.innerHTML = '<li class="text-slate-500">No entries yet.</li>'; return; }
    const items = state.entries
      .slice()
      .sort((a,b)=> toDate(b.date) - toDate(a.date))
      .map(e => `<li class="rounded-xl border p-3 flex items-center justify-between">
        <div>
          <div class="font-medium">${fmt(e.date)}</div>
          <div class="text-xs text-slate-600">cycle ${e.cycleLen} days • period ${e.periodLen} days</div>
          ${e.notes ? `<div class="text-xs mt-1">${e.notes}</div>` : ""}
        </div>
        <button class="text-xs text-brand-700 hover:underline" data-del="${e.date}">Delete</button>
      </li>`)
      .join("");
    list.innerHTML = items;
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.getAttribute('data-del');
        const idx = state.entries.findIndex(e => e.date === d);
        if (idx>-1) { state.entries.splice(idx,1); save('entries', state.entries); refresh(); }
      });
    });
  }

  function renderSymptoms() {
    const list = $('#symList');
    if (!state.symptoms.length) { list.innerHTML = '<li class="text-slate-500">No symptoms logged.</li>'; return; }
    const items = state.symptoms
      .slice()
      .sort((a,b)=> toDate(b.date) - toDate(a.date))
      .map(s => `<li class="rounded-xl border p-2 flex items-center justify-between">
        <div><span class="font-medium">${s.tag}</span> • <span class="text-slate-600">${fmt(s.date)}</span></div>
        <button class="text-xs text-brand-700 hover:underline" data-del-sym="${s.id}">Delete</button>
      </li>`).join("");
    list.innerHTML = items;
    list.querySelectorAll('[data-del-sym]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-sym');
        const idx = state.symptoms.findIndex(s => s.id === id);
        if (idx>-1) { state.symptoms.splice(idx,1); save('symptoms', state.symptoms); renderSymptoms(); }
      });
    });
  }

  // ---------- Events ----------
  $('#logForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = $('#startDate').value;
    const cycleLen = Number($('#cycleLen').value);
    const periodLen = Number($('#periodLen').value);
    const notes = $('#notes').value.trim();
    if (!date) return;
    const existing = state.entries.findIndex(en => en.date === date);
    const entry = { date, cycleLen, periodLen, notes };
    if (existing>-1) state.entries[existing] = entry; else state.entries.push(entry);
    save('entries', state.entries);
    e.target.reset();
    refresh();
  });

  document.querySelectorAll('.sym-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = $('#symDate').value || new Date().toISOString().slice(0,10);
      const tag = btn.dataset.tag;
      state.symptoms.push({ id: crypto.randomUUID(), date: d, tag });
      save('symptoms', state.symptoms);
      renderSymptoms();
    });
  });
  $('#symForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = $('#symDate').value || new Date().toISOString().slice(0,10);
    const tag = $('#symText').value.trim();
    if (!tag) return;
    state.symptoms.push({ id: crypto.randomUUID(), date: d, tag });
    save('symptoms', state.symptoms);
    e.target.reset();
    renderSymptoms();
  });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ entries: state.entries, symptoms: state.symptoms }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowcast-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  $('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    try {
      const obj = JSON.parse(txt);
      if (obj.entries && Array.isArray(obj.entries)) { state.entries = obj.entries; save('entries', state.entries); }
      if (obj.symptoms && Array.isArray(obj.symptoms)) { state.symptoms = obj.symptoms; save('symptoms', state.symptoms); }
      refresh();
    } catch {
      alert('Invalid JSON file.');
    }
    e.target.value = "";
  });

  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Clear all local data?')) {
      localStorage.removeItem('flowcast_entries');
      localStorage.removeItem('flowcast_symptoms');
      state.entries = [];
      state.symptoms = [];
      refresh();
    }
  });

  // ---------- Initial render ----------
  function refresh() {
    renderHistory();
    renderSymptoms();
    const last = latestEntry();
    const pred = last ? predict(last) : null;
    renderSummary(pred);
    renderCalendars(pred);
  }
  refresh();
})();
