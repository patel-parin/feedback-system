import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer } from 'vite';
import { Server } from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createLogger } from "vite";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createServer({
    root: join(__dirname, '..'),
    server: {
      middlewareMode: true,
      hmr: {
        server
      },
      allowedHosts: ['localhost']
    }
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  app.use(express.static(join(__dirname, '..', 'dist', 'public')));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(join(__dirname, '..', 'dist', 'public', 'index.html')));
  });
}
