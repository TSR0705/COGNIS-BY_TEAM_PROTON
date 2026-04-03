# OpenClaw Skill: process_request

Integration layer between OpenClaw agent and COGNIS backend enforcement system.

---

## Quick Start

### 1. Verify Connection
```bash
node verify-openclaw-connection.js
```

### 2. Test CLI Wrapper
```bash
node test-cli.js
```

### 3. Test with OpenClaw Agent
See [docs/TEST-OPENCLAW-AGENT.md](./docs/TEST-OPENCLAW-AGENT.md)

---

## Files

### Core Implementation
- `process_request.js` - Core function (backend integration)
- `process_request_cli.js` - CLI wrapper (OpenClaw interface)

### Testing
- `verify-openclaw-connection.js` - Automated verification
- `test-cli.js` - CLI wrapper tests
- `test-*.js` - Various integration tests

### Legacy Files (deprecated)
- `index.js` - Old plugin approach
- `register-tool.js` - Old registration approach
- `trade_stock.js` - Old implementation

---

## Documentation

All documentation is in the [docs/](./docs/) folder:

- **[docs/HOW-TO-VERIFY-OPENCLAW-CONNECTION.md](./docs/HOW-TO-VERIFY-OPENCLAW-CONNECTION.md)** - Start here
- **[docs/AGENTSKILL-INSTALLATION.md](./docs/AGENTSKILL-INSTALLATION.md)** - Installation guide
- **[docs/TEST-OPENCLAW-AGENT.md](./docs/TEST-OPENCLAW-AGENT.md)** - Testing guide
- **[docs/README.md](./docs/README.md)** - Full documentation index

---

## Architecture

```
OpenClaw Agent
    ↓
SKILL.md (defines tool)
    ↓
process_request_cli.js (CLI wrapper)
    ↓
process_request.js (core function)
    ↓
Backend API (http://localhost:5000/api/process)
```

---

## Status

✅ CLI wrapper working
✅ Core function working
✅ Backend integration working
⚠️ OpenClaw skill registration pending verification

---

## Requirements

- Node.js v14+
- Backend running on port 5000
- MongoDB connected
- OpenClaw installed and running

---

## Support

See [docs/](./docs/) folder for detailed documentation and troubleshooting.
