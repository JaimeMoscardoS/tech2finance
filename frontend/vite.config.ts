import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL(".", import.meta.url));
const shared = fileURLToPath(new URL("../shared", import.meta.url));
const tutorSource = fileURLToPath(new URL("../tutor-ia/src", import.meta.url));
export default defineConfig({ server: { fs: { allow: [frontend, tutorSource, shared] }, proxy: { "/api": "http://127.0.0.1:8000" } } });
