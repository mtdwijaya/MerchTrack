export function formatRelativeTime(date: Date, now = Date.now()): string {
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return "-";
  }

  const diffMs = now - time;

  // Timestamp di masa depan (salah zona / input tanggal) — jangan tampil "baru saja" selamanya
  if (diffMs < 0) {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diffMs < 60_000) return "baru saja";

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// gabungkan tanggal dari input date dengan jam saat ini (zona lokal)
export function parseFormDateWithNowTime(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const now = new Date();

  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}
