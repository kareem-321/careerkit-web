import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState(false);

  // On first load, if a token exists, ask the server who we are.
  useEffect(() => {
        const token = localStorage.getItem("ck_token");
        if (!token) { setLoading(false); return; }
        api
          .get("/auth/me")
          .then((res) => { setUser(res.data); setServerError(false); })
          .catch((err) => {
                    localStorage.removeItem("ck_token");
                    // Distinguish a network/timeout error from a 401 (token expired).
                         if (!err.response) setServerError(true);
          })
          .finally(() => setLoading(false));
  }, []);

  // Save token + user after a successful login/register.
  function signIn(token, userData) {
        localStorage.setItem("ck_token", token);
        setUser(userData);
        setServerError(false);
  }

  function signOut() {
        localStorage.removeItem("ck_token");
        setUser(null);
  }

  return (
        <AuthContext.Provider value={{ user, loading, serverError, signIn, signOut }}>
{children}
</AuthContext.Provider>
  );
}

export function useAuth() {
    return useContext(AuthContext);
}
