// components/layout/footer.tsx

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="h-20 bg-white border-t border-[#EFEAE5] px-14 flex items-center">
      <div className="flex items-center gap-6">
        <Image
          src="/layouts/MerchTrack.svg"
          alt="MerchTrack"
          width={170}
          height={40}
          priority
        />

        <div className="w-px h-6 bg-[#D9D9D9]" />

        <p className="text-[15px] text-[#5C4A4A] font-medium">
          © 2026 LRT Jabodebek - mtdwijaya
        </p>
      </div>
    </footer>
  );
}