export default function OrderTable() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded shadow p-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Order ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1,2,3].map(i => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition">
              <td className="px-4 py-2 font-mono text-sm">#ORDER{i}</td>
              <td className="px-4 py-2">User {i}</td>
              <td className="px-4 py-2">Product {i}</td>
              <td className="px-4 py-2"><span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Completed</span></td>
              <td className="px-4 py-2 text-xs text-muted-foreground">2024-06-01</td>
              <td className="px-4 py-2"><button className="text-primary hover:underline">View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 