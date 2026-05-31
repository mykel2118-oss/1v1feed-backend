import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export const GET = withErrorHandler(async (request: NextRequest) => {
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

    // Get accepted friends
    const friendsList = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        eloRating: users.eloRating,
      })
      .from(friendships)
      .leftJoin(
        users,
        or(
          and(
            eq(friendships.user1Id, userId),
            eq(users.id, friendships.user2Id)
          ),
          and(
            eq(friendships.user2Id, userId),
            eq(users.id, friendships.user1Id)
          )
        )
      )
      .where(
        and(
          or(
            eq(friendships.user1Id, userId),
            eq(friendships.user2Id, userId)
          ),
          eq(friendships.status, "accepted")
        )
      );

    return withCors(
      NextResponse.json({
        friends: friendsList,
        count: friendsList.length,
      })
    );
  } catch (error) {
    console.error("[Get Friends] Error:", error);
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
