#!/bin/sh
set -e

echo "→ Waiting for database connection…"
until bun -e "
  import postgres from 'postgres';
  const sql = postgres(process.env.DATABASE_URL);
  await sql\`SELECT 1\`;
  await sql.end();
" 2>/dev/null; do
  sleep 1
done
echo "  connected"

echo "→ Pushing schema…"
bun x drizzle-kit push --force

echo "→ Seeding database…"
bun src/seed.ts

echo "→ Starting server…"
exec bun src/index.ts
