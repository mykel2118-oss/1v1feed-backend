import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, users, leaderboards, sports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateEloChange } from "@/lib/utils";

// Accept match
export const POST = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;
  const matchId = parseInt(id);
  const body = await request.json();
  const { action } = body;

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(
        NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    const userId = parseInt(session.user.id as string);

    // Get match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match.length) {
      return withCors(
        NextResponse.json(
          { error: "Match not found" },
          { status: 404 }
        )
      );
    }

    const matchData = match[0];

    if (action === "accept") {
      // Only player2 can accept
      if (matchData.player2Id !== userId) {
        return withCors(
          NextResponse.json(
            { error: "Only the challenged player can accept" },
            { status: 403 }
          )
        );
      }

      const result = await db
        .update(matches)
        .set({ status: "accepted" })
        .where(eq(matches.id, matchId))
        .returning();

      return withCors(
        NextResponse.json({
          match: result[0],
        })
      );
    }

    if (action === "decline") {
      if (matchData.player2Id !== userId) {
        return withCors(
          NextResponse.json(
            { error: "Only the challenged player can decline" },
            { status: 403 }
          )
        );
      }

      const result = await db
        .update(matches)
        .set({ status: "cancelled" })
        .where(eq(matches.id, matchId))
        .returning();

      return withCors(
        NextResponse.json({
          match: result[0],
        })
      );
    }

    if (action === "score") {
      const { player1Score, player2Score } = body;

      if (player1Score === undefined || player2Score === undefined) {
        return withCors(
          NextResponse.json(
            { error: "Scores are required" },
            { status: 400 }
          )
        );
      }

      // Determine winner
      let winnerId = null;
      if (player1Score > player2Score) {
        winnerId = matchData.player1Id;
      } else if (player2Score > player1Score) {
        winnerId = matchData.player2Id;
      }

      // Update match
      const result = await db
        .update(matches)
        .set({
          status: "completed",
          player1Score,
          player2Score,
          winnerId,
          completedAt: new Date(),
        })
        .where(eq(matches.id, matchId))
        .returning();

      // Update ELO ratings if there's a winner
      if (winnerId) {
        const player1 = await db
          .select()
          .from(users)
          .where(eq(users.id, matchData.player1Id))
          .limit(1);

        const player2 = await db
          .select()
          .from(users)
          .where(eq(users.id, matchData.player2Id))
          .limit(1);

        if (player1.length && player2.length) {
          const player1Elo = player1[0].eloRating || 1200;
          const player2Elo = player2[0].eloRating || 1200;

          const player1Won = winnerId === matchData.player1Id;
          const eloChange1 = calculateEloChange(player1Elo, player2Elo, player1Won);
          const eloChange2 = calculateEloChange(player2Elo, player1Elo, !player1Won);

          // Update user ELO
          await db
            .update(users)
            .set({
              eloRating: player1Elo + eloChange1,
              totalWins: player1Won ? (player1[0].totalWins || 0) + 1 : player1[0].totalWins,
              totalLosses: !player1Won ? (player1[0].totalLosses || 0) + 1 : player1[0].totalLosses,
            })
            .where(eq(users.id, matchData.player1Id));

          await db
            .update(users)
            .set({
              eloRating: player2Elo + eloChange2,
              totalWins: !player1Won ? (player2[0].totalWins || 0) + 1 : player2[0].totalWins,
              totalLosses: player1Won ? (player2[0].totalLosses || 0) + 1 : player2[0].totalLosses,
            })
            .where(eq(users.id, matchData.player2Id));
        }
      }

      return withCors(
        NextResponse.json({
          match: result[0],
        })
      );
    }

    return withCors(
      NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    );
  } catch (error) {
    console.error("[Match Action] Error:", error);
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
