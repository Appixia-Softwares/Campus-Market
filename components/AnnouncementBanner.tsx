import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AnnouncementBanner({ userId }: { userId: string }) {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("type", "==", "admin"),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncement(snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
    });
    return () => unsub();
  }, [userId]);

  const dismiss = async () => {
    setDismissed(true);
    if (announcement?.id) {
      await updateDoc(doc(db, "notifications", announcement.id), { read: true });
    }
  };

  if (!announcement || dismissed) return null;
  return (
    <div className="bg-blue-100 text-blue-900 p-4 text-center flex items-center justify-between">
      <div>
        <strong>{announcement.title}</strong>: {announcement.body}
      </div>
      <button onClick={dismiss} className="ml-4 px-2 py-1 text-xs bg-blue-200 rounded">Dismiss</button>
    </div>
  );
} 