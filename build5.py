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
      <div class="checkbox ${t.done?'checked':''}" onclick="toggleTask('${t.id}')"></div>
      <div class="task-info">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          <span>${t.due?fmtDate(t.due):'No due date'}</span>
          <span>·</span>
          <span>${esc(userName(t.assigneeId))}</span>
          ${t.project?`<span>·</span><span>${esc(t.project)}</span>`:''}
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
        ${n.authorId===currentUserId() ? `<button class="btn btn-ghost" style="margin-left:auto;padding:6px 12px;font-size:11px" onclick="deleteNote('${n.id}')">Delete</button>` : ''}
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
async function deleteNote(id){
  const { error } = await sb.from('eta_notes').delete().eq('id', id);
  if(error){ toast('Could not delete', error.message); return; }
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
      <td>${isO ? esc(u.role) : `<input class="input" style="padding:6px 10px;font-size:12px;max-width:140px" value="${esc(u.role)}" onblur="updateUserRole('${u.id}', this.value.trim() || 'Member')"/>`}</td>
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

async function togglePerm(uid, perm){
  const u = userById(uid);
  if(!u || u.role==='Owner') return;
  const nextPerms = u.permissions.includes(perm)
    ? u.permissions.filter(p => p !== perm)
    : [...u.permissions, perm];
  const { error } = await sb.from('eta_users').update({ permissions: nextPerms }).eq('id', uid);
  if(error){ toast('Could not update', error.message); return; }
  u.permissions = nextPerms;
  renderTeam();
  toast('Permission updated', `${u.name}: ${perm} ${u.permissions.includes(perm)?'granted':'removed'}`);
}

function writeNoteTo(uid){
  openNewNoteModal(uid);
}

async function toggleTask(id){
  const t = state.tasks.find(x => x.id === id);
  if(!t) return;
  const next = !t.done;
  const { error } = await sb.from('eta_tasks').update({ done: next }).eq('id', id);
  if(error){ toast('Could not update task', error.message); return; }
  t.done = next;
  renderTasks();
  renderDashboard();
  toast(next?'Task completed':'Task reopened', t.title);
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
async function saveEvent(){
  const title = $('#f_title').value.trim();
  if(!title){ toast('Missing title','Please give the event a name'); return; }
  const payload = {
    title,
    event_date: $('#f_date').value,
    event_time: $('#f_time').value,
    venue: $('#f_venue').value || null,
    description: $('#f_desc').value || null,
    capacity: parseInt($('#f_cap').value,10) || 50,
    attendees: 0,
    status: $('#f_stat').value,
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_events').insert(payload).select().single();
  if(error){ toast('Could not save', error.message); return; }
  state.events.push(mapEvent(data));
  closeModal();
  renderEvents(); renderDashboard();
  toast('Event created', title);
}

function openNewTaskModal(){
  const today = new Date().toISOString().slice(0,10);
  const assigneeOptions = state.users.map(u =>
    `<option value="${u.id}" ${u.id===currentUserId()?'selected':''}>${esc(u.name)} · ${esc(u.role)}</option>`
  ).join('');
  openModal(`
    <h3>New task</h3>
    <div class="modal-sub">Track something the club needs to get done.</div>
    <div class="field"><label>Task</label><input class="input" id="t_title"/></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="field"><label>Due</label><input class="input" id="t_due" type="date" value="${today}"/></div>
      <div class="field"><label>Priority</label><select class="input" id="t_prio"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
    </div>
    <div class="field"><label>Assign to</label><select class="input" id="t_assignee" ${isOwner()?'':'disabled'}>${assigneeOptions}</select></div>
    <div class="field"><label>Project</label><input class="input" id="t_proj" placeholder="e.g. Annual Summit"/></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTask()">Add task</button>
    </div>
  `);
}
async function saveTask(){
  const title = $('#t_title').value.trim();
  if(!title){ toast('Missing title','Please describe the task'); return; }
  const payload = {
    title,
    due_date: $('#t_due').value || null,
    priority: $('#t_prio').value,
    assignee_id: $('#t_assignee').value || currentUserId(),
    project: $('#t_proj').value || null,
    done: false,
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_tasks').insert(payload).select().single();
  if(error){ toast('Could not save', error.message); return; }
  state.tasks.push(mapTask(data));
  closeModal(); renderTasks(); renderDashboard();
  toast('Task added', title);
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
async function saveMember(){
  const name = $('#m_name').value.trim();
  if(!name){ toast('Missing name','Enter the member\'s full name'); return; }
  const payload = {
    name,
    email: $('#m_email').value || null,
    role: $('#m_role').value,
    chapter: $('#m_college').value || null,
    tier: $('#m_tier').value,
    status: $('#m_stat').value,
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_members').insert(payload).select().single();
  if(error){ toast('Could not save', error.message); return; }
  state.members.push(mapMember(data));
  closeModal(); renderCrm(); renderDashboard();
  toast('Member added', name);
}

// ===== NOTES MODAL =====
function openNewNoteModal(prefillTargetId){
  const owner = isOwner();
  const visibilityOptions = owner
    ? '<option value="direct">Direct to a team member</option><option value="public">Public (whole team)</option><option value="private">Private (just me)</option>'
    : '<option value="private">Private (just me)</option><option value="public">Public (whole team)</option>';
  const targetOptions = state.users.filter(u=>u.id!==currentUserId()).map(u=>`<option value="${u.id}" ${prefillTargetId===u.id?'selected':''}>${esc(u.name)} · ${esc(u.role)}</option>`).join('');
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
async function saveNote(){
  const title = $('#n_title').value.trim();
  const content = $('#n_content').value.trim();
  const vis = $('#n_vis').value;
  if(!title || !content){ toast('Missing fields','Please add a title and content'); return; }
  const target = vis==='direct' ? $('#n_target').value : null;
  const payload = {
    author_id: currentUserId(),
    target_user_id: target,
    visibility: vis,
    title,
    content,
    pinned: false,
  };
  const { data, error } = await sb.from('eta_notes').insert(payload).select().single();
  if(error){ toast('Could not save', error.message); return; }
  state.notes.unshift(mapNote(data));
  closeModal();
  if(vis==='direct') notesTab = 'mine';  // author always sees it in "My notes"
  else if(vis==='private') notesTab = 'mine';
  else notesTab = 'team';
  renderNotes(); renderDashboard();
  toast('Note saved', vis==='direct' ? `Sent to ${userName(target)}` : vis==='public' ? 'Visible to the whole team' : 'Visible only to you');
}

// ===== TEAM MEMBER MODAL =====
function openNewTeamMemberModal(){
  const origin = window.location.origin + window.location.pathname;
  openModal(`
    <h3>Invite a team member</h3>
    <div class="modal-sub">Team members sign themselves up, then you grant them access here.</div>
    <div class="field">
      <label>Sign-up link</label>
      <input class="input" readonly value="${esc(origin)}" onclick="this.select()"/>
    </div>
    <div class="auth-hint" style="text-align:left;margin-top:10px">
      Share this URL with the person you want to add. They create an account with their own email and password, then they appear in this Team view as a <b>Member</b> with basic access. From there you can edit their role and flip permissions on and off.
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal()">Got it</button>
    </div>
  `);
}
async function updateUserRole(uid, nextRole){
  const { error } = await sb.from('eta_users').update({ role: nextRole }).eq('id', uid);
  if(error){ toast('Could not update', error.message); return; }
  const u = userById(uid);
  if(u) u.role = nextRole;
  renderTeam();
  toast('Role updated', `${u?u.name:'User'} is now ${nextRole}`);
}

// ===== THEME =====
function applyTheme(){
  document.documentElement.setAttribute('data-theme', state.theme);
  const show = (id, on) => { const el = document.getElementById(id); if(el) el.style.display = on ? 'block' : 'none'; };
  show('themeIconDark',      state.theme==='dark');
  show('themeIconLight',     state.theme==='light');
  show('authThemeIconDark',  state.theme==='dark');
  show('authThemeIconLight', state.theme==='light');
}
function toggleTheme(){
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  localStorage.setItem('eta-theme', state.theme);
  applyTheme();
  if(state.profile) toast('Theme switched', `Now using ${state.theme} mode`);
}

// ===== USER MENU =====
function renderUserMenu(){
  const me = currentUser();
  if(!me) return;
  $('#chipAvatar').textContent = initials(me.name);
  $('#chipName').textContent = me.name;
  $('#chipRole').textContent = me.role;
  const menu = $('#userMenu');
  menu.innerHTML = `
    <div style="padding:14px 12px 10px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border)">
      <div class="avatar">${initials(me.name)}</div>
      <div style="min-width:0;flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(me.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(me.email)}</div>
      </div>
    </div>
    <div style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Signed in as</div>
    <div style="padding:0 12px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px">
      <span class="tag">${esc(me.role)}</span>
      <span style="font-size:10.5px;color:var(--text-muted)">${(me.permissions||[]).join(' · ') || 'No access'}</span>
    </div>
    <div class="user-menu-item" onclick="signOut()" style="border-top:1px solid var(--border);margin-top:6px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <div class="info"><div class="name">Sign out</div><div class="role">End this session</div></div>
    </div>
  `;
}
function toggleUserMenu(e){
  if(e) e.stopPropagation();
  $('#userMenu').classList.toggle('open');
}

async function signOut(){
  await sb.auth.signOut();
  state.session = null;
  state.profile = null;
  state.users = state.events = state.tasks = state.members = state.notes = [];
  showAuthScreen();
  toast('Signed out','See you soon');
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
    // Team is owner-only; Notes and Dashboard always available if authed
    const allowed = (nav === 'team' ? owner : (canAccess(nav) || nav === 'dashboard'));
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
{
  const tt = document.getElementById('themeToggle');
  if(tt) tt.addEventListener('click', toggleTheme);
  const att = document.getElementById('authThemeToggle');
  if(att) att.addEventListener('click', toggleTheme);
  const aib = document.getElementById('aiBtn');
  if(aib) aib.addEventListener('click', openAiDrawer);
  const aii = document.getElementById('aiInput');
  if(aii){
    aii.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        sendAiMessage();
      }
    });
    // auto-grow
    aii.addEventListener('input', () => {
      aii.style.height = 'auto';
      aii.style.height = Math.min(140, aii.scrollHeight) + 'px';
    });
  }
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeAiDrawer();
  });
}

// ===== AUTH FLOW =====
let authTab = 'signin';
function setAuthTab(t){
  authTab = t;
  document.querySelectorAll('[data-auth-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.authTab === t);
  });
  $('#authFieldName').style.display = t === 'signup' ? 'block' : 'none';
  $('#authSubmit').textContent = t === 'signup' ? 'Create account' : 'Sign in';
  $('#authError').classList.remove('show');
}
function showAuthError(msg){
  const el = $('#authError');
  el.textContent = msg;
  el.classList.add('show');
}
async function handleAuthSubmit(){
  const email = $('#authEmail').value.trim();
  const password = $('#authPassword').value;
  if(!email || !password){ showAuthError('Email and password are required'); return; }
  $('#authSubmit').disabled = true;
  $('#authError').classList.remove('show');
  try {
    if(authTab === 'signup'){
      const name = $('#authName').value.trim();
      if(!name){ showAuthError('Please enter your full name'); $('#authSubmit').disabled = false; return; }
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { name } }
      });
      if(error){ showAuthError(error.message); $('#authSubmit').disabled = false; return; }
      if(!data.session){
        showAuthError('Check your email to confirm your account, then sign in.');
        setAuthTab('signin');
        $('#authSubmit').disabled = false;
        return;
      }
      // session available immediately (email confirmation disabled)
      await onSignedIn(data.session);
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if(error){ showAuthError(error.message); $('#authSubmit').disabled = false; return; }
      await onSignedIn(data.session);
    }
  } catch (e){
    showAuthError(e.message || 'Something went wrong');
  }
  $('#authSubmit').disabled = false;
}
function showAuthScreen(){
  $('#bootOverlay').classList.remove('show');
  $('#authWrap').classList.add('show');
  document.querySelector('.app').classList.remove('ready');
}
function hideAuthScreen(){
  $('#authWrap').classList.remove('show');
  document.querySelector('.app').classList.add('ready');
}

