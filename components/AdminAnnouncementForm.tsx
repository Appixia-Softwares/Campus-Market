import { useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminAnnouncementForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    // Get all users
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map(doc => ({ id: doc.id }));
    // Create a notification for each user
    await Promise.all(users.map(user =>
      addDoc(collection(db, "notifications"), {
        userId: user.id,
        title,
        body,
        type: "admin",
        read: false,
        createdAt: serverTimestamp(),
      })
    ));
    setTitle("");
    setBody("");
    setLoading(false);
    setSuccess(true);
  };

  return (
    <form onSubmit={sendAnnouncement} className="space-y-2 p-4 border rounded bg-white max-w-md mx-auto mt-6">
      <h4 className="font-bold text-lg">Send Announcement</h4>
      <input
        className="border p-2 w-full rounded"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <textarea
        className="border p-2 w-full rounded"
        placeholder="Message"
        value={body}
        onChange={e => setBody(e.target.value)}
        required
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        type="submit"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send"}
      </button>
      {success && <div className="text-green-600 text-center mt-2">Announcement sent to all users!</div>}
    </form>
  );
} 