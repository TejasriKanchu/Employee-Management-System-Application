import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users as UsersIcon, CalendarOff, CalendarCheck, ListTodo, CheckCircle2, Plus } from "lucide-react";
import { api, useGet, getEmail } from "../api";
import { Header, Stat, Card, Table, Badge, Btn, Field, inputCls, inputBase, Modal, Alert, useAction, useConfirm, toast, Toolbar, Segmented, Menu, Avatar, EmptyState, PageSkeleton, DueDate, daysBetween, leaveDates, localToday, longToday, fmtDate, isOverdue, matches } from "../ui";

const useLookups = () => {
  const [emps, reloadE, loadingE, errorE] = useGet("/employees");
  const [deps, reloadD, loadingD] = useGet("/departments");
  const [users, reloadU, loadingU] = useGet("/users");
  const name = (id) => emps.find((e) => e.id === id)?.name || "—";
  const dep = (id) => deps.find((d) => d.id === id)?.name || "—";
  const email = (uid) => users.find((u) => u.id === uid)?.email || "—";
  return { emps, deps, users, name, dep, email, reloadE, reloadD, reloadU, loading: loadingE || loadingD || loadingU, errorE };
};
const Select = ({ value, onChange, options, placeholder, label }) => (
  <select aria-label={label} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} required={!!placeholder?.startsWith("Select")}>
    <option value="">{placeholder}</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);
const count = (rows, pred) => rows.filter(pred).length;

