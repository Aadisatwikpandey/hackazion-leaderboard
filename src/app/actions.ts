"use server";

import { neon } from "@neondatabase/serverless";

// Raw SQL helper — use for custom queries not covered by Prisma
export async function getData(query: TemplateStringsArray, ...values: unknown[]) {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql(query, values);
  return data;
}

// Example: fetch all teams ordered by total score (raw SQL)
export async function getTeamsRaw() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`
    SELECT * FROM "Team"
    ORDER BY total DESC, round3 DESC, round2 DESC, round1 DESC
  `;
  return data;
}
