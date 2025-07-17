"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUp, ArrowDown, Trash2, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc, getDocs, query, where, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import jsPDF from "jspdf";

interface AdminLog {
  id: string;
  action: string;
  timestamp: any;
  details?: string;
  performedBy?: string;
  admin?: string;
  userId?: string;
}

// Define User type locally since it's not exported from @/types
interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  createdAt?: any;
  created_at?: any;
  avatar_url?: string;
  last_login?: any;
  phone?: string;
}

export default function AdminAdminsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: 'remove' | 'demote' | 'promote'; email: string; name?: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<() => Promise<void>>();
  const [logs, setLogs] = useState<Record<string, AdminLog[]>>({});
  const [logFilter, setLogFilter] = useState<string>("");
  const [logSearch, setLogSearch] = useState<string>("");
  const { user: currentAdmin } = useAuth();
  const [viewAllAdminId, setViewAllAdminId] = useState<string | null>(null);

  // Real-time fetch all users
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Only show users with admin or superadmin role
  const admins = users.filter(u => u.role === "admin" || u.role === "superadmin");

  // Helper to convert Timestamp/string/Date to JS Date
  function toDisplayDate(val: string | Timestamp | Date | undefined): string {
    if (!val) return "-";
    if (typeof val === "string") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    }
    if (val instanceof Date) return val.toLocaleString();
    if (typeof val === "object" && val !== null && "toDate" in val && typeof val.toDate === "function") {
      return val.toDate().toLocaleString();
    }
    return "-";
  }

  // Fetch all audit logs for all admins in real time
  useEffect(() => {
    if (admins.length === 0) return;
    const unsub = onSnapshot(
      collection(db, "auditLogs"),
      (snap) => {
        const allLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog));
        // Group logs by admin id (performedBy)
        const grouped: Record<string, AdminLog[]> = {};
        allLogs.forEach(log => {
          const adminId = log.admin || log.userId;
          if (!adminId) return; // Guard: skip undefined adminId
          if (!grouped[adminId]) grouped[adminId] = [];
          grouped[adminId].push(log);
        });
        setLogs(grouped);
      }
    );
    return () => unsub();
  }, [admins]);

  // Promote/demote admin
  const handleRole = async (id: string, role: string) => {
    await updateDoc(doc(db, "users", id), { role });
  };

  // Remove admin rights (demote to user) with confirmation
  const handleRemove = (id: string) => {
    const admin = admins.find(a => a.id === id);
    setConfirmDialog({ id, action: 'remove', email: admin?.email || '', name: admin?.full_name });
    setPendingAction(() => async () => {
      await updateDoc(doc(db, "users", id), { role: "user" });
    });
  };

  // Demote admin with confirmation
  const handleDemote = (id: string) => {
    const admin = admins.find(a => a.id === id);
    setConfirmDialog({ id, action: 'demote', email: admin?.email || '', name: admin?.full_name });
    setPendingAction(() => async () => {
      await updateDoc(doc(db, "users", id), { role: "admin" });
    });
  };

  // Promote admin with confirmation
  const handlePromote = (id: string) => {
    const admin = admins.find(a => a.id === id);
    setConfirmDialog({ id, action: 'promote', email: admin?.email || '', name: admin?.full_name });
    setPendingAction(() => async () => {
      await updateDoc(doc(db, "users", id), { role: "superadmin" });
    });
  };

  const logAdminAction = async (targetId: string, action: string, details: string) => {
    await addDoc(collection(db, "admin_logs"), {
      userId: targetId,
      action,
      timestamp: serverTimestamp(),
      details,
      performedBy: currentAdmin?.id || currentAdmin?.email || "unknown",
    });
  };

  const confirmAction = async () => {
    if (pendingAction && confirmDialog) {
      await pendingAction();
      // Log the action
      let details = "";
      if (confirmDialog.action === 'remove') details = `Removed admin rights from ${confirmDialog.name || confirmDialog.email}`;
      if (confirmDialog.action === 'demote') details = `Demoted ${confirmDialog.name || confirmDialog.email} to admin`;
      if (confirmDialog.action === 'promote') details = `Promoted ${confirmDialog.name || confirmDialog.email} to superadmin`;
      await logAdminAction(confirmDialog.id, confirmDialog.action, details);
    }
    setConfirmDialog(null);
    setPendingAction(undefined);
  };

  // Invite admin by email (set role to admin)
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Find user by email
      const q = query(collection(db, "users"), where("email", "==", inviteEmail.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("No user found with that email.");
        return;
      }
      const userDoc = snap.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), { role: "admin" });
      setInviteEmail("");
    } finally {
      setInviting(false);
    }
  };

  // Pagination state for logs per admin
  const [logPage, setLogPage] = useState<Record<string, number>>({});
  const LOGS_PER_PAGE = 10;

  // Export logs as CSV for a given admin
  function exportLogsAsCSV(adminId: string) {
    const adminLogs = logs[adminId] || [];
    const headers = ["Timestamp", "Action", "Details", "Performed By"];
    const rows = adminLogs.map((log: AdminLog) => [
      toDisplayDate(log.timestamp),
      log.action,
      log.details || "",
      log.performedBy || log.admin || log.userId || ""
    ]);
    const csvContent = [headers, ...rows].map((r: string[]) => r.map((x: string) => `"${(x || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_${adminId}_logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Add export to PDF
  function exportLogsAsPDF(adminId: string) {
    const adminLogs = logs[adminId] || [];
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Admin Action Logs", 10, 10);
    const headers = ["Timestamp", "Action", "Details", "Performed By"];
    let y = 20;
    doc.setFontSize(10);
    doc.text(headers.join(" | "), 10, y);
    y += 8;
    adminLogs.forEach((log: AdminLog) => {
      const row = [
        toDisplayDate(log.timestamp),
        log.action,
        log.details || "",
        log.performedBy || log.admin || log.userId || ""
      ].join(" | ");
      doc.text(row, 10, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`admin_${adminId}_logs.pdf`);
  }

  // Add export to Word (simple HTML table)
  function exportLogsAsWord(adminId: string) {
    const adminLogs = logs[adminId] || [];
    let html = `<table border='1' cellpadding='4' cellspacing='0'><tr><th>Timestamp</th><th>Action</th><th>Details</th><th>Performed By</th></tr>`;
    adminLogs.forEach((log: AdminLog) => {
      html += `<tr>`;
      html += `<td>${toDisplayDate(log.timestamp)}</td>`;
      html += `<td>${log.action}</td>`;
      html += `<td>${log.details || ""}</td>`;
      html += `<td>${log.performedBy || log.admin || log.userId || ""}</td>`;
      html += `</tr>`;
    });
    html += `</table>`;
    const blob = new Blob([
      `<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>${html}</body></html>`
    ], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_${adminId}_logs.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admins & Roles</h1>
          <p className="text-muted-foreground">Manage admin users and their roles</p>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Invite admin by email"
            className="border rounded px-3 py-1 text-sm"
          />
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail}><UserPlus className="h-4 w-4 mr-2" />Invite</Button>
        </div>
      </div>
      {/* Log Filters/Search */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          value={logFilter}
          onChange={e => setLogFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="promote">Promote</option>
          <option value="demote">Demote</option>
          <option value="remove">Remove</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
          <option value="add">Add</option>
        </select>
        <input
          type="text"
          value={logSearch}
          onChange={e => setLogSearch(e.target.value)}
          placeholder="Search logs..."
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No admins found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins
            .filter((admin: User): admin is User & { id: string } => typeof admin?.id === 'string')
            .map((admin) => {
              const adminId = admin.id;
              const adminLogs: AdminLog[] = logs[adminId] || [];
              const top5Logs = adminLogs
                .sort((a: AdminLog, b: AdminLog) => {
                  const aTime = typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() : (a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp && "toDate" in a.timestamp ? a.timestamp.toDate().getTime() : 0));
                  const bTime = typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() : (b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp && "toDate" in b.timestamp ? b.timestamp.toDate().getTime() : 0));
                  return bTime - aTime;
                })
                .slice(0, 5);
              return (
                <Card key={adminId}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={admin.avatar_url || undefined} />
                        <AvatarFallback>{admin.full_name?.[0] || admin.email[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{admin.full_name || admin.email}</div>
                        <div className="text-xs text-muted-foreground">{admin.email}</div>
                      </div>
                      <Badge variant="secondary">{admin.role}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => admin.role === "admin" ? handlePromote(admin.id) : handleDemote(admin.id)} aria-label="Promote/Demote">
                        {admin.role === "admin" ? <ArrowUp className="h-4 w-4 text-green-600" /> : <ArrowDown className="h-4 w-4 text-yellow-600" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRemove(admin.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Joined: {toDisplayDate(admin.createdAt || admin.created_at)}</CardDescription>
                    <div className="text-xs text-muted-foreground mt-1">Last login: {toDisplayDate(admin.last_login)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Phone: {admin.phone || "-"}</div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Recent Actions</h3>
                        <button
                          className="text-sm underline text-primary hover:text-primary/80"
                          onClick={() => setViewAllAdminId(adminId)}
                        >
                          View All
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {top5Logs.length === 0 ? (
                          <li className="text-muted-foreground">No actions found.</li>
                        ) : (
                          top5Logs.map((log: AdminLog) => (
                            <li key={log.id} className="flex items-center gap-2">
                              <span className="text-muted-foreground">{toDisplayDate(log.timestamp)}</span>
                              <span className="font-medium">{log.action}</span>
                              {log.details && <span className="text-muted-foreground">- {log.details}</span>}
                              {log.performedBy && <span className="text-muted-foreground">by {log.performedBy}</span>}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={open => { if (!open) { setConfirmDialog(null); setPendingAction(undefined); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === 'remove' && 'Remove Admin Rights'}
              {confirmDialog?.action === 'demote' && 'Demote Admin'}
              {confirmDialog?.action === 'promote' && 'Promote to Superadmin'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to {confirmDialog?.action === 'remove' ? 'remove admin rights from' : confirmDialog?.action === 'demote' ? 'demote' : 'promote'} <span className="font-semibold">{confirmDialog?.name || confirmDialog?.email}</span>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmAction}>Confirm</Button>
            <Button variant="outline" onClick={() => { setConfirmDialog(null); setPendingAction(undefined); }}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View All Dialog */}
      <Dialog open={!!viewAllAdminId} onOpenChange={() => setViewAllAdminId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Actions</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <ul className="space-y-1">
              {(viewAllAdminId && logs[viewAllAdminId]) ? (
                logs[viewAllAdminId]
                  .sort((a: AdminLog, b: AdminLog) => {
                    const aTime = typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() : (a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp && "toDate" in a.timestamp ? a.timestamp.toDate().getTime() : 0));
                    const bTime = typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() : (b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp && "toDate" in b.timestamp ? b.timestamp.toDate().getTime() : 0));
                    return bTime - aTime;
                  })
                  .map((log: AdminLog) => (
                    <li key={log.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{toDisplayDate(log.timestamp)}</span>
                      <span className="font-medium">{log.action}</span>
                      {log.details && <span className="text-muted-foreground">- {log.details}</span>}
                      {log.performedBy && <span className="text-muted-foreground">by {log.performedBy}</span>}
                    </li>
                  ))
              ) : (
                <li className="text-muted-foreground">No actions found.</li>
              )}
            </ul>
          </div>
          <DialogFooter className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => viewAllAdminId && exportLogsAsCSV(viewAllAdminId)}>Export as Sheet (CSV)</Button>
              <Button variant="outline" onClick={() => viewAllAdminId && exportLogsAsPDF(viewAllAdminId)}>Export as PDF</Button>
              <Button variant="outline" onClick={() => viewAllAdminId && exportLogsAsWord(viewAllAdminId)}>Export as Word</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 