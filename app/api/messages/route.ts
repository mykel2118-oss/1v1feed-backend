import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, users } from "@/lib/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

// Get conversations
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

    const userConversations = await db
      .select({
        id: conversations.id,
        otherId: users.id,
        otherName: users.firstName,
        otherLastName: users.lastName,
        otherUsername: users.username,
        otherAvatar: users.avatarUrl,
        lastMessageAt: conversations.lastMessageAt,
      })
      .from(conversations)
      .leftJoin(
        users,
        or(
          and(
            eq(conversations.user1Id, userId),
            eq(users.id, conversations.user2Id)
          ),
          and(
            eq(conversations.user2Id, userId),
            eq(users.id, conversations.user1Id)
          )
        )
      )
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    return withCors(
      NextResponse.json({
        conversations: userConversations,
        count: userConversations.length,
      })
    );
  } catch (error) {
    console.error("[Get Conversations] Error:", error);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
});

// Send message
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
    const { recipientId, content } = body;
    const senderId = parseInt(session.user.id as string);

    if (!content || content.trim().length === 0) {
      return withCors(
        NextResponse.json(
          { error: "Content is required" },
          { status: 400 }
        )
      );
    }

    // Find or create conversation
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.user1Id, senderId),
            eq(conversations.user2Id, recipientId)
          ),
          and(
            eq(conversations.user1Id, recipientId),
            eq(conversations.user2Id, senderId)
          )
        )
      )
      .limit(1);

    if (!conversation.length) {
      const created = await db
        .insert(conversations)
        .values({
          user1Id: Math.min(senderId, recipientId),
          user2Id: Math.max(senderId, recipientId),
          lastMessageAt: new Date(),
        })
        .returning();
      conversation = created;
    }

    // Create message
    const result = await db
      .insert(messages)
      .values({
        conversationId: conversation[0].id,
        senderId,
        content: content.trim(),
      })
      .returning();

    // Update conversation last message time
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversation[0].id));

    return withCors(
      NextResponse.json({
        message: result[0],
      })
    );
  } catch (error) {
    console.error("[Send Message] Error:", error);
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
