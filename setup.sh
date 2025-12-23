#!/bin/bash
# Remove existing files
rm -rf node_modules .next package-lock.json
# Install dependencies
npm install --legacy-peer-deps
npm install firebase@9.23.0 @next-auth/firebase-adapter@1.0.3 --legacy-peer-deps
npm install --save-dev @types/node @types/react @types/react-dom typescript@5.3.3 --legacy-peer-deps
# Create necessary directories
mkdir -p src/types
# Restart TypeScript server
echo "Setup complete! Please restart your IDE to apply all changes."