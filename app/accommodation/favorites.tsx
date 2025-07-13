import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import AccommodationList from "@/components/accommodation-list"

export default function AccommodationFavorites() {
  const { user } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchFavorites() {
      setLoading(true)
      // Get favorite accommodation IDs
      const favSnap = await getDocs(query(
        collection(db, "user_favorites"),
        where("user_id", "==", user.id),
        where("type", "==", "accommodation")
      ))
      const favIds = favSnap.docs.map(doc => doc.data().item_id)
      if (favIds.length === 0) {
        setListings([])
        setLoading(false)
        return
      }
      // Fetch accommodation docs
      const accomSnap = await getDocs(collection(db, "accommodations"))
      const allAccoms = accomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setListings(allAccoms.filter(a => favIds.includes(a.id)))
      setLoading(false)
    }
    fetchFavorites()
  }, [user])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Favourite Accommodations</h1>
      <AccommodationList listings={listings} isLoading={loading} view="grid" />
      {!loading && listings.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">No favourites yet.</div>
      )}
    </div>
  )
} 