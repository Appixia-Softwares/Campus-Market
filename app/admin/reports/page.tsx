"use client"
import { useEffect, useState } from 'react';
import { getAllReports, getAllReportsRealtime } from '@/lib/api/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = getAllReportsRealtime((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="flex-1 w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-2">User Reports</h1>
      <p className="text-muted-foreground mb-6">Review and moderate user-submitted reports.</p>
      <div className="mb-6 flex items-center gap-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border rounded focus:ring-2 focus:ring-primary"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <div>Loading…</div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">No reports found.</div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col hover:scale-[1.03] transition cursor-pointer group"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={report.reported_user_avatar || '/placeholder-user.jpg'}
                  alt={report.reported_user_name || 'User'}
                  className="h-10 w-10 rounded-full border object-cover"
                />
                <div>
                  <div className="font-medium">{report.reported_user_name || report.reported_user_id}</div>
                  <div className="text-xs text-muted-foreground">Reported</div>
                </div>
              </div>
              <div className="mb-2">
                <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'}>
                  {report.status || 'pending'}
                </Badge>
              </div>
              <div className="text-sm mb-2"><span className="font-medium">Reason:</span> {report.reason || '-'}</div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedReport(report); }}>View</Button>
                <Button size="sm" variant="default" onClick={e => { e.stopPropagation(); /* implement resolve */ }}>Resolve</Button>
                <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); /* implement ban */ }}>Ban</Button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={open => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedReport.reported_user_avatar || '/placeholder-user.jpg'}
                  alt={selectedReport.reported_user_name || 'User'}
                  className="h-12 w-12 rounded-full border object-cover"
                />
                <div>
                  <div className="font-medium">{selectedReport.reported_user_name || selectedReport.reported_user_id}</div>
                  <div className="text-xs text-muted-foreground">Reported</div>
                </div>
              </div>
              <div className="text-sm"><span className="font-medium">Reason:</span> {selectedReport.reason || '-'}</div>
              <div className="text-sm"><span className="font-medium">Description:</span> {selectedReport.description || '-'}</div>
              <div className="text-sm"><span className="font-medium">Status:</span> {selectedReport.status || 'pending'}</div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">Resolve</Button>
                <Button size="sm" variant="destructive">Ban</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 