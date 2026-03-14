const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const USER_ID_KEY = 'id_usuario';
const ROLE_ID_KEY = 'id_rol';

// If your DB uses a different role id for admins, change this.
const ADMIN_ROLE_ID = 2;
const COORDINATOR_ROLE_ID = 3;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession({ token, user } = {}) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Keep legacy keys used by some components.
  if (user?.id_usuario !== undefined && user?.id_usuario !== null) {
    localStorage.setItem(USER_ID_KEY, String(user.id_usuario));
  }
  if (user?.id_rol !== undefined && user?.id_rol !== null) {
    localStorage.setItem(ROLE_ID_KEY, String(user.id_rol));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(ROLE_ID_KEY);
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = parts[1];

  // base64url -> base64
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserId() {
  const user = getUser();
  if (user?.id_usuario !== undefined && user?.id_usuario !== null) {
    const n = Number.parseInt(String(user.id_usuario), 10);
    return Number.isFinite(n) ? n : null;
  }

  const raw = localStorage.getItem(USER_ID_KEY);
  if (raw) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }

  const payload = decodeJwtPayload(getToken());
  if (payload?.id_usuario !== undefined && payload?.id_usuario !== null) {
    const n = Number.parseInt(String(payload.id_usuario), 10);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function getRoleId() {
  const user = getUser();
  if (user?.id_rol !== undefined && user?.id_rol !== null) {
    const n = Number.parseInt(String(user.id_rol), 10);
    return Number.isFinite(n) ? n : null;
  }

  const raw = localStorage.getItem(ROLE_ID_KEY);
  if (raw) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }

  const payload = decodeJwtPayload(getToken());
  if (payload?.id_rol !== undefined && payload?.id_rol !== null) {
    const n = Number.parseInt(String(payload.id_rol), 10);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function isAdmin() {
  return getRoleId() >= ADMIN_ROLE_ID;
}

export function canViewAllSolicitudes() {
  const roleId = getRoleId();
  return roleId === ADMIN_ROLE_ID || roleId === COORDINATOR_ROLE_ID;
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearSession();
    return false;
  }
  return true;
}
