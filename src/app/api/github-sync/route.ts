import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function githubFetch(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${path}`);
  return res.json();
}

async function getTotalCommits(owner: string, repo: string): Promise<number> {
  try {
    const contributors = await githubFetch(`/repos/${owner}/${repo}/stats/contributors`);
    if (!Array.isArray(contributors)) return 0;
    return contributors.reduce((sum: number, c: { total: number }) => sum + (c.total || 0), 0);
  } catch {
    return 0;
  }
}

async function getRecentLinesChanged(owner: string, repo: string) {
  try {
    const commits = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=10`);
    if (!Array.isArray(commits) || commits.length === 0) return { linesAdded: 0, linesDeleted: 0 };

    let linesAdded = 0;
    let linesDeleted = 0;

    await Promise.all(
      commits.slice(0, 5).map(async (c: { sha: string }) => {
        try {
          const detail = await githubFetch(`/repos/${owner}/${repo}/commits/${c.sha}`);
          linesAdded += detail?.stats?.additions ?? 0;
          linesDeleted += detail?.stats?.deletions ?? 0;
        } catch { /* skip */ }
      })
    );

    return { linesAdded, linesDeleted };
  } catch {
    return { linesAdded: 0, linesDeleted: 0 };
  }
}

async function getLastCommitAndContributors(owner: string, repo: string) {
  try {
    const [commits, contributors] = await Promise.all([
      githubFetch(`/repos/${owner}/${repo}/commits?per_page=1`),
      githubFetch(`/repos/${owner}/${repo}/stats/contributors`),
    ]);

    const lastCommitDate =
      Array.isArray(commits) && commits[0]
        ? (commits[0].commit?.committer?.date ?? commits[0].commit?.author?.date ?? null)
        : null;

    const contributorCount = Array.isArray(contributors) ? contributors.length : 0;

    return { lastCommitDate, contributorCount };
  } catch {
    return { lastCommitDate: null, contributorCount: 0 };
  }
}

export async function GET() {
  try {
    const snap = await getAdminDb().collection("teams").get();
    const teams = snap.docs.filter((d) => d.data().githubRepo);

    const results = await Promise.allSettled(
      teams.map(async (docSnap) => {
        const { githubRepo } = docSnap.data();
        const [owner, repo] = githubRepo.split("/");
        if (!owner || !repo) return;

        const [totalCommits, lines, meta] = await Promise.all([
          getTotalCommits(owner, repo),
          getRecentLinesChanged(owner, repo),
          getLastCommitAndContributors(owner, repo),
        ]);

        await docSnap.ref.update({
          commits: totalCommits,
          linesAdded: lines.linesAdded,
          linesDeleted: lines.linesDeleted,
          lastCommitDate: meta.lastCommitDate,
          contributors: meta.contributorCount,
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
