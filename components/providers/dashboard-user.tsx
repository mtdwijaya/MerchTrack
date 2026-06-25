"use client";

import { createContext, useContext } from "react";

export interface DashboardUser {
  id_user: number;
  nama_user: string;
  email: string;
  role: "ADMIN" | "PETUGAS";
}

const DashboardUserContext = createContext<DashboardUser | null>(null);

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  return (
    <DashboardUserContext.Provider value={user}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  const user = useContext(DashboardUserContext);
  if (!user) {
    throw new Error("useDashboardUser must be used within DashboardUserProvider");
  }
  return user;
}
