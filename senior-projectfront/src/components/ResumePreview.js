// Renders a clean, print-friendly CV from the current version's data.
export default function ResumePreview({ title, data, fullName }) {
  if (!data) return null;
  const { contact_info, summary, education, experience, projects, skills } = data;

  const hasContent =
    contact_info || summary ||
    education.length || experience.length || projects.length || skills.length;

  return (
    <div className="cv">
      <div className="cv-name">{fullName || title || "Your Name"}</div>
      {contact_info ? (
        <div className="cv-contact">{contact_info}</div>
      ) : (
        <div className="cv-contact cv-empty-note">Add your contact info on the left…</div>
      )}

      {summary && (
        <div className="cv-section">
          <h4>Summary</h4>
          <p style={{ margin: 0 }}>{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="cv-section">
          <h4>Experience</h4>
          {experience.map((e) => (
            <div className="cv-entry" key={e.id}>
              <div className="line1">
                <b>{e.role || "Role"}{e.company ? ` · ${e.company}` : ""}</b>
                <span>{[e.start_date, e.end_date].filter(Boolean).join(" – ")}</span>
              </div>
              {e.description && <p>{e.description}</p>}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="cv-section">
          <h4>Education</h4>
          {education.map((ed) => (
            <div className="cv-entry" key={ed.id}>
              <div className="line1">
                <b>{ed.institution || "Institution"}</b>
                <span>{[ed.start_date, ed.end_date].filter(Boolean).join(" – ")}</span>
              </div>
              {ed.degree && <div className="line2">{ed.degree}</div>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="cv-section">
          <h4>Projects</h4>
          {projects.map((p) => (
            <div className="cv-entry" key={p.id}>
              <div className="line1">
                <b>{p.name || "Project"}</b>
                {p.link && <span><a href={p.link}>{p.link}</a></span>}
              </div>
              {p.description && <p>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="cv-section">
          <h4>Skills</h4>
          <div className="cv-skills">
            {skills.map((s) => (
              <span key={s.id}>{s.name}{s.category ? ` (${s.category})` : ""}</span>
            ))}
          </div>
        </div>
      )}

      {!hasContent && (
        <p className="cv-empty-note">Your CV preview will appear here as you fill in the sections.</p>
      )}
    </div>
  );
}
