import { readFile, readdir, writeFile } from "fs/promises";
import { join, relative } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

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
const serviceWorkerPath = join(__dirname, "../src/service-worker.js");

const allFiles = await getAllFilePaths(staticDir);
const relativePaths = allFiles.map((file) => "/" + relative(staticDir, file).replace(/\\/g, "/"));

const serviceWorkerContent = await readFile(serviceWorkerPath, "utf-8");
const lines = serviceWorkerContent.split("\n");
lines[8] = `const assets = ${JSON.stringify(relativePaths)};`;

await writeFile(serviceWorkerPath, lines.join("\n"), "utf-8");
console.log("Static assets list updated successfully");
