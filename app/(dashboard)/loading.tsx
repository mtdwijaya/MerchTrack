export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-[#EFEAE5]" />
        <div className="h-4 w-80 rounded bg-[#F3F4F6]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl border border-[#EFEAE5] bg-white"
          />
        ))}
      </div>

      <div className="h-12 rounded-xl border border-[#EFEAE5] bg-white" />
      <div className="h-80 rounded-2xl border border-[#EFEAE5] bg-white" />
    </div>
  );
}
