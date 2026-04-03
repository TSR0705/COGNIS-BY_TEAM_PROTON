/**
 * COGNIS PROTON - Complete System Check
 * Verifies all components and configurations
 */

const fs = require('fs');
const path = require('path');

// Load .env manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        // Skip empty lines and comments
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        // Split on first = only
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          const value = line.substring(equalIndex + 1).trim();
          process.env[key] = value;
        }
      });
    }
  } catch (error) {
    console.log('Warning: Could not load .env file');
  }
}

loadEnv();

console.log('='.repeat(80));
console.log('COGNIS PROTON - SYSTEM CHECK');
console.log('='.repeat(80));
console.log();

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

function check(name, condition, errorMsg = '', warningOnly = false) {
  totalChecks++;
  if (condition) {
    console.log(`✓ ${name}`);
    passedChecks++;
    return true;
  } else {
    if (warningOnly) {
      console.log(`⚠ ${name}`);
      if (errorMsg) console.log(`  ${errorMsg}`);
      warnings++;
    } else {
      console.log(`✗ ${name}`);
      if (errorMsg) console.log(`  ${errorMsg}`);
      failedChecks++;
    }
    return false;
  }
}

function section(title) {
  console.log();
  console.log('-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80));
}

// ============================================================================
// 1. PROJECT STRUCTURE
// ============================================================================
section('1. PROJECT STRUCTURE');

check('Root directory exists', fs.existsSync('.'));
check('Backend directory exists', fs.existsSync('./backend'));
check('Frontend directory exists', fs.existsSync('./frontend'));
check('OpenClaw skill directory exists', fs.existsSync('./openclaw-skill'));

// ============================================================================
// 2. BACKEND FILES
// ============================================================================
section('2. BACKEND CORE FILES');

const backendFiles = [
  'backend/src/app.js',
  'backend/src/intent/extractIntent.js',
  'backend/src/policy/generatePolicy.js',
  'backend/src/enforcement/enforce.js',
  'backend/src/execution/executeTrade.js',
  'backend/src/logs/saveLog.js',
  'backend/src/models/Log.js',
  'backend/src/routes/process.js',
  'backend/package.json',
  'backend/.env'
];

backendFiles.forEach(file => {
  check(`${file}`, fs.existsSync(file));
});

// ============================================================================
// 3. FRONTEND FILES
// ============================================================================
section('3. FRONTEND FILES');

const frontendFiles = [
  'frontend/app/page.js',
  'frontend/app/layout.js',
  'frontend/package.json'
];

frontendFiles.forEach(file => {
  check(`${file}`, fs.existsSync(file));
});

// ============================================================================
// 4. OPENCLAW INTEGRATION
// ============================================================================
section('4. OPENCLAW INTEGRATION');

const openclawFiles = [
  'openclaw-skill/process_request.js',
  'openclaw-skill/process_request_cli.js',
  '.openclaw/workspace/process_request/SKILL.md',
  'openclaw-skill/package.json'
];

openclawFiles.forEach(file => {
  check(`${file}`, fs.existsSync(file));
});

// ============================================================================
// 5. ENVIRONMENT VARIABLES
// ============================================================================
section('5. ENVIRONMENT VARIABLES');

check('PORT configured', !!process.env.PORT, 'Set PORT in .env');
check('MONGO_URI configured', !!process.env.MONGO_URI, 'Set MONGO_URI in .env');
check('ALPACA_API_KEY configured', !!process.env.ALPACA_API_KEY, 'Set ALPACA_API_KEY in .env');
check('ALPACA_SECRET_KEY configured', !!process.env.ALPACA_SECRET_KEY, 'Set ALPACA_SECRET_KEY in .env');
check('ALPACA_ENDPOINT configured', !!process.env.ALPACA_ENDPOINT, 'Set ALPACA_ENDPOINT in .env');
check('OPENROUTER_API_KEY configured', !!process.env.OPENROUTER_API_KEY, 'Set OPENROUTER_API_KEY in .env', true);

// Check MongoDB URI format
if (process.env.MONGO_URI) {
  const isAtlas = process.env.MONGO_URI.includes('mongodb+srv://');
  const hasLocalhost = process.env.MONGO_URI.includes('localhost') || process.env.MONGO_URI.includes('127.0.0.1');
  
  check('MongoDB Atlas URI (not localhost)', isAtlas && !hasLocalhost, 
    'Using localhost instead of MongoDB Atlas');
  
  const hasDatabase = process.env.MONGO_URI.includes('/cognis') || process.env.MONGO_URI.includes('?');
  check('MongoDB URI includes database name', hasDatabase, 
    'Add database name to URI: .../cognis?retryWrites=true', true);
}

// ============================================================================
// 6. DEPENDENCIES
// ============================================================================
section('6. BACKEND DEPENDENCIES');

try {
  const backendPkg = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'cors', 'dotenv', 'axios', 'uuid'];
  
  requiredDeps.forEach(dep => {
    check(`${dep} installed`, 
      backendPkg.dependencies && backendPkg.dependencies[dep],
      `Run: cd backend && npm install ${dep}`);
  });
} catch (error) {
  check('Backend package.json readable', false, error.message);
}

