import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Update a catalog product's name, details, category, price, color, or stock.",
  schema: z.object({
    id: z.string().describe("Product ID"),
    name: z.string().trim().min(2).max(120).optional(),
    categoryId: z.string().optional(),
    description: z.string().trim().max(600).optional(),
    price: z.number().int().positive().max(100000000).optional(),
    stock: z.number().int().min(0).max(1000000).optional(),
    color: z.string().trim().min(1).max(32).optional(),
  }).refine(({ id: _id, ...patch }) => Object.values(patch).some((value) => value !== undefined), "Provide at least one field to update."),
  run: async ({ id, ...patch }) => {
    authorizeStoreAdmin();
    const db = getDb();
    if (patch.categoryId) {
      const [category] = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.id, patch.categoryId)).limit(1);
      if (!category) fail("Choose an existing category.", { statusCode: 400 });
    }
    const [product] = await db.update(schema.products).set(patch).where(eq(schema.products.id, id)).returning();
    if (!product) fail("Product not found.", { statusCode: 404 });
    return product;
  },
});
