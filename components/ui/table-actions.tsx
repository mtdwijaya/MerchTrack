import Link from "next/link";
import { Eye, SlidersHorizontal } from "lucide-react";

import { actionButton } from "@/constants/design-tokens";

export function TextOutlineAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${actionButton.outline} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export function EditAction({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const className = actionButton.icon;

  const icon = (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} title="Edit">
        {icon}
      </button>
    );
  }

  return (
    <Link href={href!} className={className} title="Edit">
      {icon}
    </Link>
  );
}

export function RestockAction({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={actionButton.icon}
      title="Restock"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}

export function DetailsAction({
  onClick,
  label = "Details",
  variant = "view",
}: {
  onClick: () => void;
  label?: string;
  variant?: "view" | "manage";
}) {
  const Icon = variant === "manage" ? SlidersHorizontal : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${actionButton.outline} inline-flex items-center gap-1.5`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function TableTextAction({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "return" | "edit" | "delete";
  disabled?: boolean;
}) {
  const styles = {
    return: actionButton.textLink,
    edit: actionButton.textLink,
    delete: actionButton.textDestructive,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

export function ReturnAction({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${actionButton.icon} disabled:cursor-not-allowed disabled:opacity-40`}
      title="Kembalikan Barang"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    </button>
  );
}

export function DeleteAction({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={actionButton.iconDestructive}
      title="Hapus"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}
