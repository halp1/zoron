import fs from "fs";
import path from "path";
import sharp from "sharp";

const relative = (p) => path.resolve(__dirname, "../static", p);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = relative("./favicon.png");
const outputDir = relative("./icons");
const manifestPath = relative("./site.webmanifest");

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process images and collect manifest data
const icons = sizes.map((size) => {
  const filename = `icon-${size}x${size}.png`;
  const outputFile = path.join(outputDir, filename);

  // Generate the resized image
  sharp(inputPath)
    .resize(size, size)
    .toFile(outputFile, (err) => {
      if (err) {
        console.error(`Error processing ${filename}:`, err);
      } else {
        console.log(`${filename} generated successfully!`);
      }
    });

  // Return the manifest entry for this icon
  return {
    src: `icons/${filename}`,
    sizes: `${size}x${size}`,
    type: "image/png"
  };
});

// Update the manifest file
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  // Update the icons property
  manifest.icons = icons;

  // Write the updated manifest back to the file
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Updated ${manifestPath} with new icons.`);
} else {
  console.error(`Error: ${manifestPath} not found.`);
}
