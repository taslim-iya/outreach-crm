#!/usr/bin/env python3
"""Part 5: tasks + CRM + modals + router/bootstrap."""

JS3 = r"""
<script>
// ===== TASKS =====
function renderTasks(){
  const owner = isOwner();
  const scope = visibleTasks();
  const pending = scope.filter(t=>!t.done);
  const done = scope.filter(t=>t.done);
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
          <span>${esc(userName(t.assigneeId))}</span>
          <span>·</span>
          <span>${esc(t.project)}</span>
        </div>
      </div>
      <span class="tag ${prioClass}">${t.priority}</span>
    </div>`;
  };

  const ownersCount = new Set(scope.map(t=>t.assigneeId)).size;
  const cardSub = owner ? 'Everything your team is working on' : 'Tasks assigned to you';

  $('#section-tasks').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi"><div class="kpi-label">${owner?'Open':'My open'}</div><div class="kpi-value">${pending.length}</div><div class="kpi-meta">${highP} high priority</div></div>
      <div class="kpi"><div class="kpi-label">Completed</div><div class="kpi-value">${done.length}</div><div class="kpi-meta">this cycle</div></div>
      <div class="kpi"><div class="kpi-label">Due this week</div><div class="kpi-value">${pending.filter(t=>{const d=new Date(t.due);const n=new Date();return (d-n)/(1000*60*60*24)<=7;}).length}</div><div class="kpi-meta">next 7 days</div></div>
      <div class="kpi"><div class="kpi-label">${owner?'Assignees':'Project'}</div><div class="kpi-value">${owner?ownersCount:new Set(scope.map(t=>t.project)).size}</div><div class="kpi-meta">${owner?'active contributors':'workstreams'}</div></div>
    </div>

    <div class="card">
      <div class="section-head">
        <div><div class="card-title">${owner?'Open tasks':'My open tasks'}</div><div class="card-sub">${cardSub}</div></div>
        <div class="tabs"><div class="tab active">All</div><div class="tab">High</div></div>
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

// ===== NOTES =====
let notesTab = 'forme';
function renderNotes(){
  const owner = isOwner();
  const forMe = notesForMe();
  const mine = notesMyOwn();
  const team = notesTeamPublic();
  const pinnedForMe = forMe.filter(n=>n.pinned).length;

  const noteCard = (n) => {
    const a = userById(n.authorId);
    const target = n.targetUserId ? userById(n.targetUserId) : null;
    const visLabel = n.visibility==='direct' ? (target ? `to ${target.name}` : 'direct')
                    : n.visibility==='public' ? 'team public'
                    : 'private';
    const visClass = n.visibility;
    return `
    <div class="note-card ${visClass}${n.pinned?' pinned':''}">
      <div class="note-head">
        <div class="avatar">${initials(a.name)}</div>
        <div>
          <div class="note-author">${esc(a.name)}</div>
          <div style="font-size:10.5px;color:var(--text-muted)">${esc(a.role)}</div>
        </div>
        <div class="note-meta">${fmtDate(n.createdAt)}</div>
      </div>
      <div class="note-title">${esc(n.title)}</div>
      <div class="note-body">${esc(n.content)}</div>
      <div class="note-foot">
        <span class="tag ${n.visibility==='public'?'green':n.visibility==='private'?'gold':''}">${visLabel}</span>
        ${n.authorId===state.currentUserId ? `<button class="btn btn-ghost" style="margin-left:auto;padding:6px 12px;font-size:11px" onclick="deleteNote('${n.id}')">Delete</button>` : ''}
      </div>
    </div>`;
  };

  const lists = {
    forme: forMe,
    mine: mine,
    team: team,
  };
  const active = lists[notesTab];
  const emptyMsg = {
    forme: 'No direct notes yet. When leadership shares guidance with you, it appears here.',
    mine: 'You have not written any notes yet. Create one with the button above.',
    team: 'No public team notes yet.',
  }[notesTab];

  $('#section-notes').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi"><div class="kpi-label">For me</div><div class="kpi-value">${forMe.length}</div><div class="kpi-meta">${pinnedForMe} pinned</div></div>
      <div class="kpi"><div class="kpi-label">My notes</div><div class="kpi-value">${mine.length}</div><div class="kpi-meta">${mine.filter(n=>n.visibility==='private').length} private</div></div>
      <div class="kpi"><div class="kpi-label">Team public</div><div class="kpi-value">${team.length}</div><div class="kpi-meta">visible to everyone</div></div>
      <div class="kpi"><div class="kpi-label">Authors</div><div class="kpi-value">${new Set(state.notes.map(n=>n.authorId)).size}</div><div class="kpi-meta">people sharing</div></div>
    </div>

    <div class="section-head">
      <div>
        <h2>Notes</h2>
        <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px">Private, public and direct notes across the team</div>
      </div>
      <div class="tabs">
        <div class="tab ${notesTab==='forme'?'active':''}" onclick="switchNotesTab('forme')">For me <span style="opacity:0.6">(${forMe.length})</span></div>
        <div class="tab ${notesTab==='mine'?'active':''}" onclick="switchNotesTab('mine')">My notes <span style="opacity:0.6">(${mine.length})</span></div>
        <div class="tab ${notesTab==='team'?'active':''}" onclick="switchNotesTab('team')">Team <span style="opacity:0.6">(${team.length})</span></div>
      </div>
    </div>

    <div class="grid grid-2">
      ${active.length ? active.map(noteCard).join('') : `<div class="card" style="grid-column:1/-1"><div class="empty">${emptyMsg}</div></div>`}
    </div>
  `;

  // badge
  const badge = $('#notesBadge');
  if(forMe.length){ badge.style.display='inline-block'; badge.textContent=forMe.length; }
  else { badge.style.display='none'; }
}
function switchNotesTab(t){ notesTab = t; renderNotes(); }
function deleteNote(id){
  state.notes = state.notes.filter(n=>n.id!==id);
  renderNotes();
  toast('Note deleted','Removed from your notes');
}

// ===== TEAM =====
function renderTeam(){
  if(!isOwner()){
    $('#section-team').innerHTML = `<div class="card"><div class="empty">Only the Owner can manage the team. Switch user from the topbar to see this view.</div></div>`;
    return;
  }
  const PERM_OPTIONS = ['dashboard','events','tasks','crm','notes'];
  const rows = state.users.map(u=>{
    const theirs = state.tasks.filter(t=>t.assigneeId===u.id);
    const doneCount = theirs.filter(t=>t.done).length;
    const overdue = theirs.filter(t=>!t.done && new Date(t.due) < new Date()).length;
    const pct = theirs.length ? Math.round(doneCount/theirs.length*100) : 0;
    const isO = u.role==='Owner';
    const perms = isO ? '<span class="tag">Full access</span>' :
      PERM_OPTIONS.map(p=>{
        const has = u.permissions.includes(p);
        return `<span class="tag ${has?'green':'red'}" style="cursor:pointer" onclick="togglePerm('${u.id}','${p}')">${has?'':'—'} ${p}</span>`;
      }).join(' ');
    return `
    <tr>
      <td>
        <div class="contact-cell">
          <div class="avatar">${initials(u.name)}</div>
          <div class="info">
            <div class="name">${esc(u.name)}</div>
            <div class="email">${esc(u.email)}</div>
          </div>
        </div>
      </td>
      <td>${esc(u.role)}</td>
      <td style="min-width:280px">${perms}</td>
      <td style="min-width:180px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="progress-bar" style="min-width:90px"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span style="font-size:11.5px;color:var(--text-muted)">${doneCount}/${theirs.length}</span>
        </div>
      </td>
      <td>${overdue>0?`<span class="tag red">${overdue} overdue</span>`:`<span class="tag green">on track</span>`}</td>
      <td>
        <button class="btn btn-ghost" style="padding:6px 12px;font-size:11px" onclick="writeNoteTo('${u.id}')">${isO?'Note':'Write note'}</button>
      </td>
    </tr>`;
  }).join('');

  $('#section-team').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi"><div class="kpi-label">Team size</div><div class="kpi-value">${state.users.length}</div><div class="kpi-meta">active members</div></div>
      <div class="kpi"><div class="kpi-label">Tasks assigned</div><div class="kpi-value">${state.tasks.length}</div><div class="kpi-meta">${state.tasks.filter(t=>!t.done).length} open</div></div>
      <div class="kpi"><div class="kpi-label">Completion</div><div class="kpi-value">${state.tasks.length?Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100):0}%</div><div class="kpi-meta">across the team</div></div>
      <div class="kpi"><div class="kpi-label">Direct notes</div><div class="kpi-value">${state.notes.filter(n=>n.visibility==='direct').length}</div><div class="kpi-meta">leadership to team</div></div>
    </div>

    <div class="card">
      <div class="section-head">
        <div><div class="card-title">Team members</div><div class="card-sub">Monitor progress, grant section access, and leave direct notes</div></div>
        <button class="btn btn-primary" onclick="openNewTeamMemberModal()">Add team member</button>
      </div>
      <div style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Member</th><th>Role</th><th>Permissions</th><th>Progress</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="margin-top:14px;font-size:11.5px;color:var(--text-muted)">Tip: click any permission tag to toggle access. Use the topbar user switcher to preview the app as that team member.</div>
    </div>
  `;
}

function togglePerm(uid, perm){
  const u = userById(uid);
  if(!u || u.role==='Owner') return;
  const i = u.permissions.indexOf(perm);
  if(i>=0) u.permissions.splice(i,1); else u.permissions.push(perm);
  renderTeam();
  toast('Permission updated', `${u.name}: ${perm} ${i>=0?'removed':'granted'}`);
}

function writeNoteTo(uid){
  openNewNoteModal(uid);
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

// ===== NOTES MODAL =====
function openNewNoteModal(prefillTargetId){
  const owner = isOwner();
  const visibilityOptions = owner
    ? '<option value="direct">Direct to a team member</option><option value="public">Public (whole team)</option><option value="private">Private (just me)</option>'
    : '<option value="private">Private (just me)</option><option value="public">Public (whole team)</option>';
  const targetOptions = state.users.filter(u=>u.id!==state.currentUserId).map(u=>`<option value="${u.id}" ${prefillTargetId===u.id?'selected':''}>${esc(u.name)} · ${esc(u.role)}</option>`).join('');
  openModal(`
    <h3>New note</h3>
    <div class="modal-sub">Capture a thought, guidance or briefing.</div>
    <div class="field"><label>Visibility</label><select class="input" id="n_vis" onchange="updateNoteVisibility()">${visibilityOptions}</select></div>
    <div class="field" id="n_target_field" style="${owner?'':'display:none'}"><label>Direct to</label><select class="input" id="n_target">${targetOptions}</select></div>
    <div class="field"><label>Title</label><input class="input" id="n_title" placeholder="e.g. Budget review priorities"/></div>
    <div class="field"><label>Content</label><textarea class="input" id="n_content" rows="5" placeholder="Write your note..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNote()">Save note</button>
    </div>
  `);
  updateNoteVisibility();
}
function updateNoteVisibility(){
  const v = $('#n_vis').value;
  $('#n_target_field').style.display = v==='direct' ? 'block' : 'none';
}
function saveNote(){
  const title = $('#n_title').value.trim();
  const content = $('#n_content').value.trim();
  const vis = $('#n_vis').value;
  if(!title || !content){ toast('Missing fields','Please add a title and content'); return; }
  const target = vis==='direct' ? $('#n_target').value : null;
  state.notes.unshift({
    id: 'n'+Date.now(),
    authorId: state.currentUserId,
    targetUserId: target,
    visibility: vis,
    title, content,
    createdAt: new Date().toISOString().slice(0,10),
    pinned: false,
  });
  closeModal();
  if(vis==='direct') notesTab='forme';
  else if(vis==='private') notesTab='mine';
  else notesTab='team';
  renderNotes(); renderDashboard();
  toast('Note saved', vis==='direct' ? `Sent to ${userName(target)}` : vis==='public' ? 'Visible to the whole team' : 'Visible only to you');
}

// ===== TEAM MEMBER MODAL =====
function openNewTeamMemberModal(){
  openModal(`
    <h3>Add team member</h3>
    <div class="modal-sub">Grant someone access to the platform and assign their scope.</div>
    <div class="field"><label>Full name</label><input class="input" id="tm_name"/></div>
    <div class="field"><label>Email</label><input class="input" id="tm_email" type="email"/></div>
    <div class="field"><label>Role</label><input class="input" id="tm_role" placeholder="e.g. Comms Lead"/></div>
    <div class="field"><label>Permissions</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
        ${['dashboard','events','tasks','crm','notes'].map(p=>`
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer">
            <input type="checkbox" class="tm_perm" value="${p}" ${p==='dashboard'||p==='tasks'||p==='notes'?'checked':''}/>${p}
          </label>
        `).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTeamMember()">Add member</button>
    </div>
  `);
}
function saveTeamMember(){
  const name = $('#tm_name').value.trim();
  if(!name){ toast('Missing name','Enter the team member\'s name'); return; }
  const perms = Array.from($$('.tm_perm')).filter(c=>c.checked).map(c=>c.value);
  state.users.push({
    id: 'u'+Date.now(),
    name,
    email: $('#tm_email').value || (name.toLowerCase().replace(/\s+/g,'.')+'@cambridge-eta.co.uk'),
    role: $('#tm_role').value || 'Team Member',
    permissions: perms,
  });
  closeModal();
  renderTeam(); renderUserSwitcher();
  toast('Team member added', esc(name));
}

// ===== THEME =====
function applyTheme(){
  document.documentElement.setAttribute('data-theme', state.theme);
  $('#themeIconDark').style.display = state.theme==='dark' ? 'block' : 'none';
  $('#themeIconLight').style.display = state.theme==='light' ? 'block' : 'none';
}
function toggleTheme(){
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  localStorage.setItem('eta-theme', state.theme);
  applyTheme();
  toast('Theme switched', `Now using ${state.theme} mode`);
}

// ===== USER SWITCHER =====
function renderUserSwitcher(){
  const me = currentUser();
  $('#chipAvatar').textContent = initials(me.name);
  $('#chipName').textContent = me.name;
  $('#chipRole').textContent = me.role;
  const menu = $('#userMenu');
  menu.innerHTML = `
    <div class="user-menu-label">Viewing as</div>
    ${state.users.map(u=>`
      <div class="user-menu-item ${u.id===state.currentUserId?'current':''}" onclick="switchUser('${u.id}')">
        <div class="avatar">${initials(u.name)}</div>
        <div class="info">
          <div class="name">${esc(u.name)}</div>
          <div class="role">${esc(u.role)}</div>
        </div>
        <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    `).join('')}
    <div style="padding:10px 12px;border-top:1px solid var(--border);margin-top:6px;font-size:10.5px;color:var(--text-muted)">
      Simulates logging in as that team member. Sections and data filter by their permissions.
    </div>
  `;
}
function toggleUserMenu(e){
  if(e) e.stopPropagation();
  $('#userMenu').classList.toggle('open');
}
function switchUser(uid){
  state.currentUserId = uid;
  localStorage.setItem('eta-user', uid);
  $('#userMenu').classList.remove('open');
  renderUserSwitcher();
  applyPermissions();
  renderDashboard(); renderEvents(); renderTasks(); renderCrm(); renderNotes(); renderTeam();
  const me = currentUser();
  // If the current section isn't allowed, fall back to dashboard
  if(!canAccess(state.section) && state.section!=='dashboard') switchSection('dashboard');
  else switchSection(state.section);
  toast('Switched user', `Now viewing as ${me.name}`);
}
document.addEventListener('click', (e)=>{
  const sw = document.getElementById('userSwitcher');
  if(sw && !sw.contains(e.target)) $('#userMenu').classList.remove('open');
});

// ===== PERMISSIONS: sidebar visibility =====
function applyPermissions(){
  const owner = isOwner();
  document.querySelectorAll('.nav-item').forEach(n=>{
    const nav = n.dataset.nav;
    const ownerOnly = n.hasAttribute('data-owner-only');
    const allowed = canAccess(nav) && (!ownerOnly || owner);
    n.style.display = allowed ? '' : 'none';
  });
}

// ===== ROUTER =====
const SECTION_CONFIG = {
  dashboard: {title:'Dashboard',    subtitle:'Your club at a glance',                  btn:'New Event',  action: openNewEventModal},
  events:    {title:'Events',       subtitle:'Calendar, planning & capacity',          btn:'New Event',  action: openNewEventModal},
  tasks:     {title:'Tasks',        subtitle:'What you are working on',                btn:'New Task',   action: openNewTaskModal},
  crm:       {title:'Members CRM',  subtitle:'Directory of the Cambridge ETA community', btn:'Add Member', action: openNewMemberModal},
  notes:     {title:'Notes',        subtitle:'Private, public & direct notes',         btn:'New Note',   action: ()=>openNewNoteModal()},
  team:      {title:'Team',         subtitle:'Manage permissions and monitor progress',btn:'Add Member', action: openNewTeamMemberModal},
};

function switchSection(name){
  if(!canAccess(name)){ toast('No access', `You do not have permission to view ${name}`); return; }
  if(name==='team' && !isOwner()){ toast('Owner only','Only the Owner can manage the team'); return; }
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
  if(name==='notes') renderNotes();
  if(name==='team') renderTeam();
}

$$('.nav-item').forEach(n=>n.addEventListener('click',()=>switchSection(n.dataset.nav)));
$('#themeToggle').addEventListener('click', toggleTheme);

// ===== BOOT =====
applyTheme();
renderUserSwitcher();
applyPermissions();
renderDashboard();
renderEvents();
renderTasks();
renderCrm();
renderNotes();
renderTeam();
switchSection('dashboard');
</script>
</body>
</html>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(JS3)
    print("Part 5 written: tasks + crm + modals + router")
