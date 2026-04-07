"use client";

import { useState, useEffect } from "react";

const DOMAINS = ["IoT", "Cybersecurity", "Open Innovation", "AI/ML"];

export type Team = {
  id: string;
  teamName: string;
  domain: string;
  round1: number;
  round2: number;
  round3: number;
  total: number;
  createdAt: string;
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

    const payload = {
      teamName: form.teamName,
      domain: form.domain,
      round1: form.round1 === "" ? 0 : Number(form.round1),
      round2: form.round2 === "" ? 0 : Number(form.round2),
      round3: form.round3 === "" ? 0 : Number(form.round3),
    };

    const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
    const method = editingTeam ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setForm(empty);
    onSave();
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold text-white">
        {editingTeam ? "Edit Team" : "Add Team"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div>
            <label className="mb-1 block text-sm text-gray-400">Domain</label>
            <select
              className={inputClass}
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
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
