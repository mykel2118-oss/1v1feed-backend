import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { emailSchema, passwordSchema, nameSchema, usernameSchema } from "@/lib/utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, firstName, lastName, username } = body;

  // Validate input
  const emailValidation = emailSchema.safeParse(email);
  const passwordValidation = passwordSchema.safeParse(password);
  const firstNameValidation = nameSchema.safeParse(firstName);
  const lastNameValidation = nameSchema.safeParse(lastName);
  const usernameValidation = usernameSchema.safeParse(username);

  if (
    !emailValidation.success ||
    !passwordValidation.success ||
    !firstNameValidation.success ||
    !lastNameValidation.success ||
    !usernameValidation.success
  ) {
    return withCors(
      NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      )
    );
  }

  try {
    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return withCors(
        NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        )
      );
    }

    // Call better-auth's sign-up endpoint
    const response = await auth.api.signUpEmail(
      {
        body: {
          email,
          password,
          name: `${firstName} ${lastName}`,
        },
        asResponse: true,
      },
      {
        headers: request.headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return withCors(
        NextResponse.json(
          { error: data.error || "Sign up failed" },
          { status: response.status }
        )
      );
    }

    // Update user with first name, last name, and username
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        username,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(data.user.id as string)));

    // Extract session token from Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    let sessionToken = "";

    if (setCookieHeader) {
      const match = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }

    // Return in the format the mobile app expects
    const result = NextResponse.json({
      token: sessionToken || data.session?.id || "",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
        username,
        avatarUrl: null,
        bio: null,
      },
    });

    return withCors(result);
  } catch (error) {
    console.error("[Auth Sign-Up] Error:", error);
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
