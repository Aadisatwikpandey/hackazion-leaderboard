import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ALL_TEAMS } from "../../../lib/teams-data";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    // Check if already seeded
    const existing = await db.collection("teams").limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ message: "Already seeded" }, { status: 200 });
    }

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
