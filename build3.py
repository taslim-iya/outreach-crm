#!/usr/bin/env python3
"""Part 3: appends JS state, data, and render functions to index.html."""

JS1 = r"""
<script>
// ===== STATE =====
const state = {
  section: 'dashboard',
  members: [
    {id:1, name:'Alex Thornton', email:'alex.t@cambridge-eta.co.uk', role:'Investor', chapter:'Jesus College', tier:'Platinum', status:'Active', joined:'2023-10-12'},
    {id:2, name:'Priya Raghavan', email:'priya.r@cambridge-eta.co.uk', role:'Founder', chapter:'Trinity', tier:'Gold', status:'Active', joined:'2024-01-08'},
    {id:3, name:'Marcus Weatherby', email:'m.weatherby@cambridge-eta.co.uk', role:'Mentor', chapter:'Kings', tier:'Platinum', status:'Active', joined:'2022-09-21'},
    {id:4, name:'Sofia Chen', email:'sofia.c@cambridge-eta.co.uk', role:'Searcher', chapter:'Clare', tier:'Silver', status:'Pending', joined:'2024-11-03'},
    {id:5, name:'Daniel Osei', email:'d.osei@cambridge-eta.co.uk', role:'Advisor', chapter:'St Johns', tier:'Gold', status:'Active', joined:'2023-03-14'},
    {id:6, name:'Emma Lindqvist', email:'e.lindqvist@cambridge-eta.co.uk', role:'Founder', chapter:'Pembroke', tier:'Silver', status:'Active', joined:'2024-06-19'},
    {id:7, name:'Rohan Mehta', email:'r.mehta@cambridge-eta.co.uk', role:'Investor', chapter:'Jesus College', tier:'Platinum', status:'Active', joined:'2021-11-01'},
    {id:8, name:'Yuki Tanaka', email:'y.tanaka@cambridge-eta.co.uk', role:'Searcher', chapter:'Queens', tier:'Gold', status:'Active', joined:'2024-02-27'},
  ],
  events: [
    {id:1, title:'Annual Search Fund Summit', date:'2026-05-14', time:'18:30', venue:'Jesus College, Upper Hall', desc:'Flagship evening convening ETA searchers, investors and founders for keynotes and structured networking.', attendees:142, capacity:180, status:'Open'},
    {id:2, title:'Deal Workshop: CIM Deep Dive', date:'2026-04-22', time:'14:00', venue:'Judge Business School, Room W2.03', desc:'Hands-on workshop analysing real CIMs with senior operators. Limited to 24 participants.', attendees:22, capacity:24, status:'Nearly Full'},
    {id:3, title:'Founders Fireside: Lessons from Exit', date:'2026-04-30', time:'19:00', venue:'Trinity College, Old Combination Room', desc:'Intimate fireside with three ETA operators who recently exited. Invite-only for active searchers.', attendees:18, capacity:30, status:'Open'},
    {id:4, title:'Investor Roundtable Q2', date:'2026-05-07', time:'12:30', venue:'Kings Parade, Private Dining', desc:'Quarterly roundtable with LPs, family offices and sponsor funds active in the ETA ecosystem.', attendees:31, capacity:40, status:'Open'},
    {id:5, title:'Cambridge ETA Black Tie Dinner', date:'2026-06-20', time:'19:30', venue:'The Pitt Building', desc:'Our signature annual black-tie gala celebrating the cohort, with a keynote from a world-class CEO.', attendees:86, capacity:200, status:'Open'},
    {id:6, title:'New Member Induction', date:'2026-04-18', time:'17:00', venue:'Clare College, Riley Auditorium', desc:'Onboarding session for the spring cohort of new members. Platform walkthrough and mentor matching.', attendees:24, capacity:50, status:'Open'},
  ],
  tasks: [
    {id:1, title:'Finalise speaker lineup for Annual Summit', due:'2026-04-15', priority:'High', owner:'Taslim Iya', done:false, project:'Annual Search Fund Summit'},
    {id:2, title:'Send welcome packs to spring cohort', due:'2026-04-14', priority:'High', owner:'Priya Raghavan', done:false, project:'New Member Induction'},
    {id:3, title:'Reconcile Q1 membership dues', due:'2026-04-20', priority:'Medium', owner:'Marcus Weatherby', done:false, project:'Finance'},
    {id:4, title:'Draft investor update newsletter', due:'2026-04-17', priority:'Medium', owner:'Taslim Iya', done:false, project:'Comms'},
    {id:5, title:'Book private dining for roundtable', due:'2026-04-10', priority:'High', owner:'Sofia Chen', done:true, project:'Investor Roundtable Q2'},
    {id:6, title:'Update platform brand assets', due:'2026-04-25', priority:'Low', owner:'Daniel Osei', done:false, project:'Platform'},
    {id:7, title:'Confirm AV for Fireside chat', due:'2026-04-28', priority:'Medium', owner:'Rohan Mehta', done:false, project:'Founders Fireside'},
    {id:8, title:'Renew Judge Business School booking', due:'2026-04-12', priority:'High', owner:'Taslim Iya', done:true, project:'Deal Workshop'},
  ],
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
