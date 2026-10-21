import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Create a category for grouping Sokoflex catalog products.",
  schema: z.object({ name: z.string().trim().min(2).max(60).describe("Category name") }),
  run: async ({ name }) => {
    authorizeStoreAdmin();
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [category] = await getDb().insert(schema.categories).values({ id: crypto.randomUUID(), name, slug }).returning();
    return category;
  },
});
