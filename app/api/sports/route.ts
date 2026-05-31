import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, withCors } from "@/lib/middleware";
import { db } from "@/lib/db";
import { sports } from "@/lib/db/schema";

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const sportsList = await db.select().from(sports);

    return withCors(
      NextResponse.json({
        sports: sportsList,
        count: sportsList.length,
      })
    );
  } catch (error) {
    console.error("[Get Sports] Error:", error);
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
