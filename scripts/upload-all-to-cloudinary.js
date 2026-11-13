const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUD_NAME = 'dwlh5wdsw';
const API_KEY = '854992222623488';
const API_SECRET = 'ObYUIbUCL5nrdLeeKfdoJcp46Rs';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':' + API_SECRET).toString('base64');

// Mature enterprise naming dictionary mapping dish slug / file base to mature public_id
const MATURE_NAME_MAP = {
  'idly-batter': 'batters-stoneground-fresh-idly-batter',
  'crispy-dosa-batter': 'batters-crispy-fermented-dosa-batter',
  'adai-batter': 'batters-multigrain-protein-adai-batter',
  'idli-milagai-podi': 'podis-gunpowder-idli-milagai-podi',
  'mylapore-filter-coffee': 'beverages-authentic-mylapore-degree-filter-coffee',
  'spiced-buttermilk': 'beverages-tempered-neer-moru-spiced-buttermilk',
  'rose-milk': 'beverages-chilled-cardamom-rose-milk',
  'mango-lassi': 'beverages-alphonso-mango-yogurt-lassi',
  'mylapore-murungakkai-sambar': 'sambar-traditional-drumstick-murungakkai-sambar',
  'arachuvitta-sambar': 'sambar-fresh-roasted-spice-arachuvitta-sambar',
  'chinna-vengayam-sambar': 'sambar-shallots-pearl-onion-sambar',
  'mysore-rasam': 'rasam-mysore-aromatic-lentil-rasam',
  'thakkali-rasam': 'rasam-tangy-temple-tomato-thakkali-rasam',
  'poondu-milagu-rasam': 'rasam-garlic-black-pepper-poondu-milagu-rasam',
  'puliyodarai': 'rice-temple-style-tamarind-puliyodarai',
  'bisi-bele-bath': 'rice-mysore-spiced-vegetable-bisi-bele-bath',
  'lemon-rice': 'rice-citrus-tempered-elamichai-lemon-rice',
  'thayir-sadam': 'rice-tempered-curd-thayir-sadam',
  'venn-pongal': 'breakfast-ghee-cumin-pepper-venn-pongal',
  'rava-khichdi': 'breakfast-semolina-vegetable-rava-khichdi',
  'thengai-chutney': 'chutneys-fresh-grated-coconut-thengai-chutney',
  'thakkali-chutney': 'chutneys-spicy-roasted-tomato-thakkali-chutney',
  'kothamalli-pudina-chutney': 'chutneys-coriander-mint-kothamalli-pudina-chutney',
  'potato-kara-kari': 'curries-spicy-roasted-potato-kara-kari',
  'south-indian-veg-kurma': 'curries-coconut-spiced-south-indian-veg-kurma',
  'traditional-avial': 'curries-kerala-coconut-vegetable-traditional-avial',
  'vathal-kuzhambu': 'curries-turkey-berry-tamarind-vathal-kuzhambu',
  'beans-usili': 'curries-steamed-lentil-crumble-beans-usili',
  'beans-poriyal': 'curries-coconut-tempered-french-beans-poriyal',
  'chow-chow-kootu': 'curries-chayote-moong-dal-chow-chow-kootu',
  'murungai-keerai-kootu': 'curries-drumstick-leaves-lentil-murungai-keerai-kootu',
  'guttivankaya-kura': 'curries-andhra-stuffed-baby-brinjal-guttivankaya-kura',
  'black-channa-masala': 'curries-kala-chana-black-channa-masala',
  'punjabi-chole': 'curries-north-indian-punjabi-chole',
  'rajma': 'curries-slow-simmered-kashmiri-rajma',
  'matar-paneer': 'curries-cottage-cheese-peas-matar-paneer',
  'methi-paneer': 'curries-fenugreek-cottage-cheese-methi-paneer',
  'saag-paneer': 'curries-spinach-greens-cottage-cheese-saag-paneer',
  'paal-payasam': 'desserts-slow-simmered-milk-paal-payasam',
  'asoka-halwa': 'desserts-thiruvaiyaru-asoka-halwa',
  'ghee-mysore-pak': 'desserts-pure-desi-ghee-mysore-pak',
  'saffron-rava-kesari': 'desserts-aromatic-saffron-rava-kesari',
  'avakkai-mango-pickle': 'pickles-spicy-andhra-avakkai-mango-pickle',
  'elumichai-oorugai': 'pickles-sun-cured-salted-lemon-elumichai-oorugai',
  'puli-inji': 'pickles-sweet-tangy-ginger-tamarind-puli-inji',
  'mylapore-weekend-thali': 'specials-grand-festive-mylapore-weekend-thali'
};

