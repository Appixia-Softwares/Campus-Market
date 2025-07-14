"use client"

import UserTable from '@/components/admin/UserTable';

export default function AdminUsersPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-6">View, verify, and manage all users.</p>
      <UserTable />
    </div>
  );
}
