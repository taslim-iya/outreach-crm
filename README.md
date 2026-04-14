# Cambridge ETA Club Management Platform

A single-file, localStorage-backed web app for running the Cambridge ETA Club's
internal operations: events calendar, task board, investor/member CRM, team
notes, permission-based team management, and a built-in AI assistant.

Zero backend. Zero build step. Zero accounts. Open the page, everything lives
in your browser.

## What's in this repo

```
index.html      The whole app. Self-contained HTML + CSS + JS.
                Opens directly in any modern browser with no server.
vercel.json     Tells Vercel to serve index.html as a static site with a
                SPA catch-all rewrite. No install, no build.
build.py        Head + CSS (part 1 of the HTML generator)
build2.py       Body markup shell (topbar, sidebar, modals container)
build3.py       State, data layer, LocalQuery shim, helpers
build4.py       Dashboard and Events sections
build5.py       Tasks, CRM, Notes, Team, Modals, AI assistant, router
```

`index.html` is assembled by running the five Python scripts in order:

```bash
python3 build.py && python3 build2.py && python3 build3.py \
  && python3 build4.py && python3 build5.py
```

Each script appends to `index.html`. The split exists because the original
tool used to generate the file had a per-write size cap; you can merge them
into one script any time if you prefer.

## Features

**Dashboard**
- KPI strip (members, upcoming events, open tasks, task completion rate)
- Upcoming events list
- Task queue (filtered by assignee for non-owners, everything for the owner)
- Team progress strip (owner only, with empty-state when no teammates yet)
- Pinned notes

**Events**
- Create, edit, delete events
- Venue, time, capacity, description, status (Open / Closed / Cancelled)
- Chronological list with past/upcoming split

**Tasks**
- Create, assign, prioritise, complete
- Owner sees all tasks; team members only see their own
- Project grouping, due-date sorting, overdue highlighting

**CRM**
- Member directory: investors, mentors, alumni, students
- Tier system (Platinum / Gold / Silver), chapter, status
- Full contact details and notes per member

**Notes**
- Three visibility levels: public, private-to-author, direct-to-member
- "For me" tab collects direct notes the owner has written to you
- Pinning, title + body, full text search

**Team management** (owner only)
- Add team members with name / email / role / permission checkboxes
- Toggle each member's access to dashboard / events / tasks / crm / notes
- Write direct notes to individual members
- Live per-member task completion percentage

**AI assistant**
- Slide-in chat drawer accessible from the topbar
- Uses Claude directly from the browser with your own Anthropic API key
  (stored in localStorage, never sent anywhere else)
- Six tools: create_task, create_event, create_member, create_note,
  list_tasks, list_events — the assistant can actually add and query data
- First-time users see a one-time setup card asking for their key

**Theming**
- Dark theme (default) and pure-white light theme
- Persisted in localStorage, smooth transitions

**Data**
- Everything persists in localStorage under the key `eta-local-data-v1`
- "Reset all data" button in the user menu wipes the key and reloads
- No server, no cookies, no third-party tracking, nothing leaves the browser
  except font requests to Google Fonts and (optionally) AI calls to
  Anthropic if you've set an API key

## Deploy

Deploys as a static site on any host that can serve an HTML file. Tested on
Vercel with the `vercel.json` in this repo; the configuration disables all
framework auto-detection and serves `index.html` verbatim.

To deploy on Vercel:
1. Import this repository in the Vercel dashboard
2. Framework Preset: **Other** (Vercel will auto-detect this because there's
   no `package.json` in the repo)
3. Build & Development Settings: leave defaults
4. Click **Deploy**

First deployment takes about 10 seconds. Every subsequent push to `main`
redeploys automatically.

## Licence

Private, internal use by Cambridge ETA Club.
