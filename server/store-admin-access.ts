import { fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";

const storeAdminEmail = process.env.SOKOFLEX_ADMIN_EMAIL?.trim().toLowerCase(); // guard:allow-env-credential — deployment admin identity allowlist, not a credential.

export function getStoreAdminAccess() {
  const email = getRequestUserEmail()?.trim().toLowerCase();
  return {
    configured: Boolean(storeAdminEmail),
    allowed: Boolean(storeAdminEmail && email && email === storeAdminEmail),
  };
}

export function authorizeStoreAdmin() {
  if (!getStoreAdminAccess().allowed) {
    fail("Store admin access is not configured for this account.", { statusCode: 403 });
  }
}
