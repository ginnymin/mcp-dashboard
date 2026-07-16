import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { getDb } from "./db.js";
import { registerRoutes } from "./routes.js";

const app = new Hono();
app.use("*", cors());

registerRoutes(app, getDb());

const PORT = 3001;
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
