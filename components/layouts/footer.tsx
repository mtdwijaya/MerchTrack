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
          width={243}
          height={30}
          className="h-5 w-auto"
        />

        <div className="w-px h-5 bg-[#D1D5DB]" />

        <span
          className="
            text-xs
            text-[#6B7280]
          "
        >
          © {new Date().getFullYear()} LRT
          Jabodebek - Universitas Sriwijaya - Muhammad Tias Djahfran Wijaya 
        </span>
      </div>
    </footer>
  );
}