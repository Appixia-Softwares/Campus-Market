import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import type { ActivityItem } from "@/types"

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const activityQuery = query(
          collection(db, 'activity_feed'),
          orderBy('created_at', 'desc'),
          limit(5)
        )

        const snapshot = await getDocs(activityQuery)
        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setActivities(activities)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return <div>Loading activities...</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600">{activity.description}</p>
          <p className="text-xs text-gray-400">
            {new Date(activity.created_at).toLocaleDateString()}
            </p>
        </div>
      ))}
    </div>
  )
}
