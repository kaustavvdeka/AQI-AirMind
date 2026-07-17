import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("airmind_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  function persist(token, user) {
    localStorage.setItem("airmind_token", token);
    localStorage.setItem("airmind_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { token, user } = await api.login(email, password);
    persist(token, user);
  }

  async function register(name, email, password) {
    const { token, user } = await api.register(name, email, password);
    persist(token, user);
  }

  function logout() {
    localStorage.removeItem("airmind_token");
    localStorage.removeItem("airmind_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
