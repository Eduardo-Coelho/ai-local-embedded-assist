#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

console.log('🚀 AI Model Downloader\n');

// Model configurations
const models = [
  {
    name: 'DeepSeek Coder 1.3B Base',
    id: 'deepseek-ai/deepseek-coder-1.3b-base',
    files: [
      'config.json',
      'tokenizer.json',
      'tokenizer_config.json',
      'special_tokens_map.json',
      'generation_config.json'
    ],
    baseUrl: 'https://huggingface.co/deepseek-ai/deepseek-coder-1.3b-base/resolve/main'
  }
];

// Create models directory
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('📁 Created models directory');
}

// Helper function to resolve relative URLs
function resolveUrl(baseUrl, relativeUrl) {
  try {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    const base = new URL(baseUrl);
    const resolved = new URL(relativeUrl, base);
    return resolved.href;
  } catch (error) {
    console.log(`⚠️ URL resolution failed: ${relativeUrl}`);
    return null;
  }
}

// Fixed download function that handles redirects and relative URLs
function downloadFile(url, filepath, redirectCount = 0, baseUrl = null) {
  return new Promise((resolve, reject) => {
    // Resolve relative URLs
    const fullUrl = resolveUrl(baseUrl || url, url);
    if (!fullUrl) {
      reject(new Error('Invalid URL'));
      return;
    }

    const protocol = fullUrl.startsWith('https:') ? https : http;
    
    console.log(`📥 Downloading: ${path.basename(filepath)}`);
    
    const file = fs.createWriteStream(filepath);
    const request = protocol.get(fullUrl, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (
        (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) &&
        response.headers.location &&
        redirectCount < 10
      ) {
        // Follow redirect
        file.close();
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          // File might not exist, ignore error
        }
        
        const redirectUrl = response.headers.location;
        console.log(`�� Redirecting to: ${redirectUrl}`);
        
        // Use the current response URL as base for relative redirects
        const currentBase = fullUrl;
        downloadFile(redirectUrl, filepath, redirectCount + 1, currentBase).then(resolve).catch(reject);
      } else if (response.statusCode === 404) {
        file.close();
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          // File might not exist, ignore error
        }
        console.log(`⚠️ File not found (404): ${path.basename(filepath)}`);
        resolve(); // Not a fatal error, just skip
      } else {
        file.close();
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          // File might not exist, ignore error
        }
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', (err) => {
      file.close();
      try {
        fs.unlink(filepath, () => {});
      } catch (e) {
        // Ignore error
      }
      reject(err);
    });
    
    file.on('error', (err) => {
      file.close();
      try {
        fs.unlink(filepath, () => {});
      } catch (e) {
        // Ignore error
      }
      reject(err);
    });
  });
}

// Main download function
async function downloadModel(model) {
  console.log(`\n🎯 Downloading ${model.name}...`);
  console.log(`📍 Model ID: ${model.id}`);
  
  const modelDir = path.join(modelsDir, model.id.replace('/', '_'));
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  
  let successCount = 0;
  const totalFiles = model.files.length;
  
  for (const file of model.files) {
    try {
      const url = `${model.baseUrl}/${file}`;
      const filepath = path.join(modelDir, file);
      
      await downloadFile(url, filepath, 0, model.baseUrl);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed to download ${file}: ${error.message}`);
    }
  }
  
  if (successCount > 0) {
    console.log(`✅ Successfully downloaded ${model.name} (${successCount}/${totalFiles} files)`);
    return true;
  } else {
    console.log(`❌ Failed to download any files for ${model.name}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Starting model download...\n');
  
  let downloadedCount = 0;
  
  for (const model of models) {
    try {
      const success = await downloadModel(model);
      if (success) downloadedCount++;
    } catch (error) {
      console.error(`❌ Error downloading ${model.name}:`, error.message);
    }
  }
  
  console.log(`\n�� Download Summary:`);
  console.log(`✅ Successfully downloaded: ${downloadedCount}/${models.length} models`);
  
  if (downloadedCount > 0) {
    console.log(`\n🎉 Model download completed!`);
    console.log(`📁 Models saved to: ${modelsDir}`);
    console.log(`\n🚀 You can now run: npm run start`);
  } else {
    console.log(`\n⚠️ No models were downloaded successfully.`);
    console.log(`�� The app will still work with the fallback AI service.`);
    console.log(`🌐 Check your internet connection and try again.`);
  }
  
  console.log(`\n📝 Note: Large model files (safetensors) are not downloaded by this script.`);
  console.log(`📝 The transformers.js library will download them automatically when needed.`);
}

main().catch(error => {
  console.error('❌ Download failed:', error.message);
  process.exit(1);
});