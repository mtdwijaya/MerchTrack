import Link from "next/link";
import { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-[32px] font-semibold leading-10 text-[#1A1C1C]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[#5B4040]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
  onClick,
  disabled,
}: {
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className =
    "rounded-lg bg-[#B1070E] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#93060c] disabled:opacity-50";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        rounded-lg border border-[#E2E2E2]
        bg-white px-5 py-3 text-sm font-semibold text-[#1A1C1C]
        hover:bg-gray-50 disabled:opacity-50
      "
    >
      {children}
    </button>
  );
}
