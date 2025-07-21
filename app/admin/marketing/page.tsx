"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { logAdminAction } from '@/lib/firebase-service';
import { useAuth } from '@/lib/auth-context';

interface Promotion {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate?: any;
  endDate?: any;
}

export default function AdminMarketingPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "promotions"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
        setPromotions(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "promotions"), {
        ...form,
        status: form.status,
        startDate: serverTimestamp(),
        endDate: null,
      });
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'add',
        resource: 'promotion',
        resourceId: docRef.id,
        details: { ...form }
      });
      setDialogOpen(false);
      setForm({ title: "", description: "", status: "active" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPromotion) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "promotions", selectedPromotion.id), {
        ...form,
      });
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'edit',
        resource: 'promotion',
        resourceId: selectedPromotion.id,
        details: { ...form }
      });
      setDialogOpen(false);
      setSelectedPromotion(null);
      setForm({ title: "", description: "", status: "active" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "promotions", id));
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'delete',
      resource: 'promotion',
      resourceId: id,
      details: {}
    });
  };

  const openEdit = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setForm({
      title: promo.title,
      description: promo.description,
      status: promo.status,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing & Promotions</h1>
          <p className="text-muted-foreground">Manage banners, promotions, and featured listings</p>
        </div>
        <Button onClick={() => { setDialogOpen(true); setSelectedPromotion(null); }}><Plus className="h-4 w-4 mr-2" /> New Promotion</Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No promotions found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map(promo => (
            <Card key={promo.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">{promo.title}</CardTitle>
                  <Badge variant={promo.status === "active" ? "default" : "secondary"}>{promo.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(promo)} aria-label="Edit"><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(promo.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{promo.description}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">Start: {promo.startDate?.toDate ? promo.startDate.toDate().toLocaleString() : "-"}</div>
                <div className="text-xs text-muted-foreground mt-1">End: {promo.endDate?.toDate ? promo.endDate.toDate().toLocaleString() : "-"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Promotion Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPromotion ? "Edit Promotion" : "New Promotion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
            <Input value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} placeholder="Status (active/inactive)" />
          </div>
          <DialogFooter>
            <Button onClick={selectedPromotion ? handleEdit : handleAdd} disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}{selectedPromotion ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 