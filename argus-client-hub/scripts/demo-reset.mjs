// Deletes the demo data folder. The next request re-creates it from the seed.
import { rm } from "node:fs/promises";
import path from "node:path";

await rm(path.join(process.cwd(), ".data"), { recursive: true, force: true });
console.log("Demo data cleared. Restart `npm run dev` (or just reload) to get fresh sample data.");
