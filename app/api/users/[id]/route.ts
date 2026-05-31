import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors, withAuth } from "@/lib/middleware";
import { db } from "@/lib/db";
import { users, leaderboards, sports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const GET = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (!user.length) {
      return withCors(
        NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      );
    }

    const userData = user[0];

    // Get leaderboard stats
    const leaderboardStats = await db
      .select({
        sport: sports.name,
        wins: leaderboards.wins,
        losses: leaderboards.losses,
        eloRating: leaderboards.eloRating,
        rank: leaderboards.rank,
      })
      .from(leaderboards)
      .leftJoin(sports, eq(leaderboards.sportId, sports.id))
      .where(eq(leaderboards.userId, parseInt(id)));

    return withCors(
      NextResponse.json({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          avatarUrl: userData.avatarUrl,
          bio: userData.bio,
          eloRating: userData.eloRating,
          totalWins: userData.totalWins,
          totalLosses: userData.totalLosses,
          createdAt: userData.createdAt,
        },
        leaderboardStats,
      })
    );
  } catch (error) {
    console.error("[Get User] Error:", error);
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
