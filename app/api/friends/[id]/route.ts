import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";

// Send friend request
export const POST = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;
  const friendId = parseInt(id);

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

    if (userId === friendId) {
      return withCors(
        NextResponse.json(
          { error: "Cannot add yourself as a friend" },
          { status: 400 }
        )
      );
    }

    // Check if friendship already exists
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.user1Id, userId),
            eq(friendships.user2Id, friendId)
          ),
          and(
            eq(friendships.user1Id, friendId),
            eq(friendships.user2Id, userId)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return withCors(
        NextResponse.json(
          { error: "Friendship already exists or pending" },
          { status: 400 }
        )
      );
    }

    // Create friendship request
    const result = await db
      .insert(friendships)
      .values({
        user1Id: userId,
        user2Id: friendId,
        status: "pending",
      })
      .returning();

    return withCors(
      NextResponse.json({
        friendship: result[0],
      })
    );
  } catch (error) {
    console.error("[Send Friend Request] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

// Delete friend
export const DELETE = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;
  const friendId = parseInt(id);

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

    // Delete friendship
    const result = await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.user1Id, userId),
            eq(friendships.user2Id, friendId)
          ),
          and(
            eq(friendships.user1Id, friendId),
            eq(friendships.user2Id, userId)
          )
        )
      )
      .returning();

    if (!result.length) {
      return withCors(
        NextResponse.json(
          { error: "Friendship not found" },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json({ success: true })
    );
  } catch (error) {
    console.error("[Delete Friend] Error:", error);
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
