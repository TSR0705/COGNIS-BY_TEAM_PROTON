/**
 * OpenClaw Custom Skill: Process Request
 * 
 * Purpose: Secure bridge between OpenClaw agent and COGNIS backend
 * Architecture: Agent → This Skill → Backend /process → Response
 * 
 * Security Model:
 * - NO local execution
 * - Backend is single source of truth
 * - All decisions made by backend enforcement engine
 */

const axios = require('axios');
const { validateInput } = require('../backend/src/enforcement/armorclaw-pre-validation');

/**
 * Process user request through COGNIS backend
 * @param {Object} input - Skill input from OpenClaw agent
 * @param {string} input.user_input - Raw user input text
 * @param {string} input.agent_reasoning - Agent's reasoning/analysis
 * @param {Object} input.proposed_action - Action agent wants to execute
 * @returns {Object} Backend decision and execution result
 */
async function process_request(input) {
  try {
    // STAGE 0: ARMORCLAW PRE-VALIDATION (LAYER 1)
    const validation = validateInput(input?.user_input);
    if (!validation.safe) {
      return {
        status: "failed",
        error: "ARMORCLAW_BLOCK: Malicious intent detected",
        decision: "BLOCK",
        reason: validation.reason
      };
    }

    // STEP 1: VALIDATION
    if (!input || 
        typeof input.user_input !== 'string' || 
        !input.proposed_action) {
      return {
        status: "failed",
        error: "Invalid skill input"
      };
    }

    const user_input = input.user_input;
    const agent_reasoning = input.agent_reasoning || "";
    const proposed_action = input.proposed_action;

    // FIX 1: VALIDATE proposed_action STRUCTURE
    if (typeof proposed_action !== 'object' || 
        typeof proposed_action.type !== 'string') {
      return {
        status: "failed",
        error: "Invalid action format"
      };
    }

    // STEP 2: CALL BACKEND
    const response = await axios.post(
      'http://localhost:5000/api/process',
      {
        input: user_input,
        action: proposed_action,
        source: "openclaw",
        agent: {
          reasoning: agent_reasoning,
          proposed_action: proposed_action
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 3000,
        validateStatus: () => true  // Accept all HTTP status codes
      }
    );

    const data = response.data;

    // STEP 3: RETURN CLEAN RESPONSE
    return {
      request_id: data.request_id,
      decision: data.decision || "UNKNOWN",
      final_status: data.final_status || "failed",
      execution_status: data.execution_status || "unknown",
      matched_rule: data.matched_rule || null,
      reason: data.reason || "No reason provided"
    };

  } catch (error) {
    return {
      status: "failed",
      error: error.response?.data || error.message || "Backend unavailable"
    };
  }
}

module.exports = { process_request };
