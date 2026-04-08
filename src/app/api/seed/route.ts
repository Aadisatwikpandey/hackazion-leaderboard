import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ALL_TEAMS } from "../../../lib/teams-data";

export async function POST(req: NextRequest) {
  const { force } = await req.json().catch(() => ({ force: false }));

  try {
    const db = getAdminDb();

    if (force) {
      // Delete all existing teams first
      const existing = await db.collection("teams").get();
      const deleteBatch = db.batch();
      existing.docs.forEach((d) => deleteBatch.delete(d.ref));
      if (!existing.empty) await deleteBatch.commit();
    } else {
      const existing = await db.collection("teams").limit(1).get();
      if (!existing.empty) {
        return NextResponse.json({ message: "Already seeded. Use force=true to re-seed." });
      }
    }

    // Seed in batches of 500 (Firestore limit)
    const batch = db.batch();
    for (const team of ALL_TEAMS) {
      const ref = db.collection("teams").doc();
      batch.set(ref, {
        teamName: team.teamName,
        domain: team.domain,
        round1: 0,
        round2: 0,
        round3: 0,
        total: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    return NextResponse.json({ message: `Seeded ${ALL_TEAMS.length} teams` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
