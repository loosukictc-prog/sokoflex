import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Create a catalog product with validated price, stock, and category.",
  schema: z.object({
    name: z.string().trim().min(2).max(120).describe("Product name"),
    categoryId: z.string().describe("Existing category ID"),
    description: z.string().trim().max(600).default("").describe("Short product description"),
    price: z.number().int().positive().max(100000000).describe("Price in whole Kenyan shillings"),
    stock: z.number().int().min(0).max(1000000).describe("Available units"),
    color: z.string().trim().min(1).max(32).describe("Catalog artwork color token"),
  }),
  run: async (input) => {
    authorizeStoreAdmin();
    const db = getDb();
    const [category] = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.id, input.categoryId)).limit(1);
    if (!category) fail("Choose an existing category.", { statusCode: 400 });
    const [product] = await db.insert(schema.products).values({ id: crypto.randomUUID(), ...input }).returning();
    return product;
  },
});
