"use client";

import { Team } from "./TeamForm";

type Props = {
  teams: Team[];
  onEdit: (team: Team) => void;
  readOnly?: boolean;
};

function sortTeams(teams: Team[]) {
  return [...teams].sort(
    (a, b) =>
      b.total - a.total ||
      b.round3 - a.round3 ||
      b.round2 - a.round2 ||
      b.round1 - a.round1
  );
}

const rankStyles: Record<number, string> = {
  0: "bg-yellow-500/10 border-l-4 border-yellow-400",
  1: "bg-gray-400/10 border-l-4 border-gray-400",
  2: "bg-amber-700/10 border-l-4 border-amber-600",
};

const rankBadges = ["🥇", "🥈", "🥉"];

export { sortTeams };

export default function Leaderboard({ teams, onEdit, readOnly = false }: Props) {
  const sorted = sortTeams(teams);

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
        <p className="text-sm text-gray-400">{teams.length} team{teams.length !== 1 ? "s" : ""} registered</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3 text-center">R1</th>
              <th className="px-4 py-3 text-center">R2</th>
              <th className="px-4 py-3 text-center">R3</th>
              <th className="px-4 py-3 text-center font-semibold text-white">Total</th>
              <th className="px-4 py-3 text-center">Commits</th>
              <th className="px-4 py-3 text-center">+Lines</th>
              <th className="px-4 py-3 text-center">-Lines</th>
              <th className="px-4 py-3 text-center">Contributors</th>
              <th className="px-4 py-3 text-center">Last Commit</th>
              {!readOnly && <th className="px-4 py-3 w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 12 : 13} className="px-4 py-8 text-center text-gray-500">
                  No teams yet.
                </td>
              </tr>
            )}
            {sorted.map((team, i) => (
              <tr
                key={team.id}
                className={`border-b border-gray-800 text-gray-200 transition-colors hover:bg-gray-800/50 ${rankStyles[i] ?? ""}`}
              >
                <td className="px-4 py-3 text-center font-medium text-gray-400">
                  {i < 3 ? rankBadges[i] : i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  {team.teamName}
                  {team.githubRepo && (
                    <span className="ml-2 text-xs text-gray-500">⬡ {team.githubRepo}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                    {team.domain}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{team.round1}</td>
                <td className="px-4 py-3 text-center">{team.round2}</td>
                <td className="px-4 py-3 text-center">{team.round3}</td>
                <td className="px-4 py-3 text-center font-bold text-indigo-400">{team.total}</td>
                <td className="px-4 py-3 text-center text-gray-300">{team.commits ?? "—"}</td>
                <td className="px-4 py-3 text-center text-green-400">{team.linesAdded != null ? `+${team.linesAdded}` : "—"}</td>
                <td className="px-4 py-3 text-center text-red-400">{team.linesDeleted != null ? `-${team.linesDeleted}` : "—"}</td>
                <td className="px-4 py-3 text-center text-gray-300">{team.contributors ?? "—"}</td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">
                  {team.lastCommitDate
                    ? new Date(team.lastCommitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </td>
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onEdit(team)}
                      className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
