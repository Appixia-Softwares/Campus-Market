import { MigrateButton } from '@/components/admin/MigrateButton';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Database Management</h2>
          <p className="text-muted-foreground mb-4">
            Migrate data from Supabase to Firebase and seed initial data.
          </p>
          <MigrateButton />
        </div>
        
        {/* Add other admin sections here */}
      </div>
    </div>
  );
} 