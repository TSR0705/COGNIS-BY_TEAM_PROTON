const fs = require('fs');
const path = require('path');

/**
 * Configuration Loader
 * Loads all configuration files from config directory
 */
class ConfigLoader {
  constructor() {
    this.configDir = path.join(__dirname, '../../config');
    this.cache = {};
  }

  /**
   * Load a configuration file
   * @param {string} filename - Name of config file (without .json)
   * @returns {Object} Parsed configuration
   */
  load(filename) {
    // Check cache first
    if (this.cache[filename]) {
      return this.cache[filename];
    }

    try {
      const filePath = path.join(this.configDir, `${filename}.json`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(fileContent);
      
      // Cache the configuration
      this.cache[filename] = config;
      
      return config;
    } catch (error) {
      console.error(`Failed to load config file: ${filename}.json`, error.message);
      throw new Error(`Configuration file ${filename}.json not found or invalid`);
    }
  }

  /**
   * Get system constraints
   */
  getConstraints() {
    return this.load('constraints');
  }

  /**
   * Get stock mappings
   */
  getStockMappings() {
    return this.load('stock-mappings');
  }

  /**
   * Get security patterns
   */
  getSecurityPatterns() {
    return this.load('security-patterns');
  }

  /**
   * Get policy rules
   */
  getPolicyRules() {
    return this.load('policy-rules');
  }

  /**
   * Reload all configurations (clear cache)
   */
  reload() {
    this.cache = {};
  }

  /**
   * Get a specific value from config
   * @param {string} configFile - Config file name
   * @param {string} path - Dot-notation path (e.g., 'system.max_trade_amount')
   * @returns {*} Configuration value
   */
  get(configFile, path) {
    const config = this.load(configFile);
    const parts = path.split('.');
    let current = config;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }
}

// Export singleton instance
module.exports = new ConfigLoader();
