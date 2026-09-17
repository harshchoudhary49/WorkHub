import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken } from '../api/axiosClient.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  // "booting" = we're still trying the silent refresh on first load, so
  // ProtectedRoute shouldn't redirect to /login prematurely.
  const [booting, setBooting] = useState(true);

  // On first load there's no access token in memory yet (it lives only in
  // JS memory, never localStorage). Try the httpOnly refresh cookie first;
  // if that fails, the user simply isn't logged in.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        const meRes = await authApi.me();
        setUser(meRes.data.data.user);
        setEmployee(meRes.data.data.employee);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setBooting(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    setEmployee(data.data.employee);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setEmployee(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, employee, booting, login, register, logout }),
    [user, employee, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
