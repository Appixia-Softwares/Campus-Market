// Category config shared between sell and product details pages
import { Smartphone, Shirt, BookOpen, Package } from "lucide-react";

export const CATEGORY_META = [
  {
    key: "electronics",
    label: "Electronics",
    description: "Phones, laptops, gadgets, and more.",
    icon: Smartphone,
  },
  {
    key: "fashion",
    label: "Fashion",
    description: "Clothing, shoes, accessories.",
    icon: Shirt,
  },
  {
    key: "books",
    label: "Books",
    description: "Textbooks, novels, study guides.",
    icon: BookOpen,
  },
  {
    key: "other",
    label: "Other",
    description: "Anything else you want to sell.",
    icon: Package,
  },
] as const;

export type CategoryKey = typeof CATEGORY_META[number]["key"];
export type CategoryField = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
};

export const CATEGORY_CONFIG: Record<CategoryKey, CategoryField[]> = {
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
  books: [
    { name: 'brand', label: 'Publisher', placeholder: 'e.g. Pearson', type: 'text' },
    { name: 'model', label: 'Edition', placeholder: 'e.g. 2nd Edition', type: 'text' },
  ],
  other: [],
}; 