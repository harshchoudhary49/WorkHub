# Workforce ERP — Phases 1-11

**A note on updating this project:** every phase is delivered as the same
`erp-project` folder (client/ + server/) — always extract a new zip **on
top of** your existing folder, overwriting files, rather than into a new
sibling folder. That keeps Git seeing "these files changed" instead of "two
unrelated projects," which avoids the merge-conflict trap of one folder per
phase. Run `git pull` before you start layering in a new phase if you've
made any commits of your own in between.

Phases 2-10 delivered the entire feature set: auth, org management,
attendance, leave, tasks, goals/performance, communication, dashboards, and
the Workforce Command Center. Phase 11 adds the reports layer the brief
asked for - filterable, exportable reports across every module. Only
testing/security hardening/deployment (Phase 12) remains after this.

## Phase 11: Reports & analytics

**Backend additions**
- `report.service.js` - six report types (Attendance, Leaves, Employees,
  Tasks, Team performance, Workload), each returning an array of flat row
  objects ready for a table or a CSV, built around one shared
  `resolveEmployeeScope()` helper so "a manager only ever sees their own
  team's data" is enforced in exactly one place rather than once per report
  - **Attendance & Workload reports deliberately reuse existing logic**
    rather than reinventing it: the workload report calls the very same
    `computeTaskStats()` from Phase 6, and the performance report calls the
    very same `getOrCreateSnapshot()` from Phase 7 - so a number in a
    report can never quietly disagree with the same number shown live
    elsewhere in the app
  - The attendance report intentionally uses simpler math than the live
    Attendance pages (raw status counts within the date range, not the
    full working-day/holiday-exclusion percentage from Phase 4) - a report
    is for scanning totals at a glance; the nuanced version already exists
    where it belongs
- A small refactor: `getManagedEmployeeIds()` (previously copy-pasted
  separately into leave/task/goal/performance services - a deliberate
  choice at the time, noted in each phase's notes) is now also exported
  from `employee.service.js` for report.service.js to reuse, without
  touching the four existing copies - not worth the churn/regression risk
  of consolidating already-working code just for symmetry
- `GET /reports/{attendance,leaves,employees,tasks,performance,workload}`,
  all Manager/HR/Admin, all accepting date-range/department/team/employee/
  status filters (the exact filter set the brief asked for)

**Frontend additions**
- A single **Reports** page (Manager/HR/Admin) with a report-type switcher,
  a filter bar that adapts to what each report type actually needs (date
  range vs. month/year vs. none), and a results table
- **CSV export**: a small dependency-free utility (`utils/csv.js`) that
  handles comma/quote escaping properly rather than naively joining with
  commas
- **PDF export**: uses the browser's native print-to-PDF rather than
  pulling in a PDF-generation library - a `@media print` stylesheet hides
  everything except the report table (sidebar, header, filters, buttons),
  so clicking "Export PDF" opens the print dialog with a clean, printable
  report ready to save as a PDF. This is the "if practical" reading of the
  brief's CSV/PDF requirement - a real PDF library would work too, but adds
  a dependency and complexity that a print stylesheet doesn't need

### New/changed files

```
server/
  utils/validators/report.validators.js
  services/report.service.js
  services/employee.service.js   (exported getManagedEmployeeIds)
  controllers/report.controller.js
  routes/report.routes.js
  routes/index.js                (mounts the new router)

client/
  src/api/reportApi.js
  src/utils/csv.js
  src/pages/shared/Reports.jsx
  src/index.css                            (@media print rules added)
  src/components/layout/DashboardLayout.jsx  (sidebar/header marked no-print, nav updated)
  src/routes/AppRoutes.jsx                   (new route wired in)
```

### How to test Phase 11

1. Log in as `hr`/`admin`, go to **Reports**, generate the **Attendance**
   report with no filters - you should see every seeded employee with
   status counts from the last 30 days by default.
2. Switch to **Leaves**, filter by status = "approved" - should match what
   you'd see filtering the Leaves page itself for the same period.
3. Switch to **Workload**, confirm the workload labels match what the
   Manager dashboard's workload cards show for the same people (same
   underlying function, so they should always agree).
4. Click **Export CSV** - open the downloaded file and confirm columns and
   values look right, including any employee names/skills that contain
   commas (the CSV writer should have quoted them correctly).
5. Click **Export PDF** - the print dialog should open showing *only* the
   report table (no sidebar, no filters, no buttons) - use "Save as PDF" to
   confirm it produces a clean, readable document.
6. Log in as one of the seeded managers, go to **Reports**, generate the
   **Employees** report - confirm you only see your own team's members,
   even without setting a department/team filter yourself.
