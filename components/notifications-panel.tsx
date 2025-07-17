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

// Theme-aware color meta for notification types
const typeMeta = {
  message: {
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/40",
    label: "Message"
  },
  accommodation: {
    icon: Home,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/40",
    label: "Booking"
  },
  admin: {
    icon: Info,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/40",
    label: "System"
  },
  default: {
    icon: Bell,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "Other"
  },
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
    // Animated, modern notifications panel container
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto bg-card text-card-foreground rounded-2xl shadow-2xl p-4 border border-border backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 animate-fade-in"
      aria-label="Notifications Panel"
      role="region"
      style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary animate-float" /> Notifications
          {unreadCount > 0 && <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 animate-pulse-glow">{unreadCount}</span>}
        </h3>
        <div className="flex gap-2">
          <button onClick={markAllAsRead} className="text-xs text-primary hover:underline focus:underline" aria-label="Mark all as read" title="Mark all as read">Mark all as read</button>
          <button onClick={clearAll} className="text-xs text-destructive hover:underline focus:underline flex items-center gap-1" aria-label="Clear all notifications" title="Clear all" disabled={clearing}><Trash2 className="h-4 w-4" />Clear all</button>
          <a href="/settings" className="text-xs text-muted-foreground hover:underline focus:underline flex items-center gap-1" aria-label="Notification settings" title="Notification settings"><Settings className="h-4 w-4" />Settings</a>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-400 mb-2 animate-float" />
          <div className="font-semibold text-muted-foreground">All caught up!</div>
          <div className="text-xs text-muted-foreground">You have no notifications</div>
        </div>
      ) : (
        // Scrollable notifications list with custom scrollbar
        <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-all">
          {Object.entries(grouped).map(([type, group]) => {
            const meta = typeMeta[type as keyof typeof typeMeta] || typeMeta.default;
            const typedGroup = group as Notification[];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-1 sticky top-0 z-10 bg-card/80 backdrop-blur-sm py-1">
                  <meta.icon className={`h-5 w-5 ${meta.color} animate-float`} aria-label={meta.label} />
                  <span className="font-semibold text-sm text-muted-foreground">{meta.label}</span>
                </div>
                <ul className="divide-y divide-border">
                  <AnimatePresence>
                    {typedGroup.map((n: Notification) => (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className={`py-3 flex items-start gap-2 rounded-lg px-2 transition-colors ${n.read ? 'bg-muted text-muted-foreground opacity-60' : `${meta.bg} text-foreground dark:text-card-foreground`}`}
                        aria-live={n.read ? undefined : "polite"}
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {n.title}
                            {!n.read && <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse-glow" title="Unread" />}
                          </div>
                          <div className="text-sm text-muted-foreground">{n.body}</div>
                          {n.link && <a href={n.link} className="text-primary text-xs underline hover:text-primary/80 focus:text-primary/80" aria-label="View notification details">View</a>}
                          <div className="text-xs text-muted-foreground mt-1">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ''}</div>
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
      {/* Enhanced Footer */}
      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs bg-muted/40 rounded-b-lg">
        <div className="flex gap-4 items-center">
          <a href="/settings" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" aria-label="Notification Preferences">
            <Settings className="h-4 w-4" /> Preferences
          </a>
          <a href="/help" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" aria-label="Help">
            <Info className="h-4 w-4" /> Help
          </a>
        </div>
        <div className="flex gap-2 items-center text-muted-foreground">
          <span>Last updated:</span>
          <span suppressHydrationWarning>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="hidden sm:block text-muted-foreground opacity-60 text-[10px] ml-auto">Powered by Campus Market</div>
      </div>
    </motion.div>
  );
}
