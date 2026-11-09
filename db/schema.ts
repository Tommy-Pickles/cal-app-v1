import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("health_accounts", {
  userId: text("user_id").primaryKey(),
  data: text("data").notNull(),
  version: integer("version").notNull().default(0),
});
