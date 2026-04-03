/**
 * Slow Backend Endpoint for Timeout Testing
 * 
 * This creates a temporary endpoint that delays 5 seconds
 * to test the 3-second timeout in the OpenClaw skill
 * 
 * Run: node backend/test-slow-endpoint.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // Different port to avoid conflict

app.use(cors());
app.use(express.json());

// Slow endpoint that takes 5 seconds to respond
app.post('/api/process', async (req, res) => {
  console.log('Received request, delaying 5 seconds...');
  
  // Wait 5 seconds (longer than 3-second timeout)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Sending response after 5 seconds');
  res.json({
    request_id: 'test-timeout-id',
    decision: 'ALLOW',
    final_status: 'allowed',
    execution_status: 'success',
    matched_rule: 'TEST_RULE',
    reason: 'This response should never be received due to timeout'
  });
});

app.listen(PORT, () => {
  console.log(`Slow test server running on port ${PORT}`);
  console.log('This endpoint delays 5 seconds to test timeout');
  console.log();
  console.log('To test:');
  console.log('1. Update process_request.js to use http://localhost:5001/api/process');
  console.log('2. Run: node openclaw-skill/test-timeout.js');
  console.log('3. Should timeout after 3 seconds');
});
