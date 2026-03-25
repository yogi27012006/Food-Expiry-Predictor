import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodItemsTable = pgTable("food_items", {
  id: serial("id").primaryKey(),
  foodName: text("food_name").notNull(),
  imageUrl: text("image_url"),
  freshnessScore: integer("freshness_score").notNull(),
  freshnessLabel: text("freshness_label").notNull(),
  predictedExpiryDate: text("predicted_expiry_date").notNull(),
  aiAnalysis: text("ai_analysis").notNull(),
  daysUntilExpiry: integer("days_until_expiry").notNull(),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFoodItemSchema = createInsertSchema(foodItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItemsTable.$inferSelect;
