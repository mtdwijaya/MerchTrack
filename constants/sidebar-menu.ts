export interface SidebarMenu {
  name: string;
  href: string;
  icon: string;
}

/**
 * @deprecated Pakai getSidebarMenusForRole() dari lib/permissions
 * — file ini hanya menyimpan tipe SidebarMenu agar import lama tidak putus.
 */
export const sidebarMenus = {
  ADMIN: { main: [] as SidebarMenu[], master: [] as SidebarMenu[] },
  PETUGAS: { main: [] as SidebarMenu[], master: [] as SidebarMenu[] },
};
