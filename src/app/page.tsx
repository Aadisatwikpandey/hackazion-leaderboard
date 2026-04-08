"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TeamForm, { Team } from "@/components/TeamForm";
import Leaderboard from "@/components/Leaderboard";
import TopDomains from "@/components/TopDomains";
import TeamSubmitForm from "@/components/TeamSubmitForm";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
    });
    return () => unsub();
  }, []);

  async function syncGitHub() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/github-sync");
    const data = await res.json();
    setSyncing(false);
    setSyncMsg(res.ok ? `Synced ${data.synced} repos` : "Sync failed");
    setTimeout(() => setSyncMsg(""), 4000);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Hackaz<span className="text-indigo-400">ion</span> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">Live scores · Real-time updates</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={syncGitHub}
              disabled={syncing}
              className="rounded-lg bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              {syncing ? "Syncing GitHub…" : "↻ Sync GitHub Stats"}
            </button>
            {syncMsg && <span className="text-xs text-green-400">{syncMsg}</span>}
          </div>
        </div>

        {/* Admin: Add/Edit Team */}
        <TeamForm
          editingTeam={editingTeam}
          onSave={() => setEditingTeam(null)}
          onCancelEdit={() => setEditingTeam(null)}
        />

        {/* Leaderboard */}
        <Leaderboard teams={teams} onEdit={setEditingTeam} />

        {/* Top 3 per domain */}
        <TopDomains teams={teams} />

        {/* Teams: Submit GitHub Repo */}
        <TeamSubmitForm />
      </div>
    </main>
  );
}
