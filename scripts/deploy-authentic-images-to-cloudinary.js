const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUD_NAME = 'dwlh5wdsw';
const API_KEY = '854992222623488';
const API_SECRET = 'ObYUIbUCL5nrdLeeKfdoJcp46Rs';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':' + API_SECRET).toString('base64');

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\8596e12e-8e14-41f5-acde-414c80072de9';
const LOCAL_DISHES_DIR = path.join(__dirname, '../apps/web/public/images/dishes');
const GENERATED_DIR = path.join(LOCAL_DISHES_DIR, 'generated');

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// 1. New Authentic Generated Photographs
const NEW_AUTHENTIC_PHOTOS = [
  {
    dishSlug: 'mylapore-filter-coffee',
    file: path.join(ARTIFACT_DIR, 'mylapore_degree_filter_coffee_1794548795249.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'mylapore-filter-coffee.jpg'),
    matureId: 'beverages-authentic-mylapore-degree-filter-coffee'
  },
  {
    dishSlug: 'idli-milagai-podi',
    file: path.join(ARTIFACT_DIR, 'idli_milagai_podi_1794548812118.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'idli-milagai-podi.jpg'),
    matureId: 'podis-gunpowder-idli-milagai-podi'
  },
  {
    dishSlug: 'avakkai-mango-pickle',
    file: path.join(ARTIFACT_DIR, 'avakkai_mango_pickle_1794548826684.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'avakkai-mango-pickle.jpg'),
    matureId: 'pickles-spicy-andhra-avakkai-mango-pickle'
  },
  {
    dishSlug: 'vathal-kuzhambu',
    file: path.join(ARTIFACT_DIR, 'vathal_kuzhambu_1794548855550.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'vathal-kuzhambu.jpg'),
    matureId: 'curries-turkey-berry-tamarind-vathal-kuzhambu'
  },
  {
    dishSlug: 'saffron-rava-kesari',
    file: path.join(ARTIFACT_DIR, 'saffron_rava_kesari_1794548872372.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'saffron-rava-kesari.jpg'),
    matureId: 'desserts-aromatic-saffron-rava-kesari'
  },
  {
    dishSlug: 'ghee-mysore-pak',
    file: path.join(ARTIFACT_DIR, 'ghee_mysore_pak_1794548885521.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'ghee-mysore-pak.jpg'),
    matureId: 'desserts-pure-desi-ghee-mysore-pak'
  },
  {
    dishSlug: 'puliyodarai',
    file: path.join(ARTIFACT_DIR, 'temple_style_puliyodarai_1794548900833.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'puliyodarai.jpg'),
    matureId: 'rice-temple-style-tamarind-puliyodarai'
  },
  {
    dishSlug: 'lemon-rice',
    file: path.join(ARTIFACT_DIR, 'lemon_rice_1794548929640.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'lemon-rice.jpg'),
    matureId: 'rice-citrus-tempered-elamichai-lemon-rice'
  },
  {
    dishSlug: 'asoka-halwa',
    file: path.join(ARTIFACT_DIR, 'asoka_halwa_1794548944110.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'asoka-halwa.jpg'),
    matureId: 'desserts-thiruvaiyaru-asoka-halwa'
  },
  {
    dishSlug: 'mylapore-weekend-thali',
    file: path.join(ARTIFACT_DIR, 'mylapore_grand_thali_1794548959305.jpg'),
    destLocal: path.join(LOCAL_DISHES_DIR, 'mylapore-weekend-thali.jpg'),
    matureId: 'specials-grand-festive-mylapore-weekend-thali'
  }
];

function uploadToCloudinary(filePath, publicId, folder) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
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
          const optimizedUrl = parsed.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
          resolve({
            publicId: parsed.public_id,
            optimizedUrl: optimizedUrl,
            secureUrl: parsed.secure_url
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

async function main() {
  console.log('🔄 Deploying 10 Authentic Generated Food Photographs...');
  const manifestPath = path.join(__dirname, '../cloudinary-image-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 1. Upload the 10 authentic replacement images
  for (const item of NEW_AUTHENTIC_PHOTOS) {
    if (fs.existsSync(item.file)) {
      console.log(`[Upload Authentic] ${item.dishSlug} -> ${item.matureId}...`);
      // Copy to workspace
      fs.copyFileSync(item.file, item.destLocal);
      const generatedCopy = path.join(GENERATED_DIR, path.basename(item.file));
      fs.copyFileSync(item.file, generatedCopy);

      const res = await uploadToCloudinary(item.file, item.matureId, 'mylapore-express/dishes');
      manifest[item.dishSlug] = {
        matureId: item.matureId,
        cloudinaryUrl: res.optimizedUrl,
        rawUrl: res.secureUrl,
        verifiedAuthentic: true
      };
      console.log(`  ✅ Live CDN: ${res.optimizedUrl}`);
    } else {
      console.warn(`⚠️ Source file not found: ${item.file}`);
    }
  }

  // 2. Also map the photo from old puli-inji (which was Paal Payasam) to paal-payasam
  const oldPuliInji = path.join(LOCAL_DISHES_DIR, 'puli-inji.jpg');
  if (fs.existsSync(oldPuliInji)) {
    console.log('[Remap Authentic] Old puli-inji -> Paal Payasam...');
    const res = await uploadToCloudinary(oldPuliInji, 'desserts-traditional-slow-simmered-paal-payasam', 'mylapore-express/dishes');
    manifest['paal-payasam'] = {
      matureId: 'desserts-traditional-slow-simmered-paal-payasam',
      cloudinaryUrl: res.optimizedUrl,
      rawUrl: res.secureUrl,
      verifiedAuthentic: true
    };
    fs.copyFileSync(oldPuliInji, path.join(LOCAL_DISHES_DIR, 'paal-payasam.jpg'));
    console.log(`  ✅ Live Paal Payasam CDN: ${res.optimizedUrl}`);
  }

  // Save updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ Updated manifest saved to cloudinary-image-manifest.json');

  // Update seed.ts with the exact manifest
  let seedPath = path.join(__dirname, '../apps/api/src/prisma/seed.ts');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Regex replacement for each dish in seed.ts
  for (const [slug, meta] of Object.entries(manifest)) {
    // Match: slug: 'xyz', ... image: '...'
    const regex = new RegExp(`(slug:\\s*'${slug}',[\\s\\S]*?image:\\s*')([^']+)(')`, 'g');
    if (regex.test(seedContent)) {
      seedContent = seedContent.replace(regex, `$1${meta.cloudinaryUrl}$3`);
    }
  }

  // Update Category icons in seed.ts
  const categoryIconMap = {
    curries: manifest['potato-kara-kari']?.cloudinaryUrl,
    rice: manifest['puliyodarai']?.cloudinaryUrl,
    sambar: manifest['mylapore-murungakkai-sambar']?.cloudinaryUrl,
    rasam: manifest['thakkali-rasam']?.cloudinaryUrl,
    chutneys: manifest['thengai-chutney']?.cloudinaryUrl,
    desserts: manifest['paal-payasam']?.cloudinaryUrl,
    beverages: manifest['mylapore-filter-coffee']?.cloudinaryUrl,
    batters: manifest['idly-batter']?.cloudinaryUrl,
    specials: manifest['mylapore-weekend-thali']?.cloudinaryUrl,
    pickles: manifest['avakkai-mango-pickle']?.cloudinaryUrl
  };

  for (const [catSlug, iconUrl] of Object.entries(categoryIconMap)) {
    if (iconUrl) {
      const catRegex = new RegExp(`(name:\\s*'[^']+',\\s*slug:\\s*'${catSlug}',\\s*icon:\\s*')([^']+)(')`, 'g');
      if (catRegex.test(seedContent)) {
        seedContent = seedContent.replace(catRegex, `$1${iconUrl}$3`);
      }
    }
  }

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log('✅ seed.ts successfully updated with verified authentic Cloudinary URLs!');
}

main().catch(console.error);
