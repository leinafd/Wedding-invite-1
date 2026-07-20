import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const RSVPS_FILE = path.join(process.cwd(), "rsvps.json");
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "NichelleEniola2026";

// Middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Serve static assets from our local assets folder directly in both dev and prod
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

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
  
  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  const rsvps = getRSVPs();
  res.json(rsvps);
});

// Delete RSVP (Protected by passcode)
app.delete("/api/rsvps/:id", (req, res) => {
  const passcode = req.headers["x-admin-passcode"];
  const { id } = req.params;

  if (passcode !== ADMIN_PASSCODE) {
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

// Upload couple photo (Protected by passcode)
app.post("/api/upload-photo", (req, res) => {
  const passcode = req.headers["x-admin-passcode"];
  const { photoIndex, base64Data } = req.body;

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  if (photoIndex !== 1 && photoIndex !== 2) {
    return res.status(400).json({ error: "Invalid photoIndex. Must be 1 or 2." });
  }

  if (!base64Data) {
    return res.status(400).json({ error: "No base64Data provided." });
  }

  try {
    // Extract base64 content
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 data format." });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const assetsDir = path.join(process.cwd(), "assets");
    
    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const fileName = `couple_photo${photoIndex}.jpg`;
    const filePath = path.join(assetsDir, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`Successfully saved photo to: ${filePath}`);

    res.json({ success: true, url: `/assets/${fileName}` });
  } catch (error: any) {
    console.error("Error saving uploaded photo:", error);
    res.status(500).json({ error: "Failed to save photo on server: " + error.message });
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
