import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const res = await api.get("/resumes");
      setResumes(res.data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Could not load your resumes. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createResume() {
    const title = window.prompt("Name your resume:", "My Resume");
    if (title === null) return;
    setCreating(true);
    try {
      const res = await api.post("/resumes", { title: title || "Untitled Resume" });
      navigate(`/resume/${res.data.id}`);
    } catch {
      alert("Could not create the resume.");
      setCreating(false);
    }
  }

  async function deleteResume(id, title) {
    if (!window.confirm(`Delete "${title}"? This removes all its versions.`)) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes((r) => r.filter((x) => x.id !== id));
    } catch {
      alert("Could not delete the resume.");
    }
  }

  if (loading) {
    return (<><Navbar /><div className="center"><div className="spinner" /></div></>);
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="dash-head">
          <div>
            <h1>Your resumes</h1>
            <p>Create, edit, and export your CVs.</p>
          </div>
          <button className="btn btn-primary" onClick={createResume} disabled={creating}>
            + New resume
          </button>
        </div>

        {loadError && <div className="error-box">{loadError}</div>}

        {resumes.length === 0 && !loadError ? (
          <div className="empty">
            <div className="doc-icon" />
            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>No resumes yet</h3>
            <p>Click “New resume” to start building your first CV.</p>
          </div>
        ) : !loadError && (
          <div className="grid">
            {resumes.map((r) => (
              <div key={r.id} className="card resume-card">
                <div className="doc-icon" />
                <h3>{r.title}</h3>
                <div className="meta">
                  {r.version_count} version{r.version_count === 1 ? "" : "s"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
                <div className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/resume/${r.id}`)}>
                    Open
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteResume(r.id, r.title)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
