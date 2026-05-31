import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  varchar,
  boolean,
  decimal,
  uniqueIndex,
  index,
  foreignKey,
  enum as pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ ENUMS ============

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "accepted",
  "completed",
  "disputed",
  "cancelled",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "blocked",
]);

export const visibilityEnum = pgEnum("visibility", [
  "public",
  "friends_only",
  "private",
]);

// ============ USERS TABLE ============

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    eloRating: integer("elo_rating").default(1200),
    totalWins: integer("total_wins").default(0),
    totalLosses: integer("total_losses").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  })
);

// ============ SPORTS TABLE ============

export const sports = pgTable(
  "sports",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    iconUrl: text("icon_url"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("sport_name_idx").on(table.name),
  })
);

// ============ MATCHES TABLE ============

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    player1Id: integer("player1_id").notNull(),
    player2Id: integer("player2_id").notNull(),
    sportId: integer("sport_id").notNull(),
    status: matchStatusEnum("status").default("pending").notNull(),
    player1Score: integer("player1_score"),
    player2Score: integer("player2_score"),
    winnerId: integer("winner_id"),
    videoClipUrl: text("video_clip_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    player1Idx: index("player1_idx").on(table.player1Id),
    player2Idx: index("player2_idx").on(table.player2Id),
    sportIdx: index("sport_idx").on(table.sportId),
    statusIdx: index("status_idx").on(table.status),
  })
);

// ============ POSTS TABLE ============

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    videoUrl: text("video_url"),
    visibility: visibilityEnum("visibility").default("public").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("post_user_idx").on(table.userId),
    createdAtIdx: index("post_created_at_idx").on(table.createdAt),
  })
);

// ============ COMMENTS TABLE ============

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    userId: integer("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index("comment_post_idx").on(table.postId),
    userIdx: index("comment_user_idx").on(table.userId),
  })
);

// ============ LIKES TABLE ============

export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index("like_post_idx").on(table.postId),
    userIdx: index("like_user_idx").on(table.userId),
    uniqueIdx: uniqueIndex("like_unique_idx").on(table.postId, table.userId),
  })
);

// ============ FRIENDSHIPS TABLE ============

export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    user1Id: integer("user1_id").notNull(),
    user2Id: integer("user2_id").notNull(),
    status: friendshipStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    user1Idx: index("friendship_user1_idx").on(table.user1Id),
    user2Idx: index("friendship_user2_idx").on(table.user2Id),
    statusIdx: index("friendship_status_idx").on(table.status),
  })
);

// ============ CONVERSATIONS TABLE ============

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    user1Id: integer("user1_id").notNull(),
    user2Id: integer("user2_id").notNull(),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    user1Idx: index("conv_user1_idx").on(table.user1Id),
    user2Idx: index("conv_user2_idx").on(table.user2Id),
  })
);

// ============ MESSAGES TABLE ============

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").notNull(),
    senderId: integer("sender_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    convIdx: index("msg_conv_idx").on(table.conversationId),
    senderIdx: index("msg_sender_idx").on(table.senderId),
  })
);

// ============ LEADERBOARDS TABLE ============

export const leaderboards = pgTable(
  "leaderboards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    sportId: integer("sport_id").notNull(),
    wins: integer("wins").default(0),
    losses: integer("losses").default(0),
    eloRating: decimal("elo_rating", { precision: 10, scale: 2 }).default("1200"),
    rank: integer("rank"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userSportIdx: uniqueIndex("leaderboard_user_sport_idx").on(table.userId, table.sportId),
    sportIdx: index("leaderboard_sport_idx").on(table.sportId),
    eloIdx: index("leaderboard_elo_idx").on(table.eloRating),
  })
);

// ============ SESSIONS TABLE (for better-auth) ============

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("session_user_idx").on(table.userId),
  })
);

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many, one }) => ({
  matches: many(matches),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  leaderboards: many(leaderboards),
  sessions: many(sessions),
}));

export const sportsRelations = relations(sports, ({ many }) => ({
  matches: many(matches),
  leaderboards: many(leaderboards),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  player1: one(users, {
    fields: [matches.player1Id],
    references: [users.id],
  }),
  player2: one(users, {
    fields: [matches.player2Id],
    references: [users.id],
  }),
  sport: one(sports, {
    fields: [matches.sportId],
    references: [sports.id],
  }),
  winner: one(users, {
    fields: [matches.winnerId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user1: one(users, {
    fields: [friendships.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [friendships.user2Id],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  user: one(users, {
    fields: [leaderboards.userId],
    references: [users.id],
  }),
  sport: one(sports, {
    fields: [leaderboards.sportId],
    references: [sports.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
