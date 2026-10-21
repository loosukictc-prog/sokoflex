import { defineAction } from "@agent-native/core/action";
import { desc, inArray } from "drizzle-orm";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List recent Sokoflex customer orders.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    authorizeStoreAdmin();
    const db = getDb();
    const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(100);
    const orderIds = orders.map((order) => order.id);
    const items = orderIds.length
      ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds))
      : [];
    return { orders, items };
  },
});
