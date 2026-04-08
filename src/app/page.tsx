"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/components/TeamForm";
import Leaderboard from "@/components/Leaderboard";
import TopDomains from "@/components/TopDomains";

const DOMAINS = ["All", "IoT", "Cybersecurity", "AI/ML", "Open Innovation"];

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [domain, setDomain] = useState("All");

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
    });
    return () => unsub();
  }, []);

  const filtered = domain === "All" ? teams : teams.filter((t) => t.domain === domain);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Hackaz<span className="text-indigo-400">ion</span> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">Live scores · Real-time updates</p>

          {/* Domain filter */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  domain === d
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard — no edit button on public view */}
        <Leaderboard teams={filtered} onEdit={() => {}} readOnly />

        {/* Top 3 per domain */}
        <TopDomains teams={teams} />
      </div>
    </main>
  );
}
