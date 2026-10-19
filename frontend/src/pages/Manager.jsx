import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, CalendarOff, CalendarCheck, ListTodo, CheckCircle2, Plus } from "lucide-react";
import { api, useGet } from "../api";
import { Header, Stat, Card, Table, Badge, Btn, Field, inputCls, inputBase, Modal, Alert, useAction, useConfirm, Toolbar, Segmented, Avatar, EmptyState, PageSkeleton, TaskStatus, DueDate, daysBetween, leaveDates, localToday, longToday, fmtDate, isOverdue, matches } from "../ui";

const useTeam = () => {
  const [team, , loading, error] = useGet("/manager/team");
  return [team, (id) => team.find((e) => e.id === id)?.name || `#${id}`, loading, error];
};
const count = (rows, pred) => rows.filter(pred).length;

// Approve is one click; reject asks first. busyId keeps the row's buttons disabled while saving.
const useDecide = (reload, name) => {
  const [, run] = useAction({ toastErrors: true });
  const [confirmEl, ask] = useConfirm();
  const [busyId, setBusyId] = useState(null);
  const decide = async (r, s) => {
    if (s === "rejected" && !(await ask({ title: `Reject ${name(r.employee_id)}'s leave?`, body: `${r.leave_type} leave, ${leaveDates(r)}. They'll see the request as rejected.`, confirmText: "Reject request" }))) return;
    setBusyId(r.id);
    if (await run(() => api(`/manager/leaves/${r.id}?status=${s}`, "PUT"), `Leave ${s} for ${name(r.employee_id)}`)) reload();
    setBusyId(null);
  };
  const col = ["", (r) => <div className="flex gap-2 justify-end">
    <Btn variant="ok" className="!h-9" loading={busyId === r.id} onClick={() => decide(r, "approved")}>Approve</Btn>
    <Btn variant="danger-outline" className="!h-9" disabled={busyId === r.id} onClick={() => decide(r, "rejected")}>Reject</Btn></div>];
  return [col, confirmEl];
};

const todayStatus = (att, id) => att.find((a) => a.employee_id === id && a.date === localToday())?.status;

export function Overview() {
  const nav = useNavigate();
  const [team, name, loadingT] = useTeam();
  const [leaves, reload, loadingL] = useGet("/manager/leaves");
  const [att, , loadingA] = useGet("/manager/attendance");
  const [tasks, , loadingK] = useGet("/manager/tasks");
  const [decisionCol, confirmEl] = useDecide(reload, name);
  if (loadingT || loadingL || loadingA || loadingK) return <PageSkeleton />;
  const present = count(team, (m) => todayStatus(att, m.id) === "Present");
  const overdue = count(tasks, isOverdue);
  return (<>
    <Header title="Overview" sub={longToday()}>
      <Btn onClick={() => nav("/manager/tasks", { state: { assign: true } })}><Plus size={16} aria-hidden="true" />Assign task</Btn>
    </Header>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Stat label="Team members" value={team.length} icon={Users} to="/manager/team" hint="Direct reports" />
      <Stat label="Present today" value={`${present} / ${team.length}`} icon={CalendarCheck} color="emerald" to="/manager/attendance" hint={`${count(team, (m) => !todayStatus(att, m.id))} not marked`} />
      <Stat label="Waiting for you" value={leaves.length} icon={CalendarOff} color="amber" to="/manager/leaves" hint={leaves.length ? "Leave requests to decide" : "All caught up"} tone={leaves.length ? "warn" : undefined} />
      <Stat label="Open team tasks" value={count(tasks, (t) => t.status !== "Completed")} icon={ListTodo} color="sky" to="/manager/tasks" hint={overdue ? `${overdue} overdue` : "None overdue"} tone={overdue ? "bad" : undefined} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3"><Card title="Leave requests waiting for you">
        {leaves.length
          ? <Table rows={leaves} cols={[["Employee", (r) => <span className="font-semibold">{name(r.employee_id)}</span>], ["Type", (r) => r.leave_type], ["Dates", (r) => <span className="whitespace-nowrap">{leaveDates(r)}</span>], decisionCol]} />
          : <EmptyState icon={CheckCircle2} title="All caught up" text="New leave requests from your team will appear here." />}
      </Card></div>
      <div className="lg:col-span-2"><Card title="Team today" action={<Link to="/manager/attendance" className="text-sm font-semibold text-indigo-700 hover:underline">Attendance</Link>}>
        <ul className="divide-y divide-slate-100">
          {team.map((m) => { const s = todayStatus(att, m.id); return (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={m.name} /><p className="flex-1 text-sm font-semibold text-slate-900">{m.name}</p>{s ? <Badge text={s} /> : <Badge text="Not marked" tone="slate" />}</li>); })}
          {!team.length && <li><EmptyState icon={Users} title="No direct reports yet" text="An admin can set you as someone's manager on the Employees page." /></li>}
        </ul>
      </Card></div>
    </div>
    {confirmEl}</>);
}

