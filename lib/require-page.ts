import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import {
  getCurrentUser,
  getFreshUserFromDb,
  type CurrentUser,
} from "@/lib/auth";
import type { PageKey } from "@/constants/permissions";
import { canAccessPage } from "@/lib/permissions";

/** Guard halaman berdasarkan matriks RolePermission */
export async function requirePageAccess(pageKey: PageKey): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const freshUser = await getFreshUserFromDb(user.id_user);
  if (!freshUser) redirect("/admin/login");

  const allowed = await canAccessPage(freshUser.role as Role, pageKey);
  if (!allowed) redirect("/admin");

  return freshUser;
}
