import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";

// Wrap pages that require a login. Sends guests to the login page.
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Keep logged-in users away from the auth pages.
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
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