export function Team() {
  const [team, , loading, error] = useTeam();
  const [att] = useGet("/manager/attendance");
  const [q, setQ] = useState("");
  const rows = team.filter((m) => matches(q, m.name, m.phone));
  return (<><Header title="My team" sub={`${team.length} direct report${team.length === 1 ? "" : "s"}`} />
    <Card>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by name or phone" />
      <Table rows={rows} loading={loading} error={error} pageSize={15} empty={q ? "Nobody matches that search" : "No direct reports yet"} emptyIcon={Users} cols={[
        ["Name", (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><span className="font-semibold text-slate-900">{r.name}</span></div>],
        ["Phone", (r) => <span className="tabular-nums">{r.phone}</span>], ["Employee ID", (r) => `EMP-${String(r.id).padStart(3, "0")}`],
        ["Today", (r) => { const s = todayStatus(att, r.id); return s ? <Badge text={s} /> : <Badge text="Not marked" tone="slate" />; }]]} />
    </Card></>);
}

export function Leaves() {
  const [, name, loadingT] = useTeam();
  const [leaves, reload, loading, error] = useGet("/manager/leaves");
  const [decisionCol, confirmEl] = useDecide(reload, name);
  return (<><Header title="Leave requests" sub="Pending requests from your team" />
    <Card><Table rows={leaves} loading={loading || loadingT} error={error} onRetry={reload} pageSize={15} empty="No pending requests" emptyIcon={CheckCircle2} emptyText="You're all caught up." cols={[
      ["Employee", (r) => <span className="font-semibold">{name(r.employee_id)}</span>], ["Type", (r) => r.leave_type], ["Dates", (r) => <span className="whitespace-nowrap">{leaveDates(r)}</span>],
      ["Days", (r) => <span className="tabular-nums">{daysBetween(r.start_date, r.end_date) ?? "—"}</span>], ["Reason", (r) => r.reason], decisionCol]} /></Card>
    {confirmEl}</>);
}

export function Attendance() {
  const [, name, loadingT] = useTeam();
  const [rows, reload, loading, error] = useGet("/manager/attendance");
  const [day, setDay] = useState("");
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const shown = [...rows].reverse().filter((r) => (!day || r.date === day) && matches(q, name(r.employee_id)) && (st === "all" || r.status === st));
  return (<><Header title="Team attendance" sub="Attendance records for your team" />
    <Card>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by name">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">Date<input type="date" className={inputBase + " w-auto"} value={day} onChange={(e) => setDay(e.target.value)} /></label>
        {day && <Btn variant="secondary" className="!h-9" onClick={() => setDay("")}>All dates</Btn>}
        <Segmented label="Filter by status" value={st} onChange={setSt} options={[["all", "All"], ["Present", "Present"], ["Absent", "Absent"], ["Leave", "On leave"]]} />
      </Toolbar>
      <Table rows={shown} loading={loading || loadingT} error={error} onRetry={reload} pageSize={15} empty={day || q || st !== "all" ? "No records match these filters" : "No attendance recorded yet"} cols={[
        ["Employee", (r) => <span className="font-semibold">{name(r.employee_id)}</span>], ["Date", (r) => <span className="whitespace-nowrap">{fmtDate(r.date)}</span>], ["Status", (r) => <Badge text={r.status} />]]} />
    </Card></>);
}

export function Tasks() {
  const location = useLocation();
  const [team, name, loadingT] = useTeam();
  const [tasks, reload, loading, error] = useGet("/manager/tasks");
  const [msg, run, setMsg, busy] = useAction();
  const [open, setOpen] = useState(!!location.state?.assign);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const blank = { title: "", description: "", assigned_to: "", priority: "Medium", due_date: "" };
  const [f, setF] = useState(blank);
  const nav = useNavigate();
  useEffect(() => { if (location.state?.assign) nav(location.pathname, { replace: true, state: null }); }, []);
  const create = async (e) => {
    e.preventDefault();
    if (await run(() => api("/manager/tasks", "POST", { ...f, assigned_to: +f.assigned_to, due_date: f.due_date || null }), `Task assigned to ${name(+f.assigned_to)}`)) { setF(blank); setOpen(false); reload(); }
  };
  const filters = { all: () => true, open: (t) => t.status !== "Completed", overdue: isOverdue, completed: (t) => t.status === "Completed" };
  const rows = [...tasks].reverse().filter((t) => matches(q, t.title, t.description, name(t.assigned_to)) && filters[st](t));
  return (<><Header title="Team tasks" sub="Assign and track work for your direct reports"><Btn onClick={() => { setMsg(null); setOpen(true); }}><Plus size={16} aria-hidden="true" />Assign task</Btn></Header>
    <Card>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by title or assignee">
        <Segmented label="Filter tasks" value={st} onChange={setSt} options={[["all", "All", tasks.length], ["open", "Open", count(tasks, filters.open)], ["overdue", "Overdue", count(tasks, isOverdue)], ["completed", "Completed", count(tasks, filters.completed)]]} />
      </Toolbar>
      <Table rows={rows} loading={loading || loadingT} error={error} onRetry={reload} pageSize={15} empty={q || st !== "all" ? "No tasks match these filters" : "No tasks for your team yet"} emptyIcon={ListTodo} cols={[
        ["Task", (r) => <div className="min-w-[12rem]"><p className="font-semibold text-slate-900">{r.title}</p>{r.description && <p className="text-xs text-slate-600">{r.description}</p>}</div>],
        ["Assignee", (r) => <span className="whitespace-nowrap">{name(r.assigned_to)}</span>], ["Priority", (r) => <Badge text={r.priority} />], ["Due", (r) => <DueDate task={r} />], ["Status", (r) => <TaskStatus task={r} />]]} />
    </Card>
    {open && <Modal title="Assign a task" onClose={() => setOpen(false)}>
      <form onSubmit={create} className="space-y-4">
        <Alert msg={msg} />
        <Field label="Title"><input required className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description" hint="(optional)"><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Assign to"><select required className={inputCls} value={f.assigned_to} onChange={(e) => setF({ ...f, assigned_to: e.target.value })}><option value="">Select team member</option>{team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority"><select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Due date" hint="(optional)"><input type="date" min={localToday()} className={inputCls} value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
        </div>
        <Btn className="w-full" loading={busy}>{busy ? "Assigning…" : "Assign task"}</Btn>
      </form></Modal>}
  </>);
}
