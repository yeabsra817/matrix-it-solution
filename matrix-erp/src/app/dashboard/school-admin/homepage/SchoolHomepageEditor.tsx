"use client";

import { useEffect, useState } from "react";

export function SchoolHomepageEditor() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [welcome, setWelcome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [themeColor, setThemeColor] = useState("#2563eb");
  const [backgroundStyle, setBackgroundStyle] = useState("gradient");
  const [logoPosition, setLogoPosition] = useState("center");
  const [announcementBanner, setAnnouncementBanner] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/school/settings", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings;
          setTitle(s.homepageTitle);
          setMessage(s.homepageMessage);
          setWelcome(s.welcomeText || "");
          setLogoUrl(s.logoUrl || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setAnnouncement(s.announcement || "");
          setThemeColor(s.themeColor || "#2563eb");
          setBackgroundStyle(s.backgroundStyle || "gradient");
          setLogoPosition(s.logoPosition || "center");
          setAnnouncementBanner(s.announcementBanner ?? true);
        }
      });
  }, []);

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/school/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        homepageTitle: title,
        homepageMessage: message,
        welcomeText: welcome,
        logoUrl,
        phone,
        email,
        announcement,
        themeColor,
        backgroundStyle,
        logoPosition,
        announcementBanner,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Save failed.");
    else setStatus("Homepage saved.");
  }

  return (
    <form onSubmit={save} className="card space-y-3">
      <p className="text-sm text-slate-400">
        Customize branding for your school only. Layout structure is fixed by the global
        template.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Theme color</label>
          <input
            className="input"
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Background</label>
          <select
            className="input"
            value={backgroundStyle}
            onChange={(e) => setBackgroundStyle(e.target.value)}
          >
            <option value="gradient">Gradient</option>
            <option value="solid">Solid</option>
            <option value="pattern">Pattern</option>
          </select>
        </div>
        <div>
          <label className="label">Logo position</label>
          <select
            className="input"
            value={logoPosition}
            onChange={(e) => setLogoPosition(e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Logo (upload or URL)</label>
        <input type="file" accept="image/*" className="input mb-2" onChange={onLogoFile} />
        <input
          className="input"
          value={logoUrl.startsWith("data:") ? "" : logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://... or upload above"
        />
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo preview" className="h-16 mt-2 rounded" />
        )}
      </div>
      <div>
        <label className="label">Homepage Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="label">Homepage Message</label>
        <textarea
          className="input"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Welcome Text</label>
        <textarea className="input" rows={2} value={welcome} onChange={(e) => setWelcome(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Announcement</label>
        <textarea
          className="input"
          rows={2}
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={announcementBanner}
          onChange={(e) => setAnnouncementBanner(e.target.checked)}
        />
        Show announcements banner
      </label>
      <button className="btn btn-primary" type="submit">
        Save Homepage
      </button>
      {status && <p className="text-sm text-green-400">{status}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