// ===== DATA LOADING =====
async function loadAll(){
  const [users, events, tasks, members, notes] = await Promise.all([
    sb.from('eta_users').select('*').order('created_at', {ascending:true}),
    sb.from('eta_events').select('*').order('event_date', {ascending:true}),
    sb.from('eta_tasks').select('*').order('due_date', {ascending:true, nullsFirst:false}),
    sb.from('eta_members').select('*').order('created_at', {ascending:false}),
    sb.from('eta_notes').select('*').order('created_at', {ascending:false}),
  ]);
  state.users   = (users.data   || []).map(mapUser);
  state.events  = (events.data  || []).map(mapEvent);
  state.tasks   = (tasks.data   || []).map(mapTask);
  state.members = (members.data || []).map(mapMember);
  state.notes   = (notes.data   || []).map(mapNote);
  state.profile = state.users.find(u => u.id === state.session.user.id) || null;
}

async function onSignedIn(session){
  state.session = session;
  $('#bootOverlay').classList.add('show');
  $('#authWrap').classList.remove('show');
  try {
    await loadAll();
  } catch(e){
    showAuthError('Could not load data: ' + (e.message || e));
    $('#bootOverlay').classList.remove('show');
    $('#authWrap').classList.add('show');
    return;
  }
  if(!state.profile){
    // Profile row missing — trigger didn't fire or RLS blocked it
    $('#bootOverlay').classList.remove('show');
    showAuthError('Your account is missing a profile row. Contact the Owner or re-run the migration.');
    $('#authWrap').classList.add('show');
    return;
  }
  hideAuthScreen();
  $('#bootOverlay').classList.remove('show');
  renderUserMenu();
  applyPermissions();
  renderDashboard();
  renderEvents();
  renderTasks();
  renderCrm();
  renderNotes();
  renderTeam();
  // Default to dashboard if previous section no longer allowed
  const target = canAccess(state.section) ? state.section : 'dashboard';
  switchSection(target);
}

