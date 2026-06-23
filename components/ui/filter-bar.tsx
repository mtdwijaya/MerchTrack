import { ChevronDown, Filter } from "lucide-react";
import { ReactNode } from "react";

export function FilterBar({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset?: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#374151]">
        <Filter size={16} className="text-[#6B7280]" />
        Filter &amp; Pencarian
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
        {children}
        {onReset && <FilterReset onClick={onReset} />}
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
  className = "min-w-0 flex-1",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-normal text-[#6B7280]">{label}</label>
      {children}
    </div>
  );
}

const filterControlClass =
  "h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1C1C] outline-none transition focus:border-[#B1070E]";

export function FilterSearch({
  label = "Pencarian",
  value,
  onChange,
  placeholder,
  id = "filter-search",
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className ?? "min-w-0 flex-[1.4]"}>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${filterControlClass} pl-9`}
        />
      </div>
    </FilterField>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  id,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id: string;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className ?? "min-w-0 flex-1"}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${filterControlClass} appearance-none pr-9`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
      </div>
    </FilterField>
  );
}

export function FilterDateRange({
  label = "Tanggal",
  value,
  onChange,
  id = "filter-date-range",
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className ?? "min-w-0 flex-1"}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={filterControlClass}
      />
    </FilterField>
  );
}

export function FilterReset({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB] ${className ?? ""}`}
    >
      Reset Filter
    </button>
  );
}

export function FilterSlot({
  children,
  className = "min-w-0 flex-1",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
