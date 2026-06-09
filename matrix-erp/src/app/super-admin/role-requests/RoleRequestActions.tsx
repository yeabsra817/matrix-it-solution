"use client";

import { useRouter } from "next/navigation";

export function RoleRequestActions({ id }: { id: string }) {
  const router = useRouter();

  async function review(status: "APPROVED" | "REJECTED") {
    await fetch("/api/super-admin/role-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button className="btn btn-primary" onClick={() => review("APPROVED")}>
        Approve
      </button>
      <button className="btn btn-danger" onClick={() => review("REJECTED")}>
        Reject
      </button>
    </div>
  );
}
