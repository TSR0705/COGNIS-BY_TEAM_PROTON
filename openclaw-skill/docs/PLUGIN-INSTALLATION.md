# OpenClaw Plugin Installation Guide

## Overview

This guide explains how to install the COGNIS process_request tool as a real OpenClaw plugin that the agent can actually call.

---

## Plugin Structure

```
openclaw-skill/
├── index.js              # Plugin entry point (REQUIRED)
├── process_request.js    # Core implementation
├── package.json          # Plugin metadata
└── PLUGIN-INSTALLATION.md # This file
```

---

## Step 1: Verify Plugin Structure

The plugin must export this structure in `index.js`:

```javascript
module.exports = {
  name: "process_request",
  description: "Send financial action to backend enforcement system",
  schema: { /* JSON Schema */ },
  run: async (input) => { /* Implementation */ }
};
```

✅ **Status:** Already configured in `index.js`

---

## Step 2: Verify Dependencies

Ensure all dependencies are installed:

```bash
cd openclaw-skill
npm install
```

**Required dependencies:**
- axios (for HTTP requests)
- mongoose (for log validation in tests)

✅ **Status:** Check with `npm list`

---

## Step 3: Install Plugin in OpenClaw

### Method A: Using OpenClaw CLI (Recommended)

```bash
# From the project root
openclaw plugins install ./openclaw-skill
```

**Expected output:**
```
✓ Plugin 'cognis-openclaw-skill' installed successfully
✓ Tool 'process_request' registered
```

### Method B: Manual Installation

If OpenClaw CLI is not available, manually copy the plugin:

```bash
# Copy to OpenClaw plugins directory
cp -r openclaw-skill ~/.openclaw/plugins/cognis-openclaw-skill
```

### Method C: Symlink (Development)

For development, create a symlink:

```bash
# Create symlink
ln -s $(pwd)/openclaw-skill ~/.openclaw/plugins/cognis-openclaw-skill
```

---

## Step 4: Restart OpenClaw

**IMPORTANT:** You must restart OpenClaw completely for the plugin to load.

```bash
# Stop OpenClaw
openclaw stop

# Start OpenClaw
openclaw start
```

Or if running as a service:

```bash
# Restart service
systemctl restart openclaw
```

---

## Step 5: Verify Installation

### Test 1: Check Available Tools

Ask the agent:
```
"What tools do you have?"
```

**Expected response:**
```
I have access to the following tools:
- process_request: Send financial action to backend enforcement system
- [other tools...]
```

**NOT expected:**
- Tool described as "hypothetical"
- Tool not listed
- Generic response without tool names

### Test 2: Test Tool Call

Ask the agent:
```
"Buy 100 shares of AAPL"
```

**Expected behavior:**
1. Agent recognizes this as a trade request
2. Agent calls `process_request` tool
3. Backend receives the request
4. Agent receives response with request_id
5. Agent informs you of the result

**Expected response format:**
```
I've processed your trade request.
Request ID: abc-123-def
Decision: ALLOW
Status: The trade was approved but execution failed due to API configuration.
```

**NOT expected:**
- Agent prints JSON without calling tool
- Agent says "I would call process_request..."
- No backend request logged
- No request_id in response

---

## Step 6: Debug (If Plugin Not Working)

### Issue 1: Plugin Not Listed

**Symptoms:**
- Agent doesn't mention `process_request` in tool list
- Agent says "I don't have that tool"

**Solutions:**
1. Check plugin installation path:
   ```bash
   ls ~/.openclaw/plugins/
   ```

2. Verify index.js exists:
   ```bash
   cat ~/.openclaw/plugins/cognis-openclaw-skill/index.js
   ```

3. Check OpenClaw logs:
   ```bash
   openclaw logs
   ```

4. Reinstall plugin:
   ```bash
   openclaw plugins uninstall cognis-openclaw-skill
   openclaw plugins install ./openclaw-skill
   ```

### Issue 2: Plugin Listed But Not Callable

**Symptoms:**
- Agent mentions the tool
- Agent doesn't actually call it
- No backend request triggered

**Solutions:**
1. Verify `run` function is exported:
   ```javascript
   // In index.js
   run: async (input) => {
     return await process_request(input);
   }
   ```

2. Check function signature matches schema

3. Test direct call:
   ```bash
   node -e "const plugin = require('./openclaw-skill'); plugin.run({user_input: 'test', proposed_action: {type: 'trade', asset: 'AAPL', amount: 100}}).then(console.log)"
   ```

### Issue 3: Backend Connection Failed

