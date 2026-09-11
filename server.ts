import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import { db } from "./src/db/index.js";
import { profiles, links } from "./src/db/schema.js";
import { eq, asc } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

// Default Initial Data (for seeding)
const DEFAULT_PROFILE = {
  username: "solarhijab",
  display_name: "Solar Hijab",
  bio: "Pakaian bayi, balita & perempuan",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SH&backgroundColor=ffb6c1",
};

const DEFAULT_LINKS = [
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
];

async function seedDB() {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.username, "solarhijab"));
    if (existing.length === 0) {
      console.log("Seeding initial data...");
      const [insertedProfile] = await db.insert(profiles).values(DEFAULT_PROFILE).returning();
      const linksToInsert = DEFAULT_LINKS.map(l => ({ ...l, profile_id: insertedProfile.id }));
      await db.insert(links).values(linksToInsert);
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

async function startServer() {
  await seedDB();
  
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
      const token = jwt.sign({ role: "admin", username: "solarhijab" }, JWT_SECRET, { expiresIn: "1d" });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Get Profile (Public)
  app.get("/api/profile/:username", async (req, res) => {
    try {
      const [profile] = await db.select().from(profiles).where(eq(profiles.username, req.params.username));
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const profileLinks = await db
        .select()
        .from(links)
        .where(eq(links.profile_id, profile.id))
        .orderBy(asc(links.sort_order));

      res.json({
        profile,
        links: profileLinks.filter((l: any) => l.is_active),
      });
    } catch (err: any) {
      console.error("API Error (/api/profile):", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });

  // Admin: Get all details
  app.get("/api/admin/data", requireAuth, async (req, res) => {
    try {
      // Assuming admin always manages solarhijab for MVP
      const [profile] = await db.select().from(profiles).where(eq(profiles.username, "solarhijab"));
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const profileLinks = await db
        .select()
        .from(links)
        .where(eq(links.profile_id, profile.id))
        .orderBy(asc(links.sort_order));

      res.json({ profile, links: profileLinks });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update Profile
  app.put("/api/admin/profile", requireAuth, async (req, res) => {
    try {
      const { display_name, bio, avatar } = req.body;
      const [updatedProfile] = await db
        .update(profiles)
        .set({ display_name, bio, avatar, updated_at: new Date() })
        .where(eq(profiles.username, "solarhijab"))
        .returning();
      res.json(updatedProfile);
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Add Link
  app.post("/api/admin/links", requireAuth, async (req, res) => {
    try {
      const [profile] = await db.select().from(profiles).where(eq(profiles.username, "solarhijab"));
      
      const allLinks = await db.select().from(links).where(eq(links.profile_id, profile.id));
      const maxSortOrder = allLinks.length > 0 ? Math.max(...allLinks.map((l: any) => l.sort_order)) : 0;
      
      const newLinkData = {
        ...req.body,
        id: "link_" + Date.now() + Math.random().toString(36).substr(2, 5),
        sort_order: maxSortOrder + 1,
        profile_id: profile.id,
      };

      const [newLink] = await db.insert(links).values(newLinkData).returning();
      res.json(newLink);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update Link
  app.put("/api/admin/links/:id", requireAuth, async (req, res) => {
    try {
      const { title, url, platform, is_active } = req.body;
      const [updated] = await db
        .update(links)
        .set({ title, url, platform, is_active })
        .where(eq(links.id, req.params.id))
        .returning();
        
      if (!updated) return res.status(404).json({ error: "Link not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete Link
  app.delete("/api/admin/links/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(links).where(eq(links.id, req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Reorder Links
  app.put("/api/admin/links/reorder", requireAuth, async (req, res) => {
    try {
      const { linkIds } = req.body; // Array of IDs in new order
      
      // Update each link sequentially (or could use transactions)
      for (let i = 0; i < linkIds.length; i++) {
        await db.update(links).set({ sort_order: i + 1 }).where(eq(links.id, linkIds[i]));
      }

      // Fetch new sorted list
      const [profile] = await db.select().from(profiles).where(eq(profiles.username, "solarhijab"));
      const sortedLinks = await db
        .select()
        .from(links)
        .where(eq(links.profile_id, profile.id))
        .orderBy(asc(links.sort_order));

      res.json(sortedLinks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // --- VITE MIDDLEWARE & STATIC FILES ---
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else if (!process.env.VERCEL) {
    // Standard production build (not Vercel)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  return app;
}

// In Vercel, we need to export the app instance.
// But since our setup is async (seedDB), we can wrap it or just let Vercel handle it.
const appPromise = startServer();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
