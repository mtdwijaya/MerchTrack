import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-[#F3F4F6] text-[#1A1A1A]">{children}</div>
  );
}
