import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import AccommodationList from "@/components/accommodation-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MyAccommodationListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    
    // Set up real-time listener for user's accommodation listings
    const q = query(
      collection(db, "accommodations"),
      where("seller.id", "==", user.id),
      orderBy("created_at", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedListings = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setListings(updatedListings);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user])

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Accommodation Listings</h1>
        <Button asChild>
          <Link href="/accommodation/sell">+ New Listing</Link>
        </Button>
      </div>
      <AccommodationList listings={listings} isLoading={loading} view="grid" />
    </div>
  )
} 