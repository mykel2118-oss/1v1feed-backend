import { db } from "@/lib/db";
import { sports } from "@/lib/db/schema";

const sportsList = [
  { name: "Basketball", description: "1v1 Basketball" },
  { name: "Soccer", description: "1v1 Soccer" },
  { name: "Tennis", description: "1v1 Tennis" },
  { name: "Badminton", description: "1v1 Badminton" },
  { name: "Boxing", description: "1v1 Boxing" },
  { name: "Chess", description: "1v1 Chess" },
  { name: "Ping Pong", description: "1v1 Ping Pong" },
  { name: "Darts", description: "1v1 Darts" },
  { name: "Golf", description: "1v1 Golf" },
  { name: "Bowling", description: "1v1 Bowling" },
  { name: "Video Games", description: "1v1 Video Games" },
  { name: "Poker", description: "1v1 Poker" },
  { name: "Swimming", description: "1v1 Swimming" },
  { name: "Running", description: "1v1 Running" },
  { name: "Cycling", description: "1v1 Cycling" },
];

async function seed() {
  try {
    console.log("Seeding sports...");

    for (const sport of sportsList) {
      const existing = await db
        .select()
        .from(sports)
        .where(sports.name === sport.name)
        .limit(1);

      if (!existing.length) {
        await db.insert(sports).values(sport);
        console.log(`✓ Added ${sport.name}`);
      } else {
        console.log(`✓ ${sport.name} already exists`);
      }
    }

    console.log("✓ Seeding complete!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
