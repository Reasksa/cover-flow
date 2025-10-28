# Nuelink Clone (Web)

Next.js 14 + Tailwind + Prisma + NextAuth scaffold for a link-in-bio platform.

## Setup

1) Install dependencies
   - cd web
   - npm install

2) Configure environment
   - Copy .env.example to .env and fill values (DATABASE_URL, NEXTAUTH_SECRET, etc.)

3) Database
   - Ensure Postgres is running and DATABASE_URL points to it.
   - Run:
     - npx prisma generate
     - npx prisma migrate dev --name init

4) Dev server
   - npm run dev
   - Open http://localhost:3000

## Notes

- Registration endpoint: POST /api/auth/register
- Links API: GET/POST /api/links
- Public profile route: /:username

This is an initial scaffold. We will expand dashboard, analytics, billing, and themes.