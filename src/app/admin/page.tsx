"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import TeamForm, { Team } from "@/components/TeamForm";
import TeamSubmitForm from "@/components/TeamSubmitForm";

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
    });
    return () => unsub();
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function syncGitHub() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/github-sync");
    const data = await res.json();
    setSyncing(false);
    setSyncMsg(res.ok ? `Synced ${data.synced} repos` : "Sync failed");
    setTimeout(() => setSyncMsg(""), 4000);
  }

  async function seedTeams() {
    setSeeding(true);
    setSeedMsg("");
    const res = await fetch("/api/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
    const data = await res.json();
    setSeeding(false);
    setSeedMsg(data.message || "Done");
    setTimeout(() => setSeedMsg(""), 4000);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Admin Panel — <span className="text-indigo-400">Hackazion</span>
            </h1>
            <p className="text-sm text-gray-400">Manage teams and scores</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              View Leaderboard
            </a>
            <button
              onClick={logout}
              className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700 bg-gray-900 p-4">
          <span className="text-sm text-gray-400">Quick Actions:</span>
          <button
            onClick={seedTeams}
            disabled={seeding}
            className="rounded-lg bg-gray-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed All Teams"}
          </button>
          <button
            onClick={syncGitHub}
            disabled={syncing}
            className="rounded-lg bg-gray-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "↻ Sync GitHub Stats"}
          </button>
          {(syncMsg || seedMsg) && (
            <span className="text-xs text-green-400">{syncMsg || seedMsg}</span>
          )}
          <span className="ml-auto text-sm text-gray-400">{teams.length} teams</span>
        </div>

        {/* Add / Edit Team */}
        <TeamForm
          editingTeam={editingTeam}
          onSave={() => setEditingTeam(null)}
          onCancelEdit={() => setEditingTeam(null)}
        />

        {/* Teams list with edit */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-base font-semibold text-white">All Teams</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3 text-center">R1</th>
                  <th className="px-4 py-3 text-center">R2</th>
                  <th className="px-4 py-3 text-center">R3</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3">Repo</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No teams yet. Click "Seed All Teams" to add them.
                    </td>
                  </tr>
                )}
                {teams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-800 text-gray-200 hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-white">{team.teamName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                        {team.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{team.round1}</td>
                    <td className="px-4 py-3 text-center">{team.round2}</td>
                    <td className="px-4 py-3 text-center">{team.round3}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-400">{team.total}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{team.githubRepo ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditingTeam(team)}
                        className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GitHub repo submission */}
        <TeamSubmitForm />
      </div>
    </main>
  );
}
