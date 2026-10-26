# Storage Inventory

Private-access inventory application for Williams. Source repository is public; never commit personal data, credentials, photos or secrets.

## Stack
Next.js, TypeScript, Prisma, PostgreSQL.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and set DATABASE_URL.
3. `npx prisma migrate dev --name init`
4. `npm run dev`

## Status
Initial foundation only. Authentication and authorization are NOT implemented; do not deploy with real inventory data. eBay integration is deferred.
