"use client";

import { useApi } from "@/components/modules/ModuleFrame";
import { ModuleFrame } from "@/components/modules/ModuleFrame";
import { GenericListPanel } from "@/components/modules/GenericListPanel";

export function StoreDirectorPanel() {
  const { data, reload } = useApi<{ orders: { id: string; title: string; status: string }[] }>("/api/school/store");

  async function act(id: string, action: "DIRECTOR_APPROVE" | "DIRECTOR_REJECT") {
    await fetch("/api/school/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    reload();
  }

  return (
    <div className="space-y-4">
      <GenericListPanel
        title="Create Store Request"
        api="/api/school/store"
        fields={[
          { name: "Title", key: "title" },
          { name: "Items", key: "items" },
          { name: "Qty", key: "quantity", type: "number" },
        ]}
      />
      <ModuleFrame title="Pending Director Approval">
        {(data?.orders || [])
          .filter((o) => o.status === "PENDING_DIRECTOR")
          .map((o) => (
            <div key={o.id} className="card flex justify-between items-center mb-2">
              <span>{o.title}</span>
              <div className="flex gap-2">
                <button className="btn btn-primary" type="button" onClick={() => act(o.id, "DIRECTOR_APPROVE")}>
                  Approve → Store
                </button>
                <button className="btn btn-danger" type="button" onClick={() => act(o.id, "DIRECTOR_REJECT")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
      </ModuleFrame>
    </div>
  );
}
