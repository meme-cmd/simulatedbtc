#!/bin/bash

# Bitcoin Mining Simulator - Render Deployment Helper Script
# This script helps prepare your project for deployment to Render

echo "🚀 Bitcoin Mining Simulator - Render Deployment Helper"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found render.yaml configuration"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not initialized. Initializing..."
    git init
    echo "✅ Git repository initialized"
fi

# Check for required files
echo "🔍 Checking project structure..."

required_files=(
    "package.json"
    "backend/package.json"
    "backend/server-simple.js"
    "next.config.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found $file"
    else
        echo "❌ Missing $file"
        exit 1
    fi
done

# Check if environment example files exist
echo "🔍 Checking environment configuration..."

if [ -f "backend/env.production.example" ]; then
    echo "✅ Backend environment example found"
else
    echo "❌ Backend environment example not found"
fi

if [ -f "env.local.example" ]; then
    echo "✅ Frontend environment example found"
else
    echo "❌ Frontend environment example not found"
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
node_version=$(node -v 2>/dev/null || echo "not found")
if [ "$node_version" = "not found" ]; then
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
else
    echo "✅ Node.js version: $node_version"
fi

# Test local build
echo "🔨 Testing local builds..."

echo "📦 Installing frontend dependencies..."
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

echo "🔨 Testing frontend build..."
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "🔨 Testing backend build..."
cd backend
if npm run build; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Check git status
echo "📊 Git status:"
git status --short

# Deployment checklist
echo ""
echo "🎯 DEPLOYMENT CHECKLIST"
echo "======================"
echo "Before deploying to Render, make sure you have:"
echo ""
echo "1. ✅ All files are committed to your Git repository"
echo "2. ⚠️  Set up your Solana wallet and Helius API key"
echo "3. ⚠️  Updated environment variables in Render dashboard"
echo "4. ⚠️  Pushed your code to GitHub/GitLab/Bitbucket"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code: git add . && git commit -m 'Deploy setup' && git push"
echo "2. Go to Render.com dashboard"
echo "3. Create new Blueprint from your repository"
echo "4. Set environment variables as described in DEPLOYMENT.md"
echo "5. Deploy!"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "✨ Your project is ready for deployment!"
