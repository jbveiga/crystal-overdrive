const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// 144x32 sprite sheet: 9 frames of 16x32
const width = 144;
const height = 32;
const png = new PNG({ width, height });

// Transparent by default
for (let i = 0; i < png.data.length; i += 4) {
  png.data[i] = 0;
  png.data[i + 1] = 0;
  png.data[i + 2] = 0;
  png.data[i + 3] = 0;
}

// 16x16 boulder pixel art pattern (0=transparent, 1=outline, 2=shadow, 3=midtone, 4=highlight)
// Authentic GBC rock boulder graphic (centered in 16x16, placed at bottom of 16x32: y = 16..31)
const boulder16x16 = [
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,1,4,4,4,4,4,4,3,3,1,1,0,0],
  [0,1,4,4,4,4,4,4,4,3,3,3,3,3,1,0],
  [1,4,4,4,4,4,4,4,3,3,3,3,3,2,2,1],
  [1,4,4,4,4,4,3,3,3,3,3,3,2,2,2,1],
  [1,4,4,4,3,3,3,3,3,3,2,2,2,2,2,1],
  [1,4,4,3,3,3,3,1,1,2,2,2,2,2,2,1],
  [1,4,3,3,3,3,1,2,2,1,2,2,2,2,2,1],
  [1,4,3,3,3,1,2,2,2,2,1,2,2,2,2,1],
  [1,4,3,3,3,1,2,2,2,2,2,1,2,2,2,1],
  [1,3,3,3,3,3,1,2,2,2,2,2,2,2,2,1],
  [1,3,3,3,3,3,3,1,1,2,2,2,2,2,2,1],
  [1,2,3,3,3,3,3,3,2,2,2,2,2,2,2,1],
  [0,1,2,2,3,3,2,2,2,2,2,2,2,2,1,0],
  [0,0,1,1,2,2,2,2,2,2,2,2,1,1,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
];

const PALETTE = {
  0: [0, 0, 0, 0],              // Transparent
  1: [38, 28, 20, 255],         // Outer outline (#261C14)
  2: [90, 61, 40, 255],         // Shadow & cracks (#5A3D28)
  3: [156, 116, 74, 255],       // Earth rock midtone (#9C744A)
  4: [224, 186, 136, 255],      // Highlight (#E0BA88)
};

for (let frame = 0; frame < 9; frame++) {
  const xOffset = frame * 16;
  const yOffset = 16; // Bottom half of 32px height

  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const pxType = boulder16x16[r][c];
      const color = PALETTE[pxType];
      const idx = ((yOffset + r) * width + (xOffset + c)) * 4;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
}

const outputPath = path.resolve(__dirname, '../public/assets/sprites/characters/boulder.png');
fs.writeFileSync(outputPath, PNG.sync.write(png));
console.log('Successfully generated authentic boulder.png at', outputPath);
