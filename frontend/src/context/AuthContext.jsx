import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    // Respect user preference stored in DB; default to dark if no preference set
    const storedUser = readStoredUser();
    const preferDark = storedUser?.preferences?.darkMode !== false;
    document.documentElement.classList.toggle("dark", preferDark);
  }, []);

  // Axios response interceptor: auto-refresh access token on 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const { data } = await api.post("/api/auth/refresh", { refreshToken });
              localStorage.setItem("accessToken", data.accessToken);
              if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
              original.headers.Authorization = `Bearer ${data.accessToken}`;
              return api(original);
            } catch {
              // Refresh failed — clear session and redirect to login
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              setUser(null);
            }
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    persistSession(data);
    toast.success("Signed in");
  }

  async function register(payload) {
    const { data } = await api.post("/api/auth/register", payload);
    persistSession(data);
    toast.success("Account created");
  }

  async function logout() {
    await api.post("/api/auth/logout").catch(() => null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  function persistSession(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function readStoredUser() {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
}
