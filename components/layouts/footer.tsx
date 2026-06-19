export default function Footer() {
  return (
    <footer
      className="
        mt-8
        border-t
        border-[#E5E7EB]
        bg-white
      "
    >
      <div
        className="
          h-14
          px-8
          flex
          items-center
          gap-5
        "
      >
        <img
          src="/logos/MerchTrack.svg"
          alt="LRT Jabodebek"
          width={100}
          height={50}
        />

        <div className="w-px h-5 bg-[#D1D5DB]" />

        <span
          className="
            text-xs
            text-[#6B7280]
          "
        >
          © {new Date().getFullYear()} LRT
          Jabodebek - mtdwidjaya
        </span>
      </div>
    </footer>
  );
}