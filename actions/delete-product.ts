import { defineAction, fail } from "@agent-native/core/action";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Delete a product that has never appeared in an order.",
  schema: z.object({ id: z.string().describe("Product ID") }),
  run: async ({ id }) => {
    authorizeStoreAdmin();
    const db = getDb();
    const [usage] = await db.select({ count: count() }).from(schema.orderItems).where(eq(schema.orderItems.productId, id));
    if (usage.count) fail("Products in order history cannot be deleted.", { statusCode: 409 });
    const [product] = await db.delete(schema.products).where(eq(schema.products.id, id)).returning();
    if (!product) fail("Product not found.", { statusCode: 404 });
    return product;
  },
});
