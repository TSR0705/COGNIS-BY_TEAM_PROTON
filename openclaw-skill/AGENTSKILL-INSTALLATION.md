# OpenClaw AgentSkill Installation Guide

## Overview

This guide explains how to install the `process_request` tool as an OpenClaw AgentSkill.

---

## Files Created

1. **process_request_cli.js** - CLI wrapper that reads JSON from stdin
2. **.openclaw/workspace/process_request/SKILL.md** - AgentSkill definition
3. **test-cli.js** - Test suite for CLI wrapper

---

## Installation Steps

### Step 1: Verify CLI Wrapper Works

```bash
cd openclaw-skill
node test-cli.js
```

**Expected Output:**
```
CLI Wrapper Test Suite
======================================================================
Testing: Valid Trade Request
✓ request_id: ...
✓ decision: ALLOW
✓ final_status: failed
✓ TEST PASSED

Testing: Blocked Trade (Analysis)
✓ request_id: ...
✓ decision: BLOCK
✓ final_status: blocked
✓ TEST PASSED

Testing: Invalid Input (Missing Fields)
✓ status: failed
✓ error: Missing required fields...
✓ TEST PASSED

TEST SUMMARY
Total: 3
Passed: 3
Failed: 0
Success Rate: 100.0%
```

### Step 2: Verify SKILL.md Location

The SKILL.md file should be at:
```
.openclaw/workspace/process_request/SKILL.md
```

**Check:**
```bash
ls .openclaw/workspace/process_request/SKILL.md
```

### Step 3: Restart OpenClaw

**IMPORTANT:** OpenClaw must be restarted to load the new skill.

```bash
# If running as gateway
openclaw gateway stop
openclaw gateway start

# Or restart the service
openclaw restart
```

### Step 4: Verify Skill is Loaded

Ask the OpenClaw agent:
```
"What tools do you have?"
```

**Expected Response:**
The agent should list `process_request` among available tools.

**NOT Expected:**
- Tool not mentioned
- Tool described as "hypothetical"
- Generic response without tool names

### Step 5: Test Skill Execution

Ask the OpenClaw agent:
```
"Buy 100 shares of AAPL"
```

**Expected Behavior:**
1. Agent recognizes this as a trade request
2. Agent calls `process_request` tool
3. CLI wrapper executes
4. Backend receives HTTP request
5. Agent receives response with `request_id`
6. Agent informs you of the result

**Expected Response:**
```
I've processed your trade request.
Request ID: 22779318-c6d4-4c72-ae7f-90ac64e898f4
Decision: ALLOW
Status: The trade was approved but execution failed due to API configuration.
```

**NOT Expected:**
- Agent prints raw JSON
- Agent says "I would call process_request..."
- No backend request in logs
- No `request_id` in response

---

## Manual Testing

### Test CLI Directly

```bash
cd openclaw-skill

# Test valid trade
echo '{"user_input":"Buy 100 AAPL","proposed_action":{"type":"trade","asset":"AAPL","amount":100}}' | node process_request_cli.js

# Expected output (JSON):
# {"request_id":"...","decision":"ALLOW",...}
```

### Test with Different Inputs

```bash
# Blocked trade (analysis intent)
echo '{"user_input":"Analyze NVDA","proposed_action":{"type":"trade","asset":"NVDA","amount":100}}' | node process_request_cli.js

# Invalid input
echo '{"user_input":"Buy AAPL"}' | node process_request_cli.js
```

---

## Troubleshooting

### Issue 1: Skill Not Listed

**Symptoms:**
- Agent doesn't mention `process_request`
- `openclaw skills list` doesn't show it

**Solutions:**

1. **Check SKILL.md location:**
   ```bash
   ls .openclaw/workspace/process_request/SKILL.md
   ```

2. **Verify SKILL.md format:**
   - Must have `# process_request` header
   - Must have `## Description` section
   - Must have `## Command` section

3. **Check OpenClaw workspace:**
   ```bash
   openclaw config get agents.defaults.workspace
   ```

4. **Restart OpenClaw:**
   ```bash
   openclaw restart
   ```

### Issue 2: CLI Wrapper Fails

**Symptoms:**
- Error when running `node process_request_cli.js`
- "Cannot find module" errors

**Solutions:**

1. **Install dependencies:**
   ```bash
   cd openclaw-skill
   npm install
   ```

