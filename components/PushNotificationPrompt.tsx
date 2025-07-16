import { useEffect, useRef } from "react";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from '@/components/ui/use-toast';

function isValidVapidKey(key: string | undefined) {
  if (!key) return false;
  // Basic check: should be a long base64 string starting with 'B'
  return /^B[0-9A-Za-z_-]{80,}$/.test(key.trim());
}

export default function PushNotificationPrompt({ userId }: { userId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function setupFCM() {
      if (!(await isSupported())) return;
      if (Notification.permission === "denied") return;
      const messaging = getMessaging(app);
      const vapidKey = "YOUR_ACTUAL_VAPID_PUBLIC_KEY_HERE".trim();
      if (!isValidVapidKey(vapidKey)) {
        console.error("Invalid or missing VAPID key for FCM push notifications.");
        return;
      }
      try {
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
        });
        if (token && userId) {
          await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true });
        }
      } catch (err) {
        console.error("FCM error:", err);
      }

      onMessage(messaging, (payload) => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        toast({
          title: payload.notification?.title || 'Notification',
          description: payload.notification?.body || '',
        });
      });
    }
    setupFCM();
  }, [userId, toast]);

  return (
    <audio ref={audioRef} src={"/sounds/notification-sound.mp3"} preload="auto" style={{ display: 'none' }} />
  );
} 