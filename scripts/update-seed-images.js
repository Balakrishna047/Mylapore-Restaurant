const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../cloudinary-image-manifest.json');
const seedPath = path.join(__dirname, '../apps/api/src/prisma/seed.ts');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let seedContent = fs.readFileSync(seedPath, 'utf8');

let replacedCount = 0;
for (const [key, val] of Object.entries(manifest)) {
  const localJpg = '/images/dishes/' + key + '.jpg';
  const localWebp = '/images/dishes/' + key + '.webp';
  
  if (seedContent.includes(localJpg)) {
    seedContent = seedContent.split(localJpg).join(val.cloudinaryUrl);
    replacedCount++;
  }
  if (seedContent.includes(localWebp)) {
    seedContent = seedContent.split(localWebp).join(val.cloudinaryUrl);
    replacedCount++;
  }
}

if (manifest['dosa-hero']) {
  seedContent = seedContent.split('/images/dosa-hero.jpg').join(manifest['dosa-hero'].cloudinaryUrl);
}
if (manifest['logo']) {
  seedContent = seedContent.split('/images/logo.png').join(manifest['logo'].cloudinaryUrl);
}

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log('Successfully updated seed.ts with', replacedCount, 'Cloudinary URLs!');
