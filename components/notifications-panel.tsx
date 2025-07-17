"use client"

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { useRef } from "react"
import { Bell, MessageSquare, Home, Info, CheckCircle2, Trash2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Add Notification type for strong typing
interface Notification {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: any;
  cleared?: boolean;
}

const typeMeta = {
  message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", label: "Message" },
  accommodation: { icon: Home, color: "text-green-600", bg: "bg-green-50", label: "Booking" },
  admin: { icon: Info, color: "text-purple-600", bg: "bg-purple-50", label: "System" },
  default: { icon: Bell, color: "text-gray-400", bg: "bg-muted", label: "Other" },
};

export default function NotificationsPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const prevNotifications = useRef<any[]>([]);
  const notificationSound = "/sounds/notification-sound.mp3";

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const newNotifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      // Animated feedback for new booking notification
      if (prevNotifications.current.length > 0 && newNotifications.length > prevNotifications.current.length) {
        const latest = newNotifications[0];
        if (latest.type === 'accommodation') {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          toast.success("New booking notification!", { description: latest.title + ': ' + latest.body, duration: 4000 });
          const audio = new Audio(notificationSound); audio.play();
        }
      }
      prevNotifications.current = newNotifications;
      setNotifications(newNotifications);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };
  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.read).map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
  };
  const clearAll = async () => {
    setClearing(true);
    await Promise.all(notifications.map(n => updateDoc(doc(db, "notifications", n.id), { read: true, cleared: true })));
    setClearing(false);
  };

  // Group notifications by type
  const grouped: Record<string, Notification[]> = notifications.reduce((acc: Record<string, Notification[]>, n: Notification) => {
    const type = n.type || 'default';
    if (!acc[type]) acc[type] = [];
    acc[type].push(n);
    return acc;
  }, {});
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4" aria-label="Notifications Panel" role="region">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Notifications
          {unreadCount > 0 && <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>}
        </h3>
        <div className="flex gap-2">
          <button onClick={markAllAsRead} className="text-xs text-primary hover:underline focus:underline" aria-label="Mark all as read" title="Mark all as read">Mark all as read</button>
          <button onClick={clearAll} className="text-xs text-destructive hover:underline focus:underline flex items-center gap-1" aria-label="Clear all notifications" title="Clear all" disabled={clearing}><Trash2 className="h-4 w-4" />Clear all</button>
          <a href="/settings" className="text-xs text-muted-foreground hover:underline focus:underline flex items-center gap-1" aria-label="Notification settings" title="Notification settings"><Settings className="h-4 w-4" />Settings</a>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-400 mb-2" />
          <div className="font-semibold text-gray-500">All caught up!</div>
          <div className="text-xs text-gray-400">You have no notifications</div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, group]) => {
            const meta = typeMeta[type as keyof typeof typeMeta] || typeMeta.default;
            const typedGroup = group as Notification[];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-1">
                  <meta.icon className={`h-5 w-5 ${meta.color}`} aria-label={meta.label} />
                  <span className="font-semibold text-sm text-muted-foreground">{meta.label}</span>
                </div>
                <ul className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {typedGroup.map((n: Notification) => (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className={`py-3 flex items-start gap-2 rounded-lg px-2 ${n.read ? 'bg-muted text-foreground opacity-60' : `${meta.bg} text-foreground`}`}
                        aria-live={n.read ? undefined : "polite"}
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {n.title}
                            {!n.read && <span className="inline-block w-2 h-2 bg-primary rounded-full" title="Unread" />}
                          </div>
                          <div className="text-sm text-muted-foreground">{n.body}</div>
                          {n.link && <a href={n.link} className="text-primary text-xs underline hover:text-primary/80 focus:text-primary/80" aria-label="View notification details">View</a>}
                          <div className="text-xs text-gray-400 mt-1">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ''}</div>
                        </div>
                        {!n.read && (
                          <button
                            className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 focus:bg-primary/20 transition"
                            onClick={() => markAsRead(n.id)}
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            Mark as read
                          </button>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
