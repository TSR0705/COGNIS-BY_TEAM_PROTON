# COGNIS PROTON - Architecture Documentation

## System Overview

COGNIS PROTON implements a five-stage enforcement pipeline that validates AI agent actions before execution.

## Pipeline Stages

### 1. Intent Extraction
**Module**: `backend/src/intent/extractIntent.js`

Converts natural language input into structured intent contracts.

**Responsibilities**:
- Parse user input
- Detect intent type (trade, analysis, monitor)
- Extract assets (stock tickers)
- Parse amounts (supports k/m suffixes)
- Detect prompt injection patterns
- Identify ambiguous intents
- Load configuration from `security-patterns.json`

**Output**:
```javascript
{
  intent_id: "uuid",
  intent_type: "trade",
  status: "valid" | "ambiguous" | "unsafe",
  scope: ["AAPL"],
  allowed_actions: ["trade"],
  constraints: {
    max_trade_amount: 100,
    allowed_assets: ["AAPL"]
  },
  signals: {
    prompt_injection: false,
    ambiguity: false
  }
}
```

### 2. Policy Generation
**Module**: `backend/src/policy/generatePolicy.js`

Generates declarative policies from intent contracts.

**Responsibilities**:
- Load rules from `policy-rules.json`
- Build policy with priorities
- Apply deny-overrides strategy
- Filter rules based on intent

**Output**:
```javascript
{
  policy_id: "uuid",
  intent_id: "uuid",
  evaluation: {
    strategy: "deny-overrides",
    default: "deny"
  },
  rules: [
    {
      id: "DENY_IF_INTENT_INVALID",
      priority: 1,
      effect: "deny",
      conditions: [...]
    }
  ]
}
```

### 3. Enforcement Engine
**Module**: `backend/src/enforcement/enforce.js`

Evaluates policies against proposed actions.

**Responsibilities**:
- Evaluate rules in priority order
- Check conditions using operators
- Return ALLOW or BLOCK decision
- Generate full trace

**Supported Operators**:
- `==`: Equality
- `<=`: Less than or equal
- `>=`: Greater than or equal
- `in`: Value in array
- `includes`: Array includes value
- `not_includes`: Array does not include value

**Output**:
```javascript
{
  decision: "ALLOW" | "BLOCK",
  matched_rule: "ALLOW_TRADE_WITH_LIMIT",
  reason: "Allow trade within asset and amount constraints",
  trace: [...]
}
```

### 4. Execution Layer
**Module**: `backend/src/execution/executeTrade.js`

Executes approved actions via Alpaca API.

**Responsibilities**:
- Validate enforcement decision
- Check market clock
- Validate buying power
- Fetch current price
- Place order via Alpaca SDK
- Handle errors gracefully

**Output**:
```javascript
{
  status: "success" | "failed" | "blocked",
  order_id: "alpaca-order-id",
  message: "Order submitted successfully"
}
```

### 5. Audit Logging
**Module**: `backend/src/logs/saveLog.js`

Records complete decision trace to MongoDB.

**Responsibilities**:
- Store request metadata
- Log intent, policy, enforcement, execution
- Record timing metrics
- Enable traceability

## Configuration System

### Configuration Files

**`backend/config/constraints.json`**
- System limits (max_trade_amount: 1000)
- Market constraints
- Rate limits

**`backend/config/stock-mappings.json`**
- Stock name to ticker mappings (50+ stocks)
- Allowed/blocked tickers
- Ticker regex patterns

**`backend/config/security-patterns.json`**
- Prompt injection patterns (20+)
- Question patterns
- Intent keywords
- Amount parsing patterns

**`backend/config/policy-rules.json`**
- Declarative policy rules
- Priority-based evaluation
- Deny-overrides strategy

### Configuration Loader
**Module**: `backend/src/config/configLoader.js`

Centralized configuration management with caching.

## Security Model

### Fail-Closed Design
- Default policy: DENY
- Actions must be explicitly allowed
- Unknown intents are blocked
- Missing rules result in block

### Prompt Injection Detection
- 20+ malicious patterns
- Regex-based detection
- Marks intent as "unsafe"
- High-priority deny rule blocks execution

### Enforcement Before Execution
- Enforcement runs before execution layer
- Execution only proceeds if ALLOW
- No bypass possible
- Separation ensures security

## Data Flow

```
User Input
    ↓
Intent Extraction (parse, detect, validate)
    ↓
Policy Generation (load rules, build policy)
    ↓
Enforcement Engine (evaluate, decide)
    ↓
    ├─ ALLOW → Execution Layer → Alpaca API
    └─ BLOCK → Reject
    ↓
Audit Logging (MongoDB)
    ↓
Response (frontend visualization)
```

## API Layer

### POST /api/process
**Module**: `backend/src/routes/process.js`

Main enforcement endpoint.

**Flow**:
1. Validate input
2. Extract intent
3. Generate policy
4. Enforce policy
5. Execute if allowed
6. Log decision
7. Return response

## Frontend Architecture

### Next.js Application
**Module**: `frontend/app/page.js`

Professional UI with pipeline visualization.

**Features**:
- Real-time decision display
- Color-coded results (green=ALLOW, red=BLOCK)
- Pipeline flow visualization
- Example commands
- Mobile responsive

## OpenClaw Integration

### Custom Skill
**Module**: `openclaw-skill/process_request.js`

Bridges OpenClaw agents to enforcement backend.

**Flow**:
1. Agent invokes skill
2. Skill validates input
3. Skill calls backend API
4. Skill returns enforcement decision

## Deployment Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port 3000     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend       │
│   (Express)     │
│   Port 5000     │
└────┬───────┬────┘
     │       │
     │       └──────────┐
     ▼                  ▼
┌─────────┐      ┌──────────────┐
│ MongoDB │      │  Alpaca API  │
│ Port    │      │  (External)  │
│ 27017   │      └──────────────┘
└─────────┘
```

## Performance Characteristics

- API Response Time: < 50ms (health check)
- Pipeline Processing: 500-1500ms (full enforcement)
- Configuration Loading: < 10ms (cached)
- MongoDB Write: 50-100ms

## Scalability Considerations

### Current Limitations
- Single server instance
- No load balancing
- Local MongoDB
- Synchronous processing

### Future Improvements
- Horizontal scaling
- Redis caching
- Async processing
- Distributed logging
