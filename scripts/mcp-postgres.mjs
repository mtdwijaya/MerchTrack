import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "DATABASE_URL tidak ditemukan. Pastikan file .env ada di root proyek."
  );
  process.exit(1);
}

const child = spawn("npx", ["-y", "@yawlabs/postgres-mcp@latest"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Gagal menjalankan MCP PostgreSQL:", error.message);
  process.exit(1);
});
