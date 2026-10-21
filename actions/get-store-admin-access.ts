import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { getStoreAdminAccess } from "../server/store-admin-access.js";

export default defineAction({
  description: "Check whether the signed-in account can open Sokoflex admin tools.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => getStoreAdminAccess(),
});
