import { defineAction } from "@agent-native/core/action";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List the available Sokoflex products and categories.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const db = getDb();
    const [products, categories] = await Promise.all([
      db.select().from(schema.products).orderBy(asc(schema.products.name)),
      db.select().from(schema.categories).orderBy(asc(schema.categories.name)),
    ]);
    return { products, categories };
  },
});
