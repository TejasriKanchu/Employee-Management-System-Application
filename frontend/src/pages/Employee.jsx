import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarOff, CalendarCheck, ListTodo, CheckCircle2, UserX } from "lucide-react";
import { api, useGet } from "../api";
import { Header, Stat, Card, Table, Badge, Btn, Field, inputCls, inputBase, Alert, useAction, Toolbar, Segmented, Avatar, PageSkeleton, ErrorState, DueDate, daysBetween, leaveDates, localToday, longToday, fmtDate, isOverdue } from "../ui";
import { PasswordForm } from "./Account";

// Registered users have no employee record until an admin creates one
function NoProfile() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto mt-10">
      <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-700 grid place-items-center mx-auto mb-4"><UserX size={26} aria-hidden="true" /></div>
      <h1 className="text-lg font-semibold text-slate-900">Your profile hasn't been set up yet</h1>
      <p className="text-sm text-slate-600 mt-2">Contact your admin to create your employee profile. Once it's ready you'll see your tasks, leave and attendance here.</p>
    </div>
  );
}

// Shows a skeleton while the profile loads, the empty state without one, otherwise the page
function WithProfile({ children }) {
  const [me, reload, loading, error] = useGet("/my-profile", null);
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState text={error} onRetry={reload} />;
  if (!me) return <NoProfile />;
  return children(me);
}

