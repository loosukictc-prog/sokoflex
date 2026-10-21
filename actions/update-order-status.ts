import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Change a customer order's fulfilment status.",
  schema: z.object({
    id: z.string().describe("Order ID"),
    status: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]).describe("New order status"),
  }),
  run: async ({ id, status }) => {
    authorizeStoreAdmin();
    const [order] = await getDb().update(schema.orders).set({ status }).where(eq(schema.orders.id, id)).returning();
    if (!order) fail("Order not found.", { statusCode: 404 });
    return order;
  },
});
