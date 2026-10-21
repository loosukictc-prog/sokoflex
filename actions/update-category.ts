import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeStoreAdmin } from "../server/store-admin-access.js";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Rename a catalog category and update its URL slug.",
  schema: z.object({ id: z.string().describe("Category ID"), name: z.string().trim().min(2).max(60).describe("New category name") }),
  run: async ({ id, name }) => {
    authorizeStoreAdmin();
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [category] = await getDb().update(schema.categories).set({ name, slug }).where(eq(schema.categories.id, id)).returning();
    if (!category) fail("Category not found.", { statusCode: 404 });
    return category;
  },
});
