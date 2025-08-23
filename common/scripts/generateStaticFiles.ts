import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

async function getAllFilePaths(dir: string): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = await Promise.all(
    files.map(async (file) => {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        return getAllFilePaths(path);
      }
      return path;
    })
  );

  return paths.flat();
}

// Main execution
const staticDir = join(__dirname, "../static");
const serviceWorkerPath = join(__dirname, "../lib/sw/index.ts");

const allFiles = await getAllFilePaths(staticDir);
const relativePaths = allFiles.map(
  (file) => "/" + relative(staticDir, file).replace(/\\/g, "/")
);

await mkdir(dirname(serviceWorkerPath), { recursive: true });

await writeFile(
  serviceWorkerPath,
  `export const assets = ${JSON.stringify(relativePaths)};`,
  "utf-8"
);
console.log("Static assets list updated successfully");
