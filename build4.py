#!/usr/bin/env python3
"""Part 4: render functions for Dashboard + Events sections."""

JS2 = r"""
<script>
// ===== DASHBOARD =====
function renderDashboard(){
  const me = currentUser();
  const owner = isOwner();
  const totalMembers = state.members.length;
  const activeMembers = state.members.filter(m=>m.status==='Active').length;
  const upcoming = state.events.length;
  const myTasks = visibleTasks();
  const openTasks = (owner ? state.tasks : myTasks).filter(t=>!t.done).length;

  const eventSorted = [...state.events].sort((a,b)=> new Date(a.date)-new Date(b.date)).slice(0,3);
  const recentMembers = [...state.members].slice(-4).reverse();

  // Build a real 7-month trailing growth chart from member joined dates
  const now = new Date();
  const chartData = [];
  for(let i=6; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const label = d.toLocaleDateString('en-GB',{month:'short'});
    const count = state.members.filter(m => {
      if(!m.joined) return false;
      const j = new Date(m.joined);
      return j <= new Date(d.getFullYear(), d.getMonth()+1, 0);
    }).length;
    chartData.push({label, v:count});
  }
  const max = Math.max(1, ...chartData.map(d=>d.v));
  const bars = chartData.map(d=>`
    <div class="bar" style="height:${max ? (d.v/max)*100 : 0}%">
      <div class="bar-value">${d.v||''}</div>
      <div class="bar-label">${d.label}</div>
    </div>`).join('');

  const tierCounts = state.members.reduce((a,m)=>{a[m.tier]=(a[m.tier]||0)+1;return a;},{});
  const tierColors = {Platinum:'#a98bff', Gold:'#e8c66b', Silver:'#8a94b8'};
  const tierTotal = Object.values(tierCounts).reduce((a,b)=>a+b,0);
  let acc = 0;
  const segs = Object.entries(tierCounts).map(([k,v])=>{
    const pct = (v/tierTotal)*100;
    const s = `${k}|${acc}|${acc+pct}|${tierColors[k] || 'var(--purple)'}`;
    acc += pct; return s;
  });
  const grads = tierTotal === 0
    ? 'rgba(138,99,255,0.15) 0% 100%'
    : segs.map(s=>{
        const [,from,to,color] = s.split('|');
        return `${color} ${from}% ${to}%`;
      }).join(',');

  const firstName = me.name.split(' ')[0];
  const heroDesc = owner
    ? `Here is your command centre for the Cambridge ETA Club. ${openTasks} open tasks across the team, ${upcoming} upcoming events, and a steadily growing cohort.`
    : `Welcome back. You have ${openTasks} open tasks assigned to you and ${notesForMe().length} note${notesForMe().length===1?'':'s'} from leadership waiting for you.`;

  // Team progress (owner only)
  const teamProgress = owner ? `
    <div class="card" style="margin-bottom:24px">
      <div class="section-head">
        <div><div class="card-title">Team progress</div><div class="card-sub">Live view of each team member's workload</div></div>
        <button class="btn btn-ghost" onclick="switchSection('team')">Manage team</button>
      </div>
      ${state.users.filter(u=>u.role!=='Owner').map(u=>{
        const theirs = state.tasks.filter(t=>t.assigneeId===u.id);
        const doneCount = theirs.filter(t=>t.done).length;
        const pct = theirs.length ? Math.round(doneCount/theirs.length*100) : 0;
        return `
        <div class="team-row">
          <div class="avatar">${initials(u.name)}</div>
          <div style="min-width:160px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(u.name)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${esc(u.role)}</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:12px;color:var(--text-dim);min-width:90px;text-align:right">${doneCount}/${theirs.length} tasks</div>
          <span class="tag ${pct>=75?'green':pct>=40?'gold':'red'}">${pct}%</span>
        </div>`;
      }).join('')}
    </div>
  ` : '';

  $('#section-dashboard').innerHTML = `
    <div class="hero">
      <h1>Welcome back, ${esc(firstName)}</h1>
      <p>${heroDesc}</p>
      <div class="hero-actions">
        ${owner ? '<button class="btn btn-primary" onclick="switchSection(\'events\')">Plan an event</button><button class="btn btn-ghost" onclick="switchSection(\'team\')">Manage team</button>' : '<button class="btn btn-primary" onclick="switchSection(\'tasks\')">View my tasks</button><button class="btn btn-ghost" onclick="switchSection(\'notes\')">Read notes</button>'}
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="kpi">
        <div class="kpi-icon">${ICONS.users}</div>
        <div class="kpi-label">Total Members</div>
        <div class="kpi-value">${totalMembers}</div>
        <div class="kpi-meta"><span class="kpi-trend trend-up">+12%</span> vs last term</div>
      </div>
      <div class="kpi">
        <div class="kpi-icon">${ICONS.check}</div>
        <div class="kpi-label">Active</div>
        <div class="kpi-value">${activeMembers}</div>
        <div class="kpi-meta"><span class="kpi-trend trend-up">+4</span> this month</div>
      </div>
      <div class="kpi">
        <div class="kpi-icon">${ICONS.cal}</div>
        <div class="kpi-label">Events Scheduled</div>
        <div class="kpi-value">${upcoming}</div>
        <div class="kpi-meta"><span class="kpi-trend trend-up">+2</span> since April</div>
      </div>
      <div class="kpi">
        <div class="kpi-icon">${ICONS.trend}</div>
        <div class="kpi-label">Engagement</div>
        <div class="kpi-value">94%</div>
        <div class="kpi-meta"><span class="kpi-trend trend-up">+6%</span> event attendance</div>
      </div>
    </div>

    ${teamProgress}

    <div class="grid grid-2-1" style="margin-bottom:24px">
      <div class="card">
        <div class="section-head">
          <div>
            <div class="card-title">Membership growth</div>
            <div class="card-sub">New and renewing members · 7 months trailing</div>
          </div>
          <div class="tabs"><div class="tab active">Monthly</div><div class="tab">Quarterly</div></div>
        </div>
        <div class="bar-chart">${bars}</div>
        <div style="height:20px"></div>
      </div>
      <div class="card">
        <div class="card-title">Membership tiers</div>
        <div class="card-sub">Distribution across the cohort</div>
        <div class="donut" style="background:conic-gradient(${grads});border-radius:50%">
          <div style="position:absolute;inset:22px;background:var(--bg-1);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-size:26px;font-weight:700;font-family:'Space Grotesk'">${tierTotal}</div>
            <div style="font-size:10.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">Members</div>
          </div>
        </div>
        <div class="legend">
          ${tierTotal === 0
            ? '<div class="legend-item" style="color:var(--text-muted);font-size:11.5px">No members yet — add your first one from the Members CRM.</div>'
            : Object.entries(tierCounts).map(([k,v])=>`
            <div class="legend-item">
              <div class="legend-dot" style="background:${tierColors[k] || 'var(--purple)'}"></div>
              <span style="flex:1">${k}</span>
              <span style="color:var(--text-muted)">${v}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-bottom:24px">
      <div class="card">
        <div class="section-head">
          <div><div class="card-title">Upcoming events</div><div class="card-sub">Next three in your calendar</div></div>
          <button class="btn btn-ghost" onclick="switchSection('events')">View all</button>
        </div>
        ${eventSorted.length === 0 ? '<div class="empty">No events scheduled. Create your first one from the Events tab.</div>' : eventSorted.map(e=>{
          const d = shortDate(e.date);
          return `
          <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="width:54px;height:54px;border-radius:10px;background:linear-gradient(135deg,rgba(138,99,255,0.25),rgba(106,61,255,0.1));border:1px solid var(--border-strong);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
              <div style="font-size:9.5px;color:var(--purple-2);font-weight:700;letter-spacing:0.06em">${d.month}</div>
              <div style="font-size:18px;font-weight:700;font-family:'Space Grotesk'">${d.day}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13.5px;font-weight:600;color:var(--text)">${esc(e.title)}</div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">${esc(e.venue||'')}${e.time?' · '+esc(e.time):''}</div>
              <div style="margin-top:6px"><span class="tag">${e.attendees||0}/${e.capacity||0} attending</span></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <div class="section-head">
          <div><div class="card-title">Recent members</div><div class="card-sub">Latest additions to the club</div></div>
          <button class="btn btn-ghost" onclick="switchSection('crm')">View all</button>
        </div>
        ${recentMembers.length === 0 ? '<div class="empty">No members yet.</div>' : recentMembers.map(m=>`
          <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
            <div class="avatar">${initials(m.name)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(m.name)}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">${esc(m.role||'')}${m.chapter?' · '+esc(m.chapter):''}</div>
            </div>
            <span class="tag ${m.tier==='Platinum'?'':m.tier==='Gold'?'gold':'blue'}">${m.tier||''}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
}

// ===== EVENTS =====
function renderEvents(){
  const cards = state.events.map(e=>{
    const d = shortDate(e.date);
    const statusClass = e.status==='Nearly Full'?'gold':'green';
    return `
    <div class="event-card">
      <div class="event-date">
        <div style="display:flex;flex-direction:column;padding:6px 10px;border-radius:8px;background:rgba(138,99,255,0.12);border:1px solid var(--border);min-width:50px;text-align:center">
          <div style="font-size:9px;color:var(--purple-2);font-weight:700">${d.month}</div>
          <div style="font-size:15px;font-weight:700;color:#fff;font-family:'Space Grotesk'">${d.day}</div>
        </div>
        <span>${d.weekday} · ${e.time}</span>
      </div>
      <div class="event-title">${esc(e.title)}</div>
      <div class="event-desc">${esc(e.desc)}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;font-size:11.5px;color:var(--text-muted)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${esc(e.venue)}</span>
      </div>
      <div class="event-foot">
        <div class="attendees">
          ${state.members.slice(0,4).map(m=>`<div class="avatar">${initials(m.name)}</div>`).join('')}
          <div class="more">+${Math.max(0,e.attendees-4)}</div>
        </div>
        <span class="tag ${statusClass}">${e.status}</span>
      </div>
    </div>`;
  }).join('');

  $('#section-events').innerHTML = `
    <div class="section-head">
      <div>
        <h2>Upcoming events</h2>
        <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px">${state.events.length} events in your pipeline</div>
      </div>
      <div class="tabs">
        <div class="tab active">All</div>
        <div class="tab">This week</div>
        <div class="tab">This month</div>
      </div>
    </div>
    <div class="grid grid-3">${cards}</div>
  `;
}
</script>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(JS2)
    print("Part 4 written: dashboard + events")
