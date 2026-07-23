import QuickAccessClient from "./quick-access-client";
import { getMerchandiseCatalog } from "@/lib/merchandise";
import { getPetugasNameOptions } from "@/lib/petugas-options";
import { getAllStasiun } from "@/lib/stasiun";
import { getAllTujuan } from "@/lib/tujuan";
import { getAllUnit } from "@/lib/unit";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TabletHomePage() {
  const [user, merchandise, petugasOptions, tujuanList, stasiunList, unitList] =
    await Promise.all([
      getCurrentUser(),
      getMerchandiseCatalog(),
      getPetugasNameOptions(),
      getAllTujuan(),
      getAllStasiun(),
      getAllUnit(),
    ]);

  return (
    <QuickAccessClient
      userName={user?.nama_user ?? "Petugas"}
      merchandise={merchandise}
      petugasOptions={petugasOptions}
      tujuanList={tujuanList}
      stasiunList={stasiunList}
      unitList={unitList}
    />
  );
}
