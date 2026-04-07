import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

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

  const r1 = Number(round1);
  const r2 = Number(round2);
  const r3 = Number(round3);

  if ([r1, r2, r3].some((s) => isNaN(s) || s < 0 || s > 100)) {
    return NextResponse.json(
      { error: "Scores must be numbers between 0 and 100" },
      { status: 400 }
    );
  }

  const total = r1 + r2 + r3;

  try {
    const [team] = await sql`
      UPDATE "Team"
      SET "teamName" = ${teamName.trim()},
          domain = ${domain},
          round1 = ${r1},
          round2 = ${r2},
          round3 = ${r3},
          total = ${total}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json(team);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