2. **Test CLI directly:**
   ```bash
   node test-cli.js
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   # Should be v14 or higher
   ```

### Issue 3: Backend Connection Failed

**Symptoms:**
- CLI returns "Backend unavailable"
- Tool executes but fails

**Solutions:**

1. **Start backend:**
   ```bash
   cd backend
   node src/app.js
   ```

2. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check backend logs:**
   ```bash
   # Look for incoming requests
   ```

### Issue 4: Skill Executes But Agent Doesn't Understand Output

**Symptoms:**
- Tool runs successfully
- Agent doesn't interpret the result correctly

**Solutions:**

1. **Verify JSON output:**
   ```bash
   echo '{"user_input":"Buy AAPL 100","proposed_action":{"type":"trade","asset":"AAPL","amount":100}}' | node openclaw-skill/process_request_cli.js | jq
   ```

2. **Check output format matches SKILL.md:**
   - Output should be valid JSON
   - Should include `request_id`, `decision`, `final_status`

---

## SKILL.md Format

The SKILL.md file follows OpenClaw's AgentSkills specification:

```markdown
# tool_name

## Description
What the tool does

## Usage
When to use this tool

## Input Schema
JSON schema for input

## Output Schema
JSON schema for output

## Command
Command to execute (with full path)

## Examples
Example inputs and outputs
```

---

## Command Path

The command in SKILL.md uses an absolute path:

```bash
node C:/Users/ACER/OneDrive/Desktop/COGNIS_PROTON/COGNIS_PROTON/openclaw-skill/process_request_cli.js
```

**If you move the project:**
1. Update the path in `.openclaw/workspace/process_request/SKILL.md`
2. Restart OpenClaw

**Alternative (relative path):**
If OpenClaw supports relative paths, you can use:
```bash
node ./openclaw-skill/process_request_cli.js
```

---

## Verification Checklist

Before considering the skill installed:

- [ ] CLI wrapper works (`node test-cli.js` passes)
- [ ] SKILL.md exists at `.openclaw/workspace/process_request/SKILL.md`
- [ ] SKILL.md has correct command path
- [ ] Backend is running (`node backend/src/app.js`)
- [ ] OpenClaw restarted
- [ ] Skill appears in `openclaw skills list`
- [ ] Agent mentions skill when asked "What tools do you have?"
- [ ] Agent can execute skill (not just describe it)
- [ ] Backend receives requests when skill is called
- [ ] Response includes `request_id` from backend

---

## Testing Commands

```bash
# Test CLI wrapper
cd openclaw-skill
node test-cli.js

# Test direct CLI call
echo '{"user_input":"Buy AAPL 100","proposed_action":{"type":"trade","asset":"AAPL","amount":100}}' | node process_request_cli.js

# Check SKILL.md exists
ls .openclaw/workspace/process_request/SKILL.md

# List OpenClaw skills
openclaw skills list

# Restart OpenClaw
openclaw restart

# Check backend health
curl http://localhost:5000/health
```

---

## Expected Workflow

1. **User:** "Buy 100 shares of Apple"
2. **Agent:** Recognizes trade intent
3. **Agent:** Calls `process_request` skill
4. **OpenClaw:** Executes CLI command
5. **CLI:** Reads JSON from stdin
6. **CLI:** Calls `process_request()` function
7. **Function:** Makes HTTP POST to backend
8. **Backend:** Processes request (intent → policy → enforcement → execution)
9. **Backend:** Returns JSON response
10. **CLI:** Outputs JSON to stdout
11. **OpenClaw:** Parses JSON response
12. **Agent:** Interprets result
13. **Agent:** Responds to user with outcome

---

## Summary

**Installation Status:** ✅ Complete

**Files:**
- ✅ `process_request_cli.js` - CLI wrapper
- ✅ `.openclaw/workspace/process_request/SKILL.md` - Skill definition
- ✅ `test-cli.js` - Test suite

**Tests:**
- ✅ CLI wrapper: 3/3 passing
- ✅ Valid trade: Works
- ✅ Blocked trade: Works
- ✅ Invalid input: Handled correctly

**Next Steps:**
1. Restart OpenClaw
2. Verify skill is listed
3. Test with agent: "Buy 100 AAPL"
4. Check backend logs for requests

The AgentSkill is ready for OpenClaw integration!
