import { onRequest } from "firebase-functions/v2/https";
import * as dotenv from "dotenv";
import http from "http";
import path from "path";
import { spawn, ChildProcess } from "child_process";

// Load environment variables from the functions directory
const envPath = path.join(__dirname, "..", ".env");
console.log("Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env:", result.error);
} else {
  console.log("Loaded environment variables:", Object.keys(result.parsed || {}).length, "variables");
}

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
      // Ensure no stale internal URL overrides leak through
      delete process.env.NEXTAUTH_URL_INTERNAL;

      const env: Record<string, string | undefined> = {
        ...process.env,
        NODE_ENV: "production",
        HOSTNAME: hostname,
        PORT: String(port),
        // Force public NextAuth URL to avoid localhost redirects
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://walking-challenge-cd6dd.web.app",
        FIREBASE_ADMIN_PROJECT_ID: process.env.ADMIN_PROJECT_ID,
        FIREBASE_ADMIN_CLIENT_EMAIL: process.env.ADMIN_CLIENT_EMAIL,
        FIREBASE_ADMIN_PRIVATE_KEY_B64: process.env.ADMIN_PRIVATE_KEY_B64,
      };

      delete env.NEXTAUTH_URL_INTERNAL;

      console.log("Spawning Next.js standalone server:", { cwd: nextjsDir, port });
      serverProcess = spawn("node", ["server.js"], {
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

      const proxy = http.request(
        {
          hostname: "127.0.0.1",
          port: Number(process.env.NEXT_INTERNAL_PORT || 8081),
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: (req.headers.host as string) || (req.headers["x-forwarded-host"] as string) || "127.0.0.1",
            "x-forwarded-host": (req.headers.host as string) || (req.headers["x-forwarded-host"] as string),
            "x-forwarded-proto": (req.headers["x-forwarded-proto"] as string) || "https",
            "x-forwarded-port": (req.headers["x-forwarded-port"] as string) || "443",
          },
          timeout: 55000,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

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