7. Try (via the API directly, since the UI won't offer it) requesting a
   specific `employee` id that isn't on your team as a manager - should
   come back empty rather than leaking that person's data.

## Phase 10: Workforce Command Center + interactive office map

**Backend additions**
- `Floor` and `Desk` models - this is also the phase where the `office`,
  `floor`, and `desk` fields that have sat unused on the `Employee` model
  since Phase 2's scaffolding finally get populated and read
- `Desk.assignedEmployee` and `Employee.desk` are kept in sync in both
  directions (`desk.service.js`'s `assignDesk`/`unassignDesk`) - the same
  pattern `team.service.js` uses for `Team.members` ↔ `Employee.team`, so
  the same design idea now covers seating as well as team membership. A
  sparse unique index on `Desk.assignedEmployee` makes "one desk per
  person" a database-level guarantee, not just an app-level convention
- `GET /workforce/overview`: org-wide counts (present/absent/on leave/
  remote/not-checked-in) for the Command Center's header - deliberately
  counts *every* active employee, not just desk-assigned ones, since a
  fully-remote employee with no desk still counts as present
- `GET /workforce/map`: the core endpoint - returns offices/floors/desks
  with each occupied desk enriched with that employee's **live** attendance
  status, check-in time, working hours, and up to 3 active tasks (reusing
  exactly the status logic Phase 4's team-attendance view established, so
  "present" means the same thing everywhere in the app). Supports
  office/floor/department/team/status/search filters - desks outside the
  selected office/floor are omitted, but desks *within* scope whose
  employee doesn't match department/team/status/search are still returned
  with `matchesFilter: false` so the frontend can dim them rather than
  leaving visible gaps in the floor plan
- `Floor`/`Desk` CRUD plus `POST /desks/:id/assign` and `/unassign`, all
  HR/Admin only (setting up the office layout is an admin task; viewing the
  resulting map is not)
- **On the "authorized managers" wording in the brief**: this build treats
  "any manager" as authorized to view the Command Center, since there's no
  per-manager permission flag yet. A real per-manager toggle would need one
  more field (e.g. `Employee.canViewWorkforceMap`) and a check alongside
  the existing role check in `workforce.routes.js` - straightforward to add
  if you want that finer control later
- No GPS, no screen/keystroke monitoring, no webcam anything - the map is
  built entirely from desk assignments (a seating chart) plus the same
  check-in/out and task data every other part of the app already uses for
  workforce coordination, exactly as the brief specified

**Frontend additions**
- **Workforce Command Center** page (Manager/HR/Admin): status header
  cards, office/floor/department/team/status/search filters, a color-coded
  floor-plan grid (🟢 present / 🔵 remote / 🟡 on leave / 🔴 absent / ⚪ not
  checked in - the exact marker legend from the brief), and a click-through
  detail panel per employee showing name, designation, team, status,
  check-in time, working hours, and active tasks
- **Office setup** page (HR/Admin only): add floors under an office, add
  desks at grid coordinates, and assign/unassign employees to desks via a
  simple dropdown per row - no drag-and-drop, but everything the map needs
- Real-time updates are still the polling/refresh approach used throughout
  (matching the brief's "start with normal API refresh, add real-time
  later" guidance) - `workforce.routes.js`'s comment marks exactly where a
  Socket.IO layer would slot in if that's worth adding later

### New/changed files

```
server/
  models/{Floor.js, Desk.js}
  utils/validators/workforce.validators.js
  services/{floor,desk,workforce}.service.js
  controllers/{floor,desk,workforce}.controller.js
  routes/{floor,desk,workforce}.routes.js
  routes/index.js               (mounts the new routers)
  seed/seed.js                  (extended with a floor plan + desk assignments)

client/
  src/api/{workforceApi,floorApi,deskApi}.js
  src/components/ui/DeskMarker.jsx
  src/pages/shared/WorkforceCommandCenter.jsx
  src/pages/hr-admin/OfficeSetup.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated: manager gets the map, HR/Admin also get Office setup)
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 10

1. Run `npm run seed` again if you haven't since this phase (it now also
   creates two floors and seats everyone at a desk).
2. Log in as `admin@nimbuslabs.io` or any of the three managers, open
   **Workforce map** - you should immediately see a populated floor plan
   with colored desk markers reflecting today's real attendance status.
3. Click an occupied desk - confirm the detail panel shows the right name,
   designation, team, check-in time, and any active tasks for that person.
4. Try the filters: pick a department or team and confirm non-matching
   desks visibly dim rather than disappearing; try the status filter and
   the search box.
5. As `hr`/`admin`, go to **Office setup**, add a new desk on an existing
   floor, assign an unseated employee (or the reverse - unassign someone) -
   confirm the change shows up on the Workforce map immediately.
6. Try assigning the same employee to two different desks - the second
   assignment should automatically free up their first desk rather than
   letting them occupy both (that's the sparse unique index + the
   `assignDesk` sync logic at work).
7. Log in as a plain `employee` account and confirm `/workforce` redirects
   to the unauthorized page - the map is manager/HR/Admin only.

## Phase 9: Dashboards, analytics, and seed data

**Backend additions**
- `analytics.service.js` (HR/Admin only) - four read-only aggregate
  endpoints that the earlier phases didn't have a reason to build yet:
  - `GET /analytics/overview`: today's org-wide attendance breakdown,
    pending leave count, overdue task count, and holidays in the next 30
    days, all in one call so the dashboard header doesn't need five
    round-trips
  - `GET /analytics/attendance-trend?days=14`: daily present/absent/leave/
    remote counts for a trend chart - reads only days that have actual
    Attendance records (i.e. have been through check-in or the Phase 4
    absentee sweep), so an unprocessed day just doesn't show a bar instead
    of silently showing zero
  - `GET /analytics/task-completion-by-department` and
    `/headcount-by-department`: bucketed for bar charts
  - Manager and Employee dashboards needed **no new backend work** - they
    compose data the API already exposed (`/attendance/team`,
    `/tasks/team`, `/leaves/team`, `/performance/team`, `/goals/me`,
    `/holidays`, `/announcements`, `/recognitions/me`), which is itself a
    decent sign the earlier phases' APIs were shaped sensibly
- `server/seed/seed.js` - a full demo dataset: 1 admin, 1 HR, 3 managers,
  16 employees across 3 teams/2 departments/1 office, ~4 weeks of
  attendance history per person (weighted toward "present" with a
  realistic mix of remote/half-day/absent/late), a completed leave +
  matching Attendance/LeaveBalance side effects for everyone, one *live*
  pending leave request per manager so there's something to approve
  immediately, 3-5 tasks per employee (including some overdue, for the
  dashboards to have something to flag), 1-2 goals per employee, a
  performance snapshot with manager-entered quality/collaboration scores
  and a feedback comment, a dozen recognitions, 3 announcements at
  different audience scopes, and 2 holidays (one past, one upcoming).
  Run with `npm run seed` from `server/`

**Frontend additions**
- **HR/Admin dashboard**: overview cards (employees, present today, pending
  leaves, overdue tasks), a 14-day attendance trend line chart, headcount
  and task-completion bar charts by department, and an upcoming-holidays
  list - all real Recharts components, not placeholders
- **Manager dashboard**: today's team attendance as a bar chart, task
  completion with a breakdown, pending leave count, team average
  contribution score, and goals-in-progress count - built entirely from
  data the Manager APIs from Phases 4-7 already returned
- **Employee dashboard**: rounded out with the three pieces the original
  brief asked for that hadn't landed yet - upcoming holidays, recent
  announcements, and recent recognition, alongside the attendance/leave/
  goals/performance widgets from earlier phases

### New/changed files

```
server/
  services/analytics.service.js
  controllers/analytics.controller.js
  routes/analytics.routes.js
  routes/index.js               (mounts the new router)
  seed/seed.js                  (was an empty placeholder folder)

client/
  src/api/analyticsApi.js
  src/pages/hr-admin/Dashboard.jsx   (rewritten with Recharts)
  src/pages/manager/Dashboard.jsx    (rewritten with Recharts)
  src/pages/employee/Dashboard.jsx   (holidays/announcements/recognition widgets added)
```

### How to test Phase 9

1. From `server/`, run `npm run seed` (make sure `MONGO_URI` in `.env`
   points at a database you're fine wiping - the script clears existing
   data first). It prints login credentials for every seeded account at
   the end; the demo password is the same for all of them
   (`Password123!`).
2. Log in as `admin@nimbuslabs.io` - the dashboard should immediately show
   a populated attendance trend, headcount by department, and task
   completion charts instead of empty states.
3. Log in as one of the three managers (e.g. `marcus.chen@nimbuslabs.io`) -
   their dashboard should show their specific team's attendance/tasks/
   performance, and **Leave requests** should already have one pending
   request waiting (seeded via the real `applyForLeave` service call, so
   it's a genuine live request, not a fake status).
4. Log in as any seeded employee (e.g. `liam.johnson@nimbuslabs.io`) - the
   dashboard should show real attendance history, a completed leave in
   their history, a couple of tasks (check whether any show as overdue),
   goals, a contribution score with manager feedback attached, and the new
   holidays/announcements/recognition widgets all populated.
5. Confirm the numbers roughly make sense against each other - e.g. the
   employee count on the HR dashboard should match `16 + 3 managers + 1 HR
   + 1 admin = 21`, and a manager's team size on their dashboard should
   match how many people are listed under their team in Phase 3's Teams
   page.

## Phase 8: Notifications + communication

The brief's notification list was: leave approval/rejection (Phase 5), new
task (Phase 6), **task deadline**, **announcement**, **recognition**,
manager feedback (Phase 7), goal updates (Phase 7). This phase fills in the
three still missing - which meant building the features that generate them
(announcements, recognition) alongside the notification wiring itself, plus
messaging since it's the other half of "communication" in the brief.

**Backend additions**
- **Task deadline reminders**: `POST /notifications/check-task-deadlines`
  (HR/Admin) sweeps for non-completed tasks due within N hours (default 24)
  and haven't already gotten a reminder (`Task.reminderSentAt`, so re-running
  the sweep doesn't spam). Same manual-trigger-for-now pattern as
  `mark-absentees` from Phase 4 - the natural Phase 12 cron target
- **`Announcement`** model (company/department/team-scoped) -
  `POST /announcements` (HR/Admin) resolves the actual audience and
  notifies everyone in it; `GET /announcements` returns what's relevant to
  *you* specifically (company-wide + your department + your team, not
  everything)
- **`Recognition`** model - any employee can recognize any other
  (teamwork/leadership/innovation/helping/excellence + a message), notifies
  the recipient, and everyone can see a company-wide feed as well as their
  own received/given history
- **`Message`** model supporting both direct messages and team channels
  (exactly one of `recipient`/`team` is set, enforced in the service layer).
  `getInbox()` builds a contact list with last-message-preview and
  per-contact unread counts by walking the message list once in JS rather
  than a Mongo aggregation pipeline - simpler to read, and fine at this
  scale. Team channels are scoped to actual membership (`assertTeamMember`)
- The notification bell (built in Phase 5) needed no changes - it's generic
  over `type`/`title`/`message`/`link`, so every new notification type here
  just slots in

**Frontend additions**
- Shared **Announcements** page (one component, all roles) - everyone sees
  a feed, HR/Admin additionally get a publish button and delete action
- Shared **Recognition** page - a feed/received/given tab switcher and a
  "give recognition" modal
- Shared **Messages** page - a two-pane layout: contacts + team channels on
  the left (unread badges), the active thread on the right, with a "new
  conversation" picker. Same 30s-poll-not-yet-websocket approach as the
  notification bell; deep-links from notifications (`?with=` / `?team=`)
  land directly on the right conversation

### New/changed files

```
server/
  models/{Announcement.js, Recognition.js, Message.js}
  models/Task.js                       (added reminderSentAt)
  utils/validators/{announcement,recognition,message}.validators.js
  services/{announcement,recognition,message}.service.js
  services/notification.service.js     (added checkTaskDeadlines sweep)
  controllers/{announcement,recognition,message}.controller.js
  controllers/notification.controller.js  (added checkTaskDeadlines)
  routes/{announcement,recognition,message}.routes.js
  routes/notification.routes.js        (added the sweep endpoint)
  routes/index.js                      (mounts the new routers)

client/
  src/api/{announcementApi,recognitionApi,messageApi}.js
  src/pages/shared/{Announcements,Recognition,Messages}.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated, all roles)
  src/routes/AppRoutes.jsx                   (new shared routes wired in)
```

### How to test Phase 8

1. As `hr`/`admin`: go to **Announcements**, publish one scoped to a
   specific department. Log in as someone in that department - confirm
   they see it and got notified; log in as someone in a *different*
   department - confirm they don't see it.
2. As any employee: go to **Recognition**, give someone a shout-out. Check
   it shows in the company feed, in your "given" tab, and in their
   "received" tab - and that they got notified.
3. As any employee: go to **Messages**, start a new conversation with a
   coworker, send a message. Log in as that coworker - confirm the unread
   badge shows in their contact list, the message appears, and it's marked
   read once they open the thread.
4. If you're on a team (Phase 3): open its channel under "Team channels" in
   **Messages**, send a message - confirm other team members (not just the
   manager) get notified and can see/reply in the same channel.
5. As `hr`/`admin`: create a task (Phase 6) due within the next few hours,
   then hit `POST /notifications/check-task-deadlines` directly (no UI
   button for this one - it's meant to be a backend/cron trigger). Confirm
   the assignee gets a "due soon" notification, and that running the sweep
   again doesn't send a second one for the same task.

## Phase 7: Goals + performance analytics

**Backend additions**
- `Goal` model: title/description/progress (0-100, drives status
  automatically: 0 → not-started, 1-99 → in-progress, 100 → completed),
  optional due date, `createdBy` (self or a manager/HR/Admin)
- `POST /goals`: employees can only create goals for themselves; managers
  can create for themselves or their own team; HR/Admin for anyone
- `PATCH /goals/:id` (owner only): edit details and log progress - status
  updates automatically from the progress value
- `POST /goals/:id/review` (manager/HR/Admin, team-scoped for managers):
  the "review" step from the brief - set status directly (e.g. approve as
  completed, or cancel) with an optional comment that shows up on the
  employee's card
- `Performance` model: one snapshot per employee/month/year. Six factors -
  task completion rate, on-time delivery rate, quality score, collaboration
  score, goals-achieved rate, and reliability score (**this is literally
  the Phase 4 attendance percentage for that month** - a clean example of
  reusing what earlier phases already computed rather than inventing a
  second measure of the same thing)
- **`weightedAverage()`** in `performance.service.js`: the contribution
  score is a weighted average of those six factors, but any factor with no
  data for the period (e.g. no tasks were due that month) is dropped and
  the remaining weights are renormalized - so a slow month for one metric
  doesn't unfairly tank the score, and a new hire isn't penalized for
  goals/tasks that don't exist yet. Verified by hand: with one factor
  (goals) missing, five remaining weights totaling 90 correctly renormalize
  to produce the right weighted result
- Quality and collaboration scores are **always manager-entered**, never
  auto-computed - the system doesn't invent a number for something
  genuinely subjective. Everything else is recomputed fresh every time a
  snapshot is viewed, so it always reflects current task/goal/attendance
  data, while manager-entered fields and feedback history persist
  (`getOrCreateSnapshot` in `performance.service.js`)
- Workload label (low/balanced/high) rides along as context on each
  snapshot, reusing `computeTaskStats` from Phase 6 rather than
  recalculating it - **the brief's "don't label people, only the load"
  rule is enforced in exactly one place** in the codebase
- `GET /performance/me`, `/me/history` (trend), `/team` (manager, with a
  team average), `/:employeeId` (manager/HR/Admin), and
  `POST /:employeeId/feedback` (manager/HR/Admin, team-scoped for managers)
  to set quality/collaboration scores and leave a comment

**Frontend additions**
- Employee **Goals** page: goal cards with a progress slider, and **Performance**
  page: contribution score, a full metric breakdown, manager feedback, and
  a small trend chart across recent months
- Manager **Team goals** page (assign + review) and **Team performance**
  page (per-member scores + a "give feedback" modal)
- HR/Admin equivalents with employee/period pickers instead of an implicit
  "my team"
- Employee dashboard now also shows active goals and a performance summary
  tile

### New/changed files

```
server/
  models/{Goal.js, Performance.js}
  config/env.js                       (extended with performance weights)
  .env.example                        (extended)
  utils/validators/{goal,performance}.validators.js
  services/{goal,performance}.service.js
  controllers/{goal,performance}.controller.js
  routes/{goal,performance}.routes.js
  routes/index.js                     (mounts the new routers)

client/
  src/api/{goalApi,performanceApi}.js
  src/components/ui/GoalStatusBadge.jsx
  src/pages/employee/{Goals,Performance}.jsx
  src/pages/employee/Dashboard.jsx    (goal + performance widgets added)
  src/pages/manager/{Goals,Performance}.jsx
  src/pages/hr-admin/{Goals,Performance}.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated)
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 7

1. As an `employee`: go to **Goals**, add one, drag the progress slider and
   save - watch the status label move from "not started" to "in progress"
   automatically.
2. As their manager: go to **Team goals**, review it - set it to
   "completed" with a comment. Back as the employee, confirm the comment
   shows on the goal card and the status/progress updated.
3. As the employee: go to **Performance** - with no tasks/goals due yet
   this month, most factors should show "No data yet" rather than a
   misleading 0%, and the contribution score should still compute from
   whatever data *does* exist (attendance, mainly, via reliability score).
4. Complete a couple of tasks on time (Phase 6) and a goal within the
   current month, then revisit **Performance** - task completion, on-time
   delivery, and goals-achieved rates should now be populated and the
   contribution score should reflect them.
5. As the manager: go to **Team performance**, give someone a quality/
   collaboration score and a comment. Confirm it shows up on their
   Performance page and the contribution score updates accordingly.
6. As `hr`/`admin`: go to **Performance**, pick any employee (not just
   people on "your" team, since HR/Admin aren't scoped) and a past month -
   confirm the period picker actually changes which snapshot you're
   looking at.

## Phase 6: Task management

**Backend additions**
- `Task` model: title/description, `assignee` + `assignedBy` (both
  `Employee` refs), optional `team`, priority (low/medium/high/urgent),
  status (`TODO` → `IN_PROGRESS` → `REVIEW` → `COMPLETED`/`BLOCKED`), due
  date, estimated/actual hours, and `completedAt` (auto-set/cleared as
  status moves in and out of `COMPLETED`)
- `POST /tasks` (manager/HR/Admin): a manager can only assign to their own
  team's members (checked via team membership, not just `Employee.manager`,
  so it works however a team was set up); HR/Admin can assign to anyone.
  Assigning notifies the employee
- `PATCH /tasks/:id/status` (the assignee only): the narrow, employee-facing
  endpoint - just status and optionally logging actual hours so far.
  Notifies whoever assigned the task when it moves
- `PATCH /tasks/:id` / `DELETE /tasks/:id` (manager/HR/Admin): full edit,
  same team-scoping rule as creation
- `computeTaskStats()` in `task.service.js` - a small pure function (list
  of tasks in, `{ completionPercentage, overdue, active, workloadLabel }`
  out) so completion %, overdue detection, and workload labeling are
  computed the same way everywhere they're used, and are easy to unit-test
  in isolation from the database. Workload is intentionally reported as
  **low / balanced / high**, never as a judgment about the person (per the
  brief: no "lazy" labels)
- `GET /tasks/me`, `/tasks/team` (manager - includes a per-member workload
  breakdown), `/tasks` (HR/Admin, filterable by status/priority/employee/
  team/overdue)

**Frontend additions**
- Employee **Tasks** page: completion/overdue/active summary cards, a task
  table with an inline status dropdown (overdue rows are visually flagged)
- Manager **Team tasks** page: per-member workload cards (with the neutral
  low/balanced/high badge) plus an "Assign task" modal and the full team
  task list
- HR/Admin **Tasks** page: org-wide completion/overdue stats with
  status/employee filters

### New/changed files

```
server/
  models/Task.js
  config/env.js                    (extended with workload thresholds)
  .env.example                     (extended)
  utils/validators/task.validators.js
  services/task.service.js
  controllers/task.controller.js
  routes/task.routes.js
  routes/index.js                  (mounts the new router)

client/
  src/api/taskApi.js
  src/components/ui/{TaskStatusBadge,PriorityBadge,WorkloadBadge}.jsx
  src/components/ui/Select.jsx     (label now optional, for inline use)
  src/pages/employee/Tasks.jsx
  src/pages/manager/Tasks.jsx
  src/pages/hr-admin/Tasks.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated)
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 6

1. As a `manager` (with a team assigned in Phase 3): go to **Team tasks**,
   check the workload cards show "low workload" for members with no tasks
   yet, then assign a task to someone with a due date in the past (to test
   overdue) and one in the future.
2. As that employee: go to **Tasks**, see both, confirm the past-due one is
   flagged "overdue" and highlighted. Move it through statuses via the
   dropdown - watch the completion % and overdue count update.
3. Move it to `COMPLETED` - confirm it drops out of the overdue count and
   the manager's workload card for that person updates (active count down,
   completed count up).
4. As `hr`/`admin`: go to **Tasks**, filter by employee/status, confirm you
   see tasks across every team, not just one manager's.
5. Try creating a task as a manager for someone *not* on your team (e.g. by
   hitting the API directly) - should be rejected with a 403.
6. Check the notification bell picks up "new task assigned" (as the
   employee) and "task moved to X" (as the assigner) events.

## Phase 5: Leave management

**Backend additions**
- `Leave` model (casual/sick/earned/wfh/emergency; pending → approved/
  rejected, or cancelled) and `LeaveBalance` (one doc per employee/year/
  type, with `remaining` as a virtual so it can never drift out of sync
  with allocated/used)
- A minimal `Notification` model + service, built now because leave status
  changes need somewhere to land - `POST /leaves` notifies the employee's
  manager, and approve/reject notify the employee. Phase 8 will expand this
  with more notification types and possibly a real-time transport; for now
  the bell in the header polls every 30s
- `POST /leaves` (apply): validates the date range isn't in the past,
  computes the requested day count as **working days only** (weekends and
  company holidays excluded, reusing the same holiday-lookup helper as
  Attendance), rejects overlapping requests, and checks remaining balance
  (allocated − used − *other pending* requests of the same type, so two
  simultaneous pending requests can't both later be approved past the
  allocation)
- `POST /leaves/:id/approve` / `reject`: manager can only decide on their
  own team's requests (checked via `Employee.manager`), HR/Admin can decide
  on anyone's. Approval deducts the balance and **writes Attendance
  records** for each working day in the range (`status: 'leave'`, or
  `'remote'` for WFH) so the two systems agree
- `POST /leaves/:id/cancel` (employee, own requests only): refunds balance
  and removes the Attendance side-effect for any day that hasn't happened
  yet; blocked once the leave has fully elapsed, to preserve history
- `GET /leaves/balance`, `/leaves/me`, `/leaves/team` (manager), `/leaves`
  (HR/Admin, filterable by status/type/employee)
- Configurable default annual allocations via `.env` (same pattern as the
  attendance settings)

**Frontend additions**
- Employee **Leaves** page: balance cards per type (with a "pending"
  callout), an apply form, and a request history table with cancel
- Manager **Leave requests** page: a pending queue with approve/reject,
  plus decided-request history
- HR/Admin **Leaves** page: org-wide list with status/type filters and the
  same approve/reject actions
- A notification bell in the header (unread badge, dropdown, mark-read /
  mark-all-read, click-through to the relevant page)
- Employee dashboard now also shows a leave balance summary

### New/changed files

```
server/
  models/{Leave.js, LeaveBalance.js, Notification.js}
  config/env.js                     (extended with leave allocations)
  .env.example                      (extended)
  utils/validators/leave.validators.js
  services/{leave,notification}.service.js
  controllers/{leave,notification}.controller.js
  routes/{leave,notification}.routes.js
  routes/index.js                   (mounts the new routers)

client/
  src/api/{leaveApi,notificationApi}.js
  src/components/layout/NotificationBell.jsx
  src/components/layout/DashboardLayout.jsx  (bell + nav updated)
  src/components/ui/StatusBadge.jsx          (leave-status colors added)
  src/pages/employee/{Leaves.jsx, Dashboard.jsx (balance widget added)}
  src/pages/manager/Leaves.jsx
  src/pages/hr-admin/Leaves.jsx
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 5

1. As an `employee`: go to **Leaves**, check your starting balances (12
   casual / 10 sick / 15 earned / 60 wfh / 5 emergency by default), apply
   for a couple of days of casual leave starting tomorrow.
2. As their manager: go to **Leave requests**, see it in the pending queue,
   approve it. Check the notification bell shows the employee got notified
   (log in as them to see it, or just trust the `/notifications` API).
3. Back as the employee: **Leaves** should show the request as "approved"
   and the casual balance should have gone down by the requested day count.
   Go to **Attendance** for those dates - they should show status "leave"
   (not "absent"), and not count against the attendance percentage.
4. Try applying for overlapping dates - should be rejected with a clear
   error. Try applying for more days than your remaining balance - same.
5. Cancel a future approved leave as the employee - balance should be
   refunded and the Attendance "leave" records for the untouched future
   days should disappear.
6. As `hr`/`admin`: go to **Leaves**, filter by status/type, approve or
   reject something outside your own team (HR/Admin aren't restricted to
   "their" team the way a manager is).
7. Try applying for a WFH leave - on approval, check Attendance shows
   "remote" for those days (and that it still counts as present-equivalent
   in the attendance percentage, since WFH is still working).

## Phase 4: Attendance system

**Backend additions**
- `Attendance` model: one record per `(employee, date)`, storing check-in/
  check-out times, computed working hours, lateness, overtime, mode
  (office/remote), and status (present / absent / half-day / leave /
  holiday / weekend / remote)
- `Holiday` model (company-wide or office-specific) so attendance % excludes
  holidays from the working-day count, same as it already excludes weekends
- Configurable rules via `.env` (with sensible defaults): standard check-in
  time, late grace period, standard work hours, half-day threshold,
  attendance target %, which weekdays count as the weekend
- `POST /attendance/check-in` / `check-out` - self-service, computes
  lateness on check-in and working hours/overtime/half-day status on
  check-out
- `GET /attendance/me` and `GET /attendance/:employeeId` (manager/HR/admin)
  return a full month's records plus **computed stats**: percentage,
  breakdown by status, and **how many more present days are needed to hit
  the target %** (see `calculateAttendanceStats` in
  `attendance.service.js` - a pure, isolated function so the math is easy
  to follow and to unit test independently of the database)
- `GET /attendance/team` (manager) - today's (or any date's) status for
  everyone on the manager's team(s), correctly distinguishing
  "not checked in yet" (today) from "absent" (past days), and "weekend"/
  "holiday" from either
