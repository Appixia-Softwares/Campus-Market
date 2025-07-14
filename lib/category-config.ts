// Category config shared between sell and product details pages
import { Laptop, Shirt, Home, Book, Dumbbell, Car, Baby, Apple, Watch, Camera, Gamepad2, PawPrint, Sparkles, Briefcase, Globe, Gift, Music, FlaskConical, Wrench, Gem, BedDouble, Bike, Tv, Phone, Wallet, ShoppingBag, Package, Cake } from "lucide-react";

export const CATEGORY_META = [
  { key: "electronics", label: "Electronics", description: "Phones, laptops, cameras, and more", icon: Laptop },
  { key: "fashion", label: "Fashion", description: "Clothing, shoes, accessories", icon: Shirt },
  { key: "home & garden", label: "Home & Garden", description: "Furniture, decor, appliances", icon: Home },
  { key: "books & media", label: "Books & Media", description: "Books, magazines, movies, music", icon: Book },
  { key: "beauty & personal care", label: "Beauty & Personal Care", description: "Cosmetics, skincare, haircare", icon: Sparkles },
  { key: "sports & outdoors", label: "Sports & Outdoors", description: "Fitness, sports gear, outdoor", icon: Dumbbell },
  { key: "toys & games", label: "Toys & Games", description: "Toys, board games, puzzles", icon: Gamepad2 },
  { key: "groceries", label: "Groceries", description: "Food, beverages, pantry", icon: Apple },
  { key: "automotive", label: "Automotive", description: "Car parts, accessories, tools", icon: Car },
  { key: "health & wellness", label: "Health & Wellness", description: "Supplements, medical, wellness", icon: FlaskConical },
  { key: "jewelry & accessories", label: "Jewelry & Accessories", description: "Jewelry, watches, bags", icon: Gem },
  { key: "office & school", label: "Office & School", description: "Supplies, stationery, tech", icon: Briefcase },
  { key: "baby & kids", label: "Baby & Kids", description: "Baby gear, kids clothing, toys", icon: Baby },
  { key: "pet supplies", label: "Pet Supplies", description: "Food, toys, accessories for pets", icon: PawPrint },
  { key: "gifts & occasions", label: "Gifts & Occasions", description: "Gifts, party supplies, cakes", icon: Gift },
  { key: "music & instruments", label: "Music & Instruments", description: "Instruments, audio, music", icon: Music },
  { key: "watches", label: "Watches", description: "Smartwatches, wristwatches", icon: Watch },
  { key: "cameras", label: "Cameras", description: "Cameras, lenses, accessories", icon: Camera },
  { key: "gaming", label: "Gaming", description: "Consoles, games, accessories", icon: Gamepad2 },
  { key: "health & beauty", label: "Health & Beauty", description: "Personal care, wellness", icon: Sparkles },
  { key: "travel & luggage", label: "Travel & Luggage", description: "Bags, suitcases, travel gear", icon: Globe },
  { key: "furniture", label: "Furniture", description: "Beds, sofas, tables, chairs", icon: BedDouble },
  { key: "weddings & events", label: "Weddings & Events", description: "Wedding, event supplies", icon: Cake },
  { key: "tv & audio", label: "TV & Audio", description: "Televisions, speakers, audio", icon: Tv },
  { key: "phones & tablets", label: "Phones & Tablets", description: "Smartphones, tablets, accessories", icon: Phone },
  { key: "bikes & scooters", label: "Bikes & Scooters", description: "Bicycles, scooters, gear", icon: Bike },
  { key: "tools & diy", label: "Tools & DIY", description: "Tools, hardware, home improvement", icon: Wrench },
  { key: "bags & wallets", label: "Bags & Wallets", description: "Handbags, wallets, purses", icon: Wallet },
  { key: "shoes", label: "Shoes", description: "Sneakers, boots, sandals", icon: ShoppingBag },
  { key: "other", label: "Other", description: "Anything else you want to sell.", icon: Package },
];

export type CategoryKey = typeof CATEGORY_META[number]["key"];
export type CategoryField = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
};

