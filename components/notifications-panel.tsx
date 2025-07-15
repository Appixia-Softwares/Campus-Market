"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Check, Trash2, MessageSquare, Calendar, CreditCard, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { getMessagingInstance } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import type { Notification as NotificationType } from '@/lib/types';

export default function NotificationsPanel() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)

  // Foreground push handling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const messaging = await getMessagingInstance();
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          toast({
            title: title || 'New Notification',
            description: body,
          });
        });
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast]);

  // Fetch notifications (client-safe placeholder)
  useEffect(() => {
    if (!user) return;
    // TODO: Fetch notifications from a client-safe API route
    setLoading(false);
    // setNotifications([]); // Set to empty or fetched data
  }, [user]);

  // Mark notification as read (placeholder)
  const handleMarkAsRead = async (id: string) => {
    // TODO: Call API route to mark as read
  }

  // Mark all notifications as read (placeholder)
  const handleMarkAllAsRead = async () => {
    // TODO: Call API route to mark all as read
  }

  // Delete notification (placeholder)
  const handleDelete = async (id: string) => {
    // TODO: Call API route to delete notification
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return (
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </div>
        )
      case "booking":
        return (
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-300" />
          </div>
        )
      case "payment":
        return (
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
            <CreditCard className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
          </div>
        )
      case "system":
        return (
          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
            <Info className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Notifications</span>
            <Skeleton className="h-8 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Notifications</span>
          {notifications.some((n) => !n.read) && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-1" /> Mark all as read
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 p-3 rounded-lg ${notification.read ? "bg-transparent" : "bg-muted/50"}`}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