section('7. FRONTEND DEPENDENCIES');

try {
  const frontendPkg = JSON.parse(fs.readFileSync('./frontend/package.json', 'utf8'));
  const requiredDeps = ['next', 'react', 'react-dom'];
  
  requiredDeps.forEach(dep => {
    check(`${dep} installed`, 
      frontendPkg.dependencies && frontendPkg.dependencies[dep],
      `Run: cd frontend && npm install ${dep}`);
  });
} catch (error) {
  check('Frontend package.json readable', false, error.message);
}

// ============================================================================
// 8. CODE VALIDATION
// ============================================================================
section('8. CODE VALIDATION');

// Check for localhost references in code
const filesToCheck = [
  'backend/src/app.js',
  'backend/test-mongodb-storage.js',
  'backend/hackathon-demo.js'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasLocalhost = content.includes('localhost:27017');
    check(`${file} - No localhost MongoDB`, !hasLocalhost, 
      'Found localhost:27017 reference - should use MONGO_URI');
  }
});

// ============================================================================
// 9. DOCUMENTATION
// ============================================================================
section('9. DOCUMENTATION');

const docs = [
  'README.md',
  'FRONTEND-TEST-GUIDE.md',
  'MONGODB-ATLAS-SETUP.md',
  'openclaw-skill/docs/README.md'
];

docs.forEach(doc => {
  check(`${doc}`, fs.existsSync(doc), '', true);
});

// ============================================================================
// 10. GIT STATUS
// ============================================================================
section('10. GIT REPOSITORY');

check('.git directory exists', fs.existsSync('.git'));
check('.gitignore exists', fs.existsSync('.gitignore'));

// Check if .env is in .gitignore
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  check('.env in .gitignore', gitignore.includes('.env'), 
    'Add .env to .gitignore to protect secrets');
}

// ============================================================================
// 11. MODULE TESTS
// ============================================================================
section('11. TEST FILES');

const testFiles = [
  'backend/test-mongodb-storage.js',
  'backend/test-mongo-connection.js',
  'backend/hackathon-demo.js',
  'openclaw-skill/test-cli.js'
];

testFiles.forEach(file => {
  check(`${file}`, fs.existsSync(file), '', true);
});

// ============================================================================
// 12. CONFIGURATION SUMMARY
// ============================================================================
section('12. CONFIGURATION SUMMARY');

console.log();
console.log('Environment:');
console.log(`  PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`  MONGO_URI: ${process.env.MONGO_URI ? '✓ SET (Atlas)' : '✗ NOT SET'}`);
console.log(`  ALPACA_API_KEY: ${process.env.ALPACA_API_KEY ? '✓ SET' : '✗ NOT SET'}`);
console.log(`  ALPACA_SECRET_KEY: ${process.env.ALPACA_SECRET_KEY ? '✓ SET' : '✗ NOT SET'}`);
console.log(`  ALPACA_ENDPOINT: ${process.env.ALPACA_ENDPOINT || 'NOT SET'}`);
console.log(`  OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ SET' : '✗ NOT SET'}`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log();
console.log('='.repeat(80));
console.log('SYSTEM CHECK SUMMARY');
console.log('='.repeat(80));
console.log();
console.log(`Total Checks: ${totalChecks}`);
console.log(`✓ Passed: ${passedChecks}`);
console.log(`✗ Failed: ${failedChecks}`);
console.log(`⚠ Warnings: ${warnings}`);
console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
console.log();

if (failedChecks === 0) {
  console.log('✓ ALL CRITICAL CHECKS PASSED');
  console.log();
  console.log('Your system is ready! Next steps:');
  console.log('1. Fix MongoDB Atlas connection (IP whitelist)');
  console.log('2. Start backend: cd backend && node src/app.js');
  console.log('3. Start frontend: cd frontend && npm run dev');
  console.log('4. Test: http://localhost:3001');
} else {
  console.log('✗ SOME CHECKS FAILED');
  console.log();
  console.log('Please fix the failed checks above before proceeding.');
}

if (warnings > 0) {
  console.log();
  console.log(`⚠ ${warnings} warnings found - review recommended but not critical`);
}

console.log();
console.log('='.repeat(80));

process.exit(failedChecks > 0 ? 1 : 0);
