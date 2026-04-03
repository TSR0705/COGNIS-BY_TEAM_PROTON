const mongoose = require('mongoose');

/**
 * Log Schema for MongoDB
 * Stores complete request lifecycle data
 */
const logSchema = new mongoose.Schema({
  // Request identification
  request_id: {
    type: String,
    required: true,
    index: true
  },
  
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  source: {
    type: String,
    default: 'api'
  },
  
  event_type: {
    type: String,
    default: 'REQUEST_PROCESSED'
  },
  
  severity: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR'],
    required: true
  },
  
  final_status: {
    type: String,
    enum: ['allowed', 'blocked', 'failed'],
    required: true,
    index: true
  },
  
  matched_rule: {
    type: String,
    index: true
  },
  
  // Input data
  input: {
    raw_input: String
  },
  
  // Intent extraction result
  intent: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Policy generation result
  policy: {
    policy_id: String,
    rules_count: Number
  },
  
  // Action request
  action: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Enforcement decision
  enforcement: {
    decision: String,
    matched_rule: String,
    reason: String,
    trace: [mongoose.Schema.Types.Mixed]
  },
  
  // Execution result
  execution: {
    status: String,
    order_id: String,
    error_type: String,
    error: String
  },
  
  // Performance metrics
  timing: {
    total_ms: Number
  },
  
  // Agent data (OpenClaw)
  agent: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'logs'
});

// Indexes for common queries
logSchema.index({ final_status: 1, timestamp: -1 });
logSchema.index({ severity: 1, timestamp: -1 });
logSchema.index({ 'enforcement.decision': 1 });

module.exports = mongoose.model('Log', logSchema);
