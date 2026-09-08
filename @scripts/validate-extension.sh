#!/bin/bash

# czToDo Extension Validation Script
# This script validates that the extension is ready for loading in Chrome

echo "🔍 czToDo Extension Validation"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# Check if extension directory exists
echo "📁 Checking directory structure..."
if [ ! -d "extension" ]; then
    error "extension/ directory not found"
    exit 1
fi
success "extension/ directory found"

# Check manifest.json
echo ""
echo "📋 Checking manifest.json..."
if [ ! -f "extension/manifest.json" ]; then
    error "extension/manifest.json not found"
    exit 1
fi
success "extension/manifest.json exists"

# Validate manifest JSON
if command -v jq &> /dev/null; then
    if jq empty extension/manifest.json 2>/dev/null; then
        success "manifest.json is valid JSON"
    else
        error "manifest.json has invalid JSON syntax"
    fi
else
    warning "jq not installed, skipping JSON validation"
fi

# Check required files
echo ""
echo "📄 Checking required files..."

required_files=(
    "extension/manifest.json"
    "extension/popup.html"
    "extension/options.html"
    "extension/dist/popup.js"
    "extension/dist/options.js"
    "extension/dist/background.js"
    "extension/dist/content.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        success "$file ($size)"
    else
        error "$file not found"
    fi
done

# Check build artifacts
echo ""
echo "🔨 Checking build artifacts..."

dist_files=(
    "extension/dist/popup.js"
    "extension/dist/options.js"
    "extension/dist/background.js"
    "extension/dist/content.js"
)

total_size=0
for file in "${dist_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ $size -gt 0 ]; then
            size_kb=$((size / 1024))
            success "$(basename $file) compiled ($size_kb KB)"
            total_size=$((total_size + size))
        else
            error "$(basename $file) is empty (size: 0)"
        fi
    fi
done

total_size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc)
echo ""
echo "📦 Total bundle size: ${total_size_mb}MB"

# Check for common issues
echo ""
echo "🚨 Checking for common issues..."

# Check if dist files are newer than source
if [ -f "extension/popup/App.tsx" ] && [ -f "extension/dist/popup.js" ]; then
    source_time=$(stat -f%m "$extension/popup/App.tsx" 2>/dev/null || stat -c%Y "$extension/popup/App.tsx" 2>/dev/null)
    dist_time=$(stat -f%m "extension/dist/popup.js" 2>/dev/null || stat -c%Y "extension/dist/popup.js" 2>/dev/null)

    if [ "$source_time" -lt "$dist_time" ]; then
        success "Build artifacts are up to date"
    else
        warning "Build artifacts may be stale (run: npm run build:extension)"
    fi
fi

# Check for node_modules
if [ -d "node_modules" ]; then
    success "node_modules found"
else
    warning "node_modules not found (run: npm install)"
fi

# Check if .env.local exists
echo ""
echo "🔐 Checking environment configuration..."
if [ -f ".env.local" ]; then
    if grep -q "SUPABASE_URL" .env.local; then
        success ".env.local found with Supabase config"
    else
        warning ".env.local exists but missing Supabase configuration"
    fi
else
    warning ".env.local not found - you'll need Supabase credentials to test"
fi

# Summary
echo ""
echo "================================"
echo "📊 Validation Summary"
echo "================================"
echo "✓ Checks passed: $((${#required_files[@]} - $ERRORS + 7))"
echo "✗ Errors: $ERRORS"
echo "⚠ Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Extension is ready to load in Chrome!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable Developer mode (top-right toggle)"
    echo "3. Click 'Load unpacked'"
    echo "4. Select the 'extension' folder"
    echo "5. Follow LOAD_AND_TEST.md for testing steps"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Extension has errors that need to be fixed${NC}"
    echo ""
    echo "Please fix the errors above and try again."
    echo ""
    exit 1
fi
