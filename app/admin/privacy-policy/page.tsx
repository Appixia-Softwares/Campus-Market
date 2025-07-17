import AdminGuard from "@/components/admin/AdminGuard";
import ContentManager from "@/components/admin/ContentManager";

export default function AdminPrivacyPolicyPage() {
  return (
    <AdminGuard>
      <ContentManager collectionName="privacyPolicySections" label="Privacy Policy Section" />
    </AdminGuard>
  );
} 