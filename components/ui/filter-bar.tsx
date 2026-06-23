import { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#EFEAE5] bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">{children}</div>
    </section>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  id = "filter-search",
  className = "lg:col-span-5",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
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
        className="input-field pl-11"
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  id,
  className = "lg:col-span-2",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterDateRange({
  value,
  onChange,
  id = "filter-date-range",
  className = "lg:col-span-3",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

export function FilterSlot({
  children,
  className = "lg:col-span-2",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
