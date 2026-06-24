"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/sidebar";
import Header from "@/components/layouts/header";
import Footer from "@/components/layouts/footer";

interface User {
  id_user: number;
  nama_user: string;
  email: string;
  role: "ADMIN" | "PETUGAS";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] =
    useState<User | null>(null);

  const [collapsed, setCollapsed] =
    useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(
          "/api/auth/me"
        );

        if (!response.ok) {
          await fetch("/api/auth/logout", {
            method: "POST",
          });
          router.replace("/login");
          return;
        }

        const data =
          await response.json();

        setUser(data);
      } catch (error) {
        console.error(error);
        router.replace("/login");
      }
    };

    getUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      {user ? (
        <>
          <Sidebar
            user={user}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          <div
            className={`
              transition-all
              duration-300
              ${
                collapsed
                  ? "ml-16.5"
                  : "ml-75.5"
              }
            `}
          >
            <Header user={user} />

<div className="min-h-screen flex flex-col">
  <main className="flex-1 p-6">
    {children}
  </main>

  <Footer />
</div>
          </div>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center p-6">
          Loading...
        </div>
      )}
    </div>
  );
}