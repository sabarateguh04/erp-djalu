import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFromToken = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { user: me, role: myRole } = await authApi.me();
      setUser(me);
      setRole(myRole);
    } catch {
      setToken(null);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromToken();
  }, [loadFromToken]);

  const login = useCallback(async (identifier, password) => {
    const data = await authApi.login({ identifier, password });
    setToken(data.token);
    setUser(data.user);
    setRole(data.role);
    return data;
  }, []);

  const register = useCallback((payload) => authApi.register(payload), []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort, still clear local state
    }
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const hasPermission = useCallback(
    (code) => {
      if (!role) return false;
      return role.permissions.includes("*") || role.permissions.includes(code);
    },
    [role]
  );

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      hasPermission,
      refresh: loadFromToken,
    }),
    [user, role, loading, login, register, logout, hasPermission, loadFromToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
