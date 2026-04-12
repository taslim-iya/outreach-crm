#!/usr/bin/env python3
"""Part 2: appends HTML body markup (sidebar, topbar, sections) to index.html."""

BODY = r"""
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Boot overlay (while we resolve session) -->
<div class="boot-overlay show" id="bootOverlay">
  <div class="spinner"></div>
  <div class="boot-label">Connecting...</div>
</div>

<!-- Auth screen -->
<div class="auth-wrap" id="authWrap">
  <div class="auth-card">
    <div class="auth-logo">E</div>
    <h2>Cambridge ETA Club</h2>
    <div class="auth-sub">Sign in to the management platform</div>
    <div class="auth-tabs">
      <div class="tab active" data-auth-tab="signin" onclick="setAuthTab('signin')">Sign in</div>
      <div class="tab" data-auth-tab="signup" onclick="setAuthTab('signup')">Create account</div>
    </div>
    <div class="auth-error" id="authError"></div>
    <div id="authFieldName" class="field" style="display:none"><label>Full name</label><input class="input" id="authName" placeholder="e.g. Taslim Iya"/></div>
    <div class="field"><label>Email</label><input class="input" id="authEmail" type="email" placeholder="you@cambridge-eta.co.uk"/></div>
    <div class="field"><label>Password</label><input class="input" id="authPassword" type="password" placeholder="At least 8 characters"/></div>
    <button class="btn btn-primary auth-submit" id="authSubmit" onclick="handleAuthSubmit()">Sign in</button>
    <div class="auth-hint" id="authHint">The first person to sign up becomes the Owner. Everyone else starts as a Member and the Owner grants access.</div>
  </div>
</div>

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
    <div class="nav-item" data-nav="notes">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <span>Notes</span>
      <span class="badge" id="notesBadge" style="display:none">0</span>
    </div>
    <div class="nav-item" data-nav="team" data-owner-only>
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="11" r="4"/><path d="M22 11l-3 3-1.5-1.5"/><path d="M19 3a3 3 0 0 1 0 6"/></svg>
      <span>Team</span>
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
      <div class="user-switcher" id="userSwitcher">
        <button class="user-chip" onclick="toggleUserMenu(event)">
          <div class="avatar" id="chipAvatar">TI</div>
          <div style="text-align:left;min-width:0">
            <div class="chip-name" id="chipName">Taslim Iya</div>
            <div class="chip-role" id="chipRole">Owner</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.6"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="user-menu" id="userMenu"></div>
      </div>
      <button class="icon-btn" title="Toggle theme" id="themeToggle">
        <svg id="themeIconDark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg id="themeIconLight" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      </button>
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
    <section class="section" id="section-notes"></section>
    <section class="section" id="section-team"></section>
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
