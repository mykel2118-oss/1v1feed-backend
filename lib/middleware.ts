import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: number) => Promise<Response>
) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call handler with userId
    return await handler(request, parseInt(session.user.id as string));
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export function withErrorHandler(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API error:", error);

      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON" },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
        if (error.message.includes("Not found")) {
          return NextResponse.json(
            { error: "Not found" },
            { status: 404 }
          );
        }
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

export function withCors(response: Response): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
