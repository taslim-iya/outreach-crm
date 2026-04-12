#!/usr/bin/env python3
"""Part 3: appends JS state, data, and render functions to index.html."""

JS1 = r"""
<script>
// ===== STATE =====
// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://ygreplqxqazgxkudonso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncmVwbHF4cWF6Z3hrdWRvbnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDY0MTIsImV4cCI6MjA4NTI4MjQxMn0.zBJK7nL0E0RXADUFaVr6vMxpyQgMO0eauxUuFfPkCAk';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'eta-auth' }
});

const state = {
  section: 'dashboard',
  theme: localStorage.getItem('eta-theme') || 'dark',
  session: null,
  profile: null,   // current user's eta_users row
  users:   [],     // all eta_users
  events:  [],
  tasks:   [],
  members: [],
  notes:   [],
  loading: true,
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
