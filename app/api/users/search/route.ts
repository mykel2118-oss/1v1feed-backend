import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, ilike, limit } from "drizzle-orm";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return withCors(
      NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      )
    );
  }

  try {
    const results = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        eloRating: users.eloRating,
      })
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.username, `%${query}%`)
        )
      )
      .limit(20);

    return withCors(
      NextResponse.json({
        results,
        count: results.length,
      })
    );
  } catch (error) {
    console.error("[Search Users] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

export const OPTIONS = () => {
  return withCors(new Response(null, { status: 204 }));
};
