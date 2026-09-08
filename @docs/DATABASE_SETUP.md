# Database Migration cho Production

## Option 1: Vercel Functions Terminal
1. Vào Vercel Dashboard > Functions
2. Mở terminal 
3. Chạy: `npx prisma migrate deploy`

## Option 2: Local migration qua tunnel
1. Local: `npx prisma migrate deploy`
2. Với DATABASE_URL production

## Option 3: Manual SQL (nếu cần)
```sql
-- Copy từ prisma/migrations/20251008_production/migration.sql
-- Chạy trực tiếp trong Neon Console
```

## Verify Migration:
```bash
npx prisma db pull  # Check schema
npx prisma studio   # View tables
```