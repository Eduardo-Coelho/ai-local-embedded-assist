# AI Local Embedded Assistant

A modern Electron application built with React and TypeScript that provides a local AI assistant interface. This app is designed to run lightweight NLP models locally on your device, ensuring privacy and offline capability.

## Features

- 🚀 **Local AI Processing** - Runs AI models directly on your device
- 🔒 **Privacy Focused** - No data sent to external servers
- 📱 **Offline Capability** - Works without internet connection
- ⚡ **Fast Response** - Optimized for quick local inference
- 🎨 **Modern UI** - Beautiful, responsive interface
- 🔧 **TypeScript** - Full type safety and better development experience

## Tech Stack

- **Electron** - Cross-platform desktop application framework
- **React** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **TensorFlow.js** - Local AI model inference (ready for integration)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-local-embedded-assist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development mode (both renderer and main process)
- `npm run build` - Build the application for production
- `npm run dist` - Build and package the application
- `npm run dist:win` - Build for Windows
- `npm run dist:mac` - Build for macOS
- `npm run dist:linux` - Build for Linux

## Project Structure

```
ai-local-embedded-assist/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main process entry point
│   │   └── preload.ts  # Preload script for security
│   └── renderer/       # React renderer process
│       ├── main.tsx    # React entry point
│       ├── App.tsx     # Main App component
│       ├── App.css     # Component styles
│       └── index.css   # Global styles
├── dist/               # Built files
├── release/            # Packaged applications
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config (renderer)
├── tsconfig.main.json  # TypeScript config (main)
├── tsconfig.node.json  # TypeScript config (Node.js tools)
└── vite.config.ts      # Vite configuration
```

## AI Model Integration

The application is designed to integrate with local AI models. Here's how to add your own model:

1. **Model Integration**: Choose a lightweight NLP model that can run on local hardware. You can use frameworks like TensorFlow Lite, that allow you to run models directly in the Electron app.

2. **Packaging the Model**: Include the model files within your Electron application's directory. This way, the model is always available for offline use.

3. **Local Inference**: Use a JavaScript library like TensorFlow.js to load the model and perform inference directly within the app.

### Example Integration

```typescript
// In your AI service file
import * as tf from '@tensorflow/tfjs';

export class AIService {
  private model: tf.LayersModel | null = null;

  async loadModel() {
    // Load your model here
    this.model = await tf.loadLayersModel('path/to/your/model.json');
  }

  async processInput(input: string) {
    if (!this.model) {
      throw new Error('Model not loaded');
    }
    
    // Process input with your model
    // Return the response
  }
}
```

## Development

### Development Mode
The development mode runs both the Vite dev server for the React app and the Electron main process with hot reloading.

### Building for Production
The build process compiles TypeScript files and bundles the React application for production.

### Packaging
Use electron-builder to create distributable packages for different platforms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For support and questions, please open an issue in the repository.
