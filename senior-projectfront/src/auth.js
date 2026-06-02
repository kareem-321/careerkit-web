import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, ask the server who we are.
  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    if (!token) { setLoading(false); return; }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("ck_token"))
      .finally(() => setLoading(false));
  }, []);

  // Save token + user after a successful login/register.
  function signIn(token, userData) {
    localStorage.setItem("ck_token", token);
    setUser(userData);
  }

  function signOut() {
    localStorage.removeItem("ck_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
