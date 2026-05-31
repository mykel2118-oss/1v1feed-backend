import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users, conversations } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const GET = withErrorHandler(async (request: NextRequest, context: any) => {
  const { conversationId } = context.params;
  const convId = parseInt(conversationId);
  const { searchParams } = new URL(request.url);
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

    // Verify user is part of this conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, convId),
          or(
            eq(conversations.user1Id, userId),
            eq(conversations.user2Id, userId)
          )
        )
      )
      .limit(1);

    if (!conversation.length) {
      return withCors(
        NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        )
      );
    }

    // Get messages
    const messageList = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderName: users.firstName,
        senderLastName: users.lastName,
        senderAvatar: users.avatarUrl,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, convId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return withCors(
      NextResponse.json({
        messages: messageList.reverse(),
        count: messageList.length,
      })
    );
  } catch (error) {
    console.error("[Get Messages] Error:", error);
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
