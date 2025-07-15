import { useAuth } from '@/lib/auth-context';

export default function AdminHeader() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Welcome, {user?.full_name || user?.email || 'Admin'}
          <img
            src={user?.avatar_url || '/placeholder-user.jpg'}
            alt={user?.full_name || 'Admin'}
            className="h-8 w-8 rounded-full border ml-2"
          />
        </h2>
        <p className="text-muted-foreground text-sm">Today is {today}</p>
      </div>
    </div>
  );
} 