**Symptoms:**
- Tool is called
- Returns "Backend unavailable"

**Solutions:**
1. Start backend:
   ```bash
   cd backend
   node src/app.js
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:5000/api/process -X POST -H "Content-Type: application/json" -d '{"input":"test"}'
   ```

3. Check backend logs for errors

---

## Verification Checklist

Before considering the plugin installed:

- [ ] `index.js` exists with correct export structure
- [ ] `package.json` has `"main": "index.js"`
- [ ] Dependencies installed (`npm install`)
- [ ] Plugin installed in OpenClaw (`openclaw plugins install`)
- [ ] OpenClaw restarted completely
- [ ] Agent lists `process_request` in available tools
- [ ] Agent can actually call the tool (not just describe it)
- [ ] Backend receives requests when tool is called
- [ ] Response includes `request_id` from backend

---

## Testing Script

Create a test file to verify the plugin works:

```javascript
// test-plugin.js
const plugin = require('./index');

async function testPlugin() {
  console.log('Testing OpenClaw Plugin...\n');
  
  // Test 1: Verify structure
  console.log('✓ Plugin name:', plugin.name);
  console.log('✓ Plugin description:', plugin.description);
  console.log('✓ Schema defined:', !!plugin.schema);
  console.log('✓ Run function:', typeof plugin.run);
  console.log();
  
  // Test 2: Call plugin
  console.log('Calling plugin...');
  const result = await plugin.run({
    user_input: "Buy 100 AAPL",
    agent_reasoning: "Test call",
    proposed_action: {
      type: "trade",
      asset: "AAPL",
      amount: 100
    }
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Test 3: Verify response
  if (result.request_id) {
    console.log('\n✓ Plugin working correctly');
    console.log('✓ Backend connection successful');
  } else {
    console.log('\n✗ Plugin returned unexpected format');
  }
}

testPlugin().catch(console.error);
```

Run test:
```bash
cd openclaw-skill
node test-plugin.js
```

---

## Plugin Configuration

### Environment Variables

Set these before starting OpenClaw:

```bash
# Backend URL (if not localhost)
export COGNIS_BACKEND_URL=http://your-backend:5000/api/process

# Timeout (milliseconds)
export COGNIS_TIMEOUT=3000
```

### Custom Configuration

To customize the plugin, edit `process_request.js`:

```javascript
// Change timeout
timeout: 5000  // 5 seconds

// Change backend URL
const BACKEND_URL = process.env.COGNIS_BACKEND_URL || 'http://localhost:5000/api/process';
```

---

## Production Deployment

### Step 1: Build Plugin Package

```bash
cd openclaw-skill
npm pack
```

This creates: `cognis-openclaw-skill-1.0.0.tgz`

### Step 2: Install on Production

```bash
# On production server
openclaw plugins install cognis-openclaw-skill-1.0.0.tgz
```

### Step 3: Configure Backend URL

```bash
# Set production backend URL
export COGNIS_BACKEND_URL=https://api.production.com/process
```

### Step 4: Restart OpenClaw

```bash
systemctl restart openclaw
```

---

## Troubleshooting Commands

```bash
# List installed plugins
openclaw plugins list

# Show plugin details
openclaw plugins show cognis-openclaw-skill

# Uninstall plugin
openclaw plugins uninstall cognis-openclaw-skill

# Reinstall plugin
openclaw plugins install ./openclaw-skill

# View OpenClaw logs
openclaw logs --follow

# Test plugin directly
node openclaw-skill/test-plugin.js
```

---

## Support

If the plugin is not working:

1. Check this guide's troubleshooting section
2. Run the test script: `node test-plugin.js`
3. Check OpenClaw logs: `openclaw logs`
4. Verify backend is running: `curl http://localhost:5000/health`
5. Test direct call: `node -e "require('./openclaw-skill').run({...}).then(console.log)"`

---

## Summary

**Installation Steps:**
1. ✅ Verify plugin structure (index.js exists)
2. ✅ Install dependencies (npm install)
3. ⚠️ Install plugin (openclaw plugins install ./openclaw-skill)
4. ⚠️ Restart OpenClaw (openclaw restart)
5. ⚠️ Verify tool is listed (ask agent "What tools do you have?")
6. ⚠️ Test tool call (ask agent "Buy 100 AAPL")

**Expected Result:**
- Tool appears in agent's tool list
- Tool is actually callable (not simulated)
- Backend receives requests
- Responses include request_id

**Status:** Plugin structure ready, awaiting OpenClaw installation
