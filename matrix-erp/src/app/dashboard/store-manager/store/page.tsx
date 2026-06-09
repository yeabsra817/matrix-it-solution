"use client";

import { useApi } from "@/components/modules/ModuleFrame";
import { ModuleFrame } from "@/components/modules/ModuleFrame";

export default function StoreManagerStorePage() {
  const { data, reload } = useApi<{ orders: { id: string; title: string; status: string }[] }>(
    "/api/school/store"
  );

  async function act(id: string, action: "STORE_ACCEPT" | "STORE_REJECT") {
    await fetch("/api/school/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, action }),
    });
    reload();
  }

  return (
    <ModuleFrame title="Store Orders">
      <div className="space-y-2">
        {(data?.orders || [])
          .filter((o) => o.status === "AT_STORE")
          .map((o) => (
            <div key={o.id} className="card flex justify-between items-center">
              <span>
                {o.title} — {o.status}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => act(o.id, "STORE_ACCEPT")}
                >
                  Accept
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => act(o.id, "STORE_REJECT")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
      </div>
    </ModuleFrame>
  );
}
