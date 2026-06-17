export default function Header() {
  return (
    <header
      className="
      h-20
      border-b
      bg-white
      flex
      items-center
      justify-between
      px-8
    "
    >
      <div>
        Dashboard
      </div>

      <div className="flex items-center gap-3">
        <div>
          <p className="font-semibold">
            Admin User
          </p>

          <p className="text-sm text-gray-500">
            Administrator
          </p>
        </div>

        <div
          className="
          w-12
          h-12
          rounded-full
          border-2
          border-red-600
        "
        />
      </div>
    </header>
  );
}