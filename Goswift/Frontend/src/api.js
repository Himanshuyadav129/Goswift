export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// On logout, stop push notifications on this device so the next person on it doesn't get them
async function detachPush(token) {
  if (!token || !("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  await fetch(`${API_URL}/api/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: sub.endpoint })
  });
  await sub.unsubscribe();
}

export const clearAuth = () => {
  detachPush(getToken()).catch(() => {});
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// fetch wrapper: adds the JWT, sends/parses JSON, throws Error(message) with .status on failure
// Pass { auth: false } for login/register (no token sent, a 401 there just means "wrong password").
export async function apiFetch(path, { auth = true, ...options } = {}) {
  const token = auth ? getToken() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token expired or account removed: log out cleanly and go to the login page
    if (res.status === 401 && token) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    }
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Download a file that needs the login token (e.g. the CSV report)
export async function apiDownload(path, filename) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || "Download failed");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
