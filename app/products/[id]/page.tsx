import ZIM_UNIVERSITIES from "@/utils/schools_data";
import { CATEGORY_META } from "@/lib/category-config";
// Helper to get university by id
function getUniversityById(id: string) {
  return ZIM_UNIVERSITIES.find(u => u.id === id);
}
// Helper to get category meta by id or name
function getCategoryMeta(keyOrName: string) {
  const key = keyOrName?.toLowerCase();
  return CATEGORY_META.find(cat => cat.key === key || cat.label.toLowerCase() === key);
} 