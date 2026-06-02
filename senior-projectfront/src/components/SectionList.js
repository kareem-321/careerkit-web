// Generic editor for one repeatable section (education / experience / projects / skills).
// Inputs update the parent state immediately (so the preview is live),
// and save to the database when the field loses focus (onBlur).
export default function SectionList({ config, items, onAdd, onField, onSaveItem, onRemove }) {
  return (
    <div className="card panel">
      <h2>
        {config.title}
        <button className="btn btn-ghost btn-sm" onClick={onAdd}>+ Add</button>
      </h2>
      {config.subtitle && <p className="panel-sub">{config.subtitle}</p>}

      {items.length === 0 && <p className="muted" style={{ margin: 0 }}>Nothing added yet.</p>}

      {items.map((item) => (
        <div className="item-card" key={item.id}>
          <div className="item-head">
            <strong>{item[config.titleField] || `New ${config.title.toLowerCase()} entry`}</strong>
            <button className="btn btn-danger btn-sm" onClick={() => onRemove(item.id)}>Remove</button>
          </div>

          {config.rows.map((row, ri) => (
            <div className="row" key={ri} style={{ marginBottom: "0.6rem" }}>
              {row.map((f) => (
                <div key={f.name} style={{ flex: f.flex || 1 }}>
                  <label>{f.label}</label>
                  {f.area ? (
                    <textarea
                      value={item[f.name] || ""}
                      placeholder={f.ph}
                      onChange={(e) => onField(item.id, f.name, e.target.value)}
                      onBlur={() => onSaveItem(item)}
                    />
                  ) : (
                    <input
                      value={item[f.name] || ""}
                      placeholder={f.ph}
                      onChange={(e) => onField(item.id, f.name, e.target.value)}
                      onBlur={() => onSaveItem(item)}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
