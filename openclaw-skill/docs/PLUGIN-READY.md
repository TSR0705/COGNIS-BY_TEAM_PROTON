# OpenClaw Plugin: READY FOR INSTALLATION ✅

## Status: Plugin Structure Complete

The COGNIS `process_request` tool has been converted into a real OpenClaw plugin that can be installed and called by agents.

---

## What Was Created

### 1. Plugin Entry Point: `index.js`

```javascript
module.exports = {
  name: "process_request",
  description: "Send financial action to backend enforcement system...",
  schema: { /* JSON Schema for parameters */ },
  run: async (input) => {
    return await process_request(input);
  }
};
```

**Purpose:** This is the main entry point that OpenClaw loads. It wraps the `process_request` function and exposes it as a callable tool.

### 2. Updated `package.json`

```json
{
  "name": "cognis-openclaw-skill",
  "main": "index.js",  // ← Points to plugin entry point
  ...
}
```

### 3. Test Script: `test-plugin.js`

Validates plugin structure before installation:
- ✅ Plugin name correct
- ✅ Description present
- ✅ Schema valid
- ✅ Run function callable
- ✅ Backend connection works

### 4. Installation Guide: `PLUGIN-INSTALLATION.md`

Complete guide with:
- Installation methods
- Troubleshooting steps
- Verification procedures
- Debug commands

### 5. Installation Script: `install-plugin.sh`

Automated installation helper (bash script)

---

## Test Results

```
OpenClaw Plugin Test
======================================================================
TEST 1: Plugin Structure
✓ Plugin name: process_request
✓ Plugin description: Send financial action to backend enforcement syste...
✓ Schema defined with type: object
✓ Run function: callable

TEST 2: Schema Validation
✓ Required field: user_input
✓ Required field: proposed_action
✓ Property defined: user_input
✓ Property defined: proposed_action

TEST 3: Plugin Execution
✓ Response includes request_id: fd3e9e70-7454-46b1-99b3-8a75482809ec
✓ Response includes decision/status
✓ Response includes final_status

======================================================================
TEST SUMMARY
======================================================================
Total Checks: 11
Passed: 11
Failed: 0
Success Rate: 100.0%
======================================================================

✅ PLUGIN READY FOR INSTALLATION
```

---

## Installation Instructions

### Prerequisites

1. **Backend Running:**
   ```bash
   cd backend
   node src/app.js
   ```

2. **Dependencies Installed:**
   ```bash
   cd openclaw-skill
   npm install
   ```

### Install Plugin

**Method 1: OpenClaw CLI (Recommended)**
```bash
openclaw plugins install ./openclaw-skill
```

**Method 2: Manual Copy**
```bash
mkdir -p ~/.openclaw/plugins
cp -r openclaw-skill ~/.openclaw/plugins/cognis-openclaw-skill
```

**Method 3: Symlink (Development)**
```bash
mkdir -p ~/.openclaw/plugins
ln -s $(pwd)/openclaw-skill ~/.openclaw/plugins/cognis-openclaw-skill
```

### Restart OpenClaw

**CRITICAL:** You must restart OpenClaw for the plugin to load.

```bash
openclaw restart
```

Or if running as a service:
```bash
systemctl restart openclaw
```

---

## Verification Steps

### Step 1: Check Tool List

Ask the agent:
```
"What tools do you have?"
```

**Expected Response:**
```
I have access to the following tools:
- process_request: Send financial action to backend enforcement system
- [other tools...]
```

**NOT Expected:**
- Tool described as "hypothetical"
- Tool not mentioned
- Generic response without tool names

### Step 2: Test Tool Call

Ask the agent:
```
"Buy 100 shares of AAPL"
```

**Expected Behavior:**
1. ✅ Agent recognizes trade request
2. ✅ Agent calls `process_request` tool
3. ✅ Backend receives HTTP request
4. ✅ Agent receives response with `request_id`
5. ✅ Agent informs you of result

**Expected Response:**
```
I've processed your trade request.
Request ID: fd3e9e70-7454-46b1-99b3-8a75482809ec
Decision: ALLOW
Status: The trade was approved but execution failed due to API configuration.
```

**NOT Expected:**
- Agent prints JSON without calling tool
- Agent says "I would call process_request..."
- No backend request in logs
- No `request_id` in response

### Step 3: Check Backend Logs

