#!/bin/bash
# Deploy script for Vercel

echo "🚀 Starting deployment setup..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Deploy migrations to production database
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

echo "✅ Deployment setup complete!"