#!/usr/bin/env python3
"""Part 2: appends HTML body markup (sidebar, topbar, sections) to index.html."""

BODY = r"""
<aside class="sidebar">
  <div class="brand">
    <div class="brand-mark">E</div>
    <div class="brand-text">
      <div class="title">Cambridge ETA</div>
      <div class="sub">Club Platform</div>
    </div>
  </div>

  <div class="nav-label">Workspace</div>
  <div class="nav">
    <div class="nav-item active" data-nav="dashboard">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
      <span>Dashboard</span>
    </div>
    <div class="nav-item" data-nav="events">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span>Events</span>
      <span class="badge">4</span>
    </div>
    <div class="nav-item" data-nav="tasks">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <span>Tasks</span>
    </div>
    <div class="nav-item" data-nav="crm">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span>Members CRM</span>
    </div>
  </div>

  <div class="sidebar-footer">
    <div class="user-card">
      <div class="avatar">TI</div>
      <div class="info">
        <div class="name">Taslim Iya</div>
        <div class="role">Club President</div>
      </div>
    </div>
  </div>
</aside>

<main class="main">
  <header class="topbar">
    <div>
      <div class="page-title" id="pageTitle">Dashboard</div>
      <div class="page-subtitle" id="pageSubtitle">Your club at a glance</div>
    </div>
    <div class="topbar-right">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search members, events, tasks..." />
      </div>
      <button class="icon-btn" title="Notifications">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="dot"></span>
      </button>
      <button class="btn btn-primary" id="primaryBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span id="primaryBtnLabel">New Event</span>
      </button>
    </div>
  </header>

  <div class="content">
    <section class="section active" id="section-dashboard"></section>
    <section class="section" id="section-events"></section>
    <section class="section" id="section-tasks"></section>
    <section class="section" id="section-crm"></section>
  </div>
</main>

</div>

<div class="modal-back" id="modalBack">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div id="modalBody"></div>
  </div>
</div>

<div class="toast" id="toast">
  <div class="toast-icon">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  </div>
  <div>
    <div style="font-size:13px;font-weight:600" id="toastTitle">Saved</div>
    <div style="font-size:11.5px;color:var(--text-muted)" id="toastMsg">Changes applied.</div>
  </div>
</div>
"""

if __name__ == "__main__":
    with open("index.html","a") as f:
        f.write(BODY)
    print("Part 2 written: body markup")
