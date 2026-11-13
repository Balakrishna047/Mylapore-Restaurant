const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUD_NAME = 'dwlh5wdsw';
const API_KEY = '854992222623488';
const API_SECRET = 'ObYUIbUCL5nrdLeeKfdoJcp46Rs';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':' + API_SECRET).toString('base64');

const USER_UPLOADED_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/8596e12e-8e14-41f5-acde-414c80072de9/.user_uploaded';
const BANNERS_DIR = path.join(__dirname, '../apps/web/public/images/banners');

if (!fs.existsSync(BANNERS_DIR)) {
  fs.mkdirSync(BANNERS_DIR, { recursive: true });
}

const BANNERS = [
  {
    key: 'banner-freshly-cooked',
    sourceFile: path.join(USER_UPLOADED_DIR, 'media_1794549146171_ff84260a.jpg'),
    localFile: path.join(BANNERS_DIR, 'banner-freshly-cooked-dosa-idli.jpg'),
    publicId: 'banner-freshly-cooked-dosa-idli-breakfast',
    title: 'Freshly cooked, every day',
    subtitle: 'Authentic South Indian • no preservatives',
    ctaText: 'Browse the menu',
    ctaLink: '/?category=all'
  },
  {
    key: 'banner-favourites',
    sourceFile: path.join(USER_UPLOADED_DIR, 'media_1794549146166_173de718.jpg'),
    localFile: path.join(BANNERS_DIR, 'banner-choose-from-favourites.jpg'),
    publicId: 'banner-festive-south-indian-thali-favourites',
    title: 'Choose from your favourites',
    subtitle: 'Everything you can order for your day, in one place',
    ctaText: 'Order now',
    ctaLink: '/?category=curries'
  },
  {
    key: 'banner-pay-it-forward',
    sourceFile: path.join(USER_UPLOADED_DIR, 'media_1794549146166_de957336.jpg'),
    localFile: path.join(BANNERS_DIR, 'banner-pay-it-forward-tiffin-meals.jpg'),
    publicId: 'banner-pay-it-forward-tiffin-meals-charity',
    title: 'Pay it forward',
    subtitle: 'Sponsor a meal for someone in need',
    ctaText: 'Sponsor a meal',
    ctaLink: '/support'
  }
];

function uploadToCloudinary(filePath, publicId, folder) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const base64Data = 'data:image/jpeg;base64,' + fileData.toString('base64');

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
  console.log('🚀 Uploading 3 Banner Carousel Images to Cloudinary...');
  const results = [];

  for (const b of BANNERS) {
    if (!fs.existsSync(b.sourceFile)) {
      console.error(`❌ Source file not found: ${b.sourceFile}`);
      continue;
    }

    // 1. Copy locally
    fs.copyFileSync(b.sourceFile, b.localFile);
    console.log(`Copied locally -> ${b.localFile}`);

    // 2. Upload to Cloudinary
    console.log(`Uploading ${b.key} -> ${b.publicId}...`);
    const res = await uploadToCloudinary(b.sourceFile, b.publicId, 'mylapore-express/banners');
    console.log(`  ✅ Done: ${res.optimizedUrl}`);

    results.push({
      key: b.key,
      title: b.title,
      subtitle: b.subtitle,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      cloudinaryUrl: res.optimizedUrl,
      localUrl: `/images/banners/${path.basename(b.localFile)}`
    });
  }

  const outPath = path.join(__dirname, '../apps/web/src/data/carouselBanners.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n🎉 Carousel banners saved to ${outPath}`);
}

main().catch(console.error);
