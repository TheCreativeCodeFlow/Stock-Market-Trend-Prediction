const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    for (const size of sizes) {
        // Create a simple gradient icon with text
        const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#60a5fa"/>
            <stop offset="100%" style="stop-color:#a78bfa"/>
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="url(#grad)"/>
        <text x="${size / 2}" y="${size * 0.65}" font-size="${Math.round(size * 0.5)}" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle" fill="white">AI</text>
      </svg>
    `;

        await sharp(Buffer.from(svg))
            .png()
            .toFile(path.join(outputDir, `icon${size}.png`));

        console.log(`Generated icon${size}.png`);
    }

    console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