- `POST /attendance/mark-absentees` (HR/Admin) - bulk-marks anyone without
  a record for a given date as absent, skipping weekends/holidays. Meant to
  run once at end-of-day; Phase 12 is the natural place to wire this to a
  real scheduler (`node-cron`) instead of a manual button
- `POST /attendance/manual` (HR/Admin) - corrects or backfills a single
  employee/date record
- Full holiday CRUD (`/holidays`), HR/Admin-only writes

**The attendance-percentage math**, in plain terms: given how many working
days have elapsed this month (weekends and holidays excluded) and how many
of those the employee was present for, we solve for the smallest N such
that `(present + N) / (workingDays + N) >= target%`. That's what's shown on
the dashboard as "X more present days needed."

**Frontend additions**
- Employee **Attendance** page: check-in (office/remote) and check-out
  buttons, today's status, this month's % with a progress bar and the
  "N more days needed" message, a status breakdown, and a full monthly
  table with a month/year picker
- Employee dashboard now shows a live "today" + "this month" attendance
  widget instead of a placeholder
- Manager **Team attendance** page: today's (or any date's) roster for
  their team with status counts
- HR/Admin **Attendance** page: run "mark absentees" for any date, and look
  up any employee's monthly attendance/stats
- HR/Admin **Holidays** page: simple CRUD list

