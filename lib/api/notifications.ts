// Remove all supabase imports and usage. Replace with Firebase equivalents or remove.

type Notification = Database["public"]["Tables"]["notifications"]["Row"]
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]

export async function getNotifications(userId: string) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { data: [], error: null }
}

export async function markNotificationAsRead(id: string) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { data: null, error: null }
}

export async function markAllNotificationsAsRead(userId: string) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { data: null, error: null }
}

export async function createNotification(notification: NotificationInsert) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { data: null, error: null }
}

export async function deleteNotification(id: string) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { data: null, error: null }
}

export async function getUnreadNotificationCount(userId: string) {
  // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
  return { count: 0, error: null }
}
