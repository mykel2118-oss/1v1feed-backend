import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bioSchema, nameSchema } from "@/lib/utils";

export const PATCH = withErrorHandler(async (request: NextRequest) => {
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
    const { firstName, lastName, bio, avatarUrl } = body;

    // Validate input
    const updates: any = {};

    if (firstName !== undefined) {
      const validation = nameSchema.safeParse(firstName);
      if (!validation.success) {
        return withCors(
          NextResponse.json(
            { error: "Invalid first name" },
            { status: 400 }
          )
        );
      }
      updates.firstName = firstName;
    }

    if (lastName !== undefined) {
      const validation = nameSchema.safeParse(lastName);
      if (!validation.success) {
        return withCors(
          NextResponse.json(
            { error: "Invalid last name" },
            { status: 400 }
          )
        );
      }
      updates.lastName = lastName;
    }

    if (bio !== undefined) {
      const validation = bioSchema.safeParse(bio);
      if (!validation.success) {
        return withCors(
          NextResponse.json(
            { error: "Invalid bio" },
            { status: 400 }
          )
        );
      }
      updates.bio = bio;
    }

    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl;
    }

    updates.updatedAt = new Date();

    // Update user
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, parseInt(session.user.id as string)))
      .returning();

    if (!result.length) {
      return withCors(
        NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      );
    }

    const userData = result[0];

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
        },
      })
    );
  } catch (error) {
    console.error("[Update Profile] Error:", error);
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
