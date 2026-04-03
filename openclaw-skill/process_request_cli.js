#!/usr/bin/env node

/**
 * CLI Wrapper for process_request
 * 
 * This script wraps the process_request function to make it callable
 * from the command line, enabling OpenClaw AgentSkill integration.
 * 
 * Usage:
 *   echo '{"user_input":"Buy AAPL 100","proposed_action":{"type":"trade","asset":"AAPL","amount":100}}' | node process_request_cli.js
 */

const { process_request } = require('./process_request');

async function main() {
  try {
    let inputData = '';
    
    // Read JSON input from stdin
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      inputData += chunk;
    });
    
    process.stdin.on('end', async () => {
      try {
        // Parse input JSON
        const parsed = JSON.parse(inputData);
        
        // Validate required fields
        if (!parsed.user_input || !parsed.proposed_action) {
          console.log(JSON.stringify({
            status: "failed",
            error: "Missing required fields: user_input and proposed_action"
          }));
          process.exit(1);
        }
        
        // Call the process_request function
        const result = await process_request(parsed);
        
        // Output result as JSON
        console.log(JSON.stringify(result));
        process.exit(0);
        
      } catch (parseError) {
        console.log(JSON.stringify({
          status: "failed",
          error: "Invalid JSON input: " + parseError.message
        }));
        process.exit(1);
      }
    });
    
    process.stdin.on('error', (err) => {
      console.log(JSON.stringify({
        status: "failed",
        error: "Input error: " + err.message
      }));
      process.exit(1);
    });
    
  } catch (err) {
    console.log(JSON.stringify({
      status: "failed",
      error: err.message
    }));
    process.exit(1);
  }
}

// Run main function
main();
