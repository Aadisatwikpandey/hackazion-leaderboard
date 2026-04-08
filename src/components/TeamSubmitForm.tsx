"use client";

import { useState } from "react";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TeamSubmitForm() {
  const [teamName, setTeamName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Validate GitHub URL format
    const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (!match) {
      setStatus("error");
      setMessage("Invalid GitHub URL. Use format: https://github.com/owner/repo");
      return;
    }

    const githubRepo = `${match[1]}/${match[2]}`;

    try {
      // Find team by name (case-insensitive match)
      const q = query(collection(db, "teams"), where("teamName", "==", teamName.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus("error");
        setMessage("Team not found. Make sure the name matches exactly.");
        return;
      }

      await updateDoc(snap.docs[0].ref, { githubRepo });
      setStatus("success");
      setMessage(`Repo linked for ${teamName}!`);
      setTeamName("");
      setRepoUrl("");
    } catch (e) {
      console.error(e);
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
          <div>
            <label className="mb-1 block text-sm text-gray-400">Team Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Exact team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
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
