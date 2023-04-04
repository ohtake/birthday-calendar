import { createSylvanianCalendar } from "./sylvanian";
import fs from "fs/promises";
import path from "path";

const distDir = "dist";

(async function () {
  try {
    await fs.stat(distDir);
  } catch {
    await fs.mkdir(distDir);
  }

  const c = await createSylvanianCalendar();
  await c.writeFile(path.join(distDir, "sylvanian.ics"));
})();
