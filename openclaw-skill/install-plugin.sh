#!/bin/bash

# OpenClaw Plugin Installation Script
# This script installs the COGNIS process_request plugin into OpenClaw

set -e  # Exit on error

echo "======================================================================"
echo "OpenClaw Plugin Installation: COGNIS Process Request"
echo "======================================================================"
echo ""

# Step 1: Verify plugin structure
echo "Step 1: Verifying plugin structure..."
if [ ! -f "index.js" ]; then
    echo "❌ Error: index.js not found"
    echo "Please run this script from the openclaw-skill directory"
    exit 1
fi

if [ ! -f "process_request.js" ]; then
    echo "❌ Error: process_request.js not found"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

echo "✓ Plugin structure verified"
echo ""

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 3: Test plugin
echo "Step 3: Testing plugin..."
node test-plugin.js
if [ $? -ne 0 ]; then
    echo "❌ Plugin test failed"
    exit 1
fi
echo "✓ Plugin test passed"
echo ""

# Step 4: Install plugin in OpenClaw
echo "Step 4: Installing plugin in OpenClaw..."
echo ""
echo "Please run ONE of the following commands:"
echo ""
echo "Option A (Recommended): Using OpenClaw CLI"
echo "  openclaw plugins install ./openclaw-skill"
echo ""
echo "Option B: Manual installation"
echo "  mkdir -p ~/.openclaw/plugins"
echo "  cp -r openclaw-skill ~/.openclaw/plugins/cognis-openclaw-skill"
echo ""
echo "Option C: Symlink (for development)"
echo "  mkdir -p ~/.openclaw/plugins"
echo "  ln -s \$(pwd) ~/.openclaw/plugins/cognis-openclaw-skill"
echo ""

# Step 5: Reminder to restart
echo "======================================================================"
echo "IMPORTANT: After installing the plugin, you MUST restart OpenClaw"
echo "======================================================================"
echo ""
echo "Run: openclaw restart"
echo ""
echo "Or if running as a service:"
echo "  systemctl restart openclaw"
echo ""

# Step 6: Verification instructions
echo "======================================================================"
echo "Verification Steps"
echo "======================================================================"
echo ""
echo "1. Ask agent: 'What tools do you have?'"
echo "   Expected: process_request should be listed"
echo ""
echo "2. Ask agent: 'Buy 100 shares of AAPL'"
echo "   Expected: Tool should be called, backend request triggered"
echo ""
echo "3. Check backend logs for incoming requests"
echo ""

echo "✅ Plugin installation preparation complete!"
echo ""
