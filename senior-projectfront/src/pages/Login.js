import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/login", form);
      signIn(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <div className="logo"><span className="dot" /> CareerKit</div>
        <div>
          <h2>Build a clean CV worth submitting.</h2>
          <p>Guided forms, a live preview, and saved versions — so every application starts from your best work.</p>
          <ul className="features">
            <li>Structured sections that stay consistent</li>
            <li>Live preview as you type</li>
            <li>Version history for every resume</li>
            <li>Export a ready-to-send PDF</li>
          </ul>
        </div>
        <span className="muted" style={{ color: "#9a9388" }}>CSCI426 — Web Programming Advanced</span>
      </div>

      <div className="auth-form">
        <div className="inner">
          <h1>Welcome back</h1>
          <p className="sub">Log in to your CareerKit account.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={update} placeholder="you@email.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={update} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
