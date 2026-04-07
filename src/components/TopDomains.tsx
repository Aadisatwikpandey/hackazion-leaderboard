"use client";

import { Team } from "./TeamForm";
import { sortTeams } from "./Leaderboard";

const DOMAINS = ["IoT", "Cybersecurity", "Open Innovation", "AI/ML"];

const domainColors: Record<string, string> = {
  IoT: "from-teal-500/20 to-teal-900/10 border-teal-700",
  Cybersecurity: "from-red-500/20 to-red-900/10 border-red-700",
  "Open Innovation": "from-purple-500/20 to-purple-900/10 border-purple-700",
  "AI/ML": "from-blue-500/20 to-blue-900/10 border-blue-700",
};

const domainTextColors: Record<string, string> = {
  IoT: "text-teal-400",
  Cybersecurity: "text-red-400",
  "Open Innovation": "text-purple-400",
  "AI/ML": "text-blue-400",
};

const rankBadges = ["🥇", "🥈", "🥉"];

type Props = { teams: Team[] };

export default function TopDomains({ teams }: Props) {
  const topByDomain = DOMAINS.map((domain) => ({
    domain,
    top: sortTeams(teams.filter((t) => t.domain === domain)).slice(0, 3),
  }));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Top 3 Per Domain</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topByDomain.map(({ domain, top }) => (
          <div
            key={domain}
            className={`rounded-2xl border bg-gradient-to-br p-4 shadow-lg ${domainColors[domain]}`}
          >
            <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${domainTextColors[domain]}`}>
              {domain}
            </h3>

            {top.length === 0 ? (
              <p className="text-sm text-gray-500">No teams yet</p>
            ) : (
              <ol className="space-y-2">
                {top.map((team, i) => (
                  <li key={team.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-gray-200 truncate">
                      <span>{rankBadges[i]}</span>
                      <span className="truncate">{team.teamName}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-white">{team.total}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
