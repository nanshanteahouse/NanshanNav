import { serve } from "@hono/node-server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createApp } from "./app.js";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const app = createApp({ uploadDir });
await mkdir(uploadDir, { recursive: true });
serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT || "3001", 10),
    hostname: process.env.HOST || "127.0.0.1",
  },
  (info) =>
    console.log(`NanshanNav running on http://${info.address}:${info.port}`),
);