### New/changed files

```
server/
  models/{Attendance.js, Holiday.js}
  config/env.js                        (extended with attendance settings)
  .env.example                         (extended)
  utils/dateUtils.js
  utils/validators/{attendance,holiday}.validators.js
  services/{attendance,holiday}.service.js
  controllers/{attendance,holiday}.controller.js
  routes/{attendance,holiday}.routes.js
  routes/index.js                      (mounts the new routers)

client/
  src/api/{attendanceApi,holidayApi}.js
  src/components/ui/{ProgressBar,StatusBadge}.jsx
  src/pages/employee/Attendance.jsx
  src/pages/employee/Dashboard.jsx     (rewritten with live widget)
  src/pages/manager/Attendance.jsx
  src/pages/hr-admin/{Attendance,Holidays}.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated)
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 4

1. Log in as an `employee`. Go to **Attendance**, check in (try both
   "office" and "remote" on different days if you want to see the mode
   distinction), then check out. Watch working hours/percentage update.
2. To see lateness: temporarily set `STANDARD_CHECKIN_TIME` in `.env` to a
   time in the past (e.g. an hour ago) and restart the server, then check
   in - `lateByMinutes` should be non-zero on the record.
3. As `hr`/`admin`: go to **Holidays**, add one for today, then go to
   **Employees** → check an employee's monthly percentage excludes it (you
   may need to check in a day *other* than the holiday to see the effect
   clearly, or just confirm the "breakdown" doesn't add today's date as a
   working day if you check in on it anyway — the model still lets you
   check in on a holiday, it just doesn't count against you in the
   denominator).
4. As `hr`/`admin`: go to **Attendance**, pick yesterday's date, click
   "Run for this date" - any active employee without a record for that day
   should get marked absent.
5. Assign a manager to a team (Phase 3's Teams page) with some members, log
   in as that manager, and check **Team attendance** shows the roster with
   live per-person status for today.
6. Confirm the "days needed to reach target" message appears once an
   employee has missed enough days to fall under 75% for the month, and
   disappears (replaced by "You're on target") once caught up.

## Phase 3: Employee, Department, Team & Office management

**Backend additions**
- `Office`, `Department`, `Team` models, referencing each other and `Employee`
- Full CRUD services/controllers/routes for all three, HR/Admin-only for
  writes, read-only for everyone else (any authenticated user can browse
  the org structure)
- Employee CRUD extended: `createEmployee` (HR/Admin, creates login + profile
  with an explicit role), `updateEmployeeAdmin` (full edit incl. role/status),
  `updateOwnProfile` (self-service, narrow field set: skills/avatar only),
  `deactivateEmployee` (soft delete, default/recommended), `removeEmployee`
  (hard delete, Admin-only)
- Team membership is kept in sync automatically: adding/removing a member on
  a Team updates that Employee's `team` field and vice versa, so the two
  never drift apart
- Deletion guards: an Office can't be deleted while Departments reference
  it; a Department can't be deleted while Teams reference it

**Frontend additions**
- HR/Admin pages: Employees (table + add/edit modal, search, deactivate/
  remove), Departments (table + modal), Teams (cards + modal with a member
  checklist), Offices (cards + modal)
- Employee "My profile" page (visible to every role) - read-only org details
  populated from `/auth/me`, plus a self-editable skills field
- New shared UI: `Modal`, `Select`, `EmptyState`, `Banner`
- Nav updated per role: HR/Admin see Employees/Departments/Teams/Offices;
  everyone sees "My profile"

### New/changed files

```
server/
  models/{Office.js, Department.js, Team.js}
  utils/validators/{office,department,team,employee}.validators.js
  services/{office,department,team}.service.js
  services/employee.service.js        (extended)
  controllers/{office,department,team}.controller.js
  controllers/employee.controller.js  (rewritten with full CRUD)
  routes/{office,department,team}.routes.js
  routes/employee.routes.js           (extended)
  routes/index.js                     (mounts the new routers)

