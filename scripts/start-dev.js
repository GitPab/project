/**
 * Auto-start backend server before frontend dev server
 * Forces port 3001, kills any process using it
 * Usage: node scripts/start-dev.js
 */
import { spawn, exec } from 'child_process';
import { createServer } from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const SERVER_DIR = join(PROJECT_ROOT, 'server');

const FIXED_PORT = 3001;
const MAX_WAIT_TIME = 30000;

const execAsync = promisify(exec);

/**
 * Kill any process using the specified port
 */
async function killProcessOnPort(port) {
  const isWindows = process.platform === 'win32';
  
  try {
    if (isWindows) {
      // Find PID using port
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(parseInt(pid))) {
          console.log(`🔪 Killing process ${pid} using port ${port}...`);
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Killed process ${pid}`);
          } catch (e) {
            console.log(`⚠️ Could not kill process ${pid}: ${e.message}`);
          }
        }
      }
    } else {
      // Unix/Mac
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(Boolean);
        for (const pid of pids) {
          console.log(`🔪 Killing process ${pid} using port ${port}...`);
          await execAsync(`kill -9 ${pid}`);
          console.log(`✅ Killed process ${pid}`);
        }
      } catch (e) {
        // No process found, that's fine
      }
    }
    
    // Wait a moment for port to be released
    await new Promise(r => setTimeout(r, 1000));
    return true;
  } catch (e) {
    // No process found or error, continue
    return true;
  }
}

/**
 * Check if backend health endpoint responds
 */
async function checkBackendHealth(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start backend server on fixed port
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting backend server on port ${FIXED_PORT}...`);
    
    const isWindows = process.platform === 'win32';
    
    // Set PORT environment variable to force specific port
    const env = {
      ...process.env,
      PORT: FIXED_PORT.toString()
    };
    
    // Use npm start in server directory
    const serverProcess = spawn(
      isWindows ? 'npm.cmd' : 'npm',
      ['start'],
      {
        cwd: SERVER_DIR,
        stdio: 'pipe',
        detached: !isWindows,
        shell: isWindows,
        env
      }
    );

    let started = false;
    let portConfirmed = false;

    // Capture output to detect when server is ready
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Check for port confirmation
      if (output.includes(`localhost:${FIXED_PORT}`)) {
        portConfirmed = true;
      }
      
      // Server is ready when it logs the running message
      if (output.includes('Server running') || output.includes('🚀')) {
        if (!started && portConfirmed) {
          started = true;
          console.log(`✅ Backend started on port ${FIXED_PORT}`);
          resolve({ process: serverProcess, port: FIXED_PORT });
        } else if (!started && !portConfirmed) {
          // Server started but on wrong port - this is an error
          console.error(`❌ Server started but not on port ${FIXED_PORT}`);
          serverProcess.kill();
          reject(new Error(`Server did not use required port ${FIXED_PORT}`));
        }
      }
      
      // Forward backend logs with prefix
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) console.log(`[Backend] ${line}`);
      });
    });

    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) console.error(`[Backend] ${line}`);
      });
    });

    serverProcess.on('error', (err) => {
      reject(new Error(`Failed to start backend: ${err.message}`));
    });

    serverProcess.on('exit', (code) => {
      if (!started && code !== 0) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      if (!started) {
        serverProcess.kill();
        reject(new Error('Backend failed to start within 30 seconds'));
      }
    }, MAX_WAIT_TIME);
  });
}

/**
 * Wait for backend to be ready
 */
async function waitForBackend(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkBackendHealth(port)) {
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
    process.stdout.write('.');
  }
  return false;
}

/**
 * Start frontend dev server
 */
function startFrontend() {
  console.log('🚀 Starting frontend dev server...');
  
  const isWindows = process.platform === 'win32';
  
  // Set API URL for frontend to use fixed port
  const env = {
    ...process.env,
    VITE_API_URL: `http://localhost:${FIXED_PORT}/api`
  };
  
  const frontendProcess = spawn(
    isWindows ? 'npm.cmd' : 'npm',
    ['run', 'dev'],
    {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: isWindows,
      env
    }
  );

  frontendProcess.on('exit', (code) => {
    console.log(`\n👋 Frontend exited with code ${code}`);
    process.exit(code);
  });

  return frontendProcess;
}

/**
 * Main execution
 */
async function main() {
  console.log(`🔍 Preparing port ${FIXED_PORT}...\n`);

  try {
    // Kill any process using the port
    await killProcessOnPort(FIXED_PORT);
    
    // Check if backend already running on our port
    const alreadyRunning = await checkBackendHealth(FIXED_PORT);
    
    if (alreadyRunning) {
      console.log(`✅ Backend already running on port ${FIXED_PORT}\n`);
    } else {
      // Start backend
      const { process: backendProcess } = await startBackend();
      
      // Wait for backend to be ready
      console.log('⏳ Waiting for backend to be ready...');
      const ready = await waitForBackend(FIXED_PORT);
      
      if (!ready) {
        console.error('\n❌ Backend failed to start properly');
        backendProcess.kill();
        process.exit(1);
      }
      
      console.log('\n✅ Backend is ready!\n');

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n👋 Shutting down...');
        backendProcess.kill();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        backendProcess.kill();
        process.exit(0);
      });
    }

    // Start frontend
    startFrontend();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
