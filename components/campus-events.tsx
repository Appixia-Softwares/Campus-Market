import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface CampusEventsProps {
  universityId?: string
}

interface CampusEvent {
  id: string;
  title?: string;
  location?: string;
  event_date?: string;
  [key: string]: any;
}

export async function CampusEvents({ universityId }: CampusEventsProps) {
  // Build Firestore query
  let eventsQuery = query(collection(db, 'campus_events'), orderBy('event_date', 'asc'));
  if (universityId) {
    eventsQuery = query(collection(db, 'campus_events'), where('university_id', '==', universityId), orderBy('event_date', 'asc'));
  }
  const snapshot = await getDocs(eventsQuery);
  const events: CampusEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No upcoming events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        let eventDate: Date | null = null;
        try {
          eventDate = event.event_date ? new Date(event.event_date) : null;
        } catch {
          eventDate = null;
        }
        return (
          <div key={event.id} className="flex items-start gap-4">
            <div className="rounded-md bg-primary/10 p-2 text-primary flex flex-col items-center justify-center w-14 h-14">
              <span className="text-xs font-medium">{eventDate ? format(eventDate, "MMM") : "---"}</span>
              <span className="text-lg font-bold">{eventDate ? format(eventDate, "d") : "--"}</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium text-sm leading-none">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.location || "Location TBD"}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {eventDate ? format(eventDate, "h:mm a") : "Time TBD"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="pt-2">
        <Button asChild variant="outline" className="w-full">
          <Link href="/events">View All Events</Link>
        </Button>
      </div>
    </div>
  )
}
