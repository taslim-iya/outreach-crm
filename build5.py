#!/usr/bin/env python3
"""Part 5: tasks + CRM + modals + router/bootstrap."""

JS3 = r"""
<script>
// ===== TASKS =====
function renderTasks(){
  const pending = state.tasks.filter(t=>!t.done);
  const done = state.tasks.filter(t=>t.done);
  const highP = pending.filter(t=>t.priority==='High').length;

  const taskRow = (t) => {
    const prioClass = t.priority==='High'?'red':t.priority==='Medium'?'gold':'blue';
    return `
    <div class="task-row ${t.done?'done':''}">
      <div class="checkbox ${t.done?'checked':''}" onclick="toggleTask(${t.id})"></div>
      <div class="task-info">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          <span>${fmtDate(t.due)}</span>
          <span>·</span>
          <span>${esc(t.owner)}</span>
          <span>·</span>
          <span>${esc(t.project)}</span>
        </div>
      </div>
      <span class="tag ${prioClass}">${t.priority}</span>
    </div>`;
  };

  $('#section-tasks').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi"><div class="kpi-label">Open</div><div class="kpi-value">${pending.length}</div><div class="kpi-meta">${highP} high priority</div></div>
      <div class="kpi"><div class="kpi-label">Completed</div><div class="kpi-value">${done.length}</div><div class="kpi-meta">this cycle</div></div>
      <div class="kpi"><div class="kpi-label">Due this week</div><div class="kpi-value">${pending.filter(t=>{const d=new Date(t.due);const n=new Date();return (d-n)/(1000*60*60*24)<=7;}).length}</div><div class="kpi-meta">next 7 days</div></div>
      <div class="kpi"><div class="kpi-label">Owners</div><div class="kpi-value">${new Set(state.tasks.map(t=>t.owner)).size}</div><div class="kpi-meta">active contributors</div></div>
    </div>

    <div class="card">
      <div class="section-head">
        <div><div class="card-title">Open tasks</div><div class="card-sub">Everything your team is working on</div></div>
        <div class="tabs"><div class="tab active">All</div><div class="tab">Mine</div><div class="tab">High</div></div>
      </div>
      ${pending.map(taskRow).join('') || '<div class="empty">Nothing pending. Nice work.</div>'}
    </div>

    <div class="card" style="margin-top:24px">
      <div class="card-title">Completed</div>
      <div class="card-sub">Closed out recently</div>
      ${done.map(taskRow).join('') || '<div class="empty">Nothing completed yet.</div>'}
    </div>
  `;
}

function toggleTask(id){
  const t = state.tasks.find(x=>x.id===id);
  if(!t) return;
  t.done = !t.done;
  renderTasks();
  toast(t.done?'Task completed':'Task reopened', esc(t.title));
}

// ===== CRM =====
function renderCrm(){
  const rows = state.members.map(m=>{
    const tierClass = m.tier==='Platinum'?'':m.tier==='Gold'?'gold':'blue';
    const statusClass = m.status==='Active'?'green':'gold';
    return `
    <tr>
      <td>
        <div class="contact-cell">
          <div class="avatar">${initials(m.name)}</div>
          <div class="info">
            <div class="name">${esc(m.name)}</div>
            <div class="email">${esc(m.email)}</div>
          </div>
        </div>
      </td>
      <td>${esc(m.role)}</td>
      <td>${esc(m.chapter)}</td>
      <td><span class="tag ${tierClass}">${m.tier}</span></td>
      <td><span class="tag ${statusClass}">${m.status}</span></td>
      <td style="color:var(--text-muted)">${fmtDate(m.joined)}</td>
    </tr>`;
  }).join('');

  const counts = {
    Investor: state.members.filter(m=>m.role==='Investor').length,
    Founder: state.members.filter(m=>m.role==='Founder').length,
    Searcher: state.members.filter(m=>m.role==='Searcher').length,
    Mentor: state.members.filter(m=>m.role==='Mentor').length,
  };

  $('#section-crm').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi"><div class="kpi-label">Investors</div><div class="kpi-value">${counts.Investor}</div><div class="kpi-meta">LPs &amp; sponsors</div></div>
      <div class="kpi"><div class="kpi-label">Founders</div><div class="kpi-value">${counts.Founder}</div><div class="kpi-meta">operator cohort</div></div>
      <div class="kpi"><div class="kpi-label">Searchers</div><div class="kpi-value">${counts.Searcher}</div><div class="kpi-meta">active programmes</div></div>
      <div class="kpi"><div class="kpi-label">Mentors</div><div class="kpi-value">${counts.Mentor}</div><div class="kpi-meta">senior advisors</div></div>
    </div>

    <div class="card">
      <div class="section-head">
        <div><div class="card-title">Members directory</div><div class="card-sub">${state.members.length} members across the Cambridge ETA community</div></div>
        <div class="tabs"><div class="tab active">All</div><div class="tab">Active</div><div class="tab">Pending</div></div>
      </div>
      <div style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Member</th><th>Role</th><th>College</th><th>Tier</th><th>Status</th><th>Joined</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ===== MODALS (Add flows) =====
function openNewEventModal(){
  openModal(`
    <h3>Create new event</h3>
    <div class="modal-sub">Add an event to the Cambridge ETA calendar.</div>
    <div class="field"><label>Title</label><input class="input" id="f_title" placeholder="e.g. Spring Investor Drinks"/></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Date</label><input class="input" id="f_date" type="date" value="2026-05-01"/></div>
      <div class="field"><label>Time</label><input class="input" id="f_time" type="time" value="18:30"/></div>
    </div>
    <div class="field"><label>Venue</label><input class="input" id="f_venue" placeholder="e.g. Jesus College, Upper Hall"/></div>
    <div class="field"><label>Description</label><textarea class="input" id="f_desc" rows="3"></textarea></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Capacity</label><input class="input" id="f_cap" type="number" value="60"/></div>
      <div class="field"><label>Status</label><select class="input" id="f_stat"><option>Open</option><option>Nearly Full</option><option>Draft</option></select></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEvent()">Create event</button>
    </div>
  `);
}
function saveEvent(){
  const title = $('#f_title').value.trim();
  if(!title){ toast('Missing title','Please give the event a name'); return; }
  state.events.push({
    id: Date.now(),
    title,
    date: $('#f_date').value,
    time: $('#f_time').value,
    venue: $('#f_venue').value || 'TBC',
    desc: $('#f_desc').value || '',
    attendees: 0,
    capacity: parseInt($('#f_cap').value,10) || 50,
    status: $('#f_stat').value,
  });
  closeModal();
  renderEvents(); renderDashboard();
  toast('Event created', esc(title));
}

function openNewTaskModal(){
  openModal(`
    <h3>New task</h3>
    <div class="modal-sub">Track something the club needs to get done.</div>
    <div class="field"><label>Task</label><input class="input" id="t_title"/></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Due</label><input class="input" id="t_due" type="date" value="2026-04-30"/></div>
      <div class="field"><label>Priority</label><select class="input" id="t_prio"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
    </div>
    <div class="field"><label>Owner</label><input class="input" id="t_owner" value="Taslim Iya"/></div>
    <div class="field"><label>Project</label><input class="input" id="t_proj" value="General"/></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTask()">Add task</button>
    </div>
  `);
}
function saveTask(){
  const title = $('#t_title').value.trim();
  if(!title){ toast('Missing title','Please describe the task'); return; }
  state.tasks.push({
    id: Date.now(), title,
    due: $('#t_due').value,
    priority: $('#t_prio').value,
    owner: $('#t_owner').value,
    project: $('#t_proj').value,
    done:false,
  });
  closeModal(); renderTasks(); renderDashboard();
  toast('Task added', esc(title));
}

function openNewMemberModal(){
  openModal(`
    <h3>Add member</h3>
    <div class="modal-sub">Invite a new member to the Cambridge ETA club.</div>
    <div class="field"><label>Full name</label><input class="input" id="m_name"/></div>
    <div class="field"><label>Email</label><input class="input" id="m_email" type="email"/></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Role</label><select class="input" id="m_role"><option>Investor</option><option>Founder</option><option>Searcher</option><option>Mentor</option><option>Advisor</option></select></div>
      <div class="field"><label>College</label><input class="input" id="m_college" placeholder="e.g. Jesus College"/></div>
    </div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Tier</label><select class="input" id="m_tier"><option>Platinum</option><option selected>Gold</option><option>Silver</option></select></div>
      <div class="field"><label>Status</label><select class="input" id="m_stat"><option>Active</option><option>Pending</option></select></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveMember()">Add member</button>
    </div>
  `);
}
function saveMember(){
  const name = $('#m_name').value.trim();
  if(!name){ toast('Missing name','Enter the member\'s full name'); return; }
  state.members.push({
    id: Date.now(), name,
    email: $('#m_email').value || (name.toLowerCase().replace(/\s+/g,'.')+'@cambridge-eta.co.uk'),
    role: $('#m_role').value,
    chapter: $('#m_college').value || 'Unassigned',
    tier: $('#m_tier').value,
    status: $('#m_stat').value,
    joined: new Date().toISOString().slice(0,10),
  });
  closeModal(); renderCrm(); renderDashboard();
  toast('Member added', esc(name));
}

// ===== ROUTER =====
const SECTION_CONFIG = {
  dashboard: {title:'Dashboard', subtitle:'Your club at a glance', btn:'New Event', action: openNewEventModal},
  events:    {title:'Events',    subtitle:'Calendar, planning & capacity', btn:'New Event', action: openNewEventModal},
  tasks:     {title:'Tasks',     subtitle:'What the team is working on', btn:'New Task', action: openNewTaskModal},
  crm:       {title:'Members CRM', subtitle:'Directory of the Cambridge ETA community', btn:'Add Member', action: openNewMemberModal},
};

function switchSection(name){
  state.section = name;
  $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.nav===name));
  $$('.section').forEach(s=>s.classList.toggle('active', s.id===`section-${name}`));
  const cfg = SECTION_CONFIG[name];
  $('#pageTitle').textContent = cfg.title;
  $('#pageSubtitle').textContent = cfg.subtitle;
  $('#primaryBtnLabel').textContent = cfg.btn;
  $('#primaryBtn').onclick = cfg.action;
  // re-render for freshness
  if(name==='dashboard') renderDashboard();
  if(name==='events') renderEvents();
  if(name==='tasks') renderTasks();
  if(name==='crm') renderCrm();
}

$$('.nav-item').forEach(n=>n.addEventListener('click',()=>switchSection(n.dataset.nav)));

// ===== BOOT =====
renderDashboard();
renderEvents();
renderTasks();
renderCrm();
switchSection('dashboard');
</script>
</body>
</html>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(JS3)
    print("Part 5 written: tasks + crm + modals + router")
