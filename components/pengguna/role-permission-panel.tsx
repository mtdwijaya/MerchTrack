"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateRolePermissionsAction } from "@/app/admin/(dashboard)/pengguna/actions";
import { Button } from "@/components/ui/button";
import type { PageKey } from "@/constants/permissions";
import { showError, showSuccess } from "@/lib/toast";

type RoleKey = "ADMIN" | "PETUGAS";

interface PageInfo {
  key: PageKey;
  label: string;
  section: "main" | "master";
}

interface Props {
  pages: PageInfo[];
  permissions: Record<RoleKey, Record<PageKey, boolean>>;
}

export default function RolePermissionPanel({ pages, permissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(permissions);
  const [saving, setSaving] = useState(false);

  function toggle(role: RoleKey, pageKey: PageKey) {
    setDraft((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [pageKey]: !prev[role][pageKey],
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateRolePermissionsAction(draft);
    setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess("Hak akses halaman berhasil disimpan");
    startTransition(() => router.refresh());
  }

  const mainPages = pages.filter((page) => page.section === "main");
  const masterPages = pages.filter((page) => page.section === "master");

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1C1C]">
            Hak Akses Halaman
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            Atur halaman yang dapat diakses oleh Admin dan Petugas.
          </p>
        </div>
        <Button
          type="button"
          variant="brand"
          size="sm"
          disabled={saving || isPending}
          onClick={handleSave}
        >
          {saving ? "Menyimpan..." : "Simpan Hak Akses"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA] text-left text-xs uppercase tracking-wide text-[#6B7280]">
              <th className="px-4 py-3 font-semibold">Halaman</th>
              <th className="px-4 py-3 text-center font-semibold">Admin</th>
              <th className="px-4 py-3 text-center font-semibold">Petugas</th>
            </tr>
          </thead>
          <tbody>
            <PermissionSection
              title="Navigasi Utama"
              pages={mainPages}
              draft={draft}
              onToggle={toggle}
            />
            <PermissionSection
              title="Master Data"
              pages={masterPages}
              draft={draft}
              onToggle={toggle}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PermissionSection({
  title,
  pages,
  draft,
  onToggle,
}: {
  title: string;
  pages: PageInfo[];
  draft: Record<RoleKey, Record<PageKey, boolean>>;
  onToggle: (role: RoleKey, pageKey: PageKey) => void;
}) {
  if (pages.length === 0) return null;

  return (
    <>
      <tr className="border-b border-[#EFEAE5] bg-[#F9FAFB]">
        <td
          colSpan={3}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
        >
          {title}
        </td>
      </tr>
      {pages.map((page) => (
        <tr
          key={page.key}
          className="border-b border-[#EFEAE5] last:border-b-0 hover:bg-gray-50/60"
        >
          <td className="px-4 py-3 font-medium text-[#1A1C1C]">{page.label}</td>
          <td className="px-4 py-3 text-center">
            <PermissionCheckbox
              checked={draft.ADMIN[page.key]}
              onChange={() => onToggle("ADMIN", page.key)}
              label={`Akses Admin ke ${page.label}`}
            />
          </td>
          <td className="px-4 py-3 text-center">
            <PermissionCheckbox
              checked={draft.PETUGAS[page.key]}
              onChange={() => onToggle("PETUGAS", page.key)}
              label={`Akses Petugas ke ${page.label}`}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

function PermissionCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="h-4 w-4 rounded border-[#D1D5DB] text-[#B1070E] focus:ring-[#B1070E]"
      />
    </label>
  );
}
