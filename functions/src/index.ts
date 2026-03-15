import { onRequest } from "firebase-functions/v2/https";
import http from "http";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";

// Firebase Functions v2 automatically loads .env files
// Updated 2026-01-19: Fixed NEXTAUTH_URL_INTERNAL handling
console.log("Environment variables loaded by Firebase Functions v2");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "Set" : "Not set");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set");

const nextjsDir = path.join(__dirname, "..", "nextjs");
let serverProcess: ChildProcess | null = null;
let serverReady = false;
let serverStartPromise: Promise<void> | null = null;

async function startNextServer() {
  if (serverReady) return;
  if (serverStartPromise) return serverStartPromise;

  const port = Number(process.env.NEXT_INTERNAL_PORT || 8081);
  const hostname = "127.0.0.1";

  serverStartPromise = new Promise<void>((resolve, reject) => {
    try {
      const env: Record<string, string | undefined> = {
        ...process.env,
        NODE_ENV: "production",
        HOSTNAME: hostname,
        PORT: String(port),
        // Force public NextAuth URL to avoid localhost redirects
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://walking-challenge-cd6dd.web.app",
        // Provide an internal URL for NextAuth to use for server-side internal fetches
        NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL_INTERNAL || `http://${hostname}:${port}`,
        NEXT_INTERNAL_PORT: String(port),
        FIREBASE_ADMIN_PROJECT_ID: process.env.ADMIN_PROJECT_ID,
        FIREBASE_ADMIN_CLIENT_EMAIL: process.env.ADMIN_CLIENT_EMAIL,
        FIREBASE_ADMIN_PRIVATE_KEY_B64: process.env.ADMIN_PRIVATE_KEY_B64,
        // Ensure the standalone server preloads the fetch-patch shim to reroute internal fetches
        NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} -r ./fetch-patch.js`.trim(),
      };

      console.log("Spawning Next.js standalone server:", { cwd: nextjsDir, port });

      const serverPath = path.join(nextjsDir, "server.js");
      if (!fs.existsSync(serverPath)) {
        throw new Error(`Missing server.js at ${serverPath}. Ensure a standalone Next.js build was produced in functions/nextjs or use Firebase Frameworks build.`);
      }

      // Use the current Node executable to avoid spawn ENOENT when 'node' isn't in PATH
      const nodeExecutable = process.execPath || "node";
      serverProcess = spawn(nodeExecutable, ["server.js"], {
        cwd: nextjsDir,
        env: env as NodeJS.ProcessEnv,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const startupTimeout = setTimeout(() => {
        reject(new Error("Next.js server startup timeout (30s)"));
      }, 30000);

      serverProcess.stdout?.on("data", (data) => {
        console.log("[Next.js stdout]", data.toString().trim());
      });

      serverProcess.stderr?.on("data", (data) => {
        console.error("[Next.js stderr]", data.toString().trim());
      });

      serverProcess.on("error", (err) => {
        console.error("Failed to spawn Next.js server", err);
        clearTimeout(startupTimeout);
        reject(err);
      });

      serverProcess.on("exit", (code) => {
        console.error("Next.js server exited", code);
        serverReady = false;
      });

      // Poll health by hitting providers (cheap) to ensure handler works
      const check = setInterval(() => {
        const req = http.get({ hostname, port, path: "/api/auth/providers", timeout: 2000 }, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            clearInterval(check);
            clearTimeout(startupTimeout);
            serverReady = true;
            console.log("Next.js server is ready");
            resolve();
          } else {
            res.resume();
          }
        });
        req.on("error", () => {});
        req.on("timeout", () => req.destroy());
      }, 500);
    } catch (err) {
      reject(err);
    }
  });

  return serverStartPromise;
}

export const nextServer = onRequest(
  {
    region: "us-central1",
    memory: "4GiB",
    timeoutSeconds: 300,
    maxInstances: 100,
    minInstances: 1,
  },
  async (req, res) => {
    try {
      await startNextServer();

      // Prepare headers for proxy and log them for debugging
      const headers = { ...(req.headers as Record<string, string | string[] | undefined>) } as Record<string, any>;

      try {
        const publicUrl = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : null;
        const publicHost = publicUrl ? publicUrl.host : undefined;
        const internalPort = process.env.NEXT_INTERNAL_PORT || '8081';

        if (publicHost) {
          // Set host to localhost for the proxy connection to Next.js
          // This prevents Next.js from trying to fetch from itself via the public URL
          headers['host'] = `127.0.0.1:${internalPort}`;

          // Set x-forwarded-* headers so NextAuth knows the actual public URL
          // NextAuth uses these to construct correct redirect URIs and set cookies
          headers['x-forwarded-host'] = publicHost;
          headers['x-forwarded-proto'] = publicUrl.protocol.replace(':', '');
          headers['x-forwarded-port'] = publicUrl.port || (publicUrl.protocol === 'https:' ? '443' : '80');
        } else {
          headers['host'] = `127.0.0.1:${internalPort}`;
          headers['x-forwarded-proto'] = (req.headers['x-forwarded-proto'] as string) || 'https';
          headers['x-forwarded-port'] = (req.headers['x-forwarded-port'] as string) || '443';
        }
      } catch (e) {
        console.error('[Proxy] Error setting forwarded headers:', e);
      }

      console.log('Proxying request', { originalHost: req.headers.host, proxiedHost: headers.host, 'x-forwarded-host': headers['x-forwarded-host'] });

      const proxy = http.request(
        {
          hostname: "127.0.0.1",
          port: Number(process.env.NEXT_INTERNAL_PORT || 8081),
          path: req.url,
          method: req.method,
          headers,
          timeout: 120000,
        },
        (proxyRes) => {
          console.log('Proxy response', { statusCode: proxyRes.statusCode });
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);

          proxyRes.on('data', (chunk) => {
            // Avoid logging raw bodies, but track activity
            console.log('Proxy response chunk received, length:', chunk.length);
          });

          proxyRes.on('end', () => {
            console.log('Proxy response ended');
          });

          proxyRes.pipe(res);
        }
      );

      proxy.on('socket', (socket) => {
        console.log('Proxy socket assigned', { writable: socket.writable, readable: socket.readable });
        socket.on('close', (hadError) => {
          console.log('Proxy socket closed', { hadError });
        });
        socket.on('error', (err) => {
          console.error('Proxy socket error', err);
        });
      });

      req.on('data', (chunk) => {
        console.log('Request chunk', { length: chunk.length });
      });
      req.on('end', () => {
        console.log('Request ended');
      });

      proxy.on("error", (err) => {
        console.error("Proxy error", err);
        if (!res.headersSent) res.status(502).json({ error: "Bad Gateway" });
      });

      proxy.on("timeout", () => {
        proxy.destroy();
        if (!res.headersSent) res.status(504).json({ error: "Gateway Timeout" });
      });

      if (req.method !== "GET" && req.method !== "HEAD") {
        req.pipe(proxy);
      } else {
        proxy.end();
      }
    } catch (error) {
      console.error("Request error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error", details: String(error) });
      }
    }
  }
);
