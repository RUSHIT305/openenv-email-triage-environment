import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { CustomerSupportEnv, ActionSchema, TASKS } from "./src/env/CustomerSupportEnv.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- OpenEnv API ---
  let env = new CustomerSupportEnv();

  app.post("/api/reset", (req, res) => {
    const { taskId } = req.body;
    const observation = env.reset(taskId);
    res.json(observation);
  });

  app.post("/api/step", (req, res) => {
    const result = ActionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid action format", details: result.error });
    }
    const [observation, reward] = env.step(result.data);
    res.json({ observation, reward });
  });

  app.get("/api/state", (req, res) => {
    res.json(env.state());
  });

  app.get("/api/tasks", (req, res) => {
    res.json(TASKS.map(t => ({ id: t.id, description: t.description, difficulty: t.difficulty })));
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
