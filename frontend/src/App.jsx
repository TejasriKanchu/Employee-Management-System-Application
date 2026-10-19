import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Users, Building2, CalendarOff, CalendarCheck, ListTodo, UserCircle, UserCog, KeyRound } from "lucide-react";
import { api, getRole } from "./api";
import { Shell, Field, inputCls, invalidCls, Btn, Alert } from "./ui";
import * as A from "./pages/Admin";
import * as M from "./pages/Manager";
import * as E from "./pages/Employee";
import { Account } from "./pages/Account";

const HOME = { admin: "/admin", manager: "/manager", employee: "/employee" };
// Signed-in users who open another role's page go back to their own dashboard
const Guard = ({ role, links }) => { const r = getRole(); return r === role ? <Shell role={role} links={links} /> : <Navigate to={HOME[r] || "/login"} replace />; };

const adminLinks = [["/admin", "Overview", LayoutDashboard], "People", ["/admin/users", "Users", UserCog], ["/admin/employees", "Employees", Users], ["/admin/departments", "Departments", Building2], "Work", ["/admin/leaves", "Leave requests", CalendarOff], ["/admin/attendance", "Attendance", CalendarCheck], ["/admin/tasks", "Tasks", ListTodo], "You", ["/admin/account", "Account", KeyRound]];
const managerLinks = [["/manager", "Overview", LayoutDashboard], "Team", ["/manager/team", "My team", Users], ["/manager/leaves", "Leave requests", CalendarOff], ["/manager/attendance", "Attendance", CalendarCheck], ["/manager/tasks", "Tasks", ListTodo], "You", ["/manager/account", "Account", KeyRound]];
const employeeLinks = [["/employee", "Overview", LayoutDashboard], "My work", ["/employee/leaves", "My leave", CalendarOff], ["/employee/attendance", "My attendance", CalendarCheck], ["/employee/tasks", "My tasks", ListTodo], "You", ["/employee/profile", "Account", UserCircle]];

// Login and register share one layout so they read as the same product
function AuthLayout({ title, sub, children }) {
  useEffect(() => { document.title = `${title} · EMS`; }, [title]);
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-16 bg-slate-900 text-white">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500 grid place-items-center font-bold text-xl mb-6">E</div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight">Employee Management System</h1>
        <p className="mt-4 text-slate-300 max-w-md">Manage teams, track attendance, approve leave and assign tasks, all in one place.</p>
      </div>
      <div className="grid place-items-center p-6 sm:p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden h-11 w-11 rounded-xl bg-indigo-600 grid place-items-center text-white font-bold">E</div>
          <div><h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2><p className="text-slate-600 text-sm mt-1">{sub}</p></div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api("/login", "POST", f);
      if (!r.access_token) return setErr("Login failed");
      localStorage.setItem("token", r.access_token);
      localStorage.setItem("email", f.email);
      nav(HOME[getRole()] || "/login");
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Welcome back" sub="Sign in to your account">
      <form onSubmit={submit} className="space-y-5" noValidate={false}>
        <Alert msg={err && { ok: false, text: err }} />
        <Field label="Email"><input className={inputCls} type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@company.com" /></Field>
        <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Btn className="w-full" loading={busy}>{busy ? "Signing in…" : "Sign in"}</Btn>
        <p className="text-sm text-center text-slate-600">New here? <Link to="/register" className="text-indigo-700 font-semibold hover:underline">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const pwErr = touched && f.password.length < 6 ? "Use at least 6 characters" : "";
  const confirmErr = touched && f.confirm !== f.password ? "Passwords don't match" : "";

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (f.password.length < 6 || f.password !== f.confirm) return;
    setBusy(true); setErr("");
    try {
      await api("/register", "POST", { email: f.email, password: f.password });
      setDone(true);
      setTimeout(() => nav("/login"), 2500);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <AuthLayout title="Create account" sub="Register to access EMS">
      <form onSubmit={submit} className="space-y-5">
        <Alert msg={err && { ok: false, text: err }} />
        <Alert msg={done && { ok: true, text: "Account created! Ask your admin to add your employee profile. Taking you to sign in…" }} />
        <Field label="Email"><input className={inputCls} type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@company.com" /></Field>
        <Field label="Password" hint="(at least 6 characters)" error={pwErr}><input className={inputCls + (pwErr ? invalidCls : "")} aria-invalid={!!pwErr} type="password" autoComplete="new-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label="Confirm password" error={confirmErr}><input className={inputCls + (confirmErr ? invalidCls : "")} aria-invalid={!!confirmErr} type="password" autoComplete="new-password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        <Btn className="w-full" loading={busy} disabled={done}>{busy ? "Creating account…" : "Register"}</Btn>
        <p className="text-sm text-center text-slate-600">Already have an account? <Link to="/login" className="text-indigo-700 font-semibold hover:underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<Guard role="admin" links={adminLinks} />}>
        <Route index element={<A.Overview />} /><Route path="users" element={<A.Users />} /><Route path="employees" element={<A.Employees />} /><Route path="departments" element={<A.Departments />} />
        <Route path="leaves" element={<A.Leaves />} /><Route path="attendance" element={<A.Attendance />} /><Route path="tasks" element={<A.Tasks />} /><Route path="account" element={<Account />} />
      </Route>
      <Route path="/manager" element={<Guard role="manager" links={managerLinks} />}>
        <Route index element={<M.Overview />} /><Route path="team" element={<M.Team />} /><Route path="leaves" element={<M.Leaves />} /><Route path="tasks" element={<M.Tasks />} /><Route path="attendance" element={<M.Attendance />} /><Route path="account" element={<Account />} />
      </Route>
      <Route path="/employee" element={<Guard role="employee" links={employeeLinks} />}>
        <Route index element={<E.Dashboard />} /><Route path="leaves" element={<E.Leaves />} /><Route path="tasks" element={<E.Tasks />} />
        <Route path="attendance" element={<E.Attendance />} /><Route path="profile" element={<E.Profile />} />
      </Route>
      <Route path="*" element={<Navigate to={HOME[getRole()] || "/login"} replace />} />
    </Routes>
  );
}
