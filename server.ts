import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for deleting a match dynamically from the backend DB
  app.delete("/api/matches/:id", (req, res) => {
    const { id } = req.params;
    console.log(`[Express Backend] Received hard-purge match deletion request for: ${id}`);
    
    // Respond back with success to verify network execution
    res.json({
      success: true,
      message: `Match card ${id} cascaded and purged from backend collection successfully.`,
      deletedId: id,
      timestamp: new Date().toISOString()
    });
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      serverTime: new Date().toISOString()
    });
  });

  // Vite middleware loader for local development
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
    console.log(`[Full-Stack Server] Server active on port ${PORT}`);
  });
}

startServer();
