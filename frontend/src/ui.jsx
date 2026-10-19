import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, LogOut, Menu as MenuIcon, MoreHorizontal, RotateCw, Search, X } from "lucide-react";
import { getEmail, signOut } from "./api";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const ROLE_LABEL = { admin: "Administrator", manager: "Manager", employee: "Employee" };

// links: [to, label, Icon] entries; a plain string starts a new section
export function Shell({ role, links }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const email = getEmail();
  const logout = () => { signOut(); nav("/login"); };
  return (
    <div className="min-h-screen">
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 bg-slate-900 text-white px-2 py-1.5">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className={`h-11 w-11 grid place-items-center rounded-lg ${focusRing}`}><MenuIcon size={22} /></button>
        <p className="font-semibold flex-1">EMS <span className="text-xs text-slate-300 font-normal">· {ROLE_LABEL[role]}</span></p>
        {email && <Avatar name={email} className="h-8 w-8 text-xs mr-2" />}
      </header>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40" onClick={() => setOpen(false)} />}
      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col p-4 fixed inset-y-0 z-50 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-2 py-2 mb-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 grid place-items-center text-white font-bold">E</div>
          <div className="flex-1"><p className="text-white font-semibold leading-tight">EMS</p><p className="text-xs text-slate-400">{ROLE_LABEL[role]} workspace</p></div>
          <button className={`lg:hidden h-9 w-9 grid place-items-center rounded-lg ${focusRing}`} onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto">
          {links.map((l, i) => typeof l === "string"
            ? <p key={l} className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${i ? "pt-4" : ""}`}>{l}</p>
            : (
              <NavLink key={l[0]} to={l[0]} end onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${focusRing} ${isActive ? "bg-indigo-600 text-white font-semibold" : "hover:bg-slate-800 hover:text-white"}`}>
                {(() => { const Icon = l[2]; return <Icon size={18} aria-hidden="true" />; })()} {l[1]}
              </NavLink>
            ))}
        </nav>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-800 p-2.5">
          <Avatar name={email || role} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white truncate" title={email}>{email || "Signed in"}</p><p className="text-xs text-slate-400">{ROLE_LABEL[role]}</p></div>
          <IconBtn label="Sign out" icon={LogOut} onClick={logout} className="!border-transparent !bg-transparent !text-slate-300 hover:!bg-slate-700 hover:!text-white" />
        </div>
      </aside>
      <main className="lg:ml-64 p-4 lg:p-8 min-w-0"><Outlet /></main>
      <Toaster />
    </div>
  );
}

export const Header = ({ title, sub, children }) => {
  useEffect(() => { document.title = `${title} · EMS`; }, [title]);
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>{sub && <p className="text-sm text-slate-600 mt-1">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
};

export const Avatar = ({ name = "", className = "h-9 w-9 text-sm" }) => {
  const parts = String(name).split(/[\s@._-]+/).filter(Boolean);
  const initials = ((parts[0]?.[0] || "") + (parts.length > 1 && !String(name).includes("@") ? parts[1][0] : "")).toUpperCase() || "?";
  return <div className={`shrink-0 rounded-full bg-indigo-100 text-indigo-800 grid place-items-center font-semibold ${className}`} aria-hidden="true">{initials}</div>;
};

// tone: "warn" | "bad" highlights the hint; `to` makes the whole card a link
export const Stat = ({ label, value, icon: Icon, color = "indigo", to, hint, tone }) => {
  const c = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", sky: "bg-sky-50 text-sky-700" }[color];
  const border = tone === "warn" ? "border-amber-300" : tone === "bad" ? "border-rose-300" : "border-slate-200";
  const hintCls = tone === "warn" ? "text-amber-800 font-semibold" : tone === "bad" ? "text-rose-700 font-semibold" : "text-slate-600";
  const body = (
    <>
      <div className={`hidden sm:grid h-11 w-11 shrink-0 rounded-xl place-items-center ${c}`}><Icon size={20} aria-hidden="true" /></div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className={`text-xs mt-0.5 ${hintCls}`}>{hint}</p>}
      </div>
    </>
  );
  const cls = `bg-white rounded-2xl p-4 sm:p-5 border ${border} flex items-center gap-4`;
  return to ? <Link to={to} className={`${cls} transition hover:border-indigo-300 hover:shadow-sm ${focusRing}`}>{body}</Link> : <div className={cls}>{body}</div>;
};

