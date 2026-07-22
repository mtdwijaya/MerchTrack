import { unstable_cache } from "next/cache";
import type { Role } from "@prisma/client";

import {
  APP_PAGES,
  getDefaultAllowed,
  getPageByHref,
  type PageKey,
  PAGE_KEYS,
} from "@/constants/permissions";
import type { SidebarMenu } from "@/constants/sidebar-menu";
import { prisma } from "@/lib/prisma";

export const ROLE_PERMISSION_CACHE_TAG = "role-permissions";

type PermissionMap = Record<PageKey, boolean>;

function buildDefaultMap(role: Role): PermissionMap {
  return Object.fromEntries(
    PAGE_KEYS.map((key) => [key, getDefaultAllowed(role, key)])
  ) as PermissionMap;
}

async function fetchRolePermissionMap(role: Role): Promise<PermissionMap> {
  const defaults = buildDefaultMap(role);
  const rows = await prisma.rolePermission.findMany({
    where: { role },
    select: { page_key: true, allowed: true },
  });

  for (const row of rows) {
    if ((PAGE_KEYS as readonly string[]).includes(row.page_key)) {
      defaults[row.page_key as PageKey] = row.allowed;
    }
  }

  return defaults;
}

const getCachedRolePermissionMap = unstable_cache(
  async (role: Role) => fetchRolePermissionMap(role),
  ["role-permission-map"],
  { tags: [ROLE_PERMISSION_CACHE_TAG], revalidate: 60 }
);

export async function getRolePermissionMap(role: Role): Promise<PermissionMap> {
  return getCachedRolePermissionMap(role);
}

export async function canAccessPage(
  role: Role,
  pageKey: PageKey
): Promise<boolean> {
  const map = await getRolePermissionMap(role);
  return map[pageKey] ?? false;
}

export async function canAccessPath(
  role: Role,
  pathname: string
): Promise<boolean> {
  const page = getPageByHref(pathname);
  if (!page) return true;
  return canAccessPage(role, page.key);
}

export async function getSidebarMenusForRole(role: Role): Promise<{
  main: SidebarMenu[];
  master: SidebarMenu[];
}> {
  const map = await getRolePermissionMap(role);

  const toMenu = (section: "main" | "master"): SidebarMenu[] =>
    APP_PAGES.filter(
      (page) => page.section === section && map[page.key]
    ).map((page) => ({
      name: page.label,
      href: page.href,
      icon: page.icon,
    }));

  return {
    main: toMenu("main"),
    master: toMenu("master"),
  };
}

export async function getAllRolePermissions() {
  const [admin, petugas] = await Promise.all([
    getRolePermissionMap("ADMIN"),
    getRolePermissionMap("PETUGAS"),
  ]);

  return {
    ADMIN: admin,
    PETUGAS: petugas,
    pages: APP_PAGES.map((page) => ({
      key: page.key,
      label: page.label,
      section: page.section,
    })),
  };
}

export async function upsertRolePermissions(
  role: Role,
  permissions: Partial<Record<PageKey, boolean>>
) {
  const entries = Object.entries(permissions).filter(([key]) =>
    (PAGE_KEYS as readonly string[]).includes(key)
  ) as [PageKey, boolean][];

  await prisma.$transaction(
    entries.map(([page_key, allowed]) =>
      prisma.rolePermission.upsert({
        where: {
          role_page_key: { role, page_key },
        },
        create: { role, page_key, allowed },
        update: { allowed },
      })
    )
  );

  const { revalidateTag } = await import("next/cache");
  revalidateTag(ROLE_PERMISSION_CACHE_TAG, "max");
}

/** Seed defaults bila tabel masih kosong */
export async function ensureDefaultRolePermissions() {
  const count = await prisma.rolePermission.count();
  if (count > 0) {
    await backfillBarangMasukJenis();
    return;
  }

  const rows = (["ADMIN", "PETUGAS"] as const).flatMap((role) =>
    PAGE_KEYS.map((page_key) => ({
      role,
      page_key,
      allowed: getDefaultAllowed(role, page_key),
    }))
  );

  await prisma.rolePermission.createMany({ data: rows });
  await backfillBarangMasukJenis();
}

/** Transaksi masuk pertama per merchandise ditandai BARU (stok awal) */
async function backfillBarangMasukJenis() {
  await prisma.$executeRaw`
    UPDATE "BarangMasuk" bm
    SET jenis = 'BARU'
    FROM (
      SELECT DISTINCT ON ("id_merch") "id_masuk"
      FROM "BarangMasuk"
      ORDER BY "id_merch", "tanggal_masuk" ASC, "id_masuk" ASC
    ) first_rows
    WHERE bm."id_masuk" = first_rows."id_masuk"
      AND bm.jenis = 'RESTOCK'
  `;
}
