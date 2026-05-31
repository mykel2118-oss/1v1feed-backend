# 1v1Feed v2 - Backend

A production-ready backend for the 1v1Feed sports rivalry platform built with Next.js, PostgreSQL, and better-auth.

## Features

- ✅ Email/password authentication with better-auth
- ✅ User profiles with ELO ratings
- ✅ Match/challenge system with score reporting
- ✅ Social features (friends, posts, comments, likes)
- ✅ Leaderboards filtered by sport
- ✅ Direct messaging
- ✅ Video clip uploads (10-second matches)
- ✅ Self-hosted (no Vercel dependency)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** better-auth
- **Language:** TypeScript
- **Deployment:** Docker-ready

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/1v1feed
   BETTER_AUTH_SECRET=your-secret-key
   API_BASE_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000,http://localhost:8081
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb 1v1feed
   ```

4. **Generate and run migrations:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Server will be available at `http://localhost:3000`

## API Routes

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/[id]` - Get user profile
- `GET /api/users/search?q=query` - Search users
- `PATCH /api/users/profile` - Update profile

### Leaderboards
- `GET /api/leaderboard?sport=basketball` - Get leaderboard by sport
- `GET /api/leaderboard/global` - Get global leaderboard

### Friends
- `GET /api/friends` - Get friend list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/[id]/request` - Send friend request
- `POST /api/friends/[id]/accept` - Accept friend request
- `DELETE /api/friends/[id]` - Delete friend

### Posts
- `GET /api/posts` - Get feed
- `POST /api/posts` - Create post
- `POST /api/posts/[id]/like` - Like post
- `DELETE /api/posts/[id]/like` - Unlike post

### Comments
- `POST /api/comments` - Create comment
- `DELETE /api/comments/[id]` - Delete comment

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/[conversationId]` - Get conversation messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/[id]` - Delete message

### Matches/Challenges
- `POST /api/matches` - Create challenge
- `GET /api/matches` - Get user's matches
- `POST /api/matches/[id]/accept` - Accept challenge
- `POST /api/matches/[id]/score` - Report score
- `POST /api/matches/[id]/confirm-score` - Confirm score
- `POST /api/matches/[id]/video` - Upload match video

## Database Schema

See `lib/db/schema.ts` for complete schema with all tables and relations.

### Core Tables
- `users` - User accounts with ELO ratings
- `sports` - Available sports/games
- `matches` - Match records with scores
- `posts` - User posts
- `comments` - Post comments
- `likes` - Post likes
- `friendships` - Friend relationships
- `conversations` - Direct message conversations
- `messages` - Direct messages
- `leaderboards` - Sport-specific rankings

## Development

### Database Studio
View and manage database with Drizzle Studio:
```bash
npm run db:studio
```

### Type Safety
All database queries are fully typed with TypeScript.

### Validation
Input validation with Zod schemas in `lib/utils.ts`.

## Deployment

### Docker

1. **Build image:**
   ```bash
   docker build -t 1v1feed-backend .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL=postgresql://... \
     -e BETTER_AUTH_SECRET=... \
     1v1feed-backend
   ```

### Self-Hosted Options
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2 + RDS
- Your own VPS

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/1v1feed` |
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Server port | `3000` |
| `BETTER_AUTH_SECRET` | Authentication secret | `your-secret-key` |
| `API_BASE_URL` | API base URL | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000,http://localhost:8081` |

## License

MIT
