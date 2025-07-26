#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting AI Local Embedded Assistant...\n');

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check if required packages are installed
const requiredPackages = [
  '@xenova/transformers',
  '@tensorflow/tfjs',
  '@tensorflow/tfjs-backend-webgl',
  '@tensorflow/tfjs-backend-cpu'
];

console.log('🔍 Checking required packages...');
let missingPackages = [];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
  } catch (error) {
    missingPackages.push(pkg);
  }
}

if (missingPackages.length > 0) {
  console.log(`📦 Installing missing packages: ${missingPackages.join(', ')}`);
  try {
    execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Missing packages installed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to install missing packages:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ All required packages are installed!\n');
}

// Set environment variables for better stability
process.env.NODE_ENV = 'development';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Start the development server
console.log('🎯 Starting development server...\n');

const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devProcess.on('error', (error) => {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`\n👋 Development server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  devProcess.kill('SIGTERM');
}); 