#!/bin/bash
# Quick debugging script

echo "🔍 Testing Todo App Health..."

echo "1. Testing health endpoint..."
curl -X GET https://cz-to-do.vercel.app/api/health

echo -e "\n\n2. Testing registration with sample data..."
curl -X POST https://cz-to-do.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User", 
    "email": "test@example.com", 
    "password": "testpass123"
  }'

echo -e "\n\n3. Check Vercel logs for detailed errors"
echo "   → Go to Vercel Dashboard > Functions > Logs"

echo -e "\n\n4. Common fixes if still failing:"
echo "   → Set environment variables in Vercel"
echo "   → Run: npx prisma migrate deploy"
echo "   → Check database connection string"