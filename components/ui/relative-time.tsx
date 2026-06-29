"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/relative-time";

export function RelativeTime({
  iso,
  tickMs = 30_000,
}: {
  iso: string;
  tickMs?: number;
}) {
  const [label, setLabel] = useState(() =>
    formatRelativeTime(new Date(iso))
  );

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(new Date(iso)));
    update();

    const interval = setInterval(update, tickMs);
    return () => clearInterval(interval);
  }, [iso, tickMs]);

  return <>{label}</>;
}
