import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, withCors } from "@/lib/middleware";

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const response = await auth.api.signOut(
      {
        asResponse: true,
      },
      {
        headers: request.headers,
      }
    );

    return withCors(
      NextResponse.json({ success: true }, { status: 200 })
    );
  } catch (error) {
    console.error("[Auth Sign-Out] Error:", error);
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
