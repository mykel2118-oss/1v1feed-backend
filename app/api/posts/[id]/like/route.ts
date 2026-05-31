import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { likes, posts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Like post
export const POST = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;
  const postId = parseInt(id);

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

    // Check if post exists
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post.length) {
      return withCors(
        NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        )
      );
    }

    // Check if already liked
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return withCors(
        NextResponse.json(
          { error: "Already liked" },
          { status: 400 }
        )
      );
    }

    // Create like
    const result = await db
      .insert(likes)
      .values({
        postId,
        userId,
      })
      .returning();

    return withCors(
      NextResponse.json({
        like: result[0],
      })
    );
  } catch (error) {
    console.error("[Like Post] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

// Unlike post
export const DELETE = withErrorHandler(async (request: NextRequest, context: any) => {
  const { id } = context.params;
  const postId = parseInt(id);

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

    // Delete like
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        )
      )
      .returning();

    if (!result.length) {
      return withCors(
        NextResponse.json(
          { error: "Like not found" },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json({ success: true })
    );
  } catch (error) {
    console.error("[Unlike Post] Error:", error);
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
