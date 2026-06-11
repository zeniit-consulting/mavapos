import { queryPostgres } from "@/lib/postgresql/client";

export async function GET() {
  try {
    const result = await queryPostgres<{ ok: number; checked_at: Date }>(
      "select 1 as ok, now() as checked_at",
    );

    return Response.json({
      status: "ok",
      database: "postgresql",
      checkedAt: result.rows[0]?.checked_at,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        database: "postgresql",
        message: error instanceof Error ? error.message : "Database check failed.",
      },
      { status: 503 },
    );
  }
}
