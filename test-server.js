// Simple test to verify the HTTP server works
const http = require('http');

// Set environment variables
process.env.MCP_HTTP_MODE = 'true';
process.env.PORT = '3001';
process.env.PERFEX_API_URL = 'https://dummy.com/api';
process.env.PERFEX_API_KEY = 'dummy-key';

// Import and run the server
const server = require('./build/index.js');

// Wait a bit then test
setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
    res.on('end', () => {
      console.log('✅ Server is working!');
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  });

  req.end();
}, 2000);