export const CATEGORY_CONFIG = {
  electronics: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Apple, Samsung', type: 'text' },
    { name: 'model', label: 'Model', placeholder: 'e.g. iPhone 14 Pro', type: 'text' },
    { name: 'specs', label: 'Specs', placeholder: 'e.g. 256GB, 8GB RAM, M1 Chip', type: 'text' },
  ],
  fashion: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Zara', type: 'text' },
    { name: 'size', label: 'Size', placeholder: 'e.g. M, 32, 8 UK', type: 'text' },
    { name: 'color', label: 'Color', placeholder: 'e.g. Black, Red', type: 'text' },
  ],
  'home & garden': [
    { name: 'material', label: 'Material', placeholder: 'e.g. Oak Wood', type: 'text' },
    { name: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120x60x45cm', type: 'text' },
  ],
  'books & media': [
    { name: 'author', label: 'Author/Creator', placeholder: 'e.g. James Clear', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Book, Magazine', type: 'text' },
  ],
  'beauty & personal care': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Maybelline, L’Oreal', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Skincare, Haircare', type: 'text' },
  ],
  'sports & outdoors': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Adidas', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Football, Tent', type: 'text' },
  ],
  'toys & games': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Lego', type: 'text' },
    { name: 'age_range', label: 'Age Range', placeholder: 'e.g. 3-6 years', type: 'text' },
  ],
  groceries: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Nestle', type: 'text' },
    { name: 'weight', label: 'Weight/Volume', placeholder: 'e.g. 1kg, 500ml', type: 'text' },
  ],
  automotive: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Toyota', type: 'text' },
    { name: 'model', label: 'Model', placeholder: 'e.g. Corolla', type: 'text' },
    { name: 'year', label: 'Year', placeholder: 'e.g. 2015', type: 'number' },
  ],
  'health & wellness': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Wellman', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Supplement', type: 'text' },
  ],
  'jewelry & accessories': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Necklace, Watch', type: 'text' },
    { name: 'material', label: 'Material', placeholder: 'e.g. Gold', type: 'text' },
  ],
  'office & school': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Stationery, Laptop', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. HP', type: 'text' },
  ],
  'baby & kids': [
    { name: 'age_range', label: 'Age Range', placeholder: 'e.g. 0-2 years', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Pampers', type: 'text' },
  ],
  'pet supplies': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Food, Toy', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Pedigree', type: 'text' },
  ],
  'gifts & occasions': [
    { name: 'occasion', label: 'Occasion', placeholder: 'e.g. Birthday, Wedding', type: 'text' },
  ],
  'music & instruments': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Guitar, Headphones', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Yamaha', type: 'text' },
  ],
  watches: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Rolex', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Smartwatch, Analog', type: 'text' },
  ],
  cameras: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Canon', type: 'text' },
    { name: 'model', label: 'Model', placeholder: 'e.g. EOS 5D', type: 'text' },
  ],
  gaming: [
    { name: 'type', label: 'Type', placeholder: 'e.g. Console, Game', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Sony', type: 'text' },
  ],
  'health & beauty': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Supplement, Skincare', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Nivea', type: 'text' },
  ],
  'travel & luggage': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Suitcase, Backpack', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Samsonite', type: 'text' },
  ],
  furniture: [
    { name: 'material', label: 'Material', placeholder: 'e.g. Wood', type: 'text' },
    { name: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 200x150cm', type: 'text' },
  ],
  'weddings & events': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Wedding Dress, Decor', type: 'text' },
  ],
  'tv & audio': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Samsung', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Television, Speaker', type: 'text' },
  ],
  'phones & tablets': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Apple', type: 'text' },
    { name: 'model', label: 'Model', placeholder: 'e.g. iPhone 14', type: 'text' },
  ],
  'bikes & scooters': [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Giant', type: 'text' },
    { name: 'type', label: 'Type', placeholder: 'e.g. Bicycle, Scooter', type: 'text' },
  ],
  'tools & diy': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Drill, Hammer', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Bosch', type: 'text' },
  ],
  'bags & wallets': [
    { name: 'type', label: 'Type', placeholder: 'e.g. Handbag, Wallet', type: 'text' },
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Gucci', type: 'text' },
  ],
  shoes: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Nike', type: 'text' },
    { name: 'size', label: 'Size', placeholder: 'e.g. 42', type: 'text' },
    { name: 'color', label: 'Color', placeholder: 'e.g. Black', type: 'text' },
  ],
  other: [],
}; 