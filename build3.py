#!/usr/bin/env python3
"""Part 3: appends JS state, data, and render functions to index.html."""

JS1 = r"""
<script>
// ===== STATE =====
// ===== LOCAL STORAGE "SUPABASE" SHIM =====
// This app runs entirely in the browser. There is no backend, no auth.
// We expose a small query builder that matches the subset of the
// Supabase JS API used by the rest of the code so every existing
// save/update/delete site keeps working without changes.

const LOCAL_DATA_KEY = 'eta-local-data-v1';
const LOCAL_OWNER_ID = 'local-owner';

function _loadLocal(){
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if(raw) return JSON.parse(raw);
  } catch(e){}
  // First run: seed with a single Owner so profile-dependent features work.
  const seed = {
    eta_users: [{
      id: LOCAL_OWNER_ID,
      email: 'owner@local',
      name: 'Owner',
      role: 'Owner',
      permissions: ['*'],
      created_at: new Date().toISOString(),
    }],
    eta_events:  [],
    eta_tasks:   [],
    eta_members: [],
    eta_notes:   [],
  };
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(seed));
  return seed;
}
function _saveLocal(data){
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
}
function _genId(){
  return 'loc_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

class LocalQuery {
  constructor(table){
    this.table = table;
    this.op = null;
    this.payload = null;
    this.patch = null;
    this.filters = [];
    this.orderBy = null;
    this.limitN = null;
    this.single_ = false;
  }
  select(){ if(!this.op) this.op = 'select'; return this; }
  insert(payload){ this.op = 'insert'; this.payload = payload; return this; }
  update(patch){ this.op = 'update'; this.patch = patch; return this; }
  delete(){ this.op = 'delete'; return this; }
  eq(col, val){ this.filters.push({col, val}); return this; }
  order(col, opts){ this.orderBy = {col, opts: opts || {}}; return this; }
  limit(n){ this.limitN = n; return this; }
  single(){ this.single_ = true; return this; }
  then(onResolve, onReject){
    return Promise.resolve().then(() => this._run()).then(onResolve, onReject);
  }
  _matches(row){
    return this.filters.every(f => row[f.col] === f.val);
  }
  _run(){
    const data = _loadLocal();
    const rows = data[this.table] || [];
    try {
      if(this.op === 'select' || this.op === null){
        let result = rows.filter(r => this._matches(r));
        if(this.orderBy){
          const {col, opts} = this.orderBy;
          const asc = opts.ascending !== false;
          result = result.slice().sort((a,b) => {
            const av = a[col], bv = b[col];
            if(av == null && bv == null) return 0;
            if(av == null) return 1;
            if(bv == null) return -1;
            if(av === bv) return 0;
            return asc ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1);
          });
        }
        if(this.limitN != null) result = result.slice(0, this.limitN);
        if(this.single_) return { data: result[0] || null, error: null };
        return { data: result, error: null };
      }
      if(this.op === 'insert'){
        const list = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted = list.map(p => ({
          id: p.id || _genId(),
          created_at: new Date().toISOString(),
          ...p,
        }));
        data[this.table] = [...rows, ...inserted];
        _saveLocal(data);
        if(this.single_) return { data: inserted[0], error: null };
        return { data: inserted, error: null };
      }
      if(this.op === 'update'){
        const updated = [];
        const newRows = rows.map(r => {
          if(this._matches(r)){
            const u = { ...r, ...this.patch };
            updated.push(u);
            return u;
          }
          return r;
        });
        data[this.table] = newRows;
        _saveLocal(data);
        if(this.single_) return { data: updated[0] || null, error: null };
        return { data: updated, error: null };
      }
      if(this.op === 'delete'){
        data[this.table] = rows.filter(r => !this._matches(r));
        _saveLocal(data);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    } catch(e){
      return { data: null, error: { message: e.message || String(e) } };
    }
  }
}

const sb = {
  from(table){ return new LocalQuery(table); }
};

const state = {
  section: 'dashboard',
  theme: localStorage.getItem('eta-theme') || 'dark',
  profile: null,   // the hardcoded local Owner
  users:   [],
  events:  [],
  tasks:   [],
  members: [],
  notes:   [],
};

// ===== HELPERS =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtDate = (s) => {
  const d = new Date(s);
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
};
const shortDate = (s) => {
  const d = new Date(s);
  return {day:d.getDate(), month:d.toLocaleDateString('en-GB',{month:'short'}).toUpperCase(), weekday:d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase()};
};
const initials = (n) => n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const esc = (s) => String(s).replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// ===== USERS / PERMISSIONS =====
function currentUser(){ return state.profile; }
function currentUserId(){ return state.profile ? state.profile.id : null; }
function isOwner(){ return state.profile && state.profile.role === 'Owner'; }
function userById(id){ return state.users.find(u => u.id === id); }
function userName(id){ const u = userById(id); return u ? u.name : 'Unassigned'; }
function canAccess(section){
  const u = state.profile;
  if(!u) return false;
  if(Array.isArray(u.permissions) && (u.permissions.includes('*') || u.permissions.includes(section))) return true;
  return false;
}
function visibleTasks(){
  // RLS already restricts what we can fetch; this is just a belt-and-braces filter.
  if(isOwner()) return state.tasks;
  return state.tasks.filter(t => t.assigneeId === currentUserId());
}
function notesForMe(){
  const me = currentUserId();
  return state.notes.filter(n => n.visibility === 'direct' && n.targetUserId === me);
}
function notesMyOwn(){
  return state.notes.filter(n => n.authorId === currentUserId());
}
function notesTeamPublic(){
  return state.notes.filter(n => n.visibility === 'public');
}

// ===== DB -> JS SHAPE =====
function mapUser(u){ return u; } // shapes already match
function mapEvent(e){
  return { ...e, date: e.event_date, time: e.event_time || '', desc: e.description || '' };
}
function mapTask(t){
  return { ...t, due: t.due_date, assigneeId: t.assignee_id };
}
function mapMember(m){ return m; } // shapes already match
function mapNote(n){
  return { ...n, authorId: n.author_id, targetUserId: n.target_user_id, createdAt: n.created_at };
}

function toast(title, msg){
  $('#toastTitle').textContent = title;
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(window._tt); window._tt = setTimeout(()=>t.classList.remove('show'), 2600);
}

function openModal(html){ $('#modalBody').innerHTML = html; $('#modalBack').classList.add('open'); }
function closeModal(){ $('#modalBack').classList.remove('open'); }
$('#modalBack').addEventListener('click', e=>{ if(e.target.id==='modalBack') closeModal(); });

// ===== ICONS =====
const ICONS = {
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a98bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a98bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a98bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  trend: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a98bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
};
</script>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(JS1)
    print("Part 3 written: state + data + helpers")
