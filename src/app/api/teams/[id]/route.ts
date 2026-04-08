import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebase-admin";

const VALID_DOMAINS = ["IoT", "Cybersecurity", "Open Innovation", "AI/ML"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { teamName, domain, round1, round2, round3 } = body;

  if (!teamName || typeof teamName !== "string" || teamName.trim() === "") {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }
  if (!VALID_DOMAINS.includes(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const r1 = Number(round1 ?? 0);
  const r2 = Number(round2 ?? 0);
  const r3 = Number(round3 ?? 0);

  if ([r1, r2, r3].some((s) => isNaN(s) || s < 0 || s > 100)) {
    return NextResponse.json({ error: "Scores must be between 0 and 100" }, { status: 400 });
  }

  const total = r1 + r2 + r3;

  try {
    const ref = getAdminDb().collection("teams").doc(id);
    const docSnap = await ref.get();
    if (!docSnap.exists) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    await ref.update({ teamName: teamName.trim(), domain, round1: r1, round2: r2, round3: r3, total });
    return NextResponse.json({ id, teamName: teamName.trim(), domain, round1: r1, round2: r2, round3: r3, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
