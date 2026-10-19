import { useEffect, useState, useCallback } from "react";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const getToken = () => localStorage.getItem("token");
export const getEmail = () => localStorage.getItem("email") || "";
export const signOut = () => { localStorage.removeItem("token"); localStorage.removeItem("email"); };
export const getRole = () => {
  try {
    const p = JSON.parse(atob(getToken().split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (p.exp && p.exp * 1000 < Date.now()) { signOut(); return null; }
    return p.role;
  } catch { return null; }
};
const errorText = (data) => {
  const d = data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg.replace(/^Value error, /, "");
  return "Request failed";
};
export async function api(path, method = "GET", body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
    body: body && JSON.stringify(body),
  });
  // A 401 from /login is just bad credentials; anywhere else the session is gone
  if (r.status === 401 && path !== "/login") { signOut(); window.location.href = "/login"; }
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(errorText(data));
  return data;
}
// GET helper: const [data, reload, loading, error] = useGet("/employees")
export function useGet(path, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => api(path).then((d) => { setData(d); setError(""); }).catch((x) => { setData(fallback); setError(x.message); }).finally(() => setLoading(false)), [path]);
  useEffect(() => { load(); }, [load]);
  return [data, load, loading, error];
}
