import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, users, sports } from "@/lib/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

// Get user's matches
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

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

    let query = db
      .select({
        id: matches.id,
        player1Id: matches.player1Id,
        player1Name: users.firstName,
        player2Id: matches.player2Id,
        sportName: sports.name,
        status: matches.status,
        player1Score: matches.player1Score,
        player2Score: matches.player2Score,
        winnerId: matches.winnerId,
        createdAt: matches.createdAt,
        completedAt: matches.completedAt,
      })
      .from(matches)
      .leftJoin(users, eq(matches.player1Id, users.id))
      .leftJoin(sports, eq(matches.sportId, sports.id))
      .where(
        or(
          eq(matches.player1Id, userId),
          eq(matches.player2Id, userId)
        )
      );

    if (status) {
      query = query.where(eq(matches.status, status as any));
    }

    const matchList = await query
      .orderBy(desc(matches.createdAt))
      .limit(limit)
      .offset(offset);

    return withCors(
      NextResponse.json({
        matches: matchList,
        count: matchList.length,
      })
    );
  } catch (error) {
    console.error("[Get Matches] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

// Create match/challenge
export const POST = withErrorHandler(async (request: NextRequest) => {
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

    const body = await request.json();
    const { player2Id, sportId } = body;
    const player1Id = parseInt(session.user.id as string);

    if (!player2Id || !sportId) {
      return withCors(
        NextResponse.json(
          { error: "player2Id and sportId are required" },
          { status: 400 }
        )
      );
    }

    if (player1Id === player2Id) {
      return withCors(
        NextResponse.json(
          { error: "Cannot challenge yourself" },
          { status: 400 }
        )
      );
    }

    // Create match
    const result = await db
      .insert(matches)
      .values({
        player1Id,
        player2Id,
        sportId,
        status: "pending",
      })
      .returning();

    return withCors(
      NextResponse.json({
        match: result[0],
      })
    );
  } catch (error) {
    console.error("[Create Match] Error:", error);
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
