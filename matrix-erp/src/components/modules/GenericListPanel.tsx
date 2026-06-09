"use client";

import { useState } from "react";
import { ModuleFrame, useApi } from "./ModuleFrame";

export function GenericListPanel({
  title,
  api,
  fields,
}: {
  title: string;
  api: string;
  fields: { name: string; key: string; type?: string }[];
}) {
  const { data, reload } = useApi<Record<string, unknown>>(api);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fields.forEach((field) => {
      const v = f.get(field.key);
      body[field.key] = field.type === "number" ? Number(v) : v;
    });
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setMsg(res.ok ? "Saved." : d.error);
    if (res.ok) {
      e.currentTarget.reset();
      reload();
    }
  }

  const listKey = Object.keys(data || {}).find((k) => Array.isArray(data?.[k])) || "items";

  return (
    <ModuleFrame title={title}>
      {fields.length > 0 && (
        <form onSubmit={submit} className="card grid sm:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.name}</label>
              <input className="input" name={f.key} type={f.type || "text"} required={f.key !== "note"} />
            </div>
          ))}
          <button className="btn btn-primary" type="submit">Submit</button>
        </form>
      )}
      {msg && <p className="text-sm text-green-400">{msg}</p>}
      <pre className="card text-xs overflow-auto max-h-96">
        {JSON.stringify(data?.[listKey] ?? data, null, 2)}
      </pre>
    </ModuleFrame>
  );
}
