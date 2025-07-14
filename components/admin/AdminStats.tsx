export default function AdminStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
        <span className="text-3xl font-bold text-primary">1,234</span>
        <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Users</span>
      </div>
      <div className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
        <span className="text-3xl font-bold text-primary">567</span>
        <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Products</span>
      </div>
      <div className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
        <span className="text-3xl font-bold text-primary">89</span>
        <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Orders</span>
      </div>
      <div className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
        <span className="text-3xl font-bold text-primary">₦1,000,000</span>
        <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Revenue</span>
      </div>
    </div>
  );
} 