import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";

// Shown when the backend is unreachable (timeout / network error).
function ServerErrorScreen() {
    return (
          <div className="center" style={{ flexDirection: "column", gap: "1rem" }}>
      <p style={{ fontSize: "1.1rem", color: "#555" }}>
        ⚠️ Cannot reach the server. Please check your connection and try again.
          </p>
      <button
        onClick={() => window.location.reload()}
        style={{
                    padding: "0.5rem 1.2rem",
                    background: "#c0392b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "1rem",
        }}
      >
        Retry
          </button>
          </div>
  );
}

// Wrap pages that require a login. Sends guests to the login page.
function Protected({ children }) {
    const { user, loading, serverError } = useAuth();
    if (serverError) return <ServerErrorScreen />;
        if (loading) return <div className="center"><div className="spinner" /></div>;
    return user ? children : <Navigate to="/login" replace />;
}

// Keep logged-in users away from the auth pages.
function GuestOnly({ children }) {
    const { user, loading, serverError } = useAuth();
    if (serverError) return <ServerErrorScreen />;
        if (loading) return <div className="center"><div className="spinner" /></div>;
    return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
    return (
          <Routes>
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/resume/:id" element={<Protected><Editor /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  );
}
