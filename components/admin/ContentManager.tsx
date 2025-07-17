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
    await addDoc(collection(db, collectionName), {
      title: newTitle,
      content: newContent,
      order: items.length,
    });
    setNewTitle("");
    setNewContent("");
    setLoading(false);
  }

  async function updateItem(id: string, field: keyof Omit<ContentItem, "id">, value: string | number) {
    await updateDoc(doc(db, collectionName, id), { [field]: value });
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, collectionName, id));
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
            <Input
              value={item.title}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="mb-2"
            />
            <Textarea
              value={item.content}
              onChange={(e) => updateItem(item.id, "content", e.target.value)}
              className="mb-2"
            />
            <Button variant="destructive" onClick={() => deleteItem(item.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
} 