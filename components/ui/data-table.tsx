"use client";

import { ReactNode } from "react";

import { SortOrder } from "@/lib/sort";
import { cn } from "@/lib/utils";

type TableAlign = "left" | "center" | "right";

const alignClass: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const thBase =
  "px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280] first:pl-6 last:pr-6";
const tdBase =
  "px-4 py-4 text-sm leading-relaxed text-[#1A1C1C] first:pl-6 last:pr-6";

export function DataTableSection({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#EFEAE5] bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full min-w-[720px] border-collapse", className)}>
      {children}
    </table>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: TableAlign;
  className?: string;
}) {
  return (
    <th className={cn(thBase, alignClass[align], className)}>{children}</th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  align?: TableAlign;
  variant?: "default" | "numeric" | "action" | "truncate";
}) {
  return (
    <td
      className={cn(
        tdBase,
        alignClass[align],
        variant === "numeric" && "tabular-nums whitespace-nowrap",
        variant === "action" && "whitespace-nowrap",
        variant === "truncate" && "max-w-[180px] truncate",
        className
      )}
    >
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
  align = "left",
}: {
  label: string;
  field: T;
  activeField: T;
  activeOrder: SortOrder;
  onSort: (field: T) => void;
  align?: TableAlign;
}) {
  const isActive = activeField === field;

  return (
    <th className={cn(thBase, alignClass[align])}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280] hover:text-[#B1070E]",
          align === "center" && "w-full justify-center",
          align === "right" && "w-full justify-end"
        )}
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
