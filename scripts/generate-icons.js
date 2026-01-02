const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/scale-light.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from:', inputFile);

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 10, b: 30, alpha: 1 } // #0f0a1e - dark purple background
      })
      .png()
      .toFile(outputFile);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate Apple Touch Icon (180x180)
  const appleTouchIcon = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(inputFile)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 10, b: 30, alpha: 1 }
    })
    .png()
    .toFile(appleTouchIcon);
  console.log('Generated: apple-touch-icon.png');

  // Generate favicon.ico (32x32)
  const favicon = path.join(__dirname, '../public/favicon.ico');
  await sharp(inputFile)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 10, b: 30, alpha: 1 }
    })
    .png()
    .toFile(favicon);
  console.log('Generated: favicon.ico');

  console.log('Done! All icons generated.');
}

generateIcons().catch(console.error);
