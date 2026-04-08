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

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Hackaz<span className="text-indigo-400">ion</span> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">Live scores · Real-time updates</p>
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
