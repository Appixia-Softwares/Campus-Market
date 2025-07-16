import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDacVR49IYKM5NUgP6PlchNAH02Je9AhRk",
  authDomain: "universestay-8c0e4.firebaseapp.com",
  databaseURL: "https://universestay-8c0e4-default-rtdb.firebaseio.com",
  projectId: "universestay-8c0e4",
  storageBucket: "universestay-8c0e4.appspot.com",
  messagingSenderId: "984032807399",
  appId: "1:984032807399:web:50e0cdc71b62aec99d1542",
  measurementId: "G-6RYNDDKK5L"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const categories = [
  { name: 'Electronics', description: 'Phones, laptops, cameras, and more', icon: '💻', active: true },
  { name: 'Fashion', description: 'Clothing, shoes, accessories', icon: '👗', active: true },
  { name: 'Home & Garden', description: 'Furniture, decor, appliances', icon: '🏡', active: true },
  { name: 'Books & Media', description: 'Books, magazines, movies, music', icon: '📚', active: true },
  { name: 'Beauty & Personal Care', description: 'Cosmetics, skincare, haircare', icon: '💄', active: true },
  { name: 'Sports & Outdoors', description: 'Fitness, sports gear, outdoor', icon: '🏀', active: true },
  { name: 'Toys & Games', description: 'Toys, board games, puzzles', icon: '🧸', active: true },
  { name: 'Groceries', description: 'Food, beverages, pantry', icon: '🛒', active: true },
  { name: 'Automotive', description: 'Car parts, accessories, tools', icon: '🚗', active: true },
  { name: 'Health & Wellness', description: 'Supplements, medical, wellness', icon: '💊', active: true },
  { name: 'Jewelry & Accessories', description: 'Jewelry, watches, bags', icon: '💍', active: true },
  { name: 'Office & School', description: 'Supplies, stationery, tech', icon: '📎', active: true },
  { name: 'Baby & Kids', description: 'Baby gear, kids clothing, toys', icon: '👶', active: true },
  { name: 'Pet Supplies', description: 'Food, toys, accessories for pets', icon: '🐾', active: true },
  { name: 'Gifts & Occasions', description: 'Gifts, party supplies, cakes', icon: '🎁', active: true },
  { name: 'Music & Instruments', description: 'Instruments, audio, music', icon: '🎸', active: true },
  { name: 'Watches', description: 'Smartwatches, wristwatches', icon: '⌚', active: true },
  { name: 'Cameras', description: 'Cameras, lenses, accessories', icon: '📷', active: true },
  { name: 'Gaming', description: 'Consoles, games, accessories', icon: '🎮', active: true },
  { name: 'Health & Beauty', description: 'Personal care, wellness', icon: '🧴', active: true },
  { name: 'Travel & Luggage', description: 'Bags, suitcases, travel gear', icon: '🧳', active: true },
  { name: 'Furniture', description: 'Beds, sofas, tables, chairs', icon: '🛋️', active: true },
  { name: 'Weddings & Events', description: 'Wedding, event supplies', icon: '💒', active: true },
  { name: 'TV & Audio', description: 'Televisions, speakers, audio', icon: '📺', active: true },
  { name: 'Phones & Tablets', description: 'Smartphones, tablets, accessories', icon: '📱', active: true },
  { name: 'Bikes & Scooters', description: 'Bicycles, scooters, gear', icon: '🚲', active: true },
  { name: 'Tools & DIY', description: 'Tools, hardware, home improvement', icon: '🛠️', active: true },
  { name: 'Bags & Wallets', description: 'Handbags, wallets, purses', icon: '👜', active: true },
  { name: 'Shoes', description: 'Sneakers, boots, sandals', icon: '👟', active: true },
];

async function seedCategories() {
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    try {
      await addDoc(collection(db, 'product_categories'), {
        ...cat,
        sort_order: i,
        createdAt: new Date(),
      });
      console.log(`Seeded category: ${cat.name}`);
    } catch (err) {
      console.error(`Failed to seed category: ${cat.name}`, err);
    }
  }
  console.log('Seeding complete!');
}

seedCategories(); 