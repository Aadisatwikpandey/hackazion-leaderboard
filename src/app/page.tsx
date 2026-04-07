"use client";

import { useState, useEffect, useCallback } from "react";
import TeamForm, { Team } from "@/components/TeamForm";
import Leaderboard from "@/components/Leaderboard";
import TopDomains from "@/components/TopDomains";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    if (res.ok) setTeams(await res.json());
  }, []);

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, [fetchTeams]);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Hackaz<span className="text-indigo-400">ion</span> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">Live scores · Updates every 5s</p>
        </div>

        {/* Form */}
        <TeamForm
          editingTeam={editingTeam}
          onSave={() => {
            setEditingTeam(null);
            fetchTeams();
          }}
          onCancelEdit={() => setEditingTeam(null)}
        />

        {/* Leaderboard */}
        <Leaderboard teams={teams} onEdit={setEditingTeam} />

        {/* Top 3 per domain */}
        <TopDomains teams={teams} />
      </div>
    </main>
  );
}
