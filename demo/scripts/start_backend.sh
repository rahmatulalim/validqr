#!/usr/bin/env bash
# Start the ValidQR backend for the HackNusa demo.
# Ensures the database and redis are running (assumes local services for demo).

echo "🚀 Starting ValidQR Backend Demo..."

# Navigate to backend directory
cd "$(dirname "$0")/../../backend" || exit 1

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env not found. Copying from .env.example..."
  cp .env.example .env
  echo "⚠️  Please configure your WA_API_TOKEN in backend/.env before continuing."
  exit 1
fi

# Run backend
echo "📦 Installing dependencies if needed..."
npm install

echo "🔥 Starting development server..."
npm run dev
