import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const RSVPS_FILE = path.join(process.cwd(), "rsvps.json");

// Middleware
app.use(express.json());

// Initialize rsvps.json if not exists
if (!fs.existsSync(RSVPS_FILE)) {
  fs.writeFileSync(RSVPS_FILE, JSON.stringify([], null, 2), "utf8");
}

// Read RSVPs helper
function getRSVPs() {
  try {
    const data = fs.readFileSync(RSVPS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading RSVPs file:", error);
    return [];
  }
}

// Write RSVPs helper
function saveRSVPs(rsvps: any[]) {
  try {
    fs.writeFileSync(RSVPS_FILE, JSON.stringify(rsvps, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing RSVPs file:", error);
    return false;
  }
}

// API Routes

// Submit RSVP
app.post("/api/rsvps", (req, res) => {
  const { name, guestsCount, status, dietary, message } = req.body;

  if (!name || !status) {
    return res.status(400).json({ error: "Name and attendance status are required." });
  }

  const rsvps = getRSVPs();
  const newRsvp = {
    id: "_" + Math.random().toString(36).substr(2, 9),
    name: name.trim(),
    guestsCount: parseInt(guestsCount, 10) || 1,
    status,
    dietary: (dietary || "").trim(),
    message: (message || "").trim(),
    submittedAt: new Date().toISOString(),
  };

  rsvps.push(newRsvp);
  if (saveRSVPs(rsvps)) {
    res.status(201).json(newRsvp);
  } else {
    res.status(500).json({ error: "Failed to save RSVP." });
  }
});

// Get RSVPs (Protected by passcode)
app.get("/api/rsvps", (req, res) => {
  const passcode = req.headers["x-admin-passcode"];
  
  if (passcode !== "NichelleEniola2026") {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  const rsvps = getRSVPs();
  res.json(rsvps);
});

// Delete RSVP (Protected by passcode)
app.delete("/api/rsvps/:id", (req, res) => {
  const passcode = req.headers["x-admin-passcode"];
  const { id } = req.params;

  if (passcode !== "NichelleEniola2026") {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  let rsvps = getRSVPs();
  const initialLength = rsvps.length;
  rsvps = rsvps.filter((r: any) => r.id !== id);

  if (rsvps.length === initialLength) {
    return res.status(404).json({ error: "RSVP not found." });
  }

  if (saveRSVPs(rsvps)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Failed to update RSVPs." });
  }
});

// Integration with Vite
async function init() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

init().catch((err) => {
  console.error("Failed to start server:", err);
});