client/
  src/api/{officeApi,departmentApi,teamApi,employeeApi}.js
  src/components/ui/{Modal,Select,EmptyState,Banner}.jsx
  src/pages/hr-admin/{Employees,Departments,Teams,Offices}.jsx
  src/pages/employee/Profile.jsx
  src/components/layout/DashboardLayout.jsx  (nav updated)
  src/routes/AppRoutes.jsx                   (new routes wired in)
```

### How to test Phase 3

1. Log in as an `hr` or `admin` user (see Phase 2 instructions to promote
   one via MongoDB if you haven't already).
2. Go to **Offices** → add an office.
3. Go to **Departments** → add a department, assigning it to that office.
4. Go to **Teams** → add a team under that department; optionally assign a
   manager and check off some members from the list.
5. Go to **Employees** → add a new employee, assigning them to the
   department/team you just created. Try editing one, deactivating one.
6. Log in as an `employee`-role account → go to **My profile**, confirm you
   can see (but not change) department/team/manager, and can update the
   skills field.
7. Confirm a plain `employee` account gets redirected away from `/hr/*`
   routes (RBAC), and that hitting those API routes directly without the
   right role returns `403`.

## Phase 2: Project Setup + Authentication

This phase delivered a runnable skeleton: Express + MongoDB backend with JWT
authentication and RBAC, and a Vite + React + Tailwind frontend with
role-based routing.

## What's implemented

**Backend (`server/`)**
- Express app with security middleware (helmet, cors, rate limiting)
- MongoDB connection via Mongoose
- `User` (auth) and `Employee` (profile) models, kept separate on purpose
- JWT auth: short-lived access token (returned in the JSON body, kept in
  memory on the frontend) + long-lived refresh token (httpOnly cookie,
  scoped to `/api/auth`)
- Refresh-token rotation with reuse detection (a stolen/replayed refresh
  token invalidates the session instead of silently succeeding)
- `bcryptjs` password hashing (12 salt rounds)
- RBAC middleware (`authorize('hr', 'admin')`) demonstrated on a sample
  `/api/employees/admin-check` route
- Centralized error handling (`ApiError` / `errorHandler`) and a consistent
  success envelope (`ApiResponse`)
- Request validation via `zod`

**Frontend (`client/`)**
- Vite + React + Tailwind, dev proxy to the backend on `/api`
- `AuthContext` managing the in-memory access token + silent refresh on load
- Axios interceptor that retries a request once after a silent token
  refresh on 401
- `ProtectedRoute` supporting both "must be logged in" and "must have role X"
- Login and Register pages, role-based post-login redirect
- Minimal `DashboardLayout` shell with per-role nav and placeholder
  dashboards for Employee / Manager / HR-Admin

## Files created

```
server/
  config/{env.js, db.js}
  models/{User.js, Employee.js}
  services/{token.service.js, auth.service.js}
  middleware/{auth.middleware.js, rbac.middleware.js, validate.middleware.js, error.middleware.js}
  utils/{ApiError.js, ApiResponse.js, asyncHandler.js, validators/auth.validators.js}
  controllers/{auth.controller.js, employee.controller.js}
  routes/{auth.routes.js, employee.routes.js, index.js}
  app.js, server.js, package.json, .env.example

client/
  src/api/{axiosClient.js, authApi.js}
  src/context/AuthContext.jsx
  src/hooks/useAuth.js
  src/routes/{ProtectedRoute.jsx, RoleRedirect.jsx, AppRoutes.jsx}
  src/components/layout/DashboardLayout.jsx
  src/components/ui/{Button.jsx, TextField.jsx}
  src/pages/auth/{Login.jsx, Register.jsx, Unauthorized.jsx, NotFound.jsx}
  src/pages/employee/Dashboard.jsx
  src/pages/manager/Dashboard.jsx
  src/pages/hr-admin/Dashboard.jsx
  src/{main.jsx, App.jsx, index.css}
  index.html, vite.config.js, tailwind.config.js, postcss.config.js, package.json
```

## How to run it

**Prerequisites:** Node.js 18+, a MongoDB instance (local `mongod` or a free
MongoDB Atlas cluster).

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, and change JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
# to long random strings (e.g. `openssl rand -hex 32`)
npm install
npm run dev
```

Server starts on `http://localhost:5000`. Check `http://localhost:5000/health`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Client starts on `http://localhost:5173` and proxies `/api` calls to the
backend automatically (see `vite.config.js`).

### 3. Try it end-to-end

1. Go to `http://localhost:5173/register`, create an account (this always
   creates an `employee` role — that's intentional, see `auth.controller.js`).
2. Log in — you'll land on `/employee/dashboard`.
3. To test RBAC: in MongoDB, manually change that user's `role` field to
   `hr` or `admin` (e.g. via `mongosh` or Compass), log out, and log back
   in. You should now land on `/hr/dashboard`, and
   `GET /api/employees/admin-check` (try it with the bearer token from
   DevTools, or just note that an `employee`-role user gets a 403 on it)
   should return `200`.
4. Refresh the page while logged in — you should stay logged in (silent
   refresh via the httpOnly cookie), because the access token itself is
   only ever kept in memory.

## Why these choices

- **Access token in memory, refresh token in an httpOnly cookie**: the
  access token never touches `localStorage`/`sessionStorage`, so it isn't
  readable by an XSS payload; the refresh token is inaccessible to any JS
  at all, and scoped to `/api/auth` only.
- **User vs. Employee split**: auth/security fields and HR/org fields
  change at very different rates and are edited by very different flows
  (self-service login vs. HR editing a profile) — keeping them in separate
  collections avoids a bloated, permission-tangled document.
- **Public registration always creates `employee` role**: prevents anyone
  from self-granting `manager`/`hr`/`admin` through the public form. Phase 3
  will add an Admin/HR-only "create employee with role X" endpoint.

## Next: Phase 12

Testing, security hardening, and deployment: automated tests for the
trickiest business logic (attendance %, leave balances, the weighted
performance score), a security pass (rate limiting coverage, input
sanitization, dependency audit), and deployment instructions/config for a
real hosting target.
