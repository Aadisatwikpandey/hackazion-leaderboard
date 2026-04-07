import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { randomUUID } from "crypto";

const VALID_DOMAINS = ["IoT", "Cybersecurity", "Open Innovation", "AI/ML"];

export async function GET() {
  try {
    const teams = await sql`SELECT * FROM "Team" ORDER BY "createdAt" ASC`;
    return NextResponse.json(teams);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
  const id = randomUUID();

  try {
    const [team] = await sql`
      INSERT INTO "Team" (id, "teamName", domain, round1, round2, round3, total, "createdAt")
      VALUES (${id}, ${teamName.trim()}, ${domain}, ${r1}, ${r2}, ${r3}, ${total}, NOW())
      RETURNING *
    `;
    return NextResponse.json(team, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
