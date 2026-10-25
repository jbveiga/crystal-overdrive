const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const CHAR_DIR = path.resolve(__dirname, '../public/assets/sprites/characters');

async function processSprite(url, isSlowpoke, outFilename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const srcPng = PNG.sync.read(Buffer.from(await res.arrayBuffer()));

  const outPng = new PNG({ width: 144, height: 32 });

  // Key color to treat as transparent (CrystalDust GBA background: rgb(115, 197, 164))
  const keyR = srcPng.data[0];
  const keyG = srcPng.data[1];
  const keyB = srcPng.data[2];

  for (let destFrame = 0; destFrame < 9; destFrame++) {
    let srcFrame = destFrame;
    if (isSlowpoke) {
      // Slowpoke has 3 frames: 0 (Stand), 1 (Walk 1), 2 (Walk 2)
      if (destFrame === 0 || destFrame === 1 || destFrame === 2) {
        srcFrame = 0; // Stand
      } else if (destFrame === 3 || destFrame === 5 || destFrame === 7) {
        srcFrame = 1; // Walk 1
      } else {
        srcFrame = 2; // Walk 2
      }
    }

    const srcStartX = srcFrame * 16;
    const destStartX = destFrame * 16;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const srcIdx = ((y * srcPng.width) + (srcStartX + x)) * 4;
        const r = srcPng.data[srcIdx];
        const g = srcPng.data[srcIdx + 1];
        const b = srcPng.data[srcIdx + 2];
        const a = srcPng.data[srcIdx + 3];

        // Place on the bottom half of the 16x32 frame (y + 16)
        const destY = y + 16;
        const destIdx = ((destY * 144) + (destStartX + x)) * 4;

        // Check if transparent or matches background color key
        const isKeyColor = (r === keyR && g === keyG && b === keyB) || (r === 115 && g === 197 && b === 164);
        if (a === 0 || isKeyColor) {
          outPng.data[destIdx] = 0;
          outPng.data[destIdx + 1] = 0;
          outPng.data[destIdx + 2] = 0;
          outPng.data[destIdx + 3] = 0;
        } else {
          outPng.data[destIdx] = r;
          outPng.data[destIdx + 1] = g;
          outPng.data[destIdx + 2] = b;
          outPng.data[destIdx + 3] = 255;
        }
      }
    }
  }

  const outPath = path.join(CHAR_DIR, outFilename);
  fs.writeFileSync(outPath, PNG.sync.write(outPng));
  console.log(`Saved ${outPath} (144x32)`);
}

async function run() {
  fs.mkdirSync(CHAR_DIR, { recursive: true });

  await processSprite(
    'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/pokemon/slowpoke.png',
    true,
    'slowpoke.png'
  );

  await processSprite(
    'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/pokemon/farfetchd.png',
    false,
    'farfetchd.png'
  );

  console.log('Successfully generated authentic overworld character sprites for Slowpoke and Farfetchd!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
