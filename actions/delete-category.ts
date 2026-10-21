import { defineAction, fail } from "@agent-native/core/action";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Delete a catalog category when it contains no products.",
  schema: z.object({ id: z.string().describe("Category ID") }),
  run: async ({ id }) => {
    authorizeStoreAdmin();
    const db = getDb();
    const [usage] = await db.select({ count: count() }).from(schema.products).where(eq(schema.products.categoryId, id));
    if (usage.count) fail("Move or delete this category's products before deleting it.", { statusCode: 409 });
    const [category] = await db.delete(schema.categories).where(eq(schema.categories.id, id)).returning();
    if (!category) fail("Category not found.", { statusCode: 404 });
    return category;
  },
});
