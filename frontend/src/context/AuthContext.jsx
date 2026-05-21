import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("hiresense_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hiresense_token");
    if (!token) {
      setBooting(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("hiresense_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("hiresense_token");
        localStorage.removeItem("hiresense_user");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = async (payload, mode = "login") => {
    const { data } = await api.post(`/auth/${mode}`, payload);
    localStorage.setItem("hiresense_token", data.token);
    localStorage.setItem("hiresense_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("hiresense_token");
    localStorage.removeItem("hiresense_user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, booting, login, logout }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
