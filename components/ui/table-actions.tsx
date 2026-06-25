import Link from "next/link";

export function EditAction({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] text-[#2563EB] hover:border-[#2563EB] hover:bg-blue-50";

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
      className="
        flex h-8 w-8 items-center justify-center
        rounded-lg border border-[#E2E2E2]
        text-[#059669] hover:border-[#059669] hover:bg-emerald-50
      "
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

export function DeleteAction({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex h-8 w-8 items-center justify-center
        rounded-lg border border-[#E2E2E2]
        text-[#DC2626] hover:border-[#DC2626] hover:bg-red-50
      "
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
