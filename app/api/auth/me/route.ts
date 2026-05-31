import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id as string)))
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
        },
      })
    );
  } catch (error) {
    console.error("[Auth Me] Error:", error);
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