export const Card = ({ title, action, children, className = "" }) => (
  <section className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
    {title && <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">{title}</h2>{action}</div>}
    {children}
  </section>
);

const TONES = {
  green: "bg-emerald-50 text-emerald-800 [--dot:#10b981]",
  amber: "bg-amber-50 text-amber-800 [--dot:#f59e0b]",
  red: "bg-rose-50 text-rose-800 [--dot:#f43f5e]",
  blue: "bg-sky-50 text-sky-800 [--dot:#0ea5e9]",
  indigo: "bg-indigo-50 text-indigo-800 [--dot:#6366f1]",
  slate: "bg-slate-100 text-slate-700 [--dot:#94a3b8]",
};
const AUTO = { approved: "green", present: "green", completed: "green", active: "green", pending: "amber", "in progress": "blue", leave: "blue", rejected: "red", absent: "red", inactive: "red", overdue: "red", high: "red", medium: "amber", low: "slate", admin: "indigo", manager: "blue", employee: "slate" };
const LABEL = { leave: "On leave" };
// Dot + word, so the meaning never depends on colour alone
export const Badge = ({ text, tone, dot = true }) => {
  const key = String(text ?? "").toLowerCase();
  const label = LABEL[key] || (key ? String(text)[0].toUpperCase() + String(text).slice(1) : "—");
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TONES[tone || AUTO[key] || "slate"]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" aria-hidden="true" />}{label}
    </span>
  );
};

export const EmptyState = ({ icon: Icon = Inbox, title = "Nothing here yet", text, action }) => (
  <div className="flex flex-col items-center text-center gap-2 px-6 py-10">
    <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 grid place-items-center"><Icon size={20} aria-hidden="true" /></div>
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    {text && <p className="text-sm text-slate-600 max-w-sm">{text}</p>}
    {action}
  </div>
);

export const ErrorState = ({ text, onRetry }) => (
  <div role="alert" className="m-4 flex gap-3 items-start rounded-xl border border-rose-200 bg-rose-50 p-4">
    <AlertCircle size={18} className="text-rose-700 mt-0.5 shrink-0" aria-hidden="true" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-rose-900">Couldn't load this list</p>
      <p className="text-sm text-rose-800 mt-0.5">{text || "The server didn't respond."}</p>
      {onRetry && <Btn variant="secondary" className="mt-3 !h-8 !px-3" onClick={onRetry}><RotateCw size={14} aria-hidden="true" />Try again</Btn>}
    </div>
  </div>
);

const Skeleton = ({ className = "" }) => <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
export const PageSkeleton = () => (
  <div aria-busy="true" aria-label="Loading" className="space-y-6">
    <Skeleton className="h-8 w-56" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);

// cols: [header, render]; an empty header is an actions column.
// loading shows placeholder rows, error shows a retry box, pageSize adds paging.
export function Table({ cols, rows, empty = "Nothing here yet", emptyText, emptyIcon, loading, error, onRetry, pageSize = 0 }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [rows.length]);
  if (error) return <ErrorState text={error} onRetry={onRetry} />;
  const pages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const p = Math.min(page, pages - 1);
  const shown = pageSize ? rows.slice(p * pageSize, (p + 1) * pageSize) : rows;
  const emptyEl = <EmptyState icon={emptyIcon} title={empty} text={emptyText} />;
  const skeletonRows = [0, 1, 2, 3];
  const [titleCol, ...rest] = cols;
  return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-200">{cols.map(([h], i) => <th key={h || `a${i}`} scope="col" className="px-5 py-3 whitespace-nowrap">{h || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100" aria-busy={loading || undefined}>
            {loading
              ? skeletonRows.map((i) => <tr key={i}>{cols.map(([h], j) => <td key={j} className="px-5 py-4"><Skeleton className={`h-3.5 ${j ? "w-20" : "w-40"}`} /></td>)}</tr>)
              : shown.map((r, i) => <tr key={r.id ?? i} className="hover:bg-slate-50">{cols.map(([h, f], j) => <td key={h || `a${j}`} className={`px-5 py-3 text-slate-800 ${h ? "" : "text-right w-px whitespace-nowrap"}`}>{f(r)}</td>)}</tr>)}
            {!loading && !rows.length && <tr><td colSpan={cols.length}>{emptyEl}</td></tr>}
          </tbody>
        </table>
      </div>
      {/* Phones: each row becomes a small card instead of a wide table */}
      <ul className="sm:hidden divide-y divide-slate-100" aria-busy={loading || undefined}>
        {loading
          ? skeletonRows.map((i) => <li key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></li>)
          : shown.map((r, i) => (
            <li key={r.id ?? i} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-sm text-slate-900">{titleCol[1](r)}</div>
                {rest.filter(([h]) => !h).map(([, f], j) => <div key={j} className="shrink-0">{f(r)}</div>)}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {rest.filter(([h]) => h).map(([h, f]) => <div key={h} className="min-w-0"><dt className="text-xs text-slate-500">{h}</dt><dd className="text-slate-800 break-words">{f(r)}</dd></div>)}
              </dl>
            </li>
          ))}
        {!loading && !rows.length && <li>{emptyEl}</li>}
      </ul>
      {pageSize > 0 && !loading && rows.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm text-slate-600">
          <span className="tabular-nums">Showing {p * pageSize + 1}–{Math.min(rows.length, (p + 1) * pageSize)} of {rows.length}</span>
          <div className="flex gap-2">
            <Btn variant="secondary" className="!h-9" disabled={p === 0} onClick={() => setPage(p - 1)}><ChevronLeft size={16} aria-hidden="true" />Previous</Btn>
            <Btn variant="secondary" className="!h-9" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next<ChevronRight size={16} aria-hidden="true" /></Btn>
          </div>
        </div>
      )}
    </>
  );
}

