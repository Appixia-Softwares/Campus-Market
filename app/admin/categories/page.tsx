"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { logAdminAction } from '@/lib/firebase-service';
import { useAuth } from '@/lib/auth-context';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  active?: boolean;
  createdAt?: any;
  sort_order?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "", active: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user: currentAdmin } = useAuth();

  // Real-time listener for categories
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      // Fetch all categories, not just active ones
      collection(db, "product_categories"),
      (snap) => {
        // Sort by sort_order if present
        const cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category));
        console.log('DEBUG: Categories fetched from Firestore:', cats);
        cats.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setCategories(cats);
        setLoading(false);
      },
      (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Add category
  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Category name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "product_categories"), {
        name: form.name,
        description: form.description,
        icon: form.icon,
        active: form.active,
        createdAt: serverTimestamp(),
      });
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'create',
        resource: 'category',
        resourceId: docRef.id,
        details: { name: form.name, description: form.description }
      });
      setDialogOpen(false);
      setForm({ name: "", description: "", icon: "", active: true });
      toast({ title: "Category added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Edit category
  const handleEdit = async () => {
    if (!selectedCategory) return;
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Category name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "product_categories", selectedCategory.id), {
        name: form.name,
        description: form.description,
        icon: form.icon,
        active: form.active,
      });
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'update',
        resource: 'category',
        resourceId: selectedCategory.id,
        details: { name: form.name, description: form.description }
      });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      setForm({ name: "", description: "", icon: "", active: true });
      toast({ title: "Category updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "product_categories", selectedCategory.id));
      await logAdminAction({
        adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
        action: 'delete',
        resource: 'category',
        resourceId: selectedCategory.id,
        details: { name: selectedCategory.name }
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "Category deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Open edit dialog
  const openEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
      icon: cat.icon || "",
      active: cat.active ?? true,
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDelete = (cat: Category) => {
    setSelectedCategory(cat);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage marketplace categories in real time</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No categories found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="relative group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  {cat.icon && <span className="text-xl">{cat.icon}</span>}
                  <CardTitle className="text-lg font-semibold">{cat.name}</CardTitle>
                  {!cat.active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(cat)} aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openDelete(cat)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{cat.description}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  Created: {cat.createdAt?.toDate ? cat.createdAt.toDate().toLocaleDateString() : "-"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
            <Label>Icon (emoji or text)</Label>
            <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. 🛒" />
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
            <Label>Icon (emoji or text)</Label>
            <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. 🛒" />
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete <span className="font-semibold">{selectedCategory?.name}</span>? This cannot be undone.</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 