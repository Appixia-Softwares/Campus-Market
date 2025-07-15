import { useEffect, useState } from "react";
import { getUniversities } from "@/lib/get-universities";
import { CATEGORY_META } from "@/lib/category-config";
// Helper to get university by id
function useUniversityById(id: string) {
  const [universities, setUniversities] = useState<any[]>([]);
  useEffect(() => {
    getUniversities().then(setUniversities);
  }, []);
  return universities.find(u => u.id === id);
}
// Helper to get category meta by id or name
function getCategoryMeta(keyOrName: string) {
  const key = keyOrName?.toLowerCase();
  return CATEGORY_META.find(cat => cat.key === key || cat.label.toLowerCase() === key);
} 