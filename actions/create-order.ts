import { defineAction, fail } from "@agent-native/core/action";
import { eq, sql } from "drizzle-orm";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Create a Sokoflex order using server-verified prices and stock.",
  schema: z.object({
    customerName: z.string().trim().min(2).max(120),
    email: z.email(),
    phone: z.string().trim().min(7).max(30),
    address: z.string().trim().min(5).max(300),
    items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(50) })).min(1),
  }),
  run: async ({ customerName, email, phone, address, items }) => {
    const accountEmail = getRequestUserEmail();
    if (!accountEmail) fail("Not authenticated", { statusCode: 401 });
    if (email.toLowerCase() !== accountEmail.toLowerCase()) fail("Use the email address on your signed-in account.", { statusCode: 403 });
    const db = getDb();
    const orderId = crypto.randomUUID();
    const orderNumber = `SF-${Date.now().toString().slice(-8)}`;
    const result = await db.transaction(async (tx) => {
      const resolved = [];
      for (const item of items) {
        const [product] = await tx.select().from(schema.products).where(eq(schema.products.id, item.productId)).limit(1);
        if (!product || product.stock < item.quantity) fail(`${product?.name ?? "A product"} is no longer available in that quantity.`, { statusCode: 409 });
        const [updated] = await tx.update(schema.products)
          .set({ stock: sql`${schema.products.stock} - ${item.quantity}` })
          .where(sql`${schema.products.id} = ${item.productId} and ${schema.products.stock} >= ${item.quantity}`)
          .returning();
        if (!updated) fail(`${product.name} just sold out. Please update your cart.`, { statusCode: 409 });
        resolved.push({ product, quantity: item.quantity });
      }
      const total = resolved.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
      await tx.insert(schema.orders).values({ id: orderId, orderNumber, customerName, email, phone, address, total, status: "Pending" });
      await tx.insert(schema.orderItems).values(resolved.map(({ product, quantity }) => ({
        id: crypto.randomUUID(), orderId, productId: product.id, productName: product.name, quantity, unitPrice: product.price,
      })));
      return { orderNumber, total };
    });
    return result;
  },
});
