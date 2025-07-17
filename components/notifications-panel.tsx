"use client"

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { useRef } from "react"

export default function NotificationsPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const prevNotifications = useRef<any[]>([]);
  const notificationSound = "/sounds/notification-sound.mp3";

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const newNotifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // --- Animated feedback for new booking notification ---
      if (prevNotifications.current.length > 0 && newNotifications.length > prevNotifications.current.length) {
        const latest = newNotifications[0];
        if (latest.type === 'accommodation') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
          toast.success("New booking notification!", {
            description: latest.title + ': ' + latest.body,
            duration: 4000,
          });
          // Play notification sound
          const audio = new Audio(notificationSound);
          audio.play();
        }
      }
      prevNotifications.current = newNotifications;
      setNotifications(newNotifications);
    });
    return () => unsub();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Notifications</h3>
      <ul className="divide-y divide-gray-200">
        {notifications.length === 0 && <li className="py-4 text-gray-400 text-center">No notifications</li>}
        {notifications.map(n => (
          <li key={n.id} className={`py-3 flex items-start gap-2 ${n.read ? 'opacity-60' : ''}`}>
            <div className="flex-1">
              <div className="font-medium">{n.title}</div>
              <div className="text-sm text-gray-600">{n.body}</div>
              {n.link && <a href={n.link} className="text-blue-500 text-xs underline">View</a>}
              <div className="text-xs text-gray-400 mt-1">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ''}</div>
            </div>
            {!n.read && (
              <button
                className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                onClick={() => markAsRead(n.id)}
              >
                Mark as read
              </button>
            )}
          </li>
        ))}
      </ul>
                    </div>
  );
}
