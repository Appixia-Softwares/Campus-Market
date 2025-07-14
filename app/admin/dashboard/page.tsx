import AdminStats from '@/components/admin/AdminStats';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <AdminHeader />
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Overview of platform performance and recent activity.</p>
      <AdminStats />
    </div>
  );
}
