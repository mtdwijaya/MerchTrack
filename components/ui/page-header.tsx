import Link from "next/link";
import { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// header standar tiap halaman list/dashboard
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

// tombol utama merah LRT — dipakai di header halaman CRUD
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
  const className = cn(buttonVariants({ variant: "brand", size: "lg" }), "px-5");

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="brand"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="px-5"
    >
      {children}
    </Button>
  );
}
