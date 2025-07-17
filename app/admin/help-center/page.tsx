import AdminGuard from "@/components/admin/AdminGuard";
import ContentManager from "@/components/admin/ContentManager";

export default function AdminHelpCenterPage() {
  return (
    <AdminGuard>
      <ContentManager collectionName="helpArticles" label="Help Article" />
    </AdminGuard>
  );
} 