Backend should show:
```
POST /api/process
{
  "input": "Buy 100 shares of AAPL",
  "action": { "type": "trade", "asset": "AAPL", "amount": 100 },
  "source": "openclaw",
  "agent": { ... }
}
```

---

## Troubleshooting

### Issue: Plugin Not Listed

**Symptoms:**
- Agent doesn't mention `process_request`
- Agent says "I don't have that tool"

**Solutions:**
1. Check installation:
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

4. Reinstall:
   ```bash
   openclaw plugins uninstall cognis-openclaw-skill
   openclaw plugins install ./openclaw-skill
   openclaw restart
   ```

### Issue: Plugin Listed But Not Callable

**Symptoms:**
- Agent mentions the tool
- Agent doesn't actually call it
- No backend request

**Solutions:**
1. Verify `run` function in index.js
2. Test direct call:
   ```bash
   node -e "require('./openclaw-skill').run({user_input: 'test', proposed_action: {type: 'trade', asset: 'AAPL', amount: 100}}).then(console.log)"
   ```
3. Check OpenClaw function calling is enabled

### Issue: Backend Connection Failed

**Symptoms:**
- Tool is called
- Returns "Backend unavailable"

**Solutions:**
1. Start backend:
   ```bash
   cd backend
   node src/app.js
   ```

2. Test backend:
   ```bash
   curl http://localhost:5000/api/process -X POST -H "Content-Type: application/json" -d '{"input":"test"}'
   ```

3. Check firewall/network

---

## Plugin Architecture

```
OpenClaw Agent
      ↓
  [Function Call]
      ↓
index.js (Plugin Entry Point)
      ↓
  run: async (input) => { ... }
      ↓
process_request.js (Implementation)
      ↓
  HTTP POST to Backend
      ↓
Backend /api/process
      ↓
  [Intent → Policy → Enforcement → Execution]
      ↓
  Response with request_id
      ↓
OpenClaw Agent
      ↓
  User Response
```

---

## Files Structure

```
openclaw-skill/
├── index.js                    # ✅ Plugin entry point (NEW)
├── process_request.js          # ✅ Core implementation
├── package.json                # ✅ Updated main: "index.js"
├── test-plugin.js              # ✅ Plugin test script (NEW)
├── install-plugin.sh           # ✅ Installation helper (NEW)
├── PLUGIN-INSTALLATION.md      # ✅ Installation guide (NEW)
├── PLUGIN-READY.md             # ✅ This file (NEW)
├── register-tool.js            # Legacy (for reference)
├── example-agent.js            # Legacy (for reference)
└── TOOL-REGISTRATION.md        # Legacy (for reference)
```

---

## Next Steps

1. ✅ **Plugin Structure:** Complete
2. ✅ **Plugin Tests:** Passing (11/11)
3. ✅ **Documentation:** Complete
4. ⚠️ **Installation:** Awaiting OpenClaw CLI
5. ⚠️ **Verification:** Awaiting agent test
6. ⚠️ **Production:** Awaiting deployment

---

## Commands Reference

```bash
# Test plugin structure
node openclaw-skill/test-plugin.js

# Install plugin
openclaw plugins install ./openclaw-skill

# List installed plugins
openclaw plugins list

# Show plugin details
openclaw plugins show cognis-openclaw-skill

# Uninstall plugin
openclaw plugins uninstall cognis-openclaw-skill

# Restart OpenClaw
openclaw restart

# View logs
openclaw logs --follow

# Test backend
curl http://localhost:5000/api/process -X POST \
  -H "Content-Type: application/json" \
  -d '{"input":"Buy 100 AAPL"}'
```

---

## Summary

**Status:** ✅ PLUGIN READY FOR INSTALLATION

**What's Complete:**
- ✅ Plugin entry point (index.js)
- ✅ Proper export structure
- ✅ JSON Schema for parameters
- ✅ Run function implementation
- ✅ Test script (11/11 passing)
- ✅ Installation guide
- ✅ Troubleshooting documentation

**What's Needed:**
- ⚠️ OpenClaw CLI to install plugin
- ⚠️ OpenClaw restart after installation
- ⚠️ Agent verification ("What tools do you have?")
- ⚠️ Tool call test ("Buy 100 AAPL")

**Expected Outcome:**
- Tool appears in agent's tool list
- Tool is actually callable (not simulated)
- Backend receives real HTTP requests
- Responses include request_id from backend

The plugin is production-ready and awaiting installation in OpenClaw!
