import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive Mylapore Express database seed...');

  // 1. Restaurant Info
  await prisma.restaurant.deleteMany();
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Mylapore Express',
      phone: '(925) 238-3736',
      email: 'support@mylaporeexpress.com',
      address: 'Mylapore Heritage & Bay Area Delivery Kitchen, CA / Chennai',
      description: 'Authentic South Indian flavors, made the way our grandmothers did. Freshly cooked, blast chilled, no preservatives added.',
      openingTime: '11:00 AM',
      closingTime: '10:00 PM',
      minimumOrder: 15.00,
      deliveryFee: 4.99,
      freeDeliveryThreshold: 45.00,
      taxRate: 0.0825,
      currency: 'USD',
      isAcceptingOrders: true
    }
  });

  // 2. Users (Admin, Staff, Customer)
  await prisma.user.deleteMany();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@mylaporeexpress.com',
      passwordHash,
      name: 'Sundaram Iyer',
      phone: '(925) 238-3736',
      role: 'SUPER_ADMIN'
    }
  });

  const kitchenManager = await prisma.user.create({
    data: {
      email: 'kitchen@mylaporeexpress.com',
      passwordHash,
      name: 'Chef Ramanathan',
      phone: '(925) 238-3737',
      role: 'KITCHEN_MANAGER'
    }
  });

  const supportAgent = await prisma.user.create({
    data: {
      email: 'support@mylaporeexpress.com',
      passwordHash,
      name: 'Meenakshi Support',
      phone: '(925) 238-3738',
      role: 'CUSTOMER_SUPPORT'
    }
  });

  const testCustomer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash,
      name: 'Anand Krishnan',
      phone: '(408) 555-0199',
      role: 'CUSTOMER',
      addresses: {
        create: {
          street: '1244 S Capitol Ave',
          apt: 'Unit 302',
          city: 'San Jose',
          state: 'CA',
          zipCode: '95127',
          deliveryNotes: 'Please ring bell and leave in insulated thermal tote bag.',
          isDefault: true
        }
      }
    }
  });

  // 3. Menu Categories matching PDF with circular images / icons
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.menuItemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  const categories = [
    { name: 'Curries', slug: 'curries', icon: '/images/dishes/potato-kara-kari.jpg', description: 'Traditional dry curries, kootus, and rich lentil stews', displayOrder: 1 },
    { name: 'Rice', slug: 'rice', icon: '/images/dishes/puliyodarai.jpg', description: 'Aromatic variety rice, pongal, and flavored dishes', displayOrder: 2 },
    { name: 'Sambar', slug: 'sambar', icon: '/images/dishes/mylapore-murungakkai-sambar.jpg', description: 'Freshly tempered spiced lentil sambar with drumsticks and pearl onions', displayOrder: 3 },
    { name: 'Rasam', slug: 'rasam', icon: '/images/dishes/thakkali-rasam.jpg', description: 'Tangy, peppery tomato, pepper, and mysore rasam brews', displayOrder: 4 },
    { name: 'Chutneys', slug: 'chutneys', icon: '/images/dishes/thengai-chutney.jpg', description: 'Fresh coconut, tomato thakkali, and spicy coriander pachadis', displayOrder: 5 },
    { name: 'Desserts', slug: 'desserts', icon: '/images/dishes/paal-payasam.jpg', description: 'Traditional payasam, badam halwa, and mysore pak', displayOrder: 6 },
    { name: 'Beverages', slug: 'beverages', icon: '/images/dishes/mylapore-filter-coffee.jpg', description: 'Authentic South Indian Degree Filter Coffee and spiced buttermilk', displayOrder: 7 },
    { name: 'Batters', slug: 'batters', icon: '/images/dishes/idly-batter.jpg', description: 'Naturally stone-ground idly, dosa, and adai batters', displayOrder: 8 },
    { name: 'Specials', slug: 'specials', icon: '/images/dishes/mylapore-weekend-thali.jpg', description: 'Festive weekend meals and curated kitchen specials', displayOrder: 9 },
    { name: 'Pickles', slug: 'pickles', icon: '/images/dishes/avakkai-mango-pickle.jpg', description: 'Sun-cured avakkai mango, lemon, and green chili pickles', displayOrder: 10 }
  ];

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.menuCategory.create({ data: c });
    catMap.set(c.slug, created.id);
  }

  // 4. All 20 dishes matching the exact PDF catalog
  const dishes = [
    // Customer Favorites & Kootu/Poriyal
    {
      slug: 'south-indian-veg-kurma',
      name: 'South Indian Veg Kurma',
      description: 'South Indian Veg Kurma for Parotta · Vegan, has coconut and rich spices.',
      categoryId: catMap.get('curries')!,
      basePrice: 12.49,
      image: '/images/dishes/south-indian-veg-kurma.jpg',
      orderCountBadge: '1,000+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Tree Nuts']),
      ingredients: JSON.stringify(['Carrots', 'Beans', 'Potatoes', 'Green Peas', 'Fresh Coconut', 'Poppy Seeds', 'Fennel', 'Cloves', 'Cinnamon', 'Cardamom']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Refrigerate at <=40°F (4°C). Simmer on low heat in a saucepan for 3 minutes.',
      rating: 5.0,
      reviewCount: 112,
      variants: [{ name: 'Regular (16 oz)', price: 12.49, servesCount: 2 }]
    },
    {
      slug: 'murungai-keerai-kootu',
      name: 'Murungai Keerai Kootu',
      description: 'Murungai Keerai (Drumstick leaves) Kootu with yellow lentils and mild tempering.',
      categoryId: catMap.get('curries')!,
      basePrice: 11.49,
      image: '/images/dishes/murungai-keerai-kootu.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Fresh Drumstick Leaves', 'Moong Dal', 'Fresh Coconut Paste', 'Cumin Seeds', 'Mustard Seeds', 'Curry Leaves']),
      nutritionServing: '1 cup (200 g)',
      reheatingInstructions: 'Microwave for 2 minutes or warm in a pot over medium flame.',
      rating: 4.8,
      reviewCount: 64,
      variants: [{ name: 'Regular (16 oz)', price: 11.49, servesCount: 2 }]
    },
    {
      slug: 'puliyodarai',
      name: 'Puliyodarai',
      description: 'Puliyodarai has peanuts. Temple-style Tamarind rice with roasted peanuts and fragrant spice powder.',
      categoryId: catMap.get('rice')!,
      basePrice: 9.99,
      image: '/images/dishes/puliyodarai.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Peanuts', 'Sesame']),
      ingredients: JSON.stringify(['Sona Masoori Rice', 'Tamarind Pulp', 'Peanuts', 'Sesame Oil', 'Fenugreek Powder', 'Curry Leaves', 'Mustard']),
      nutritionServing: '1 cup (180 g)',
      reheatingInstructions: 'Best enjoyed warm or at room temperature. Microwave for 60 seconds.',
      rating: 4.9,
      reviewCount: 95,
      variants: [{ name: 'Portion (16 oz)', price: 9.99, servesCount: 1 }]
    },
    {
      slug: 'vathal-kuzhambu',
      name: 'Vathal Kuzhambu',
      description: 'Tangy, spicy stew made with sun dried turkey berries and tamarind gravy.',
      categoryId: catMap.get('curries')!,
      basePrice: 11.99,
      image: '/images/dishes/vathal-kuzhambu.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'EXTRA_HOT',
      allergens: JSON.stringify(['Sesame']),
      ingredients: JSON.stringify(['Sundakkai Vathal', 'Tamarind Juice', 'Cold Pressed Gingelly Oil', 'Sambar Masala', 'Asafoetida', 'Curry Leaves']),
      nutritionServing: '1/2 cup (120 g)',
      reheatingInstructions: 'Heat thoroughly in pan until bubbling hot. Serve with steamed rice and ghee.',
      rating: 5.0,
      reviewCount: 88,
      variants: [{ name: 'Regular (16 oz)', price: 11.99, servesCount: 3 }]
    },
    {
      slug: 'bisi-bele-bath',
      name: 'Bisi Bele Bath',
      description: 'Bisi Bele Bath with spiced aromatic ghee tempering and fresh vegetables.',
      categoryId: catMap.get('rice')!,
      basePrice: 10.99,
      image: '/images/dishes/bisi-bele-bath.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'HOT',
      allergens: JSON.stringify(['Milk', 'Tree Nuts']),
      ingredients: JSON.stringify(['Rice', 'Toor Dal', 'French Beans', 'Carrots', 'Bisi Bele Bath Podi', 'Pure Desi Ghee', 'Cashews', 'Curry Leaves']),
      nutritionServing: '1 cup (220 g)',
      reheatingInstructions: 'Microwave for 2 minutes or stir on low flame with a spoonful of ghee.',
      rating: 4.9,
      reviewCount: 130,
      variants: [{ name: 'Regular (16 oz)', price: 10.99, servesCount: 1 }]
    },
    {
      slug: 'potato-kara-kari',
      name: 'Potato Kara Kari',
      description: 'A South Indian potato fry. Authentic South Indian flavors, made the way our grandmothers did.',
      categoryId: catMap.get('curries')!,
      basePrice: 10.99,
      image: '/images/dishes/potato-kara-kari.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'HOT',
      allergens: JSON.stringify(['Wheat', 'Sesame']),
      ingredients: JSON.stringify(['Potatoes', 'Cold-pressed Sesame Oil', 'Mustard Seeds', 'Curry Leaves', 'Red Chili Powder', 'Asafoetida', 'Himalayan Pink Salt', 'Turmeric']),
      nutritionServing: '1/2 cup (80 g)',
      reheatingInstructions: 'Refrigerate at <=40°F (4°C). Empty into a stovetop pan and crisp for 3-4 minutes on medium heat, or microwave 90 seconds.',
      rating: 4.9,
      reviewCount: 48,
      variants: [
        { name: 'Regular (16 oz)', price: 10.99, servesCount: 2 },
        { name: 'Family (32 oz)', price: 19.99, servesCount: 4 }
      ]
    },
    {
      slug: 'chow-chow-kootu',
      name: 'Chow Chow Kootu',
      description: 'Chayote kootu, a South Indian vegetable stew with moong dal and coconut.',
      categoryId: catMap.get('curries')!,
      basePrice: 10.49,
      image: '/images/dishes/chow-chow-kootu.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Chow Chow (Chayote)', 'Moong Dal', 'Coconut', 'Cumin Seeds', 'Mustard Seeds', 'Curry Leaves']),
      nutritionServing: '1 cup (200 g)',
      reheatingInstructions: 'Warm in pot for 2-3 minutes.',
      rating: 4.7,
      reviewCount: 35,
      variants: [{ name: 'Regular (16 oz)', price: 10.49, servesCount: 2 }]
    },
    {
      slug: 'beans-usili',
      name: 'Beans Usili',
      description: 'A Tamil dry curry of green beans and lentils.',
      categoryId: catMap.get('curries')!,
      basePrice: 11.99,
      image: '/images/dishes/beans-usili.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Green Beans', 'Toor Dal', 'Chana Dal', 'Dry Red Chilies', 'Asafoetida', 'Mustard Seeds']),
      nutritionServing: '1/2 cup (90 g)',
      reheatingInstructions: 'Heat in a flat skillet for 2 minutes to restore the fluffy lentil texture.',
      rating: 4.9,
      reviewCount: 52,
      variants: [{ name: 'Regular (16 oz)', price: 11.99, servesCount: 2 }]
    },
    {
      slug: 'guttivankaya-kura',
      name: 'Guttivankaya Kura',
      description: 'Guttivankaya Kura - Baby Eggplant Curry - Andhra Style',
      categoryId: catMap.get('curries')!,
      basePrice: 12.99,
      image: '/images/dishes/guttivankaya-kura.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
      spiceLevel: 'HOT',
      allergens: JSON.stringify(['Peanuts', 'Sesame']),
      ingredients: JSON.stringify(['Baby Purple Eggplants', 'Roasted Peanuts', 'Sesame Seeds', 'Coriander Seeds', 'Tamarind', 'Red Chilies']),
      nutritionServing: '1 cup (220 g)',
      reheatingInstructions: 'Simmer on low in a covered saucepan for 3-4 minutes.',
      rating: 5.0,
      reviewCount: 46,
      variants: [{ name: 'Regular (16 oz)', price: 12.99, servesCount: 2 }]
    },
    {
      slug: 'beans-poriyal',
      name: 'Beans Poriyal',
      description: 'A South Indian green bean fry with freshly grated coconut.',
      categoryId: catMap.get('curries')!,
      basePrice: 9.99,
      image: '/images/dishes/beans-poriyal.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Green Beans', 'Fresh Grated Coconut', 'Urad Dal', 'Mustard Seeds', 'Curry Leaves']),
      nutritionServing: '1/2 cup (80 g)',
      reheatingInstructions: 'Warm on pan for 90 seconds.',
      rating: 4.8,
      reviewCount: 29,
      variants: [{ name: 'Regular (16 oz)', price: 9.99, servesCount: 2 }]
    },

    // North Indian Favourites
    {
      slug: 'punjabi-chole',
      name: 'Punjabi Chole',
      description: 'Punjabi chickpea curry, great with roti or rice.',
      categoryId: catMap.get('curries')!,
      basePrice: 11.99,
      image: '/images/dishes/punjabi-chole.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
      spiceLevel: 'HOT',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Kabuli Chana', 'Tomatoes', 'Onions', 'Amchur', 'Ginger', 'Garam Masala']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Heat in saucepan or microwave for 2 minutes.',
      rating: 4.8,
      reviewCount: 71,
      variants: [{ name: 'Regular (16 oz)', price: 11.99, servesCount: 2 }]
    },
    {
      slug: 'saag-paneer',
      name: 'Saag Paneer',
      description: 'Paneer in a spinach gravy.',
      categoryId: catMap.get('curries')!,
      basePrice: 13.49,
      image: '/images/dishes/saag-paneer.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Paneer (Cottage Cheese)', 'Fresh Spinach', 'Heavy Cream', 'Garlic', 'Ginger', 'Kasuri Methi']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Heat slowly on low flame to maintain soft paneer texture.',
      rating: 4.9,
      reviewCount: 84,
      variants: [{ name: 'Regular (16 oz)', price: 13.49, servesCount: 2 }]
    },
    {
      slug: 'black-channa-masala',
      name: 'Black Channa Masala',
      description: 'Black chickpeas in a North Indian masala.',
      categoryId: catMap.get('curries')!,
      basePrice: 11.49,
      image: '/images/dishes/black-channa-masala.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
      spiceLevel: 'HOT',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Black Kala Chana', 'Tomatoes', 'Ginger', 'Garam Masala', 'Cumin']),
      nutritionServing: '1 cup (220 g)',
      reheatingInstructions: 'Heat thoroughly in pan or microwave.',
      rating: 4.8,
      reviewCount: 42,
      variants: [{ name: 'Regular (16 oz)', price: 11.49, servesCount: 2 }]
    },
    {
      slug: 'matar-paneer',
      name: 'Matar Paneer',
      description: 'Paneer and peas in a North Indian gravy.',
      categoryId: catMap.get('curries')!,
      basePrice: 12.99,
      image: '/images/dishes/matar-paneer.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Fresh Paneer', 'Green Peas', 'Tomato Puree', 'Cashew Paste', 'Garam Masala']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Warm gently in pot for 3 minutes.',
      rating: 4.9,
      reviewCount: 55,
      variants: [{ name: 'Regular (16 oz)', price: 12.99, servesCount: 2 }]
    },
    {
      slug: 'rajma',
      name: 'Rajma',
      description: 'Kidney beans in a North Indian gravy, made for rice.',
      categoryId: catMap.get('curries')!,
      basePrice: 10.99,
      image: '/images/dishes/rajma.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Red Kidney Beans', 'Onions', 'Tomatoes', 'Ginger', 'Spices']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Simmer on stovetop. Serve with steamed basmati rice.',
      rating: 4.8,
      reviewCount: 63,
      variants: [{ name: 'Regular (16 oz)', price: 10.99, servesCount: 2 }]
    },
    {
      slug: 'methi-paneer',
      name: 'Methi Paneer',
      description: 'Paneer with fenugreek leaves in a North Indian gravy.',
      categoryId: catMap.get('curries')!,
      basePrice: 13.49,
      image: '/images/dishes/methi-paneer.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Paneer', 'Fresh Fenugreek (Methi)', 'Onion-Tomato Gravy', 'Cream', 'Spices']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Warm slowly in saucepan for 2-3 minutes.',
      rating: 4.9,
      reviewCount: 38,
      variants: [{ name: 'Regular (16 oz)', price: 13.49, servesCount: 2 }]
    },

    // Breakfast & Tiffin
    {
      slug: 'idly-batter',
      name: 'Idly Batter',
      description: 'Fresh Idly batter, makes 18-20 soft Idlies.',
      categoryId: catMap.get('batters')!,
      basePrice: 7.99,
      image: '/images/dishes/idly-batter.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'JAIN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Idly Rice', 'Whole Urad Dal', 'Fenugreek Seeds', 'RO Water', 'Salt']),
      nutritionServing: '2 Idlies (100 g batter)',
      reheatingInstructions: 'Steam in idly cooker for 10-12 minutes on high flame.',
      rating: 5.0,
      reviewCount: 210,
      variants: [{ name: 'Tub (32 oz)', price: 7.99, servesCount: 18 }]
    },
    {
      slug: 'rava-khichdi',
      name: 'Rava Khichdi',
      description: 'Rava Khichdi made with Sooji and vegetables.',
      categoryId: catMap.get('rice')!,
      basePrice: 9.49,
      image: '/images/dishes/rava-khichdi.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Wheat', 'Milk', 'Tree Nuts']),
      ingredients: JSON.stringify(['Roasted Sooji', 'Carrots', 'Beans', 'Green Peas', 'Ginger', 'Ghee', 'Cashews']),
      nutritionServing: '1 cup (200 g)',
      reheatingInstructions: 'Microwave for 90 seconds with a sprinkle of water and a dab of ghee.',
      rating: 4.8,
      reviewCount: 52,
      variants: [{ name: 'Regular (16 oz)', price: 9.49, servesCount: 1 }]
    },
    {
      slug: 'venn-pongal',
      name: 'Venn Pongal',
      description: 'Venn Pongal with crushed pepper, cumin, ginger, and cashews in cow ghee.',
      categoryId: catMap.get('rice')!,
      basePrice: 9.49,
      image: '/images/dishes/venn-pongal.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Milk', 'Tree Nuts']),
      ingredients: JSON.stringify(['Raw Rice', 'Moong Dal', 'Black Peppercorns', 'Cumin Seeds', 'Ginger', 'Curry Leaves', 'Cashews', 'Pure Desi Ghee']),
      nutritionServing: '1 cup (220 g)',
      reheatingInstructions: 'Microwave 90 seconds. Add a teaspoon of warm ghee for peak flavor.',
      rating: 4.9,
      reviewCount: 68,
      variants: [{ name: 'Regular (16 oz)', price: 9.49, servesCount: 1 }]
    },
    {
      slug: 'adai-batter',
      name: 'Adai Batter',
      description: 'Fresh Adai batter, makes 8-10 adais.',
      categoryId: catMap.get('batters')!,
      basePrice: 8.49,
      image: '/images/dishes/adai-batter.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Rice', 'Toor Dal', 'Chana Dal', 'Urad Dal', 'Red Chilies', 'Fennel', 'Asafoetida', 'Salt']),
      nutritionServing: '1 Adai (120 g batter)',
      reheatingInstructions: 'Pour thick ladle onto hot tawa, drizzle gingelly oil, and cook until crisp and golden brown.',
      rating: 4.9,
      reviewCount: 82,
      variants: [{ name: 'Tub (32 oz)', price: 8.49, servesCount: 10 }]
    },
    {
      slug: 'spiced-buttermilk',
      name: 'Spiced Buttermilk (Neer Mor)',
      description: 'Cooling churned yogurt beverage tempered with mustard seeds, curry leaves, ginger, and green chilies. A quintessential South Indian refresher.',
      categoryId: catMap.get('beverages')!,
      basePrice: 5.99,
      image: '/images/dishes/spiced-buttermilk.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Fresh Cultured Yogurt', 'Water', 'Fresh Ginger', 'Green Chilies', 'Cilantro', 'Curry Leaves', 'Mustard Seeds', 'Hing', 'Rock Salt']),
      nutritionServing: '1 bottle (16 oz)',
      reheatingInstructions: 'Serve thoroughly chilled. Shake well before opening.',
      rating: 4.9,
      reviewCount: 45,
      variants: [{ name: 'Bottle (16 oz)', price: 5.99, servesCount: 1 }]
    },
    {
      slug: 'mango-lassi',
      name: 'Mango Lassi',
      description: 'Creamy, velvety Alphonso mango pulp blended with fresh homemade yogurt and a gentle hint of green cardamom.',
      categoryId: catMap.get('beverages')!,
      basePrice: 6.49,
      image: '/images/dishes/mango-lassi.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Ratnagiri Alphonso Mango Pulp', 'Whole Milk Yogurt', 'Chilled Milk', 'Organic Raw Sugar', 'Green Cardamom']),
      nutritionServing: '1 bottle (16 oz)',
      reheatingInstructions: 'Serve thoroughly chilled. Shake well before sipping.',
      rating: 5.0,
      reviewCount: 89,
      variants: [{ name: 'Bottle (16 oz)', price: 6.49, servesCount: 1 }]
    },
    {
      slug: 'mylapore-filter-coffee',
      name: 'Mylapore Degree Filter Coffee Decoction',
      description: 'Freshly brewed strong chicory-infused South Indian coffee decoction served with frothy boiled whole milk. The legendary aroma of South Mada Street.',
      categoryId: catMap.get('beverages')!,
      basePrice: 5.99,
      image: '/images/dishes/mylapore-filter-coffee.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Plantation A Arabica & Robusta Coffee Beans', 'Chicory (15%)', 'Fresh Organic Whole Milk', 'Cane Sugar']),
      nutritionServing: '1 flask (12 oz)',
      reheatingInstructions: 'Warm gently in saucepan or microwave 45 seconds. Pour back and forth with a dabarah-tumbler for signature froth.',
      rating: 5.0,
      reviewCount: 124,
      variants: [{ name: 'Decoction Flask (12 oz)', price: 5.99, servesCount: 2 }]
    },
    {
      slug: 'rose-milk',
      name: 'Mylapore Rose Milk with Sabja',
      description: 'Classic Chennai-style fragrant sweet rose milk made with pure rose petal extract syrup, chilled boiled milk, and soaked sweet basil (sabja) seeds.',
      categoryId: catMap.get('beverages')!,
      basePrice: 5.49,
      image: '/images/dishes/rose-milk.jpg',
      orderCountBadge: '100+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Chilled Whole Milk', 'Handcrafted Rose Petal Syrup', 'Soaked Sabja Seeds (Sweet Basil)', 'Cardamom Extract']),
      nutritionServing: '1 bottle (16 oz)',
      reheatingInstructions: 'Serve ice-cold. Shake gently to disperse sabja seeds.',
      rating: 4.8,
      reviewCount: 52,
      variants: [{ name: 'Bottle (16 oz)', price: 5.49, servesCount: 1 }]
    },
    // --- SAMBAR CATEGORY ---
    {
      slug: 'mylapore-murungakkai-sambar',
      name: 'Mylapore Murungakkai Sambar',
      description: 'Slow-simmered tender drumsticks and Madras pearl onions in slow-cooked toor dal infused with heirloom sambar podi and tamarind pulp.',
      categoryId: catMap.get('sambar')!,
      basePrice: 8.99,
      image: '/images/dishes/mylapore-murungakkai-sambar.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Toor Dal', 'Tender Drumsticks', 'Shallots', 'Tamarind', 'Coriander Seeds', 'Byadagi Red Chilies', 'Curry Leaves', 'Asafoetida', 'Mustard Seeds', 'Fenugreek']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Microwave 90 seconds or simmer in saucepan until gently bubbling.',
      rating: 4.9,
      reviewCount: 142,
      variants: [
        { name: 'Regular (16 oz)', price: 8.99, servesCount: 2 },
        { name: 'Family Tub (32 oz)', price: 15.99, servesCount: 4 }
      ]
    },
    {
      slug: 'arachuvitta-sambar',
      name: 'Arachuvitta Sambar',
      description: 'Traditional festive temple sambar made with freshly roasted and stone-ground coconut, whole coriander, chana dal, and dried red chilies.',
      categoryId: catMap.get('sambar')!,
      basePrice: 9.49,
      image: '/images/dishes/arachuvitta-sambar.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Coconut']),
      ingredients: JSON.stringify(['Yellow Pigeon Peas (Toor Dal)', 'Fresh Grated Coconut', 'White Pumpkin (Ash Gourd)', 'Tamarind', 'Roasted Coriander', 'Cumin', 'Fenugreek', 'Curry Leaves']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Heat on stovetop until fragrant. Drizzle a spoon of cold-pressed gingelly oil.',
      rating: 5.0,
      reviewCount: 98,
      variants: [
        { name: 'Regular (16 oz)', price: 9.49, servesCount: 2 },
        { name: 'Family Tub (32 oz)', price: 16.99, servesCount: 4 }
      ]
    },
    {
      slug: 'chinna-vengayam-sambar',
      name: 'Chinna Vengayam (Shallot) Sambar',
      description: 'Tender baby shallots caramelized in pure gingelly oil, stewed in velvety yellow lentils and aromatic handmade spice broth.',
      categoryId: catMap.get('sambar')!,
      basePrice: 9.29,
      image: '/images/dishes/chinna-vengayam-sambar.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Madras Pearl Onions (Shallots)', 'Toor Dal', 'Tamarind Juice', 'Turmeric', 'Sambar Masala', 'Sesame Oil', 'Curry Leaves']),
      nutritionServing: '1 cup (240 g)',
      reheatingInstructions: 'Microwave 90 seconds. Stir well before serving with hot rice or soft idlies.',
      rating: 4.9,
      reviewCount: 76,
      variants: [
        { name: 'Regular (16 oz)', price: 9.29, servesCount: 2 },
        { name: 'Family Tub (32 oz)', price: 16.49, servesCount: 4 }
      ]
    },
    // --- RASAM CATEGORY ---
    {
      slug: 'thakkali-rasam',
      name: 'Mylapore Thakkali (Tomato) Rasam',
      description: 'Soothing clear broth made with country tomatoes, crushed black Tellicherry peppercorns, cumin, garlic, and fresh coriander leaves.',
      categoryId: catMap.get('rasam')!,
      basePrice: 7.49,
      image: '/images/dishes/thakkali-rasam.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Farm Fresh Ripe Tomatoes', 'Tamarind Water', 'Crushed Black Pepper', 'Cumin Seeds', 'Garlic', 'Mustard Seeds', 'Coriander Leaves', 'Asafoetida']),
      nutritionServing: '1 cup (240 ml)',
      reheatingInstructions: 'Bring to a gentle boil for 60 seconds on stovetop or microwave 1 minute. Sip warm like a soup.',
      rating: 5.0,
      reviewCount: 164,
      variants: [
        { name: 'Regular (16 oz)', price: 7.49, servesCount: 2 },
        { name: 'Family Flask (32 oz)', price: 13.49, servesCount: 4 }
      ]
    },
    {
      slug: 'mysore-rasam',
      name: 'Mysore Lentil Rasam',
      description: 'A richer, fragrant rasam brewed with cooked toor dal water and freshly roasted Mysore spice blend featuring coriander seeds and dry red chilies.',
      categoryId: catMap.get('rasam')!,
      basePrice: 7.99,
      image: '/images/dishes/mysore-rasam.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Toor Dal Broth', 'Tamarind Extract', 'Mysore Rasam Powder', 'Tomatoes', 'Curry Leaves', 'Cumin', 'Desi Ghee Tempering']),
      nutritionServing: '1 cup (240 ml)',
      reheatingInstructions: 'Heat in small saucepan until frothy bubbles form on top.',
      rating: 4.8,
      reviewCount: 88,
      variants: [
        { name: 'Regular (16 oz)', price: 7.99, servesCount: 2 },
        { name: 'Family Flask (32 oz)', price: 13.99, servesCount: 4 }
      ]
    },
    {
      slug: 'poondu-milagu-rasam',
      name: 'Poondu Milagu (Garlic Pepper) Rasam',
      description: 'Traditional immunity-boosting grandmother cure made with whole roasted garlic cloves and heavy cracked black pepper.',
      categoryId: catMap.get('rasam')!,
      basePrice: 7.99,
      image: '/images/dishes/poondu-milagu-rasam.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'SPICY',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Roasted Garlic Cloves', 'Black Peppercorns', 'Jeera (Cumin)', 'Tamarind', 'Curry Leaves', 'Mustard', 'Hing']),
      nutritionServing: '1 cup (240 ml)',
      reheatingInstructions: 'Heat thoroughly until steaming. Best enjoyed as a hot digestive soup.',
      rating: 4.9,
      reviewCount: 92,
      variants: [
        { name: 'Regular (16 oz)', price: 7.99, servesCount: 2 },
        { name: 'Family Flask (32 oz)', price: 13.99, servesCount: 4 }
      ]
    },
    // --- CHUTNEYS CATEGORY ---
    {
      slug: 'thengai-chutney',
      name: 'Authentic Thengai (Coconut) Chutney',
      description: 'Freshly grated coconut ground with roasted Bengal gram, ginger, green chilies, and tempered with crackling mustard seeds and curry leaves.',
      categoryId: catMap.get('chutneys')!,
      basePrice: 4.99,
      image: '/images/dishes/thengai-chutney.jpg',
      orderCountBadge: '1,000+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Coconut']),
      ingredients: JSON.stringify(['Fresh Coconut', 'Roasted Chana Dal', 'Green Chilies', 'Ginger', 'Mustard Seeds', 'Urad Dal', 'Curry Leaves', 'Hing']),
      nutritionServing: '2 tbsp (40 g)',
      reheatingInstructions: 'Serve chilled or at room temperature. Do not heat.',
      rating: 5.0,
      reviewCount: 210,
      variants: [
        { name: 'Tub (8 oz)', price: 4.99, servesCount: 4 },
        { name: 'Tub (16 oz)', price: 8.99, servesCount: 8 }
      ]
    },
    {
      slug: 'thakkali-chutney',
      name: 'Spicy Thakkali (Tomato Onion) Chutney',
      description: 'Slow-caramelized country tomatoes, red onions, and red chilies stewed in gingelly oil with a fiery tangy punch.',
      categoryId: catMap.get('chutneys')!,
      basePrice: 5.49,
      image: '/images/dishes/thakkali-chutney.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'SPICY',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Ripe Tomatoes', 'Red Onions', 'Byadagi Chilies', 'Tamarind', 'Sesame Oil', 'Mustard Seeds', 'Curry Leaves']),
      nutritionServing: '2 tbsp (40 g)',
      reheatingInstructions: 'Serve at room temperature. Pairs exceptionally with hot idlies and crispy dosas.',
      rating: 4.9,
      reviewCount: 135,
      variants: [
        { name: 'Tub (8 oz)', price: 5.49, servesCount: 4 },
        { name: 'Tub (16 oz)', price: 9.49, servesCount: 8 }
      ]
    },
    {
      slug: 'kothamalli-pudina-chutney',
      name: 'Fresh Kothamalli Pudina (Mint-Coriander) Chutney',
      description: 'Vibrant green chutney ground with garden mint, fresh cilantro, raw mango, and green chilies. Refreshing, digestive, and zesty.',
      categoryId: catMap.get('chutneys')!,
      basePrice: 5.29,
      image: '/images/dishes/kothamalli-pudina-chutney.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Fresh Mint Leaves', 'Coriander Leaves', 'Raw Mango', 'Green Chilies', 'Ginger', 'Roasted Cumin', 'Himalayan Rock Salt']),
      nutritionServing: '2 tbsp (40 g)',
      reheatingInstructions: 'Serve fresh and chilled.',
      rating: 4.8,
      reviewCount: 78,
      variants: [
        { name: 'Tub (8 oz)', price: 5.29, servesCount: 4 },
        { name: 'Tub (16 oz)', price: 9.29, servesCount: 8 }
      ]
    },
    {
      slug: 'idli-milagai-podi',
      name: 'Mylapore Idli Milagai Podi (Gunpowder)',
      description: 'Stone-roasted lentils, dry Guntur red chilies, white sesame, and asafoetida coarsely ground to crunchy perfection. Packed with cold-pressed sesame oil.',
      categoryId: catMap.get('chutneys')!,
      basePrice: 6.99,
      image: '/images/dishes/idli-milagai-podi.jpg',
      orderCountBadge: '1,000+ ordered',
      isBlastChilled: false,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'SPICY',
      allergens: JSON.stringify(['Sesame']),
      ingredients: JSON.stringify(['Urad Dal', 'Chana Dal', 'White Sesame Seeds', 'Guntur Red Chilies', 'Asafoetida (Hing)', 'Curry Leaves', 'Sea Salt']),
      nutritionServing: '1 tbsp (15 g)',
      reheatingInstructions: 'Mix with warm ghee or cold-pressed gingelly oil and dip hot idlies.',
      rating: 5.0,
      reviewCount: 312,
      variants: [
        { name: 'Pouch (250 g)', price: 6.99, servesCount: 15 },
        { name: 'Family Jar (500 g)', price: 12.99, servesCount: 30 }
      ]
    },
    // --- DESSERTS CATEGORY ---
    {
      slug: 'paal-payasam',
      name: 'Mylapore Paal Payasam',
      description: 'Slow-simmered Govindobhog raw rice in organic rich milk for hours with pure saffron strands, green cardamom, and golden ghee-roasted cashews.',
      categoryId: catMap.get('desserts')!,
      basePrice: 6.99,
      image: '/images/dishes/paal-payasam.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk', 'Tree Nuts']),
      ingredients: JSON.stringify(['Whole Organic Milk', 'Aromatic Rice', 'Pure Saffron', 'Raw Sugar', 'Cardamom', 'Cashews', 'Golden Raisins', 'Cow Ghee']),
      nutritionServing: '1 cup (200 g)',
      reheatingInstructions: 'Enjoy warm or chilled directly from refrigerator.',
      rating: 5.0,
      reviewCount: 180,
      variants: [
        { name: 'Tub (12 oz)', price: 6.99, servesCount: 2 },
        { name: 'Family Bowl (24 oz)', price: 12.99, servesCount: 4 }
      ]
    },
    {
      slug: 'asoka-halwa',
      name: 'Thiruvaiyaru Asoka Halwa',
      description: 'The royal dessert of Tanjore: velvety yellow moong dal cooked with pure desi ghee, wheat extract, caramelized sugar, and cardamom.',
      categoryId: catMap.get('desserts')!,
      basePrice: 7.49,
      image: '/images/dishes/asoka-halwa.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk', 'Wheat', 'Tree Nuts']),
      ingredients: JSON.stringify(['Yellow Moong Dal', 'Wheat Flour', 'Pure Desi Cow Ghee', 'Raw Cane Sugar', 'Cardamom', 'Roasted Cashews']),
      nutritionServing: '1 portion (150 g)',
      reheatingInstructions: 'Warm in microwave for 25 seconds so the golden ghee glistens.',
      rating: 4.9,
      reviewCount: 84,
      variants: [
        { name: 'Box (250 g)', price: 7.49, servesCount: 2 },
        { name: 'Box (500 g)', price: 13.99, servesCount: 4 }
      ]
    },
    {
      slug: 'ghee-mysore-pak',
      name: 'Melt-in-Mouth Ghee Mysore Pak',
      description: 'Traditional royal Mysore delicacy made with roasted besan (gram flour), pure fragrant cow ghee, and sugar syrup. Soft and decadent.',
      categoryId: catMap.get('desserts')!,
      basePrice: 7.99,
      image: '/images/dishes/ghee-mysore-pak.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: false,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Pure Desi Cow Ghee', 'Gram Flour (Besan)', 'Refined Sugar', 'Cardamom']),
      nutritionServing: '2 pieces (80 g)',
      reheatingInstructions: 'Store at room temperature. Consume within 14 days.',
      rating: 5.0,
      reviewCount: 145,
      variants: [
        { name: 'Box (250 g)', price: 7.99, servesCount: 4 },
        { name: 'Box (500 g)', price: 14.99, servesCount: 8 }
      ]
    },
    {
      slug: 'saffron-rava-kesari',
      name: 'Saffron Rava Kesari',
      description: 'Golden semolina slow-roasted in pure cow ghee with saffron infusions, cardamom essence, cashews, and plump golden sultanas.',
      categoryId: catMap.get('desserts')!,
      basePrice: 6.49,
      image: '/images/dishes/saffron-rava-kesari.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk', 'Wheat', 'Tree Nuts']),
      ingredients: JSON.stringify(['Roasted Sooji Rava', 'Desi Ghee', 'Sugar', 'Saffron', 'Cashews', 'Raisins', 'Cardamom']),
      nutritionServing: '1 cup (180 g)',
      reheatingInstructions: 'Warm in microwave for 30 seconds for warm, heavenly aroma.',
      rating: 4.8,
      reviewCount: 79,
      variants: [
        { name: 'Tub (12 oz)', price: 6.49, servesCount: 2 },
        { name: 'Family Tub (24 oz)', price: 11.99, servesCount: 4 }
      ]
    },
    // --- SPECIALS CATEGORY ---
    {
      slug: 'mylapore-weekend-thali',
      name: 'Mylapore Grand Weekend Thali Feast',
      description: 'The ultimate royal feast: Murungakkai Sambar, Thakkali Rasam, Chow Chow Kootu, Potato Kara Kari, Puliyodarai, White Rice, Paal Payasam, and Appalam.',
      categoryId: catMap.get('specials')!,
      basePrice: 19.99,
      image: '/images/dishes/mylapore-weekend-thali.jpg',
      orderCountBadge: '1,000+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Milk', 'Tree Nuts']),
      ingredients: JSON.stringify(['Full traditional multi-course Tamil Brahmin wedding banquet assortment with pure ghee and temple spices']),
      nutritionServing: '1 Complete Platter (850 g)',
      reheatingInstructions: 'Follow the color-coded reheating lid guide included in the meal box.',
      rating: 5.0,
      reviewCount: 290,
      variants: [
        { name: 'Single Feast Platter', price: 19.99, servesCount: 1 },
        { name: 'Couples Feast (2 Platters)', price: 37.99, servesCount: 2 }
      ]
    },
    {
      slug: 'traditional-avial',
      name: 'Traditional Palakkad Avial',
      description: 'Classic heritage medley of 7 garden vegetables (drumstick, ash gourd, raw plantain, carrots, beans, yam) stewed with coconut, cumin, yogurt, and fresh coconut oil.',
      categoryId: catMap.get('specials')!,
      basePrice: 10.99,
      image: '/images/dishes/traditional-avial.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk', 'Coconut']),
      ingredients: JSON.stringify(['Raw Plantain', 'Elephant Foot Yam', 'Drumstick', 'Ash Gourd', 'Carrots', 'French Beans', 'Fresh Coconut', 'Curd', 'Cumin', 'Green Chilies', 'Curry Leaves', 'Cold Pressed Coconut Oil']),
      nutritionServing: '1 cup (220 g)',
      reheatingInstructions: 'Gently warm in microwave 60 seconds. Do not over-boil to keep yogurt silky.',
      rating: 4.9,
      reviewCount: 114,
      variants: [
        { name: 'Regular (16 oz)', price: 10.99, servesCount: 2 },
        { name: 'Family Tub (32 oz)', price: 19.99, servesCount: 4 }
      ]
    },
    // --- PICKLES CATEGORY ---
    {
      slug: 'avakkai-mango-pickle',
      name: 'Mylapore Heritage Avakkai Mango Pickle',
      description: 'Crisp green raw mango chunks cured in cold-pressed gingelly oil, freshly stone-ground mustard seeds, fenugreek, and fiery Guntur chilies.',
      categoryId: catMap.get('pickles')!,
      basePrice: 7.99,
      image: '/images/dishes/avakkai-mango-pickle.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: false,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'SPICY',
      allergens: JSON.stringify(['Mustard']),
      ingredients: JSON.stringify(['Raw Green Ramkela Mangoes', 'Mustard Seed Powder', 'Fenugreek Powder', 'Red Chili Powder', 'Cold Pressed Gingelly Oil', 'Rock Salt', 'Turmeric']),
      nutritionServing: '1 tsp (10 g)',
      reheatingInstructions: 'Store in cool dry pantry. Use a dry spoon.',
      rating: 5.0,
      reviewCount: 187,
      variants: [
        { name: 'Jar (300 g)', price: 7.99, servesCount: 30 },
        { name: 'Family Jar (600 g)', price: 14.99, servesCount: 60 }
      ]
    },
    {
      slug: 'elumichai-oorugai',
      name: 'Sun-Cured Elumichai (Lemon) Pickle',
      description: 'Zesty paper-thin lemons pickled in salt and aged in the Chennai sun, tempered with mustard seeds, fenugreek, and spicy red chili powder.',
      categoryId: catMap.get('pickles')!,
      basePrice: 6.99,
      image: '/images/dishes/elumichai-oorugai.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: false,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify(['Mustard']),
      ingredients: JSON.stringify(['Sun-cured Juicy Lemons', 'Mustard Powder', 'Methi (Fenugreek)', 'Asafoetida', 'Red Chilies', 'Sesame Oil', 'Salt']),
      nutritionServing: '1 tsp (10 g)',
      reheatingInstructions: 'Store at room temperature.',
      rating: 4.8,
      reviewCount: 94,
      variants: [
        { name: 'Jar (300 g)', price: 6.99, servesCount: 30 },
        { name: 'Family Jar (600 g)', price: 12.99, servesCount: 60 }
      ]
    },
    {
      slug: 'puli-inji',
      name: 'Traditional Puli Inji (Ginger Tamarind Relish)',
      description: 'Finely minced fresh ginger, green chilies, and tamarind cooked down in organic jaggery syrup and roasted fenugreek powder. A sublime feast accompaniment.',
      categoryId: catMap.get('pickles')!,
      basePrice: 7.49,
      image: '/images/dishes/puli-inji.jpg',
      orderCountBadge: '250+ ordered',
      isBlastChilled: false,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MEDIUM',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Fresh Mountain Ginger', 'Organic Palm Jaggery', 'Tamarind Pulp', 'Green Chilies', 'Mustard Seeds', 'Curry Leaves', 'Fenugreek', 'Sesame Oil']),
      nutritionServing: '1 tsp (10 g)',
      reheatingInstructions: 'Store at room temperature.',
      rating: 4.9,
      reviewCount: 112,
      variants: [
        { name: 'Jar (300 g)', price: 7.49, servesCount: 30 },
        { name: 'Family Jar (600 g)', price: 13.99, servesCount: 60 }
      ]
    },
    // --- RICE ADDITIONS ---
    {
      slug: 'lemon-rice',
      name: 'Mylapore Elumichai (Lemon) Sadam',
      description: 'Fluffy Sona Masoori rice tossed in fresh lemon juice, turmeric, crunchy roasted peanuts, split chana dal, and fragrant curry leaves.',
      categoryId: catMap.get('rice')!,
      basePrice: 8.99,
      image: '/images/dishes/lemon-rice.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Peanuts']),
      ingredients: JSON.stringify(['Sona Masoori Rice', 'Fresh Lemon Juice', 'Roasted Peanuts', 'Chana Dal', 'Urad Dal', 'Green Chilies', 'Ginger', 'Curry Leaves', 'Turmeric', 'Sesame Oil']),
      nutritionServing: '1 portion (250 g)',
      reheatingInstructions: 'Microwave 90 seconds. Stir gently.',
      rating: 4.9,
      reviewCount: 154,
      variants: [
        { name: 'Regular (16 oz)', price: 8.99, servesCount: 1 },
        { name: 'Family Bowl (32 oz)', price: 15.99, servesCount: 3 }
      ]
    },
    {
      slug: 'thayir-sadam',
      name: 'Mylapore Temple Thayir Sadam (Curd Rice)',
      description: 'Cooling comfort rice mashed with thick homemade curd, whole milk, tempered with mustard, ginger, green chilies, and topped with sweet pomegranate pearls.',
      categoryId: catMap.get('rice')!,
      basePrice: 8.49,
      image: '/images/dishes/thayir-sadam.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify(['Milk']),
      ingredients: JSON.stringify(['Mashed Soft Rice', 'Homemade Fresh Curd', 'Whole Milk', 'Pomegranate Seeds', 'Ginger', 'Green Chilies', 'Curry Leaves', 'Mustard Seeds', 'Asafoetida']),
      nutritionServing: '1 portion (250 g)',
      reheatingInstructions: 'Serve thoroughly chilled. Do not heat.',
      rating: 5.0,
      reviewCount: 220,
      variants: [
        { name: 'Regular (16 oz)', price: 8.49, servesCount: 1 },
        { name: 'Family Bowl (32 oz)', price: 14.99, servesCount: 3 }
      ]
    },
    // --- BATTERS ADDITION ---
    {
      slug: 'crispy-dosa-batter',
      name: 'Mylapore Crispy Dosa Batter',
      description: 'Naturally stone-ground and aged fermented rice and urad dal batter formulated specifically for golden, extra-crisp paper roast dosas.',
      categoryId: catMap.get('batters')!,
      basePrice: 8.49,
      image: '/images/dishes/crispy-dosa-batter.jpg',
      orderCountBadge: '500+ ordered',
      isBlastChilled: true,
      dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
      spiceLevel: 'MILD',
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Parboiled Idli Rice', 'Raw Ponni Rice', 'Whole White Urad Dal', 'Fenugreek Seeds', 'Salt', 'Purified RO Water']),
      nutritionServing: '1 Dosa (80 g batter)',
      reheatingInstructions: 'Pour thin spiral onto hot cast-iron tawa, drizzle ghee or sesame oil, and flip once crisp.',
      rating: 5.0,
      reviewCount: 198,
      variants: [
        { name: 'Tub (32 oz)', price: 8.49, servesCount: 12 },
        { name: 'Family Tub (64 oz)', price: 15.49, servesCount: 25 }
      ]
    }
  ];

  for (const dish of dishes) {
    const { variants, ...dishData } = dish;
    await prisma.menuItem.create({
      data: {
        ...dishData,
        variants: {
          create: variants
        }
      }
    });
  }
  console.log(`✅ Seeded ${dishes.length} Authentic Dishes matching PDF catalog`);

  // 5. Coupons
  await prisma.coupon.deleteMany();
  await prisma.coupon.create({
    data: {
      code: 'MYLAPORE15',
      description: '15% off on authentic South Indian feast over $30',
      discountPercent: 15,
      minOrderAmount: 30.00,
      maxDiscount: 15.00,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME5',
      description: '$5 off on first order over $20',
      discountAmount: 5.00,
      minOrderAmount: 20.00,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  });

  // 6. Sample Order
  const potatoDish = await prisma.menuItem.findUnique({ where: { slug: 'potato-kara-kari' } });
  if (potatoDish) {
    await prisma.order.deleteMany();
    await prisma.order.create({
      data: {
        orderNumber: 'MYL-2026-1001',
        userId: testCustomer.id,
        guestName: testCustomer.name,
        guestEmail: testCustomer.email,
        guestPhone: testCustomer.phone,
        status: 'CONFIRMED',
        orderType: 'DELIVERY',
        deliveryAddressText: '1244 S Capitol Ave, Unit 302, San Jose, CA 95127',
        deliverySlot: 'Today, 12:30 PM - 1:30 PM',
        subtotal: 21.98,
        discount: 0.0,
        tax: 1.81,
        deliveryFee: 4.99,
        tip: 3.50,
        total: 32.28,
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_mock_1234567890_test',
        items: {
          create: [
            {
              menuItemId: potatoDish.id,
              name: potatoDish.name,
              quantity: 2,
              unitPrice: 10.99,
              totalPrice: 21.98,
              optionsSummary: 'Regular (16 oz) · Spice: Hot'
            }
          ]
        },
        history: {
          create: [
            { status: 'PENDING_PAYMENT', note: 'Customer checkout initiated' },
            { status: 'PAID', note: 'Stripe webhook verified payment succeeded' },
            { status: 'CONFIRMED', note: 'Order sent to Mylapore Express kitchen queue' }
          ]
        }
      }
    });

    await prisma.order.create({
      data: {
        orderNumber: 'MYL-2026-1002',
        userId: testCustomer.id,
        guestName: testCustomer.name,
        guestEmail: testCustomer.email,
        guestPhone: testCustomer.phone,
        status: 'PREPARING',
        orderType: 'DELIVERY',
        deliveryAddressText: '1244 S Capitol Ave, Unit 302, San Jose, CA 95127',
        deliverySlot: 'Today, 1:00 PM - 2:00 PM',
        subtotal: 32.97,
        discount: 0.0,
        tax: 2.72,
        deliveryFee: 0.0,
        tip: 5.00,
        total: 40.69,
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_mock_active_prep_test',
        items: {
          create: [
            {
              menuItemId: potatoDish.id,
              name: potatoDish.name,
              quantity: 3,
              unitPrice: 10.99,
              totalPrice: 32.97,
              optionsSummary: 'Regular (16 oz) · Spice: Medium'
            }
          ]
        },
        history: {
          create: [
            { status: 'PENDING_PAYMENT', note: 'Customer checkout initiated' },
            { status: 'PAID', note: 'Payment verified' },
            { status: 'CONFIRMED', note: 'Order queued for kitchen' },
            { status: 'ACCEPTED', note: 'Kitchen accepted order' },
            { status: 'PREPARING', note: 'Chefs preparing and blast chilling meal at 38°F' }
          ]
        }
      }
    });
  }

  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
