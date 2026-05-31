import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { emailSchema, passwordSchema } from "@/lib/utils";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password } = body;

  // Validate input
  const emailValidation = emailSchema.safeParse(email);
  const passwordValidation = passwordSchema.safeParse(password);

  if (!emailValidation.success || !passwordValidation.success) {
    return withCors(
      NextResponse.json(
        { error: "Invalid email or password format" },
        { status: 400 }
      )
    );
  }

  try {
    // Call better-auth's sign-in endpoint
    const response = await auth.api.signInEmail(
      {
        body: { email, password },
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
          { error: data.error || "Sign in failed" },
          { status: response.status }
        )
      );
    }

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
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        username: data.user.username || "",
        avatarUrl: data.user.avatarUrl,
        bio: data.user.bio,
      },
    });

    return withCors(result);
  } catch (error) {
    console.error("[Auth Sign-In] Error:", error);
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
