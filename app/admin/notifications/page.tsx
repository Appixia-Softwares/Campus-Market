"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Check, Trash2, Bell } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { logAdminAction } from '@/lib/firebase-service';
import { useAuth } from '@/lib/auth-context';

interface Notification {
  id: string;
  title: string;
  content: string;
  is_read?: boolean;
  createdAt?: any;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setNotifications(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "notifications"), {
        ...form,
        is_read: false,
        createdAt: serverTimestamp(),
      });
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'add',
        resource: 'notification',
        resourceId: docRef.id,
        details: { ...form }
      });
      setDialogOpen(false);
      setForm({ title: "", content: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleRead = async (id: string, is_read: boolean) => {
    await updateDoc(doc(db, "notifications", id), { is_read });
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: is_read ? 'mark_read' : 'mark_unread',
      resource: 'notification',
      resourceId: id,
      details: { is_read }
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'delete',
      resource: 'notification',
      resourceId: id,
      details: {}
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send and manage platform notifications</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Bell className="h-4 w-4 mr-2" /> New Notification</Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No notifications found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notifications.map(note => (
            <Card key={note.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">{note.title}</CardTitle>
                  {!note.is_read && <span className="text-xs text-primary">New</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleRead(note.id, !note.is_read)} aria-label="Mark as read/unread"><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(note.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{note.content}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : "-"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Notification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
            <Input value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Content" />
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 