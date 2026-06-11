export type AuthUser = {
  username: string;
  name: string;
  role: string;
};

const AUTH_STORAGE_KEY = "falai-auth-session";
const MOCK_USERNAME = "admin";
const MOCK_PASSWORD = "pex5";

export function authenticateMockUser(username: string, password: string): AuthUser | null {
  if (username.trim() !== MOCK_USERNAME || password !== MOCK_PASSWORD) return null;

  return {
    username: MOCK_USERNAME,
    name: "Administrador",
    role: "Admin",
  };
}

export function readAuthSession(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    return user.username ? user : null;
  } catch {
    return null;
  }
}

export function storeAuthSession(user: AuthUser) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
