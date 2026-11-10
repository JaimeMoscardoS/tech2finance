import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL(".", import.meta.url));
const tutorSource = fileURLToPath(new URL("../tutor-ia/src", import.meta.url));
export default defineConfig({ server: { fs: { allow: [frontend, tutorSource] } } });
