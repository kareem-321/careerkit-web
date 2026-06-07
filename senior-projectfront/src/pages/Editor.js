import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";
import Navbar from "../components/Navbar";
import SectionList from "../components/SectionList";
import ResumePreview from "../components/ResumePreview";

// Field layouts for each repeatable section.
const CONFIGS = {
  experience: {
    apiType: "experience",
    title: "Experience",
    subtitle: "Internships, jobs, and volunteering.",
    titleField: "role",
    fields: ["company", "role", "description", "start_date", "end_date"],
    rows: [
      [{ name: "role", label: "Role / Title", ph: "Frontend Intern" }, { name: "company", label: "Company", ph: "Acme Inc." }],
      [{ name: "start_date", label: "Start", ph: "Jun 2024" }, { name: "end_date", label: "End", ph: "Present" }],
      [{ name: "description", label: "What you did", ph: "Built X using React, improved Y by Z%…", area: true }],
    ],
  },
  education: {
    apiType: "education",
    title: "Education",
    subtitle: "Degrees, schools, certifications.",
    titleField: "institution",
    fields: ["institution", "degree", "start_date", "end_date"],
    rows: [
      [{ name: "institution", label: "Institution", ph: "Lebanese International University" }],
      [{ name: "degree", label: "Degree / Field", ph: "BSc Computer Science" }],
      [{ name: "start_date", label: "Start", ph: "2022" }, { name: "end_date", label: "End", ph: "2026" }],
    ],
  },
  projects: {
    apiType: "projects",
    title: "Projects",
    subtitle: "Course projects, side projects, anything you built.",
    titleField: "name",
    fields: ["name", "description", "link"],
    rows: [
      [{ name: "name", label: "Project name", ph: "CareerKit" }],
      [{ name: "description", label: "Description", ph: "A full-stack CV builder using React + Node + MySQL.", area: true }],
      [{ name: "link", label: "Link (optional)", ph: "https://github.com/…" }],
    ],
  },
  skills: {
    apiType: "skills",
    title: "Skills",
    subtitle: "Languages, frameworks, tools.",
    titleField: "name",
    fields: ["name", "category"],
    rows: [
      [{ name: "name", label: "Skill", ph: "React", flex: 2 }, { name: "category", label: "Category", ph: "Frontend" }],
    ],
  },
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resume, setResume] = useState(null);   // { id, title, versions: [] }
  const [versionId, setVersionId] = useState(null);
  const [data, setData] = useState(null);        // full version + sections
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // brief "Saved ✓" flash
  const flashSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }, []);

  const loadVersion = useCallback(async (vid) => {
    const res = await api.get(`/resumes/versions/${vid}`);
    setData(res.data);
  }, []);

  const loadResume = useCallback(async () => {
    try {
      const res = await api.get(`/resumes/${id}`);
      setResume(res.data);
      const latest = res.data.versions[0];        // versions come newest-first
      setVersionId(latest.id);
      await loadVersion(latest.id);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, loadVersion]);

  useEffect(() => { loadResume(); }, [loadResume]);

  // ---- header (contact + summary) ----
  function setHeader(name, value) {
    setData((d) => ({ ...d, [name]: value }));
  }
  async function saveHeader() {
    try {
      await api.put(`/resumes/versions/${versionId}`, {
        contact_info: data.contact_info,
        summary: data.summary,
      });
      flashSaved();
    } catch {
      alert("Could not save header. Please try again.");
    }
  }

  // ---- resume title ----
  function setTitle(value) {
    setResume((r) => ({ ...r, title: value }));
  }
  async function saveTitle() {
    try {
      await api.put(`/resumes/${id}`, { title: resume.title });
      flashSaved();
    } catch {
      alert("Could not save title. Please try again.");
    }
  }

  // ---- section items ----
  async function addItem(type) {
    try {
      const cfg = CONFIGS[type];
      const res = await api.post(`/sections/${cfg.apiType}`, { version_id: versionId });
      const blank = { id: res.data.id };
      cfg.fields.forEach((f) => (blank[f] = ""));
      setData((d) => ({ ...d, [type]: [...d[type], blank] }));
    } catch {
      alert("Could not add item. Please try again.");
    }
  }

  function onField(type, itemId, name, value) {
    setData((d) => ({
      ...d,
      [type]: d[type].map((it) => (it.id === itemId ? { ...it, [name]: value } : it)),
    }));
  }

  async function saveItem(type, item) {
    try {
      const cfg = CONFIGS[type];
      const payload = {};
      cfg.fields.forEach((f) => (payload[f] = item[f] ?? ""));
      await api.put(`/sections/${cfg.apiType}/${item.id}`, payload);
      flashSaved();
    } catch {
      alert("Could not save changes. Please try again.");
    }
  }

  async function removeItem(type, itemId) {
    try {
      const cfg = CONFIGS[type];
      await api.delete(`/sections/${cfg.apiType}/${itemId}`);
      setData((d) => ({ ...d, [type]: d[type].filter((it) => it.id !== itemId) }));
    } catch {
      alert("Could not remove item. Please try again.");
    }
  }

  // ---- versions ----
  async function newVersion() {
    if (!window.confirm("Save the current content as a new version? You can switch back anytime.")) return;
    try {
      await api.post(`/resumes/${id}/versions`, { source_version_id: versionId });
      await loadResume(); // refreshes version list and loads the new latest version
      flashSaved();
    } catch {
      alert("Could not create the new version. Please try again.");
    }
  }

  async function switchVersion(vid) {
    setVersionId(Number(vid));
    await loadVersion(vid);
  }

  function exportPdf() {
    window.print();
  }

  if (loading || !data) {
    return (<><Navbar /><div className="center"><div className="spinner" /></div></>);
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="editor-bar">
          <input
            className="title-input"
            value={resume.title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
          <div className="editor-tools">
            {saved && <span className="save-hint">Saved ✓</span>}
            <select
              className="version-select"
              value={versionId}
              onChange={(e) => switchVersion(e.target.value)}
            >
              {resume.versions.map((v) => (
                <option key={v.id} value={v.id}>Version {v.version_number}</option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={newVersion}>+ New version</button>
            <button className="btn btn-primary btn-sm" onClick={exportPdf}>Export PDF</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>Back</button>
          </div>
        </div>

        <div className="editor-grid">
          {/* LEFT: the forms */}
          <div className="left-col">
            <div className="card panel">
              <h2>Header</h2>
              <p className="panel-sub">Contact details and a short summary.</p>
              <div className="field">
                <label>Contact info</label>
                <textarea
                  value={data.contact_info || ""}
                  placeholder={"you@email.com · +961 …\nCity, Country · linkedin.com/in/…"}
                  onChange={(e) => setHeader("contact_info", e.target.value)}
                  onBlur={saveHeader}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Professional summary</label>
                <textarea
                  value={data.summary || ""}
                  placeholder="Final-year CS student focused on web development…"
                  onChange={(e) => setHeader("summary", e.target.value)}
                  onBlur={saveHeader}
                />
              </div>
            </div>

            {["experience", "education", "projects", "skills"].map((type) => (
              <SectionList
                key={type}
                config={CONFIGS[type]}
                items={data[type]}
                onAdd={() => addItem(type)}
                onField={(itemId, name, value) => onField(type, itemId, name, value)}
                onSaveItem={(item) => saveItem(type, item)}
                onRemove={(itemId) => removeItem(type, itemId)}
              />
            ))}
          </div>

          {/* RIGHT: live preview */}
          <div className="preview-wrap">
            <div className="preview-toolbar">
              <span className="muted" style={{ fontSize: "0.85rem" }}>Live preview</span>
              <button className="btn btn-ghost btn-sm" onClick={exportPdf}>Print / Save as PDF</button>
            </div>
            <ResumePreview title={resume.title} data={data} fullName={user?.full_name} />
          </div>
        </div>
      </div>
    </>
  );
}