const useTaskStatus = (reload) => {
  const [, run] = useAction({ toastErrors: true });
  const [busyId, setBusyId] = useState(null);
  const update = async (t, status) => { setBusyId(t.id); if (await run(() => api(`/my-tasks/${t.id}/status`, "PUT", { status }), `"${t.title}" marked ${status.toLowerCase()}`)) await reload(); setBusyId(null); };
  const col = ["Status", (r) => <div className="flex flex-wrap items-center gap-2"><select aria-label={`Status of ${r.title}`} disabled={busyId === r.id} className={inputBase + " w-36"} value={r.status} onChange={(e) => update(r, e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select>{isOverdue(r) && <Badge text="Overdue" />}</div>];
  return col;
};

export const Dashboard = () => <WithProfile>{(me) => <DashboardContent me={me} />}</WithProfile>;

function DashboardContent({ me }) {
  const [mgr] = useGet("/my-manager", null);
  const [tasks, reloadTasks, loadingT, errorT] = useGet("/my-tasks");
  const [leaves] = useGet("/my-leaves");
  const [att] = useGet("/my-attendance");
  const [balance] = useGet("/my-leave-balance");
  const statusCol = useTaskStatus(reloadTasks);
  const open = tasks.filter((t) => t.status !== "Completed");
  const overdue = tasks.filter(isOverdue).length;
  return (<>
    <Header title={`Hello, ${me.name?.split(" ")[0] || "there"}`} sub={`${longToday()}${mgr?.name ? ` · Reports to ${mgr.name}` : ""}`} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Stat label="Open tasks" value={open.length} icon={ListTodo} to="/employee/tasks" hint={overdue ? `${overdue} overdue` : undefined} tone={overdue ? "bad" : undefined} />
      <Stat label="Completed" value={tasks.length - open.length} icon={CheckCircle2} color="emerald" to="/employee/tasks" />
      <Stat label="Days present" value={att.filter((a) => a.status === "Present").length} icon={CalendarCheck} color="sky" to="/employee/attendance" />
      <Stat label="Leave pending" value={leaves.filter((l) => l.status === "pending").length} icon={CalendarOff} color="amber" to="/employee/leaves" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2"><Card title="My open tasks" action={<Link to="/employee/tasks" className="text-sm font-semibold text-indigo-700 hover:underline">All tasks</Link>}>
        <Table rows={open} loading={loadingT} error={errorT} onRetry={reloadTasks} empty="No open tasks" emptyIcon={ListTodo} emptyText="Tasks your manager assigns will appear here." cols={[["Task", (r) => <span className="font-semibold text-slate-900">{r.title}</span>], ["Priority", (r) => <Badge text={r.priority} />], ["Due", (r) => <DueDate task={r} />], statusCol]} />
      </Card></div>
      <div className="space-y-6">
        <Card title="Leave balance" action={<Link to="/employee/leaves" className="text-sm font-semibold text-indigo-700 hover:underline">Apply</Link>}><div className="p-5 space-y-3">
          {balance.map((b) => (
            <div key={b.leave_type}><div className="flex justify-between text-sm"><span className="font-semibold text-slate-800">{b.leave_type}</span><span className="text-slate-600 tabular-nums">{b.remaining} of {b.allowed} days left</span></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-indigo-100"><div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${(b.remaining / b.allowed) * 100}%` }} /></div></div>))}
        </div></Card>
        <Card title="Me"><div className="p-5 flex items-center gap-4"><Avatar name={me.name} className="h-12 w-12 text-base" /><div><p className="font-semibold text-slate-900">{me.name}</p><p className="text-sm text-slate-600 tabular-nums">{me.phone}</p><p className="text-sm text-slate-600">Manager: {mgr?.name || "Not assigned"}</p></div></div></Card>
      </div>
    </div></>);
}

export const Leaves = () => <WithProfile>{() => <LeavesContent />}</WithProfile>;

function LeavesContent() {
  const [leaves, reload, loading, error] = useGet("/my-leaves");
  const [balance, reloadBalance] = useGet("/my-leave-balance");
  const [msg, run, , busy] = useAction();
  const today = localToday();
  const [f, setF] = useState({ leave_type: "Casual", reason: "", start_date: today, end_date: today });
  const days = daysBetween(f.start_date, f.end_date);
  const left = balance.find((b) => b.leave_type === f.leave_type)?.remaining;
  const over = left != null && days > left;
  const apply = async (e) => {
    e.preventDefault();
    if (await run(() => api("/leaves", "POST", f), `${f.leave_type} leave requested for ${leaveDates(f)}`)) { setF({ ...f, reason: "" }); reload(); reloadBalance(); }
  };
  return (<><Header title="My leave" sub="Apply for leave and track your requests" />
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
      {balance.map((b) => (
        <div key={b.leave_type} className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">{b.leave_type}</p>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm"><span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{b.remaining}</span> of {b.allowed} left</p>
          <div className="h-1.5 bg-slate-100 rounded-full mt-2 flex overflow-hidden"><div className="bg-indigo-600" style={{ width: `${(b.taken / b.allowed) * 100}%` }} /><div className="bg-amber-400" style={{ width: `${(b.pending / b.allowed) * 100}%` }} /></div>
          <p className="hidden sm:block text-xs text-slate-600 mt-2 tabular-nums">{b.taken} taken · {b.pending} pending</p>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={apply} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start">
        <h2 className="font-semibold text-slate-900">Apply for leave</h2>
        <Alert msg={msg} />
        <Field label="Leave type"><select className={inputCls} value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })}><option>Casual</option><option>Sick</option><option>Annual</option></select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><input type="date" required className={inputCls} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value, end_date: e.target.value > f.end_date ? e.target.value : f.end_date })} /></Field>
          <Field label="To"><input type="date" required min={f.start_date} className={inputCls} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
        </div>
        {days > 0 && <p className={`text-sm ${over ? "text-rose-700 font-semibold" : "text-slate-600"}`}>{days} day{days > 1 ? "s" : ""}{left != null && ` · ${left} ${f.leave_type.toLowerCase()} day${left === 1 ? "" : "s"} left`}{over && " — more than you have left"}</p>}
        <Field label="Reason" hint="(shown to your manager)"><textarea required rows={3} className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        <Btn className="w-full" loading={busy} disabled={over}>{busy ? "Submitting…" : "Submit request"}</Btn>
      </form>
      <div className="lg:col-span-2"><Card title="My requests"><Table rows={[...leaves].reverse()} loading={loading} error={error} onRetry={reload} pageSize={10} empty="No leave requests yet" emptyIcon={CalendarOff} cols={[
        ["Type", (r) => <span className="font-semibold">{r.leave_type}</span>], ["Dates", (r) => <span className="whitespace-nowrap">{leaveDates(r)}</span>], ["Days", (r) => <span className="tabular-nums">{daysBetween(r.start_date, r.end_date) ?? "—"}</span>], ["Reason", (r) => r.reason], ["Status", (r) => <Badge text={r.status} />]]} /></Card></div>
    </div></>);
}

export const Tasks = () => <WithProfile>{() => <TasksContent />}</WithProfile>;

function TasksContent() {
  const [tasks, reload, loading, error] = useGet("/my-tasks");
  const statusCol = useTaskStatus(reload);
  const [st, setSt] = useState("open");
  const open = tasks.filter((t) => t.status !== "Completed");
  const rows = st === "open" ? open : st === "completed" ? tasks.filter((t) => t.status === "Completed") : tasks;
  return (<><Header title="My tasks" sub="Work assigned to you. Update the status as you go." />
    <Card>
      <Toolbar><Segmented label="Filter tasks" value={st} onChange={setSt} options={[["open", "Open", open.length], ["completed", "Completed", tasks.length - open.length], ["all", "All", tasks.length]]} /></Toolbar>
      <Table rows={rows} loading={loading} error={error} onRetry={reload} pageSize={15} empty={st === "open" ? "No open tasks" : "No tasks here"} emptyIcon={ListTodo} emptyText="Tasks your manager assigns will appear here." cols={[
        ["Task", (r) => <div className="min-w-[12rem]"><p className="font-semibold text-slate-900">{r.title}</p>{r.description && <p className="text-xs text-slate-600">{r.description}</p>}</div>], ["Priority", (r) => <Badge text={r.priority} />], ["Due", (r) => <DueDate task={r} />], statusCol]} />
    </Card></>);
}

export const Attendance = () => <WithProfile>{() => <AttendanceContent />}</WithProfile>;

function AttendanceContent() {
  const [att, reload, loading, error] = useGet("/my-attendance");
  const by = (s) => att.filter((a) => a.status === s).length;
  return (<><Header title="My attendance" sub={`${by("Present")} present · ${by("Absent")} absent · ${by("Leave")} on leave`} />
    <Card><Table rows={[...att].reverse()} loading={loading} error={error} onRetry={reload} pageSize={15} empty="No attendance recorded yet" emptyIcon={CalendarCheck} cols={[["Date", (r) => <span className="font-semibold whitespace-nowrap">{fmtDate(r.date)}</span>], ["Status", (r) => <Badge text={r.status} />]]} /></Card></>);
}

export function Profile() {
  const [me, reload, loading, error] = useGet("/my-profile", null);
  const [f, setF] = useState(null);
  const [msg, run, , busy] = useAction();
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState text={error} onRetry={reload} />;
  const form = f || me;
  const save = async (e) => { e.preventDefault(); if (await run(() => api("/my-profile", "PUT", { name: form.name, phone: form.phone }), "Profile updated")) reload(); };
  return (<><Header title="Account" sub="Your details and password" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      {form ? (
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"><h2 className="font-semibold text-slate-900">Personal details</h2>
          <Alert msg={msg} />
          <Field label="Name"><input required autoComplete="name" className={inputCls} value={form.name} onChange={(e) => setF({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input required type="tel" autoComplete="tel" className={inputCls} value={form.phone} onChange={(e) => setF({ ...form, phone: e.target.value })} /></Field>
          <Btn loading={busy}>{busy ? "Saving…" : "Save changes"}</Btn></form>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-600"><h2 className="font-semibold text-slate-900 mb-2">Personal details</h2>Your profile hasn't been set up yet. Contact your admin.</div>
      )}
      <PasswordForm />
    </div></>);
}
