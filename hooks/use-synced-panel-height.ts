"use client";

import { useEffect, useState, type RefObject } from "react";

/** samakan tinggi panel kanan dengan panel kiri di layar xl */
export function useSyncedPanelHeight(
  referenceRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const [height, setHeight] = useState<number | undefined>();

  useEffect(() => {
    const node = referenceRef.current;
    if (!node || !enabled) {
      setHeight(undefined);
      return;
    }

    const xlQuery = window.matchMedia("(min-width: 1280px)");

    const sync = () => {
      if (!xlQuery.matches) {
        setHeight(undefined);
        return;
      }

      setHeight(Math.round(node.getBoundingClientRect().height));
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(node);
    xlQuery.addEventListener("change", sync);
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      xlQuery.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [referenceRef, enabled]);

  return height;
}