// Search box plus any filter controls, shown above a table
export const Toolbar = ({ search, onSearch, placeholder = "Search", children }) => (
  <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200">
    {onSearch && (
      <label className="relative flex-1 min-w-[200px]">
        <span className="sr-only">{placeholder}</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input type="search" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} className={inputCls + " pl-9"} />
      </label>
    )}
    {children}
  </div>
);

// options: [value, label, count?]
export const Segmented = ({ label, options, value, onChange }) => (
  <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
    {options.map(([v, l, n]) => (
      <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`h-8 px-3 rounded-md text-sm font-semibold transition ${focusRing} ${value === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
        {l}{n != null && <span className="ml-1.5 tabular-nums text-slate-500">{n}</span>}
      </button>
    ))}
  </div>
);

const BTN = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  "danger-outline": "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50",
  ok: "bg-emerald-600 text-white hover:bg-emerald-700",
};
// loading disables the button and shows a spinner, so one click saves once
export const Btn = ({ variant = "primary", loading, children, className = "", ...p }) => (
  <button {...p} disabled={p.disabled || loading} aria-busy={loading || undefined} className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition ${focusRing} disabled:opacity-60 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}>
    {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{children}
  </button>
);

export const IconBtn = forwardRef(({ label, icon: Icon, active, className = "", ...p }, ref) => (
  <button ref={ref} type="button" aria-label={label} title={label} {...p} className={`inline-grid place-items-center h-9 w-9 shrink-0 rounded-lg border transition ${focusRing} ${active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"} ${className}`}>
    <Icon size={18} aria-hidden="true" />
  </button>
));

// "⋯" row menu. items: { label, onClick, danger, disabled } or "-" for a divider. Positioned fixed so table scrolling can't clip it.
export function Menu({ label, items }) {
  const btn = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const key = (e) => { if (e.key === "Escape") { close(); btn.current?.focus(); } };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", key);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); document.removeEventListener("keydown", key); };
  }, [pos]);
  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - r.right);
    setPos(r.bottom + 220 > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right });
  };
  const list = items.filter(Boolean);
  return (
    <>
      <IconBtn ref={btn} label={label} icon={MoreHorizontal} onClick={toggle} active={!!pos} aria-haspopup="menu" aria-expanded={!!pos} />
      {pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPos(null)} />
          <div role="menu" aria-label={label} style={pos} className="fixed z-50 w-52 flex flex-col whitespace-normal rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left"
            ref={(el) => el?.querySelector("button:not(:disabled)")?.focus()}>
            {list.map((it, i) => it === "-"
              ? <div key={i} className="my-1 h-px bg-slate-200" />
              : <button key={it.label} type="button" role="menuitem" disabled={it.disabled} onClick={() => { setPos(null); it.onClick(); }}
                  className={`w-full h-9 px-3 rounded-md text-left text-sm transition focus:outline-none focus:bg-slate-100 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent ${it.danger ? "text-rose-700 font-semibold" : "text-slate-800"}`}>{it.label}</button>)}
          </div>
        </>
      )}
    </>
  );
}

export const Field = ({ label, hint, error, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700">{label}{hint && <span className="font-normal text-slate-500"> {hint}</span>}</span>
    <div className="mt-1.5">{children}</div>
    {error && <span className="mt-1.5 flex items-center gap-1.5 text-sm text-rose-700"><AlertCircle size={14} aria-hidden="true" />{error}</span>}
  </label>
);
// inputBase has no width so callers can size it; inputCls fills its container
export const inputBase = "rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
export const inputCls = "w-full " + inputBase;
export const invalidCls = " !border-rose-500 ring-2 ring-rose-100";

// Accessible dialog: Esc and the backdrop close it, focus moves in and stays inside, then returns
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    (el.querySelector("input:not([type=hidden]),select,textarea,[data-autofocus]") || el.querySelector("button:not([data-close])") || el).focus();
    const key = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const f = [...el.querySelectorAll("button,input,select,textarea,a[href]")].filter((x) => !x.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); prev?.focus?.(); };
  }, []);
  return (
    <div className="fixed inset-0 bg-slate-900/40 grid place-items-center z-50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto focus:outline-none">
        <div className="flex justify-between items-center gap-3 mb-4"><h3 id={id} className="font-semibold text-lg text-slate-900">{title}</h3><IconBtn data-close label="Close" icon={X} onClick={onClose} className="!border-transparent" /></div>
        {children}
      </div>
    </div>
  );
}

