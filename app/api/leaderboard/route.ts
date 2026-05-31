import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { db } from "@/lib/db";
import { leaderboards, sports, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const sportName = searchParams.get("sport");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    if (!sportName) {
      return withCors(
        NextResponse.json(
          { error: "Sport parameter is required" },
          { status: 400 }
        )
      );
    }

    // Get sport ID
    const sport = await db
      .select()
      .from(sports)
      .where(eq(sports.name, sportName))
      .limit(1);

    if (!sport.length) {
      return withCors(
        NextResponse.json(
          { error: "Sport not found" },
          { status: 404 }
        )
      );
    }

    // Get leaderboard for this sport
    const leaderboardData = await db
      .select({
        rank: leaderboards.rank,
        userId: leaderboards.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        eloRating: leaderboards.eloRating,
        wins: leaderboards.wins,
        losses: leaderboards.losses,
      })
      .from(leaderboards)
      .leftJoin(users, eq(leaderboards.userId, users.id))
      .where(eq(leaderboards.sportId, sport[0].id))
      .orderBy(desc(leaderboards.eloRating))
      .limit(limit)
      .offset(offset);

    return withCors(
      NextResponse.json({
        sport: sportName,
        leaderboard: leaderboardData,
        count: leaderboardData.length,
      })
    );
  } catch (error) {
    console.error("[Get Leaderboard] Error:", error);
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
