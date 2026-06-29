function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum di-set di file .env`);
  }
  return value;
}

// validasi env saat pertama kali di-import — gagal cepat, bukan saat login random
export const env = {
  get DATABASE_URL() {
    return requireEnv("DATABASE_URL");
  },
  get JWT_SECRET() {
    return requireEnv("JWT_SECRET");
  },
};
