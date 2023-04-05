import fs from "fs/promises";
import path from "path";
import { createSanrioCalendar } from "./sanrio";
import { createSylvanianCalendar } from "./sylvanian";

const distDir = "dist";

(async function () {
  try {
    await fs.stat(distDir);
  } catch {
    await fs.mkdir(distDir);
  }

  const cSanrio = await createSanrioCalendar();
  await cSanrio.writeFile(path.join(distDir, "sanrio.ics"));

  const cSylv = await createSylvanianCalendar();
  await cSylv.writeFile(path.join(distDir, "sylvanian.ics"));
})();
