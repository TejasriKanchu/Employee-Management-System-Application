import { useState } from "react";
import { api, getEmail } from "../api";
import { Header, Btn, Field, inputCls, invalidCls, Alert, useAction } from "../ui";

export function PasswordForm() {
  const blank = { old_password: "", new_password: "", confirm: "" };
  const [pw, setPw] = useState(blank);
  const [touched, setTouched] = useState(false);
  const [msg, run, , busy] = useAction();
  const newErr = touched && pw.new_password.length < 6 ? "Use at least 6 characters" : "";
  const confirmErr = touched && pw.confirm !== pw.new_password ? "Passwords don't match" : "";
  const change = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (pw.new_password.length < 6 || pw.new_password !== pw.confirm) return;
    if (await run(() => api("/change-password", "PUT", { old_password: pw.old_password, new_password: pw.new_password }), "Password changed")) { setPw(blank); setTouched(false); }
  };
  return (
    <form onSubmit={change} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"><h2 className="font-semibold text-slate-900">Change password</h2>
      <Alert msg={msg} />
      <Field label="Current password"><input type="password" autoComplete="current-password" required className={inputCls} value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} /></Field>
      <Field label="New password" hint="(at least 6 characters)" error={newErr}><input type="password" autoComplete="new-password" required aria-invalid={!!newErr} className={inputCls + (newErr ? invalidCls : "")} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
      <Field label="Confirm new password" error={confirmErr}><input type="password" autoComplete="new-password" required aria-invalid={!!confirmErr} className={inputCls + (confirmErr ? invalidCls : "")} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
      <Btn loading={busy}>{busy ? "Updating…" : "Update password"}</Btn>
    </form>
  );
}

export function Account() {
  return (<><Header title="Account" sub={`Signed in as ${getEmail() || "you"}`} />
    <div className="max-w-md"><PasswordForm /></div></>);
}
