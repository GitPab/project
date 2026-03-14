#!/bin/bash

# Du Học Cost - Deployment Script
echo "🚀 Starting Du Học Cost deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build files are in ./dist/"
    echo "🌐 Ready to deploy to live server"
    echo ""
    echo "To deploy:"
    echo "1. Copy all files from ./dist/ to your server"
    echo "2. Ensure your server supports SPA routing"
    echo "3. Test the deployment"
    echo ""
    echo "Build summary:"
    ls -la ./dist/
    echo ""
    echo "🎉 Du Học Cost is ready for production!"
else
    echo "❌ Build failed!"
    exit 1
fi
