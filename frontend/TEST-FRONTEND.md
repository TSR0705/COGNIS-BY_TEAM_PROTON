# Frontend Test Guide

## Setup Complete ✅

The minimal Next.js frontend is ready and running.

---

## What Was Created

**File:** `app/page.js`

**Features:**
- ✅ One input field
- ✅ One button
- ✅ POST request to backend
- ✅ Console logging
- ✅ State management for response

---

## How to Test

### 1. Start Backend
```bash
cd backend
node src/app.js
```
**Expected:** Server running on port 5000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
**Expected:** Frontend running on port 3001

### 3. Open Browser
```
http://localhost:3001
```

### 4. Test the Flow

**Input examples:**
- "Buy 100 shares of AAPL"
- "Sell 50 TSLA"
- "Analyze NVDA"

**Click Submit**

**Check:**
1. Browser console (F12) - Full response logged
2. Backend terminal - Request received
3. Response stored in state (for future use)

---

## Expected Response Format

```json
{
  "request_id": "uuid",
  "final_status": "allowed|blocked|failed",
  "decision": "ALLOW|BLOCK",
  "matched_rule": "rule_name",
  "reason": "explanation",
  "execution_status": "success|failed|blocked",
  "timing": { "total_ms": 123 },
  "intent": { ... },
  "action": { ... },
  "enforcement": { ... },
  "execution": { ... }
}
```

---

## Code Structure

```javascript
'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
        }),
      });

      const data = await res.json();
      console.log('Response:', data);  // Full response in console
      setResponse(data);                // Stored in state
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main>
      <h1>COGNIS PROTON</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your input"
      />
      <button onClick={handleSubmit}>Submit</button>
    </main>
  );
}
```

---

## Troubleshooting

### Issue: CORS Error

**Symptom:** Browser console shows CORS error

**Solution:** Backend already has CORS enabled in `app.js`:
```javascript
app.use(cors());
```

### Issue: Connection Refused

**Symptom:** `fetch failed` error

**Solution:** Make sure backend is running on port 5000:
```bash
cd backend
node src/app.js
```

### Issue: Port 3000 in use

**Solution:** Next.js automatically uses port 3001 (already configured)

---

## Next Steps (Future Enhancement)

The response is stored in state, so you can easily add:
- Display response on page
- Show decision status
- Display matched rule
- Show execution result
- Add error handling UI

**Example:**
```javascript
{response && (
  <div>
    <p>Decision: {response.decision}</p>
    <p>Status: {response.final_status}</p>
    <p>Reason: {response.reason}</p>
  </div>
)}
```

---

## Summary

✅ Minimal Next.js frontend created
✅ Single page with input + button
✅ POST request to backend API
✅ Full response logged to console
✅ Response stored in state
✅ No styling, no complexity
✅ Everything in one file

**Ready for demo!**

