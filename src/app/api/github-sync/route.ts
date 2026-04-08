import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function githubFetch(path: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
  return { status: res.status, data };
}

// Retry stats/contributors up to 3 times — GitHub returns 202 while computing
async function getContributorStats(owner: string, repo: string, attempts = 3): Promise<{ totalCommits: number; contributors: number }> {
  for (let i = 0; i < attempts; i++) {
    const { status, data } = await githubFetch(`/repos/${owner}/${repo}/stats/contributors`);
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      const totalCommits = (data as { total: number }[]).reduce((sum, c) => sum + (c.total || 0), 0);
      const contributors = data.length;
      return { totalCommits, contributors };
    }
    // 202 = GitHub is computing stats, wait and retry
    if (status === 202 && i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Fallback: count commits via pagination using Link header
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
    );
    const link = res.headers.get("link") ?? "";
    const match = link.match(/page=(\d+)>; rel="last"/);
    const totalCommits = match ? parseInt(match[1], 10) : 0;
    return { totalCommits, contributors: 0 };
  } catch {
    return { totalCommits: 0, contributors: 0 };
  }
}

async function getRecentLinesChanged(owner: string, repo: string) {
  try {
    const { status, data } = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=10`);
    if (status !== 200 || !Array.isArray(data) || data.length === 0) return { linesAdded: 0, linesDeleted: 0 };

    let linesAdded = 0;
    let linesDeleted = 0;

    await Promise.all(
      (data as { sha: string }[]).slice(0, 5).map(async (c) => {
        try {
          const { status: s, data: detail } = await githubFetch(`/repos/${owner}/${repo}/commits/${c.sha}`);
          if (s === 200 && detail && typeof detail === "object") {
            const d = detail as { stats?: { additions?: number; deletions?: number } };
            linesAdded += d.stats?.additions ?? 0;
            linesDeleted += d.stats?.deletions ?? 0;
          }
        } catch { /* skip */ }
      })
    );

    return { linesAdded, linesDeleted };
  } catch {
    return { linesAdded: 0, linesDeleted: 0 };
  }
}

async function getLastCommitDate(owner: string, repo: string): Promise<string | null> {
  try {
    const { status, data } = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=1`);
    if (status !== 200 || !Array.isArray(data) || !data[0]) return null;
    const commit = data[0] as { commit?: { committer?: { date?: string }; author?: { date?: string } } };
    return commit.commit?.committer?.date ?? commit.commit?.author?.date ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const snap = await getAdminDb().collection("teams").get();
    const teams = snap.docs.filter((d) => d.data().githubRepo);

    const results = await Promise.allSettled(
      teams.map(async (docSnap) => {
        const { githubRepo } = docSnap.data();
        const parts = (githubRepo as string).replace("https://github.com/", "").split("/");
        const owner = parts[0];
        const repo = parts[1];
        if (!owner || !repo) return;

        const [{ totalCommits, contributors }, lines, lastCommitDate] = await Promise.all([
          getContributorStats(owner, repo),
          getRecentLinesChanged(owner, repo),
          getLastCommitDate(owner, repo),
        ]);

        await docSnap.ref.update({
          commits: totalCommits,
          linesAdded: lines.linesAdded,
          linesDeleted: lines.linesDeleted,
          lastCommitDate,
          contributors,
          githubLastSynced: FieldValue.serverTimestamp(),
        });
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({ synced: teams.length - failed, failed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
