import { pgTable, text, boolean, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  display_name: text("display_name").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  sort_order: integer("sort_order").notNull(),
  profile_id: integer("profile_id").references(() => profiles.id).notNull(),
});
