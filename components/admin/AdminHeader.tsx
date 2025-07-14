const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold">Welcome, Admin!</h2>
        <p className="text-muted-foreground text-sm">Today is {today}</p>
      </div>
      {/* Optionally, add quick actions or profile here */}
    </div>
  );
} 