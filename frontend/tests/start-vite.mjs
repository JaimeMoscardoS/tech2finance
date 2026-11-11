import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const [bank, port] = process.argv.slice(2);
if (
  !["demo", "caixabank", "unknown"].includes(bank) ||
  !["5175", "5177", "5178"].includes(port)
)
  throw new Error("Invalid test configuration");
const vite = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const child = spawn(
  process.execPath,
  [vite, "--host", "127.0.0.1", "--port", port, "--strictPort"],
  { stdio: "inherit", env: { ...process.env, VITE_BANK_ID: bank } },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
