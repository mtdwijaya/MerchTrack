"use client";

import { ReactNode } from "react";

import { SortOrder } from "@/lib/sort";

export function DataTableSection({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#EFEAE5] bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-5 py-4 text-sm text-[#1A1C1C] ${className ?? ""}`}>
      {children}
    </td>
  );
}

export function SortableTh<T extends string>({
  label,
  field,
  activeField,
  activeOrder,
  onSort,
}: {
  label: string;
  field: T;
  activeField: T;
  activeOrder: SortOrder;
  onSort: (field: T) => void;
}) {
  const isActive = activeField === field;

  return (
    <th className="px-5 py-4 text-left">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="
          inline-flex items-center gap-1
          text-xs font-semibold uppercase tracking-wide
          text-[#6B7280] hover:text-[#B1070E]
        "
      >
        {label}
        <SortIcon isActive={isActive} order={activeOrder} />
      </button>
    </th>
  );
}

function SortIcon({
  isActive,
  order,
}: {
  isActive: boolean;
  order: SortOrder;
}) {
  return (
    <span className="inline-flex flex-col leading-none">
      <svg
        className={`h-2.5 w-2.5 ${
          isActive && order === "asc" ? "text-[#B1070E]" : "text-[#D1D5DB]"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`-mt-0.5 h-2.5 w-2.5 ${
          isActive && order === "desc" ? "text-[#B1070E]" : "text-[#D1D5DB]"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

export function TableEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-gray-500">
        {message}
      </td>
    </tr>
  );
}
