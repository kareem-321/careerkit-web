import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
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
      const res = await api.post("/auth/register", form);
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
          <h2>Your CV, organized and reusable.</h2>
          <p>Stop reformatting in Word for every application. Keep your content structured and export when you need it.</p>
          <ul className="features">
            <li>One account, many resumes</li>
            <li>Education, experience, projects, skills</li>
            <li>Save versions and reopen them anytime</li>
          </ul>
        </div>
        <span className="muted" style={{ color: "#9a9388" }}>CSCI426 — Web Programming Advanced</span>
      </div>

      <div className="auth-form">
        <div className="inner">
          <h1>Create your account</h1>
          <p className="sub">Free, and takes a few seconds.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input name="full_name" value={form.full_name} onChange={update} placeholder="Karim Aoun" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={update} placeholder="you@email.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={update} placeholder="At least 6 characters" required />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