// ============================================================
// ===== AI ASSISTANT (Claude tool-use via browser API) =======
// ============================================================

const AI_MODEL = 'claude-sonnet-4-5';  // Change to 'claude-opus-4-5' for Opus, or any current Anthropic model ID
const AI_STORAGE_KEY = 'eta-ai-key';
const aiState = {
  history: [],   // Claude messages format
  busy: false,
};

const AI_TOOLS = [
  {
    name: 'list_team',
    description: 'List all app users (the operational team running the club platform), with their emails, roles and current permissions. Use this if you need to look up who to assign something to.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_task',
    description: 'Create a task and optionally assign it to a team member by email. If the user names someone, look up the matching email from the team list in the system prompt.',
    input_schema: {
      type: 'object',
      properties: {
        title:          { type: 'string', description: 'Short task description' },
        assignee_email: { type: 'string', description: 'Email of the team member to assign to. Optional; defaults to the current user.' },
        due_date:       { type: 'string', description: 'ISO date YYYY-MM-DD. Optional.' },
        priority:       { type: 'string', enum: ['High','Medium','Low'], description: 'Defaults to Medium if not specified' },
        project:        { type: 'string', description: 'Project or event the task belongs to. Optional.' }
      },
      required: ['title']
    }
  },
  {
    name: 'create_event',
    description: 'Schedule an event on the club calendar.',
    input_schema: {
      type: 'object',
      properties: {
        title:       { type: 'string' },
        date:        { type: 'string', description: 'ISO date YYYY-MM-DD' },
        time:        { type: 'string', description: '24h HH:MM' },
        venue:       { type: 'string' },
        description: { type: 'string' },
        capacity:    { type: 'integer' }
      },
      required: ['title','date']
    }
  },
  {
    name: 'add_club_member',
    description: 'Add someone to the Cambridge ETA club members directory (an actual club member, not an operational team user).',
    input_schema: {
      type: 'object',
      properties: {
        name:    { type: 'string' },
        email:   { type: 'string' },
        role:    { type: 'string', description: 'e.g. Investor, Founder, Searcher, Mentor' },
        chapter: { type: 'string', description: 'Cambridge college, e.g. Jesus College' },
        tier:    { type: 'string', enum: ['Platinum','Gold','Silver'] },
        status:  { type: 'string', enum: ['Active','Pending'] }
      },
      required: ['name']
    }
  },
  {
    name: 'write_note',
    description: 'Write a note. visibility=private is only visible to you, public is visible to the whole team, direct must include target_email.',
    input_schema: {
      type: 'object',
      properties: {
        title:        { type: 'string' },
        content:      { type: 'string' },
        visibility:   { type: 'string', enum: ['private','public','direct'] },
        target_email: { type: 'string', description: 'Required when visibility is "direct"' }
      },
      required: ['title','content','visibility']
    }
  },
  {
    name: 'update_team_member',
    description: 'Update a team member\'s role and/or permissions. Owner-only. Permissions are a subset of [dashboard, events, tasks, crm, notes].',
    input_schema: {
      type: 'object',
      properties: {
        target_email: { type: 'string' },
        new_role:     { type: 'string', description: 'New role label' },
        permissions:  { type: 'array', items: { type: 'string' }, description: 'New full permission list (replaces existing)' }
      },
      required: ['target_email']
    }
  }
];

