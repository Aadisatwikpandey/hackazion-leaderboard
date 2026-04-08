"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type TeamOption = { id: string; teamName: string; domain: string; githubRepo?: string };

export default function TeamSubmitForm() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TeamOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamOption)));
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = teams.filter((t) =>
    t.teamName.toLowerCase().includes(search.toLowerCase())
  );

  function selectTeam(team: TeamOption) {
    setSelected(team);
    setSearch(team.teamName);
    setShowDropdown(false);
    if (team.githubRepo) setRepoUrl(`https://github.com/${team.githubRepo}`);
    else setRepoUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setStatus("error"); setMessage("Please select a team"); return; }
    setStatus("loading");
    setMessage("");

    const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/\s]+?)(\.git)?$/);
    if (!match) {
      setStatus("error");
      setMessage("Invalid GitHub URL. Use: https://github.com/owner/repo");
      return;
    }

    const githubRepo = `${match[1]}/${match[2]}`;

    try {
      const q = query(collection(db, "teams"), where("teamName", "==", selected.teamName));
      const snap = await getDocs(q);
      if (snap.empty) { setStatus("error"); setMessage("Team not found."); return; }
      await updateDoc(snap.docs[0].ref, { githubRepo });
      setStatus("success");
      setMessage(`Repo linked for ${selected.teamName}!`);
      setSearch("");
      setSelected(null);
      setRepoUrl("");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-1 text-lg font-semibold text-white">Submit Your GitHub Repo</h2>
      <p className="mb-4 text-sm text-gray-400">Link your team's repo to track commit activity</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Searchable team dropdown */}
          <div ref={wrapperRef} className="relative">
            <label className="mb-1 block text-sm text-gray-400">Team Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Search your team…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
                {filtered.map((t) => (
                  <li
                    key={t.id}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-700"
                    onMouseDown={() => selectTeam(t)}
                  >
                    <span className="text-sm text-white">{t.teamName}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                      {t.domain}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">GitHub Repo URL</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
        >
          {status === "loading" ? "Linking…" : "Link Repo"}
        </button>
      </form>
    </div>
  );
}