export function Overview() {
  const nav = useNavigate();
  const L = useLookups();
  const [leaves, , loadingL] = useGet("/admin/leaves");
  const [tasks, , loadingT] = useGet("/tasks");
  const [att, , loadingA] = useGet("/attendance");
  if (L.loading || loadingL || loadingT || loadingA) return <PageSkeleton />;
  const today = localToday();
  const markedToday = att.filter((a) => a.date === today);
  const present = count(markedToday, (a) => a.status === "Present");
  const unmarked = Math.max(0, L.emps.length - markedToday.length);
  const pending = count(leaves, (l) => l.status === "pending");
  const open = count(tasks, (t) => t.status !== "Completed");
  const overdue = tasks.filter(isOverdue);
  const noProfile = count(L.users, (u) => !L.emps.some((e) => e.user_id === u.id));
  const attention = [
    ...overdue.map((t) => ({ key: `t${t.id}`, dot: "bg-rose-500", title: `Task overdue: ${t.title}`, text: `${L.name(t.assigned_to)} · was due ${fmtDate(t.due_date)}`, to: "/admin/tasks", cta: "Open" })),
    unmarked > 0 && L.emps.length > 0 && { key: "att", dot: "bg-amber-500", title: "Today's attendance isn't complete", text: `${markedToday.length} of ${L.emps.length} employees recorded`, to: "/admin/attendance", cta: "Mark now" },
    pending > 0 && { key: "lv", dot: "bg-amber-500", title: `${pending} leave request${pending > 1 ? "s" : ""} waiting for a manager`, text: "Managers approve requests from their own team", to: "/admin/leaves", cta: "View" },
    noProfile > 0 && { key: "np", dot: "bg-slate-400", title: `${noProfile} account${noProfile > 1 ? "s have" : " has"} no employee profile`, text: "They see an empty dashboard until a profile is added", to: "/admin/users", cta: "Review" },
  ].filter(Boolean);
  return (
    <>
      <Header title="Overview" sub={longToday()}>
        <Btn variant="secondary" onClick={() => nav("/admin/attendance")}>Mark attendance</Btn>
        <Btn onClick={() => nav("/admin/tasks", { state: { assign: true } })}><Plus size={16} aria-hidden="true" />Assign task</Btn>
      </Header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Stat label="Employees" value={L.emps.length} icon={UsersIcon} to="/admin/employees" hint={`in ${L.deps.length} department${L.deps.length === 1 ? "" : "s"}`} />
        <Stat label="Present today" value={`${present} / ${L.emps.length}`} icon={CalendarCheck} color="emerald" to="/admin/attendance" hint={unmarked ? `${unmarked} not marked yet` : "All marked"} tone={unmarked ? "warn" : undefined} />
        <Stat label="Pending leave" value={pending} icon={CalendarOff} color="amber" to="/admin/leaves" hint={pending ? "Waiting for managers" : "All caught up"} />
        <Stat label="Open tasks" value={open} icon={ListTodo} color="sky" to="/admin/tasks" hint={overdue.length ? `${overdue.length} overdue` : "None overdue"} tone={overdue.length ? "bad" : undefined} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Needs attention" action={<span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">{attention.length}</span>}>
            {attention.length ? (
              <ul className="divide-y divide-slate-100">
                {attention.map((a) => (
                  <li key={a.key} className="flex gap-3 px-5 py-3.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900">{a.title}</p><p className="text-sm text-slate-600">{a.text}</p></div>
                    <Link to={a.to} className="text-sm font-semibold text-indigo-700 hover:underline whitespace-nowrap">{a.cta}</Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={CheckCircle2} title="Nothing needs attention" text="Attendance is marked, no tasks are overdue and no leave is waiting." />}
          </Card>
          <Card title="Recent leave requests" action={<Link to="/admin/leaves" className="text-sm font-semibold text-indigo-700 hover:underline">View all</Link>}>
            <Table rows={leaves.slice(-5).reverse()} empty="No leave requests yet" cols={[["Employee", (r) => <span className="font-semibold">{L.name(r.employee_id)}</span>], ["Type", (r) => r.leave_type], ["Dates", leaveDates], ["Status", (r) => <Badge text={r.status} />]]} />
          </Card>
        </div>
        <Card title="Headcount by department"><div className="p-5 space-y-4">
          {L.deps.map((d) => { const n = count(L.emps, (e) => e.department_id === d.id); return (
            <div key={d.id}><div className="flex justify-between text-sm mb-1"><span className="text-slate-800">{d.name}</span><span className="text-slate-600 tabular-nums">{n}</span></div>
              <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${(n / Math.max(L.emps.length, 1)) * 100}%` }} /></div></div>); })}
          {!L.deps.length && <p className="text-sm text-slate-600">No departments yet.</p>}
        </div></Card>
      </div>
    </>
  );
}

export function Users() {
  const [users, reload, loading, error] = useGet("/users");
  const [emps] = useGet("/employees");
  const [, act] = useAction({ toastErrors: true });
  const [msg, run, setMsg, busy] = useAction();
  const [confirmEl, ask] = useConfirm();
  const [open, setOpen] = useState(false);
  const [roleEdit, setRoleEdit] = useState(null);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [statusF, setStatusF] = useState("");
  const blank = { email: "", password: "", role: "employee" };
  const [f, setF] = useState(blank);
  const me = getEmail();
  const hasProfile = (u) => emps.some((e) => e.user_id === u.id);
  const save = async (e) => {
    e.preventDefault();
    if (await run(() => api("/users", "POST", f), "User created")) { setOpen(false); setF(blank); reload(); }
  };
  const update = async (u, body, text) => { if (await act(() => api(`/users/${u.id}`, "PUT", body), text)) reload(); };
  const saveRole = async (e) => { e.preventDefault(); if (await run(() => api(`/users/${roleEdit.id}`, "PUT", { role: roleEdit.role }), `Role changed to ${roleEdit.role}`)) { setRoleEdit(null); reload(); } };
  const toggleActive = async (u) => {
    if (u.is_Active === false) return update(u, { is_Active: true }, "User activated");
    if (await ask({ title: `Deactivate ${u.email}?`, body: "They won't be able to sign in until you activate the account again. Nothing is deleted.", confirmText: "Deactivate" })) update(u, { is_Active: false }, "User deactivated");
  };
  const del = async (u) => {
    if (hasProfile(u)) return toast.error("This account has an employee profile. Delete the employee first.");
    if (await ask({ title: `Delete ${u.email}?`, body: "The login account is removed permanently. This can't be undone.", confirmText: "Delete account" }) && await act(() => api(`/users/${u.id}`, "DELETE"), "User deleted")) reload();
  };
  const roleCount = (r) => count(users, (u) => u.role === r);
  const rows = users.filter((u) => matches(q, u.email) && (roleF === "all" || u.role === roleF) && (!statusF || (statusF === "active") === (u.is_Active !== false)));
  return (
    <>
      <Header title="Users" sub={`${users.length} login accounts · ${count(users, (u) => !hasProfile(u))} without an employee profile`}><Btn onClick={() => { setMsg(null); setOpen(true); }}><Plus size={16} aria-hidden="true" />Add user</Btn></Header>
      <Card>
        <Toolbar search={q} onSearch={setQ} placeholder="Search by email">
          <Segmented label="Filter by role" value={roleF} onChange={setRoleF} options={[["all", "All", users.length], ["admin", "Admins", roleCount("admin")], ["manager", "Managers", roleCount("manager")], ["employee", "Employees", roleCount("employee")]]} />
          <select aria-label="Filter by status" className={inputBase + " w-auto"} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </Toolbar>
        <Table rows={rows} loading={loading} error={error} onRetry={reload} pageSize={10} empty={q || roleF !== "all" || statusF ? "No users match these filters" : "No users yet"} cols={[
          ["Account", (r) => <div className="flex items-center gap-3"><Avatar name={r.email} /><div className="min-w-0"><p className="font-semibold text-slate-900 truncate">{r.email}</p>
            {r.email === me ? <p className="text-xs font-semibold text-indigo-700">You</p> : !hasProfile(r) && <p className="text-xs font-semibold text-amber-800">No employee profile</p>}</div></div>],
          ["Role", (r) => <Badge text={r.role} dot={false} />],
          ["Status", (r) => <Badge text={r.is_Active === false ? "inactive" : "active"} />],
          ["Created", (r) => <span className="whitespace-nowrap text-slate-700">{fmtDate(r.created_at)}</span>],
          ["", (r) => r.email === me ? null : <Menu label={`Actions for ${r.email}`} items={[
            { label: "Change role…", onClick: () => { setMsg(null); setRoleEdit({ id: r.id, email: r.email, role: r.role }); } },
            { label: r.is_Active === false ? "Activate" : "Deactivate…", onClick: () => toggleActive(r) },
            "-",
            { label: "Delete account…", danger: true, onClick: () => del(r) },
          ]} />]]} />
      </Card>
      {open && <Modal title="Add user" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          <Alert msg={msg} />
          <Field label="Email"><input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Password" hint="(at least 6 characters)"><input required minLength={6} type="password" autoComplete="new-password" className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Role"><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></Field>
          <Btn className="w-full" loading={busy}>{busy ? "Creating…" : "Create user"}</Btn>
        </form></Modal>}
      {roleEdit && <Modal title="Change role" onClose={() => setRoleEdit(null)}>
        <form onSubmit={saveRole} className="space-y-4">
          <p className="text-sm text-slate-700">Choose the role for <span className="font-semibold">{roleEdit.email}</span>. It changes which dashboard they see the next time they sign in.</p>
          <Alert msg={msg} />
          <Field label="Role"><select className={inputCls} value={roleEdit.role} onChange={(e) => setRoleEdit({ ...roleEdit, role: e.target.value })}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></Field>
          <div className="flex justify-end gap-2"><Btn type="button" variant="secondary" onClick={() => setRoleEdit(null)}>Cancel</Btn><Btn loading={busy}>Save role</Btn></div>
        </form></Modal>}
      {confirmEl}
    </>
  );
}

export function Employees() {
  const L = useLookups();
  const [msg, run, setMsg, busy] = useAction();
  const [, act] = useAction({ toastErrors: true });
  const [confirmEl, ask] = useConfirm();
  const [q, setQ] = useState("");
  const [depF, setDepF] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, "new" or an employee id
  const blank = { user_id: "", name: "", phone: "", department_id: "", manager_id: "" };
  const [f, setF] = useState(blank);
  const openNew = () => { setF(blank); setMsg(null); setEditing("new"); };
  const openEdit = (r) => { setF({ user_id: String(r.user_id ?? ""), name: r.name, phone: r.phone, department_id: String(r.department_id ?? ""), manager_id: r.manager_id ? String(r.manager_id) : "" }); setMsg(null); setEditing(r.id); };
  const save = async (e) => {
    e.preventDefault();
    const body = { ...f, user_id: +f.user_id, department_id: +f.department_id, manager_id: f.manager_id ? +f.manager_id : null };
    const ok = await run(() => (editing === "new" ? api("/employees", "POST", body) : api(`/employees/${editing}`, "PUT", body)), editing === "new" ? "Employee added" : "Employee updated");
    if (ok) { setEditing(null); L.reloadE(); }
  };
  const del = async (r) => {
    const reports = count(L.emps, (e) => e.manager_id === r.id);
    const body = `Their leave requests, attendance records and tasks are deleted too.${reports ? ` ${reports} ${reports === 1 ? "person reports" : "people report"} to them and will have no manager.` : ""} This can't be undone.`;
    if (await ask({ title: `Delete ${r.name}?`, body, confirmText: "Delete employee" }) && await act(() => api(`/employees/${r.id}`, "DELETE"), "Employee deleted")) L.reloadE();
  };
  const rows = L.emps.filter((e) => matches(q, e.name, e.phone, L.email(e.user_id)) && (!depF || String(e.department_id) === depF));
  // Only offer accounts without a profile (plus the one being edited)
  const linked = new Set(L.emps.filter((e) => e.id !== editing).map((e) => e.user_id));
  const freeUsers = L.users.filter((u) => !linked.has(u.id));
  return (
    <>
      <Header title="Employees" sub={`${L.emps.length} people in the company`}><Btn onClick={openNew}><Plus size={16} aria-hidden="true" />Add employee</Btn></Header>
      <Card>
        <Toolbar search={q} onSearch={setQ} placeholder="Search by name, email or phone">
          <div className="w-full sm:w-56"><Select label="Filter by department" value={depF} onChange={setDepF} placeholder="All departments" options={L.deps.map((d) => [d.id, d.name])} /></div>
        </Toolbar>
        <Table rows={rows} loading={L.loading} error={L.errorE} onRetry={L.reloadE} pageSize={10} empty={q || depF ? "No employees match these filters" : "No employees yet"} emptyText={q || depF ? undefined : "Add a user account first, then create their employee profile."} cols={[
          ["Name", (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div className="min-w-0"><p className="font-semibold text-slate-900">{r.name}</p><p className="text-xs text-slate-600 truncate">{L.email(r.user_id)}</p></div></div>],
          ["Phone", (r) => <span className="tabular-nums">{r.phone}</span>], ["Department", (r) => <Badge text={L.dep(r.department_id)} tone="slate" dot={false} />], ["Manager", (r) => L.name(r.manager_id)],
          ["", (r) => <Menu label={`Actions for ${r.name}`} items={[{ label: "Edit…", onClick: () => openEdit(r) }, "-", { label: "Delete employee…", danger: true, onClick: () => del(r) }]} />]]} />
      </Card>
      {editing && <Modal title={editing === "new" ? "Add employee" : "Edit employee"} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="space-y-4">
          <Alert msg={msg} />
          <Field label="User account"><Select value={f.user_id} onChange={(v) => setF({ ...f, user_id: v })} placeholder="Select user" options={freeUsers.map((u) => [u.id, `${u.email} (${u.role})`])} /></Field>
          <Field label="Full name"><input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone"><input required type="tel" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Department"><Select value={f.department_id} onChange={(v) => setF({ ...f, department_id: v })} placeholder="Select department" options={L.deps.map((d) => [d.id, d.name])} /></Field>
          <Field label="Manager" hint="(optional)"><Select value={f.manager_id} onChange={(v) => setF({ ...f, manager_id: v })} placeholder="No manager" options={L.emps.filter((e) => e.id !== editing).map((e) => [e.id, e.name])} /></Field>
          <Btn className="w-full" loading={busy}>{busy ? "Saving…" : "Save employee"}</Btn>
        </form></Modal>}
      {confirmEl}
    </>
  );
}

export function Departments() {
  const [deps, reload, loading, error] = useGet("/departments");
  const [emps] = useGet("/employees");
  const [msg, run, , busy] = useAction();
  const [, act] = useAction({ toastErrors: true });
  const [confirmEl, ask] = useConfirm();
  const [f, setF] = useState({ name: "", description: "" });
  const [edit, setEdit] = useState(null);
  const headcount = (d) => count(emps, (e) => e.department_id === d.id);
  const add = async (e) => { e.preventDefault(); if (await run(() => api("/departments", "POST", f), "Department added")) { setF({ name: "", description: "" }); reload(); } };
  const saveEdit = async () => { if (await act(() => api(`/departments/${edit.id}`, "PUT", { name: edit.name, description: edit.description }), "Department updated")) { setEdit(null); reload(); } };
  const del = async (d) => {
    const n = headcount(d);
    if (n) return toast.error(`${d.name} still has ${n} employee${n > 1 ? "s" : ""}. Move them to another department first.`);
    if (await ask({ title: `Delete ${d.name}?`, body: "The department is removed permanently. This can't be undone.", confirmText: "Delete department" }) && await act(() => api(`/departments/${d.id}`, "DELETE"), "Department deleted")) reload();
  };
  const editing = (r) => edit?.id === r.id;
  return (
    <>
      <Header title="Departments" sub="Organise your company structure" />
      <form onSubmit={add} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1"><Field label="Name"><input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
          <div className="flex-[2]"><Field label="Description" hint="(optional)"><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
          <Btn loading={busy}><Plus size={16} aria-hidden="true" />Add department</Btn>
        </div>
        <Alert msg={msg} />
      </form>
      <Card>
        <Table rows={deps} loading={loading} error={error} onRetry={reload} empty="No departments yet" emptyText="Add your first department above." cols={[
          ["Name", (r) => editing(r) ? <input aria-label="Department name" className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : <span className="font-semibold text-slate-900">{r.name}</span>],
          ["Description", (r) => editing(r) ? <input aria-label="Description" className={inputCls} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /> : r.description || "—"],
          ["Employees", (r) => <span className="tabular-nums">{headcount(r)}</span>],
          ["", (r) => editing(r)
            ? <div className="flex gap-2 justify-end"><Btn variant="ok" className="!h-9" onClick={saveEdit}>Save</Btn><Btn variant="secondary" className="!h-9" onClick={() => setEdit(null)}>Cancel</Btn></div>
            : <Menu label={`Actions for ${r.name}`} items={[{ label: "Edit…", onClick: () => setEdit({ ...r }) }, "-", { label: "Delete department…", danger: true, onClick: () => del(r) }]} />]]} />
      </Card>
      {confirmEl}
    </>
  );
}

export function Leaves() {
  const L = useLookups();
  const [leaves, reload, loading, error] = useGet("/admin/leaves");
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const by = (s) => count(leaves, (l) => l.status === s);
  const rows = [...leaves].reverse().filter((l) => matches(q, L.name(l.employee_id), l.leave_type, l.reason) && (st === "all" || l.status === st));
  return (<><Header title="Leave requests" sub="All requests across the company. Managers approve requests from their own team." />
    <Card>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by employee, type or reason">
        <Segmented label="Filter by status" value={st} onChange={setSt} options={[["all", "All", leaves.length], ["pending", "Pending", by("pending")], ["approved", "Approved", by("approved")], ["rejected", "Rejected", by("rejected")]]} />
      </Toolbar>
      <Table rows={rows} loading={loading || L.loading} error={error} onRetry={reload} pageSize={15} empty={q || st !== "all" ? "No requests match these filters" : "No leave requests yet"} cols={[
        ["Employee", (r) => <span className="font-semibold">{L.name(r.employee_id)}</span>], ["Type", (r) => r.leave_type], ["Dates", (r) => <span className="whitespace-nowrap">{leaveDates(r)}</span>],
        ["Days", (r) => <span className="tabular-nums">{daysBetween(r.start_date, r.end_date) ?? "—"}</span>], ["Reason", (r) => r.reason], ["Status", (r) => <Badge text={r.status} />]]} />
    </Card></>);
}

export function Attendance() {
  const L = useLookups();
  const [rows, reload, loading, error] = useGet("/attendance");
  const [msg, run, , busy] = useAction();
  const [f, setF] = useState({ employee_id: "", date: localToday(), status: "Present" });
  const [day, setDay] = useState("");
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const mark = async (e) => { e.preventDefault(); if (await run(() => api("/attendance", "POST", { ...f, employee_id: +f.employee_id }), `Marked ${L.name(+f.employee_id)} as ${f.status === "Leave" ? "on leave" : f.status.toLowerCase()}`)) reload(); };
  const onDay = day ? rows.filter((r) => r.date === day) : rows;
  const shown = [...onDay].reverse().filter((r) => matches(q, L.name(r.employee_id)) && (st === "all" || r.status === st));
  const by = (s) => count(onDay, (r) => r.status === s);
  return (<><Header title="Attendance" sub="Mark and review daily attendance" />
    <form onSubmit={mark} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1"><Field label="Employee"><Select value={f.employee_id} onChange={(v) => setF({ ...f, employee_id: v })} placeholder="Select employee" options={L.emps.map((e) => [e.id, e.name])} /></Field></div>
        <Field label="Date"><input type="date" required className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="Present">Present</option><option value="Absent">Absent</option><option value="Leave">On leave</option></select></Field>
        <Btn loading={busy}>Mark</Btn>
      </div>
      <Alert msg={msg} />
    </form>
    <Card title="Records" action={<span className="text-sm text-slate-600 tabular-nums text-right">{by("Present")} present · {by("Absent")} absent · {by("Leave")} on leave{day ? ` on ${fmtDate(day)}` : ""}</span>}>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by employee">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">Date<input type="date" className={inputBase + " w-auto"} value={day} onChange={(e) => setDay(e.target.value)} /></label>
        {day && <Btn variant="secondary" className="!h-9" onClick={() => setDay("")}>All dates</Btn>}
        <Segmented label="Filter by status" value={st} onChange={setSt} options={[["all", "All"], ["Present", "Present"], ["Absent", "Absent"], ["Leave", "On leave"]]} />
      </Toolbar>
      <Table rows={shown} loading={loading || L.loading} error={error} onRetry={reload} pageSize={15} empty={day || q || st !== "all" ? "No records match these filters" : "No attendance recorded yet"} cols={[["Employee", (r) => <span className="font-semibold">{L.name(r.employee_id)}</span>], ["Date", (r) => <span className="whitespace-nowrap">{fmtDate(r.date)}</span>], ["Status", (r) => <Badge text={r.status} />]]} /></Card></>);
}

export function Tasks() {
  const L = useLookups();
  const location = useLocation();
  const [tasks, reload, loading, error] = useGet("/tasks");
  const [msg, run, setMsg, busy] = useAction();
  const [, act] = useAction({ toastErrors: true });
  const [confirmEl, ask] = useConfirm();
  const [open, setOpen] = useState(!!location.state?.assign);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const blank = { title: "", description: "", assigned_to: "", priority: "Medium", due_date: "" };
  const [f, setF] = useState(blank);
  const nav = useNavigate();
  // Opened from the dashboard's "Assign task": clear the flag so a refresh doesn't reopen the form
  useEffect(() => { if (location.state?.assign) nav(location.pathname, { replace: true, state: null }); }, []);
  const create = async (e) => {
    e.preventDefault();
    if (await run(() => api("/tasks", "POST", { ...f, assigned_to: +f.assigned_to, due_date: f.due_date || null }), `Task assigned to ${L.name(+f.assigned_to)}`)) { setF(blank); setOpen(false); reload(); }
  };
  const setStatus = async (t, status) => { if (await act(() => api(`/tasks/${t.id}`, "PUT", { status }), `"${t.title}" marked ${status.toLowerCase()}`)) reload(); };
  const del = async (t) => { if (await ask({ title: `Delete "${t.title}"?`, body: `The task assigned to ${L.name(t.assigned_to)} is removed permanently. This can't be undone.`, confirmText: "Delete task" }) && await act(() => api(`/tasks/${t.id}`, "DELETE"), "Task deleted")) reload(); };
  const filters = { all: () => true, open: (t) => t.status !== "Completed", overdue: isOverdue, completed: (t) => t.status === "Completed" };
  const rows = [...tasks].reverse().filter((t) => matches(q, t.title, t.description, L.name(t.assigned_to)) && filters[st](t));
  return (<><Header title="Tasks" sub="Assign and track work across the company"><Btn onClick={() => { setMsg(null); setOpen(true); }}><Plus size={16} aria-hidden="true" />Assign task</Btn></Header>
    <Card>
      <Toolbar search={q} onSearch={setQ} placeholder="Search by title or assignee">
        <Segmented label="Filter tasks" value={st} onChange={setSt} options={[["all", "All", tasks.length], ["open", "Open", count(tasks, filters.open)], ["overdue", "Overdue", count(tasks, isOverdue)], ["completed", "Completed", count(tasks, filters.completed)]]} />
      </Toolbar>
      <Table rows={rows} loading={loading || L.loading} error={error} onRetry={reload} pageSize={15} empty={q || st !== "all" ? "No tasks match these filters" : "No tasks yet"} emptyIcon={ListTodo} emptyText={q || st !== "all" ? undefined : "Use \"Assign task\" to give someone work."} cols={[
        ["Task", (r) => <div className="min-w-[12rem]"><p className="font-semibold text-slate-900">{r.title}</p>{r.description && <p className="text-xs text-slate-600">{r.description}</p>}</div>],
        ["Assignee", (r) => <span className="whitespace-nowrap">{L.name(r.assigned_to)}</span>], ["Priority", (r) => <Badge text={r.priority} />], ["Due", (r) => <DueDate task={r} />],
        ["Status", (r) => <div className="flex flex-wrap items-center gap-2"><select aria-label={`Status of ${r.title}`} className={inputBase + " w-36"} value={r.status} onChange={(e) => setStatus(r, e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select>{isOverdue(r) && <Badge text="Overdue" />}</div>],
        ["", (r) => <Menu label={`Actions for ${r.title}`} items={[{ label: "Delete task…", danger: true, onClick: () => del(r) }]} />]]} />
    </Card>
    {open && <Modal title="Assign a task" onClose={() => setOpen(false)}>
      <form onSubmit={create} className="space-y-4">
        <Alert msg={msg} />
        <Field label="Title"><input required className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description" hint="(optional)"><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Assign to"><Select value={f.assigned_to} onChange={(v) => setF({ ...f, assigned_to: v })} placeholder="Select employee" options={L.emps.map((e) => [e.id, e.name])} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority"><select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Due date" hint="(optional)"><input type="date" min={localToday()} className={inputCls} value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
        </div>
        <Btn className="w-full" loading={busy}>{busy ? "Assigning…" : "Assign task"}</Btn>
      </form></Modal>}
    {confirmEl}</>);
}