function aiSystemPrompt(){
  const today = new Date().toISOString().slice(0,10);
  const me = currentUser();
  const team = state.users.map(u =>
    `- ${u.name} <${u.email}> · role=${u.role} · permissions=[${(u.permissions||[]).join(', ')}]`
  ).join('\n');
  const ownerNote = isOwner()
    ? 'The current user is the Owner, so you may call update_team_member.'
    : 'The current user is NOT the Owner. Do not call update_team_member.';
  return `You are the AI assistant for the Cambridge ETA Club Management Platform.

You help ${me.name} (${me.role}) run the club by creating events, tasks, notes, members, and updating team settings through the tools provided.

Today is ${today}.
${ownerNote}

Current operational team (app users):
${team || '(only the current user so far)'}

Rules:
- When the user asks for something, pick the right tool and call it directly. Don't narrate the steps.
- Resolve people by name to their email from the team list above. If ambiguous, ask a single short clarifying question.
- For relative dates (tomorrow, Friday, next week, "in two weeks"), compute the concrete YYYY-MM-DD.
- If a required field is missing and you can't reasonably infer it, ask one concise question.
- After a tool succeeds, confirm briefly in one sentence. No bullet lists, no restating everything.
- Never invent people, emails, colleges or dates. If you don't know, ask.
- Be confident and concise — this is a management tool, not casual chat.`;
}