// const [confirmEl, ask] = useConfirm(); if (await ask({ title, body, confirmText })) ...; render {confirmEl}
export function useConfirm() {
  const [state, setState] = useState(null);
  const ask = (opts) => new Promise((resolve) => setState({ ...opts, resolve }));
  const close = (v) => { state.resolve(v); setState(null); };
  const el = state && (
    <Modal title={state.title} onClose={() => close(false)}>
      {state.body && <p className="text-sm text-slate-700 leading-relaxed">{state.body}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Btn variant="secondary" data-autofocus onClick={() => close(false)}>Cancel</Btn>
        <Btn variant={state.danger === false ? "primary" : "danger"} onClick={() => close(true)}>{state.confirmText || "Confirm"}</Btn>
      </div>
    </Modal>
  );
  return [el, ask];
}

export const Alert = ({ msg, className = "" }) =>
  msg?.text ? <p role={msg.ok ? "status" : "alert"} className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? "text-emerald-800 bg-emerald-50" : "text-rose-800 bg-rose-50"} ${className}`}>{msg.text}</p> : null;

// Corner notifications: toast.success("Saved") / toast.error("…") from anywhere; <Toaster /> renders them
const toastListeners = new Set();
let toastId = 0;
export const toast = {
  show: (text, ok) => toastListeners.forEach((l) => l({ id: ++toastId, text, ok })),
  success: (text) => toast.show(text, true),
  error: (text) => toast.show(text, false),
};
export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const add = (t) => { setItems((s) => [...s, t]); setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 4000); };
    toastListeners.add(add);
    return () => toastListeners.delete(add);
  }, []);
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col items-end gap-2 pointer-events-none">
      {items.map((t) => (
        <div key={t.id} role={t.ok ? "status" : "alert"} className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900 text-white text-sm px-4 py-3 shadow-lg max-w-sm">
          {t.ok ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertCircle size={18} className="text-rose-400 shrink-0" aria-hidden="true" />}
          <span className="flex-1">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// Runs api calls: const [msg, run, setMsg, busy] = useAction(); run(() => api(...), "Saved")
// Success shows a corner toast; errors show inline via msg, or as a toast with { toastErrors: true }.
export function useAction({ toastErrors = false } = {}) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn, success) => {
    setBusy(true);
    try {
      const r = await fn();
      setMsg(null);
      if (success) toast.success(success);
      return r ?? true;
    } catch (x) {
      if (toastErrors) toast.error(x.message); else setMsg({ ok: false, text: x.message });
      return false;
    } finally {
      setBusy(false);
    }
  };
  return [msg, run, setMsg, busy];
}

// Dates: one readable format everywhere ("15 Oct 2026"); unparseable values are shown as stored
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
export const fmtDate = (s) => { const d = parseDate(s); return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : s || "—"; };
export const fmtRange = (a, b) => {
  const x = parseDate(a), y = parseDate(b);
  if (!x) return "Not recorded";
  if (!y || +x === +y) return fmtDate(a);
  if (x.getFullYear() !== y.getFullYear()) return `${fmtDate(a)} – ${fmtDate(b)}`;
  if (x.getMonth() === y.getMonth()) return `${x.getDate()}–${y.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  return `${x.getDate()} ${MONTHS[x.getMonth()]} – ${y.getDate()} ${MONTHS[y.getMonth()]} ${y.getFullYear()}`;
};
// Local calendar date (toISOString() is UTC, which is still "yesterday" early in the morning east of UTC)
export const localToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const longToday = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const daysBetween = (a, b) => (parseDate(a) && parseDate(b) ? Math.round((parseDate(b) - parseDate(a)) / 86400000) + 1 : null);
export const leaveDates = (r) => fmtRange(r.start_date, r.end_date);
export const isOverdue = (t) => !!t.due_date && t.status !== "Completed" && t.due_date < localToday();

// Task status badge: Pending is neutral grey for tasks; overdue work is flagged
export const TaskStatus = ({ task }) => (
  <span className="inline-flex flex-wrap gap-1.5"><Badge text={task.status} tone={task.status === "Pending" ? "slate" : undefined} />{isOverdue(task) && <Badge text="Overdue" />}</span>
);
export const DueDate = ({ task }) => <span className={`whitespace-nowrap ${isOverdue(task) ? "text-rose-700 font-semibold" : ""}`}>{task.due_date ? fmtDate(task.due_date) : "—"}</span>;
export const matches = (q, ...fields) => !q || fields.some((f) => String(f ?? "").toLowerCase().includes(q.trim().toLowerCase()));
