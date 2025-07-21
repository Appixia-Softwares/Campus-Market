"use client"

import { useEffect, useState } from 'react';
import { getAllUsers } from '@/lib/api/users';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { logAdminAction } from '@/lib/firebase-service';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ type: 'ban' | 'suspend' | 'unban'; user: any } | null>(null);
  const [suspendUntil, setSuspendUntil] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { user: currentAdmin } = useAuth();

  // Real-time fetch all users
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Send notification to user (in-app only)
  async function sendUserNotification(userId: string, title: string, body: string) {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      createdAt: Timestamp.now(),
      read: false,
      type: 'admin',
    });
  }

  // Ban user
  async function handleBan(user: any) {
    setProcessing(true);
    await updateDoc(doc(db, 'users', user.id), { status: 'banned', suspendedUntil: null });
    await sendUserNotification(user.id, 'Account Banned', 'Your account has been banned by an admin. Contact support for more info.');
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'ban',
      resource: 'user',
      resourceId: user.id,
      details: { user: user.full_name || user.email }
    });
    setProcessing(false);
    setActionDialog(null);
  }

  // Suspend user
  async function handleSuspend(user: any, until: string) {
    setProcessing(true);
    const untilTimestamp = Timestamp.fromDate(new Date(until));
    await updateDoc(doc(db, 'users', user.id), { status: 'suspended', suspendedUntil: untilTimestamp });
    await sendUserNotification(user.id, 'Account Suspended', `Your account has been suspended until ${format(new Date(until), 'PPPpp')}. Contact support for more info.`);
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'suspend',
      resource: 'user',
      resourceId: user.id,
      details: { user: user.full_name || user.email, until: format(new Date(until), 'PPPpp') }
    });
    setProcessing(false);
    setActionDialog(null);
    setSuspendUntil("");
  }

  // Unban/Unsuspend user
  async function handleUnban(user: any) {
    setProcessing(true);
    await updateDoc(doc(db, 'users', user.id), { status: 'active', suspendedUntil: null });
    await sendUserNotification(user.id, 'Account Restored', 'Your account has been restored. You may now use the platform.');
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'unban',
      resource: 'user',
      resourceId: user.id,
      details: { user: user.full_name || user.email }
    });
    setProcessing(false);
    setActionDialog(null);
  }

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
                {user.status === 'banned' || user.status === 'suspended' ? (
                  <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); setActionDialog({ type: 'unban', user }); }}>Unban</Button>
                ) : (
                  <>
                    <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setActionDialog({ type: 'ban', user }); }}>Ban</Button>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setActionDialog({ type: 'suspend', user }); }}>Suspend</Button>
                  </>
                )}
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
              <div className="w-full text-sm space-y-1">
                <div><span className="font-medium">ID:</span> {selectedUser.id}</div>
                <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                <div><span className="font-medium">Phone:</span> {selectedUser.phone || '-'}</div>
                <div><span className="font-medium">University:</span> {selectedUser.university_id || '-'}</div>
                <div><span className="font-medium">Website:</span> {selectedUser.website || '-'}</div>
                <div><span className="font-medium">Bio:</span> {selectedUser.bio || '-'}</div>
                <div><span className="font-medium">Role:</span> {selectedUser.role || '-'}</div>
                <div><span className="font-medium">Status:</span> {selectedUser.status || '-'}</div>
                <div><span className="font-medium">Created At:</span> {selectedUser.created_at ? (selectedUser.created_at.seconds ? new Date(selectedUser.created_at.seconds * 1000).toLocaleString() : new Date(selectedUser.created_at).toLocaleString()) : '-'}</div>
                <div><span className="font-medium">Last Login:</span> {selectedUser.last_login ? (selectedUser.last_login.seconds ? new Date(selectedUser.last_login.seconds * 1000).toLocaleString() : new Date(selectedUser.last_login).toLocaleString()) : '-'}</div>
                <div><span className="font-medium">Suspended Until:</span> {selectedUser.suspendedUntil ? (selectedUser.suspendedUntil.seconds ? new Date(selectedUser.suspendedUntil.seconds * 1000).toLocaleString() : new Date(selectedUser.suspendedUntil).toLocaleString()) : '-'}</div>
                {/* Show any other fields dynamically */}
                {Object.entries(selectedUser).map(([key, value]) => {
                  if ([
                    'id', 'full_name', 'email', 'avatar_url', 'phone', 'university_id', 'website', 'bio', 'role', 'status', 'created_at', 'last_login', 'suspendedUntil', 'verified'
                  ].includes(key)) return null;
                  if (typeof value === 'object' && value !== null) return null;
                  return (
                    <div key={key}><span className="font-medium">{key}:</span> {String(value)}</div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">Edit</Button>
                <Button size="sm" variant="destructive">Ban</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Action Confirmation Dialogs */}
      <Dialog open={!!actionDialog} onOpenChange={open => !open && setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'ban' && 'Confirm Ban'}
              {actionDialog?.type === 'suspend' && 'Suspend User'}
              {actionDialog?.type === 'unban' && (actionDialog.user.status === 'banned' ? 'Unban User' : 'Unsuspend User')}
            </DialogTitle>
          </DialogHeader>
          {actionDialog?.type === 'ban' && (
            <div>Are you sure you want to <b>ban</b> <span className="font-semibold">{actionDialog.user.full_name || actionDialog.user.email}</span>? This will immediately log them out and prevent access until unbanned.</div>
          )}
          {actionDialog?.type === 'suspend' && (
            <div>
              <div>Enter suspension end date/time for <span className="font-semibold">{actionDialog.user.full_name || actionDialog.user.email}</span>:</div>
              <input
                type="datetime-local"
                value={suspendUntil}
                onChange={e => setSuspendUntil(e.target.value)}
                className="border rounded px-2 py-1 mt-2 w-full"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
          {actionDialog?.type === 'unban' && (
            <div>Are you sure you want to restore <span className="font-semibold">{actionDialog.user.full_name || actionDialog.user.email}</span>'s account?</div>
          )}
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={processing}>Cancel</Button>
            {actionDialog?.type === 'ban' && (
              <Button variant="destructive" disabled={processing} onClick={() => handleBan(actionDialog.user)}>
                {processing ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}Ban
              </Button>
            )}
            {actionDialog?.type === 'suspend' && (
              <Button variant="default" disabled={processing || !suspendUntil} onClick={() => handleSuspend(actionDialog.user, suspendUntil)}>
                {processing ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}Suspend
              </Button>
            )}
            {actionDialog?.type === 'unban' && (
              <Button variant="default" disabled={processing} onClick={() => handleUnban(actionDialog.user)}>
                {processing ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}
                {actionDialog.user.status === 'banned' ? 'Unban' : 'Unsuspend'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