function uploadSingleImage(filePath, publicId, folder) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.webp' ? 'image/webp' : (ext === '.png' ? 'image/png' : 'image/jpeg');
    const fileData = fs.readFileSync(filePath);
    const base64Data = `data:${mime};base64,` + fileData.toString('base64');

    const postData = JSON.stringify({
      file: base64Data,
      public_id: publicId,
      folder: folder,
      overwrite: true
    });

    const req = https.request({
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          // Insert f_auto,q_auto into the secure_url
          const optimizedUrl = parsed.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
          resolve({
            publicId: parsed.public_id,
            secureUrl: parsed.secure_url,
            optimizedUrl: optimizedUrl,
            format: parsed.format,
            bytes: parsed.bytes
          });
        } else {
          reject(new Error(`Failed with ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting batch upload of all dishes and brand assets to Cloudinary...');
  const manifest = {};
  const dishesDir = path.join(__dirname, '../apps/web/public/images/dishes');

  const keys = Object.keys(MATURE_NAME_MAP);
  console.log(`Found ${keys.length} dishes to upload with mature naming.`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const matureId = MATURE_NAME_MAP[key];

    // Prefer webp, fallback to jpg
    let localPath = path.join(dishesDir, `${key}.webp`);
    if (!fs.existsSync(localPath)) {
      localPath = path.join(dishesDir, `${key}.jpg`);
    }

    if (!fs.existsSync(localPath)) {
      console.warn(`⚠️ File not found for ${key}`);
      continue;
    }

    try {
      console.log(`[${i + 1}/${keys.length}] Uploading ${key} -> ${matureId}...`);
      const result = await uploadSingleImage(localPath, matureId, 'mylapore-express/dishes');
      manifest[key] = {
        matureId,
        cloudinaryUrl: result.optimizedUrl,
        rawUrl: result.secureUrl,
        bytes: result.bytes
      };
      console.log(`  ✅ Done: ${result.optimizedUrl}`);
    } catch (err) {
      console.error(`  ❌ Error uploading ${key}:`, err.message);
    }
  }

  // Brand assets
  const brandAssets = [
    { name: 'logo', file: 'apps/web/public/images/logo.png', matureId: 'brand-mylapore-express-official-logo' },
    { name: 'dosa-hero', file: 'apps/web/public/images/dosa-hero.jpg', matureId: 'brand-crispy-golden-dosa-hero-banner' },
    { name: 'temple-watermark', file: 'apps/web/public/images/temple-watermark.jpg', matureId: 'brand-kapaleeshwarar-temple-watermark' }
  ];

  for (const b of brandAssets) {
    if (fs.existsSync(b.file)) {
      try {
        console.log(`Uploading brand asset ${b.name}...`);
        const result = await uploadSingleImage(b.file, b.matureId, 'mylapore-express/brand');
        manifest[b.name] = {
          matureId: b.matureId,
          cloudinaryUrl: result.optimizedUrl,
          rawUrl: result.secureUrl,
          bytes: result.bytes
        };
        console.log(`  ✅ Brand Asset Done: ${result.optimizedUrl}`);
      } catch (err) {
        console.error(`  ❌ Error uploading brand asset ${b.name}:`, err.message);
      }
    }
  }

  // Save manifest
  const manifestPath = path.join(__dirname, '../cloudinary-image-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n🎉 Upload complete! Manifest saved to ${manifestPath}`);
}

run().catch(console.error);
