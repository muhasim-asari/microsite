import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

// Mock DB File Path
const DB_FILE = path.join(process.cwd(), "db.json");

// Default Initial Data
const DEFAULT_DB = {
  profile: {
    username: "solarhijab",
    display_name: "Solar Hijab",
    bio: "Pakaian bayi, balita & perempuan",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SH&backgroundColor=ffb6c1",
  },
  links: [
    {
      id: "link_001",
      platform: "shopee",
      title: "Belanja di Shopee",
      url: "https://shopee.co.id/solarhijab",
      icon: "shopee",
      is_active: true,
      sort_order: 1,
    },
    {
      id: "link_002",
      platform: "tokopedia",
      title: "Belanja di Tokopedia",
      url: "https://tokopedia.com/solarhijab",
      icon: "tokopedia",
      is_active: true,
      sort_order: 2,
    },
    {
      id: "link_003",
      platform: "instagram",
      title: "Instagram",
      url: "https://instagram.com/solarhijab",
      icon: "instagram",
      is_active: true,
      sort_order: 3,
    },
    {
      id: "link_004",
      platform: "whatsapp",
      title: "WhatsApp",
      url: "https://wa.me/628123456789",
      icon: "whatsapp",
      is_active: true,
      sort_order: 4,
    }
  ],
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return DEFAULT_DB;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Login (Hardcoded for MVP)
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@solarhijab.com" && password === "password") {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Get Profile (Public)
  app.get("/api/profile/:username", (req, res) => {
    const db = readDB();
    if (db.profile.username === req.params.username) {
      res.json({
        profile: db.profile,
        links: db.links.filter((l: any) => l.is_active).sort((a: any, b: any) => a.sort_order - b.sort_order),
      });
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  });

  // Admin: Get all details
  app.get("/api/admin/data", requireAuth, (req, res) => {
    const db = readDB();
    res.json({
      profile: db.profile,
      links: db.links.sort((a: any, b: any) => a.sort_order - b.sort_order),
    });
  });

  // Admin: Update Profile
  app.put("/api/admin/profile", requireAuth, (req, res) => {
    const db = readDB();
    db.profile = { ...db.profile, ...req.body };
    writeDB(db);
    res.json(db.profile);
  });

  // Admin: Add Link
  app.post("/api/admin/links", requireAuth, (req, res) => {
    const db = readDB();
    const newLink = {
      ...req.body,
      id: "link_" + Date.now(),
      sort_order: db.links.length > 0 ? Math.max(...db.links.map((l: any) => l.sort_order)) + 1 : 1,
    };
    db.links.push(newLink);
    writeDB(db);
    res.json(newLink);
  });

  // Admin: Update Link
  app.put("/api/admin/links/:id", requireAuth, (req, res) => {
    const db = readDB();
    const index = db.links.findIndex((l: any) => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Link not found" });
    db.links[index] = { ...db.links[index], ...req.body };
    writeDB(db);
    res.json(db.links[index]);
  });

  // Admin: Delete Link
  app.delete("/api/admin/links/:id", requireAuth, (req, res) => {
    const db = readDB();
    db.links = db.links.filter((l: any) => l.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Admin: Reorder Links
  app.put("/api/admin/links/reorder", requireAuth, (req, res) => {
    const { linkIds } = req.body; // Array of IDs in new order
    const db = readDB();
    
    const newLinks = linkIds.map((id: string, index: number) => {
      const link = db.links.find((l: any) => l.id === id);
      if (link) {
        link.sort_order = index + 1;
      }
      return link;
    }).filter(Boolean);

    db.links = newLinks;
    writeDB(db);
    res.json(db.links);
  });


  // --- VITE MIDDLEWARE & STATIC FILES ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
