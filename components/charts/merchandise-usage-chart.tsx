"use client";

const COLORS = [
  "#D71920",
  "#E24B4B",
  "#EE7A7A",
  "#F4A7A7",
  "#F8CACA",
];

interface MerchandiseUsageItem {
  nama: string;
  total: number;
}

export default function MerchandiseUsageChart({
  data,
}: {
  data: MerchandiseUsageItem[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#6B7280]">
        Belum ada data merchandise
      </p>
    );
  }

  const maxTotal = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.nama}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
              <span className="truncate text-sm font-medium text-[#1A1C1C]">
                {item.nama}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#1A1C1C]">
              {item.total} pcs
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.total / maxTotal) * 100}%`,
                backgroundColor: COLORS[index % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
