#!/bin/bash

echo "🚀 Deploying CafeCare Backend with Seeder..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo "Please set your database connection string:"
    echo "export DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building project..."
npm run build

echo "🌱 Starting server with automatic seeder..."
NODE_ENV=production RUN_SEEDER_ON_START=true npm start

echo ""
echo "✅ Deployment completed!"