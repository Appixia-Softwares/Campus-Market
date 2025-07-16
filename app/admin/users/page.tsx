"use client"

import { useEffect, useState } from 'react';
import { getAllUsers } from '@/lib/api/users';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-6">View, verify, and manage all users.</p>
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border rounded w-full max-w-xs focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div>Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">No users found.</div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center hover:scale-[1.03] transition cursor-pointer group"
              onClick={() => setSelectedUser(user)}
            >
              <img
                src={user.avatar_url || '/placeholder-user.jpg'}
                alt={user.full_name}
                className="h-16 w-16 rounded-full border object-cover mb-2"
              />
              <div className="font-semibold text-center">{user.full_name}</div>
              <div className="text-xs text-muted-foreground mb-2">{user.email || user.id}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                {user.verified && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {user.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedUser(user); }}>View</Button>
                <Button size="sm" variant="default" onClick={e => { e.stopPropagation(); /* implement edit */ }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); /* implement ban */ }}>Ban</Button>
              </div>
            </div>
          ))
        )}
            </div>
      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={selectedUser.avatar_url || '/placeholder-user.jpg'}
                alt={selectedUser.full_name}
                className="h-20 w-20 rounded-full border object-cover mb-2"
              />
              <div className="font-semibold text-lg">{selectedUser.full_name}</div>
              <div className="text-xs text-muted-foreground mb-2">{selectedUser.email || selectedUser.id}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                {selectedUser.verified && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {selectedUser.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
              </div>
              <div className="w-full text-sm">
                <div><span className="font-medium">Phone:</span> {selectedUser.phone || '-'}</div>
                <div><span className="font-medium">University:</span> {selectedUser.university_id || '-'}</div>
                <div><span className="font-medium">Website:</span> {selectedUser.website || '-'}</div>
                <div><span className="font-medium">Bio:</span> {selectedUser.bio || '-'}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">Edit</Button>
                <Button size="sm" variant="destructive">Ban</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
