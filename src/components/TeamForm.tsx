"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DOMAINS = ["IoT", "Cybersecurity", "Open Innovation", "AI/ML"];

export type Team = {
  id: string;
  teamName: string;
  domain: string;
  round1: number;
  round2: number;
  round3: number;
  total: number;
  createdAt?: unknown;
  githubRepo?: string;
  commits?: number;
  linesAdded?: number;
  linesDeleted?: number;
  lastCommitDate?: string;
  contributors?: number;
  githubLastSynced?: unknown;
};

type Props = {
  editingTeam: Team | null;
  onSave: () => void;
  onCancelEdit: () => void;
};

const empty = { teamName: "", domain: DOMAINS[0], round1: "", round2: "", round3: "" };

export default function TeamForm({ editingTeam, onSave, onCancelEdit }: Props) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTeam) {
      setForm({
        teamName: editingTeam.teamName,
        domain: editingTeam.domain,
        round1: String(editingTeam.round1),
        round2: String(editingTeam.round2),
        round3: String(editingTeam.round3),
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [editingTeam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const r1 = form.round1 === "" ? 0 : Number(form.round1);
    const r2 = form.round2 === "" ? 0 : Number(form.round2);
    const r3 = form.round3 === "" ? 0 : Number(form.round3);

    if ([r1, r2, r3].some((s) => isNaN(s) || s < 0 || s > 100)) {
      setError("Scores must be between 0 and 100");
      setLoading(false);
      return;
    }

    const total = r1 + r2 + r3;

    try {
      if (editingTeam) {
        await updateDoc(doc(db, "teams", editingTeam.id), {
          teamName: form.teamName.trim(),
          round1: r1,
          round2: r2,
          round3: r3,
          total,
        });
      } else {
        await addDoc(collection(db, "teams"), {
          teamName: form.teamName.trim(),
          domain: form.domain,
          round1: r1,
          round2: r2,
          round3: r3,
          total,
          createdAt: serverTimestamp(),
        });
      }
      setForm(empty);
      onSave();
    } catch (e) {
      console.error(e);
      setError("Failed to save. Check your connection.");
    }

    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold text-white">
        {editingTeam ? "Edit Team" : "Add Team"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Team Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Team Alpha"
            value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["round1", "round2", "round3"] as const).map((r, i) => (
            <div key={r}>
              <label className="mb-1 block text-sm text-gray-400">Round {i + 1}</label>
              <input
                type="number"
                className={inputClass}
                placeholder="0–100"
                min={0}
                max={100}
                value={form[r]}
                onChange={(e) => setForm({ ...form, [r]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Saving…" : editingTeam ? "Update Team" : "Add Team"}
          </button>
          {editingTeam && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-gray-600 px-5 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
