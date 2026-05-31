import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, users, likes, comments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { count } from "drizzle-orm";

// Get feed
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const feedPosts = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        content: posts.content,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        visibility: posts.visibility,
        createdAt: posts.createdAt,
        likeCount: count(likes.id),
        commentCount: count(comments.id),
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.visibility, "public"))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return withCors(
      NextResponse.json({
        posts: feedPosts,
        count: feedPosts.length,
      })
    );
  } catch (error) {
    console.error("[Get Feed] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

// Create post
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
    const { content, imageUrl, videoUrl, visibility } = body;

    if (!content || content.trim().length === 0) {
      return withCors(
        NextResponse.json(
          { error: "Content is required" },
          { status: 400 }
        )
      );
    }

    const result = await db
      .insert(posts)
      .values({
        userId: parseInt(session.user.id as string),
        content: content.trim(),
        imageUrl,
        videoUrl,
        visibility: visibility || "public",
      })
      .returning();

    return withCors(
      NextResponse.json({
        post: result[0],
      })
    );
  } catch (error) {
    console.error("[Create Post] Error:", error);
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
