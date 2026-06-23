"use client";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = "item",
}: Props) {
  const pages = getPageNumbers(currentPage, totalPages);

  const startItem =
    totalItems && pageSize
      ? totalItems === 0
        ? 0
        : (currentPage - 1) * pageSize + 1
      : null;

  const endItem =
    totalItems && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {startItem !== null && endItem !== null && totalItems !== undefined ? (
        <p className="text-sm text-[#6B7280]">
          Menampilkan {startItem} - {endItem} dari {totalItems} {itemLabel}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="
            rounded-lg border border-[#E2E2E2]
            px-3 py-2 text-sm text-[#1A1C1C]
            hover:bg-gray-50
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          Previous
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-sm text-[#6B7280]"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                min-w-[36px] rounded-lg px-3 py-2 text-sm
                ${
                  page === currentPage
                    ? "bg-[#B1070E] font-medium text-white"
                    : "border border-[#E2E2E2] text-[#1A1C1C] hover:bg-gray-50"
                }
              `}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="
            rounded-lg border border-[#E2E2E2]
            px-3 py-2 text-sm text-[#1A1C1C]
            hover:bg-gray-50
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          Next
        </button>
      </div>
    </div>
  );
}
