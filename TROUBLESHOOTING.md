# Troubleshooting Guide

This guide helps you resolve common issues when running the AI Local Embedded Assistant with DeepSeek Lite models.

## Common Issues and Solutions

### 1. GPU Process Crashes

**Symptoms:**
- Error: `GPU process exited unexpectedly: exit_code=-1073740791`
- Application crashes on startup
- Black screen or frozen window

**Solutions:**
1. **Use the startup script:**
   ```bash
   npm run start
   ```

2. **Manual GPU disable:**
   - The app now automatically disables GPU acceleration
   - If issues persist, try running with these flags:
   ```bash
   npm run dev -- --disable-gpu --disable-software-rasterizer
   ```

3. **Update graphics drivers:**
   - Update your GPU drivers to the latest version
   - For NVIDIA: Download from nvidia.com
   - For AMD: Download from amd.com
   - For Intel: Download from intel.com

### 2. Model Loading Issues

**Symptoms:**
- "Model Not Loaded" status
- Loading progress bar stuck
- Network errors during model download

**Solutions:**
1. **Check internet connection:**
   - First-time model download requires internet
   - Ensure stable connection for ~2.6GB download

2. **Clear model cache:**
   - Delete the IndexedDB cache:
     - Windows: `%APPDATA%/Electron/IndexedDB/`
     - macOS: `~/Library/Application Support/Electron/IndexedDB/`
     - Linux: `~/.config/Electron/IndexedDB/`

3. **Check disk space:**
   - Ensure at least 5GB free space
   - Model requires ~2.6GB storage

4. **Try different model:**
   - Edit `src/renderer/services/DeepSeekService.ts`
   - Change model ID to a different DeepSeek model

### 3. Memory Issues

**Symptoms:**
- Application becomes slow
- "Out of memory" errors
- Model fails to load

**Solutions:**
1. **Close other applications:**
   - Free up RAM by closing unnecessary apps
   - Ensure at least 4GB RAM available

2. **Use smaller model:**
   - The default 1.3B model is optimized for memory
   - Avoid 6.7B/7B models on low-memory systems

3. **Restart the application:**
   - Close and reopen the app
   - This clears memory and reloads the model

### 4. Dependencies Issues

**Symptoms:**
- Module not found errors
- TypeScript compilation errors
- Missing packages

**Solutions:**
1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use the startup script:**
   ```bash
   npm run start
   ```
   This automatically checks and installs missing packages.

3. **Manual package installation:**
   ```bash
   npm install @xenova/transformers @tensorflow/tfjs @tensorflow/tfjs-backend-webgl @tensorflow/tfjs-backend-cpu
   ```

### 5. Performance Issues

**Symptoms:**
- Slow response generation
- High CPU usage
- Application lag

**Solutions:**
1. **Reduce model parameters:**
   - Edit `src/renderer/App.tsx`
   - Lower the `maxLength` parameter in `generateResponse` call

2. **Enable hardware acceleration (if stable):**
   - Remove `app.disableHardwareAcceleration()` from `main.ts`
   - Only if GPU crashes are resolved

3. **Optimize system:**
   - Close background applications
   - Ensure adequate cooling
   - Use SSD storage if possible

### 6. Network/Firewall Issues

**Symptoms:**
- Model download fails
- Connection timeouts
- Security warnings

**Solutions:**
1. **Check firewall settings:**
   - Allow the application through firewall
   - Disable antivirus temporarily for testing

2. **Use proxy if needed:**
   - Configure proxy settings in your system
   - The app respects system proxy settings

3. **Offline mode:**
   - Once downloaded, models work offline
   - Copy model cache to other machines if needed

## System Requirements

### Minimum Requirements:
- **OS:** Windows 10, macOS 10.14+, or Linux
- **RAM:** 4GB (8GB recommended)
- **Storage:** 5GB free space
- **CPU:** Modern multi-core processor
- **Internet:** Required for first-time model download

### Recommended Requirements:
- **RAM:** 8GB or more
- **Storage:** 10GB free space
- **CPU:** Recent Intel i5/AMD Ryzen 5 or better
- **GPU:** Dedicated GPU (optional, for acceleration)

## Getting Help

If you're still experiencing issues:

1. **Check the console:**
   - Open DevTools (F12)
   - Look for error messages in the Console tab

2. **Check the logs:**
   - Application logs are shown in the terminal
   - Look for specific error messages

3. **Create an issue:**
   - Include your OS version
   - Include error messages
   - Include system specifications

## Performance Tips

1. **First run:** Model download may take 10-30 minutes depending on internet speed
2. **Subsequent runs:** Model loads in 30-60 seconds
3. **Response generation:** Takes 5-30 seconds depending on input length
4. **Memory usage:** ~2-4GB RAM when model is loaded
5. **CPU usage:** High during generation, normal during idle

## Model Information

- **Model:** DeepSeek Coder 1.3B Base
- **Size:** ~2.6GB (quantized)
- **Type:** Text generation, code assistance
- **License:** Check Hugging Face for specific license terms
- **Source:** https://huggingface.co/deepseek-ai/deepseek-coder-1.3b-base 