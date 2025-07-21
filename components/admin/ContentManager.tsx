"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { logAdminAction } from '@/lib/firebase-service';
import { useAuth } from '@/lib/auth-context';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function ContentManager({ collectionName, label }: { collectionName: string; label: string }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>("");
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ContentItem, "id">),
        }))
      );
    });
    return () => unsub();
  }, [collectionName]);

  async function addItem() {
    setLoading(true);
    const docRef = await addDoc(collection(db, collectionName), {
      title: newTitle,
      content: newContent,
      order: items.length,
    });
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'add',
      resource: collectionName,
      resourceId: docRef.id,
      details: { title: newTitle, content: newContent }
    });
    setNewTitle("");
    setNewContent("");
    setLoading(false);
  }

  async function updateItem(id: string, field: keyof Omit<ContentItem, "id">, value: string | number) {
    await updateDoc(doc(db, collectionName, id), { [field]: value });
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'edit',
      resource: collectionName,
      resourceId: id,
      details: { field, value }
    });
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, collectionName, id));
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'delete',
      resource: collectionName,
      resourceId: id,
      details: {}
    });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{label} Manager</h2>
      <div className="mb-6">
        <Input
          placeholder="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="mb-2"
        />
        <Textarea
          placeholder="Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="mb-2"
        />
        <Button onClick={addItem} disabled={loading || !newTitle || !newContent}>
          Add {label}
        </Button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="mb-4 border p-3 rounded">
            {editingId === item.id ? (
              <>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mb-2"
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={async () => {
                      await updateItem(item.id, "title", editTitle);
                      await updateItem(item.id, "content", editContent);
                      setEditingId(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Input
                  value={item.title}
                  readOnly
                  className="mb-2 bg-muted"
                />
                <Textarea
                  value={item.content}
                  readOnly
                  className="mb-2 bg-muted"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditTitle(item.title);
                      setEditContent(item.content);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="destructive" onClick={() => { setDeleteId(item.id); setDeleteTitle(item.title); }}>
                    Delete
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete the section <b>{deleteTitle}</b>? This action cannot be undone.</div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) { await deleteItem(deleteId); setDeleteId(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 