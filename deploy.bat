@echo off
echo 🚀 Starting Du Học Cost deployment...

REM Build the application
echo 📦 Building application...
call npm run build

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    echo 📁 Build files are in .\dist\
    echo 🌐 Ready to deploy to live server
    echo.
    echo To deploy:
    echo 1. Copy all files from .\dist\ to your server
    echo 2. Ensure your server supports SPA routing
    echo 3. Test the deployment
    echo.
    echo Build summary:
    dir .\dist\
    echo.
    echo 🎉 Du Học Cost is ready for production!
) else (
    echo ❌ Build failed!
    exit /b 1
)

pause