async function callClaude(apiKey, messages){
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: aiSystemPrompt(),
      tools: AI_TOOLS,
      messages,
    })
  });
  if(!res.ok){
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text.slice(0,200)}`);
  }
  return await res.json();
}

// ===== TOOL IMPLEMENTATIONS =====
function aiUserByEmail(email){
  if(!email) return null;
  return state.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
}

async function toolCreateTask(input){
  const assignee = input.assignee_email ? aiUserByEmail(input.assignee_email) : currentUser();
  if(input.assignee_email && !assignee) return { error: `No team member with email ${input.assignee_email}.` };
  const payload = {
    title: input.title,
    due_date: input.due_date || null,
    priority: input.priority || 'Medium',
    assignee_id: assignee ? assignee.id : currentUserId(),
    project: input.project || null,
    done: false,
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_tasks').insert(payload).select().single();
  if(error) return { error: error.message };
  state.tasks.push(mapTask(data));
  renderTasks(); renderDashboard();
  return { ok: `Created task "${input.title}" assigned to ${assignee ? assignee.name : 'you'}.` };
}

async function toolCreateEvent(input){
  const payload = {
    title: input.title,
    event_date: input.date,
    event_time: input.time || null,
    venue: input.venue || null,
    description: input.description || null,
    capacity: input.capacity || 50,
    attendees: 0,
    status: 'Open',
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_events').insert(payload).select().single();
  if(error) return { error: error.message };
  state.events.push(mapEvent(data));
  renderEvents(); renderDashboard();
  return { ok: `Scheduled "${input.title}" for ${input.date}${input.time?' at '+input.time:''}.` };
}

async function toolAddClubMember(input){
  const payload = {
    name: input.name,
    email: input.email || null,
    role: input.role || null,
    chapter: input.chapter || null,
    tier: input.tier || 'Silver',
    status: input.status || 'Active',
    created_by: currentUserId(),
  };
  const { data, error } = await sb.from('eta_members').insert(payload).select().single();
  if(error) return { error: error.message };
  state.members.push(mapMember(data));
  renderCrm(); renderDashboard();
  return { ok: `Added ${input.name} to the members directory.` };
}

async function toolWriteNote(input){
  let target = null;
  if(input.visibility === 'direct'){
    if(!input.target_email) return { error: 'Direct notes require target_email.' };
    target = aiUserByEmail(input.target_email);
    if(!target) return { error: `No team member with email ${input.target_email}.` };
  }
  const payload = {
    author_id: currentUserId(),
    target_user_id: target ? target.id : null,
    visibility: input.visibility,
    title: input.title,
    content: input.content,
    pinned: false,
  };
  const { data, error } = await sb.from('eta_notes').insert(payload).select().single();
  if(error) return { error: error.message };
  state.notes.unshift(mapNote(data));
  renderNotes(); renderDashboard();
  const audience = input.visibility === 'direct' ? `to ${target.name}` :
                   input.visibility === 'public' ? 'to the whole team' :
                   'as a private note';
  return { ok: `Saved "${input.title}" ${audience}.` };
}

async function toolUpdateTeamMember(input){
  if(!isOwner()) return { error: 'Only the Owner can update team members.' };
  const target = aiUserByEmail(input.target_email);
  if(!target) return { error: `No team member with email ${input.target_email}.` };
  const patch = {};
  if(input.new_role) patch.role = input.new_role;
  if(Array.isArray(input.permissions)) patch.permissions = input.permissions;
  if(!Object.keys(patch).length) return { error: 'Nothing to update.' };
  const { error } = await sb.from('eta_users').update(patch).eq('id', target.id);
  if(error) return { error: error.message };
  Object.assign(target, patch);
  renderTeam();
  const bits = [];
  if(patch.role) bits.push(`role → ${patch.role}`);
  if(patch.permissions) bits.push(`permissions → [${patch.permissions.join(', ')}]`);
  return { ok: `Updated ${target.name}: ${bits.join(', ')}.` };
}

function toolListTeam(){
  const rows = state.users.map(u =>
    `${u.name} <${u.email}> · ${u.role} · [${(u.permissions||[]).join(', ')}]`
  );
  return { ok: rows.join('\n') };
}

async function executeTool(name, input){
  try {
    switch(name){
      case 'create_task':        return await toolCreateTask(input);
      case 'create_event':       return await toolCreateEvent(input);
      case 'add_club_member':    return await toolAddClubMember(input);
      case 'write_note':         return await toolWriteNote(input);
      case 'update_team_member': return await toolUpdateTeamMember(input);
      case 'list_team':          return toolListTeam();
      default:                   return { error: `Unknown tool ${name}` };
    }
  } catch(e){
    return { error: e.message || String(e) };
  }
}

// ===== CHAT UI =====
function openAiDrawer(){
  const key = localStorage.getItem(AI_STORAGE_KEY);
  $('#aiDrawer').classList.add('open');
  $('#aiDrawer').setAttribute('aria-hidden','false');
  $('#aiDrawerBack').classList.add('open');
  if(!key){
    renderAiSetup();
  } else if(aiState.history.length === 0){
    renderAiIntro();
  }
  setTimeout(() => { const i = document.getElementById('aiInput'); if(i) i.focus(); }, 320);
}
function closeAiDrawer(){
  $('#aiDrawer').classList.remove('open');
  $('#aiDrawer').setAttribute('aria-hidden','true');
  $('#aiDrawerBack').classList.remove('open');
}
function renderAiSetup(){
  const container = $('#aiMessages');
  container.innerHTML = `
    <div class="ai-setup">
      <h4>Connect the AI assistant</h4>
      <p>The assistant uses your own Anthropic API key, stored only on this device. Get one free at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</p>
      <input class="input" id="aiKeyInput" type="password" placeholder="sk-ant-..."/>
      <button class="btn btn-primary" style="width:100%" onclick="saveAiKey()">Save key</button>
    </div>
  `;
  $('#aiSuggestions').innerHTML = '';
}
function saveAiKey(){
  const key = $('#aiKeyInput').value.trim();
  if(!key.startsWith('sk-ant-')){ toast('Invalid key','Anthropic keys start with sk-ant-'); return; }
  localStorage.setItem(AI_STORAGE_KEY, key);
  aiState.history = [];
  renderAiIntro();
  toast('AI connected','You can now chat with the assistant');
}
function renderAiIntro(){
  const me = currentUser();
  const container = $('#aiMessages');
  container.innerHTML = '';
  addAiMsg('assistant', `Hi ${me ? me.name.split(' ')[0] : 'there'} — tell me what you'd like to add and I'll take care of it. For example:`);
  const suggestions = isOwner()
    ? ['Add a task for Priya to confirm speakers by Friday', 'Schedule a fireside at Trinity next Tuesday 7pm', 'Write a public note: AGM is April 30', 'Make Marcus the Finance Lead with events + tasks']
    : ['Add a task for me to draft the newsletter by Friday', 'Write a private note about follow-ups', 'Schedule a meeting prep session tomorrow at 9am'];
  $('#aiSuggestions').innerHTML = suggestions.map(s => `<div class="ai-suggestion" onclick="useSuggestion(this)">${esc(s)}</div>`).join('');
}
function useSuggestion(el){
  $('#aiInput').value = el.textContent;
  $('#aiInput').focus();
}
function addAiMsg(role, text, toolChip){
  const container = $('#aiMessages');
  const wrap = document.createElement('div');
  wrap.className = `ai-msg ${role}`;
  const initialsHtml = role === 'user'
    ? `<div class="avatar">${initials((currentUser()||{name:'You'}).name)}</div>`
    : `<div class="avatar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 5.26L20 8l-4.5 3.5L17 18l-5-3-5 3 1.5-6.5L4 8l5.91-.74L12 2z"/></svg></div>`;
  wrap.innerHTML = `${initialsHtml}<div class="bubble">${esc(text)}${toolChip || ''}</div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return wrap;
}
function addAiTyping(){
  const container = $('#aiMessages');
  const wrap = document.createElement('div');
  wrap.className = 'ai-msg assistant';
  wrap.id = '__ai_typing__';
  wrap.innerHTML = `<div class="avatar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 5.26L20 8l-4.5 3.5L17 18l-5-3-5 3 1.5-6.5L4 8l5.91-.74L12 2z"/></svg></div><div class="bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}
function removeAiTyping(){
  const t = document.getElementById('__ai_typing__');
  if(t) t.remove();
}

async function sendAiMessage(){
  if(aiState.busy) return;
  const input = $('#aiInput');
  const text = input.value.trim();
  if(!text) return;
  const key = localStorage.getItem(AI_STORAGE_KEY);
  if(!key){ renderAiSetup(); return; }
  input.value = '';
  $('#aiSuggestions').innerHTML = '';
  addAiMsg('user', text);
  aiState.history.push({ role: 'user', content: [{ type: 'text', text }] });
  aiState.busy = true;
  $('#aiSend').disabled = true;
  addAiTyping();

  try {
    let iterations = 0;
    while(iterations < 6){
      iterations++;
      const response = await callClaude(key, aiState.history);
      removeAiTyping();
      const assistantContent = response.content || [];
      aiState.history.push({ role: 'assistant', content: assistantContent });

      // Emit any natural-language text blocks
      for(const block of assistantContent){
        if(block.type === 'text' && block.text.trim()){
          addAiMsg('assistant', block.text.trim());
        }
      }

      if(response.stop_reason !== 'tool_use') break;

      // Execute all tool_use blocks and send results back
      const toolResults = [];
      for(const block of assistantContent){
        if(block.type !== 'tool_use') continue;
        const result = await executeTool(block.name, block.input || {});
        const chipHtml = result.error
          ? `<div class="ai-tool-chip err">⚠ ${esc(block.name)}: ${esc(result.error)}</div>`
          : `<div class="ai-tool-chip">✓ ${esc(block.name)}</div>`;
        // Show a chip under the last assistant bubble
        const lastBubble = $('#aiMessages').querySelector('.ai-msg.assistant:last-child .bubble');
        if(lastBubble){
          const span = document.createElement('div');
          span.innerHTML = chipHtml;
          lastBubble.appendChild(span.firstChild);
        } else {
          addAiMsg('assistant', '', chipHtml);
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result.error ? `ERROR: ${result.error}` : `OK: ${result.ok}`,
          is_error: !!result.error,
        });
      }
      aiState.history.push({ role: 'user', content: toolResults });
      addAiTyping();
    }
  } catch(e){
    removeAiTyping();
    addAiMsg('assistant', `Sorry — I ran into an error: ${e.message || e}`);
  }

  aiState.busy = false;
  $('#aiSend').disabled = false;
}

// ===== BOOT =====
applyTheme();
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    await onSignedIn(session);
  } else {
    showAuthScreen();
  }
})();

sb.auth.onAuthStateChange((event, session) => {
  if(event === 'SIGNED_OUT'){
    showAuthScreen();
  }
});
</script>
</body>
</html>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(JS3)
    print("Part 5 written: tasks + crm + modals + router")
