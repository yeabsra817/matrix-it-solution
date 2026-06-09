"use client";

import { useEffect, useState } from "react";

export function HomepageTemplateEditor() {
  const [minTitleLength, setMinTitle] = useState(3);
  const [minMessageLength, setMinMessage] = useState(10);
  const [defaultThemeColor, setTheme] = useState("#2563eb");
  const [defaultBackgroundStyle, setBg] = useState("gradient");
  const [requiredFields, setRequired] = useState("title,message,welcome,contact,announcement");
  const [structureNote, setNote] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/homepage-template", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.template) {
          setMinTitle(d.template.minTitleLength);
          setMinMessage(d.template.minMessageLength);
          setTheme(d.template.defaultThemeColor);
          setBg(d.template.defaultBackgroundStyle);
          setRequired(d.template.requiredFields);
          setNote(d.template.structureNote || "");
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/super-admin/homepage-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        minTitleLength,
        minMessageLength,
        defaultThemeColor,
        defaultBackgroundStyle,
        requiredFields,
        structureNote,
      }),
    });
    setStatus(res.ok ? "Template saved." : "Save failed.");
  }

  return (
    <form onSubmit={save} className="card space-y-3 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Min title length</label>
          <input
            className="input"
            type="number"
            value={minTitleLength}
            onChange={(e) => setMinTitle(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Min message length</label>
          <input
            className="input"
            type="number"
            value={minMessageLength}
            onChange={(e) => setMinMessage(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="label">Default theme color</label>
        <input className="input" value={defaultThemeColor} onChange={(e) => setTheme(e.target.value)} />
      </div>
      <div>
        <label className="label">Default background</label>
        <select className="input" value={defaultBackgroundStyle} onChange={(e) => setBg(e.target.value)}>
          <option value="gradient">Gradient</option>
          <option value="solid">Solid</option>
          <option value="pattern">Pattern</option>
        </select>
      </div>
      <div>
        <label className="label">Required fields (comma-separated)</label>
        <input className="input" value={requiredFields} onChange={(e) => setRequired(e.target.value)} />
      </div>
      <div>
        <label className="label">Structure note</label>
        <textarea className="input" rows={2} value={structureNote} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary">
        Save Template
      </button>
      {status && <p className="text-sm text-green-400">{status}</p>}
    </form>
  );
}
