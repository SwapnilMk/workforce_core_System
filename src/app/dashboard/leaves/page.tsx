'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  remarks: string | null;
  user: {
    name: string;
    email: string;
    department?: {
      name: string;
    } | null;
  };
  approver?: {
    name: string;
  } | null;
}

export default function LeavePage() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('CASUAL');
  const [reason, setReason] = useState('');

  // Stats
  const [totalBalance, setTotalBalance] = useState(24);
  const [usedLeaves, setUsedLeaves] = useState(0);

  const isAdminOrManager = user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaves');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.leaves) {
          setLeaves(data.leaves);
          
          // Calculate used leaves from approved records
          let usedCount = 0;
          data.leaves.forEach((leave: Leave) => {
            if (leave.status === 'APPROVED') {
              const start = new Date(leave.startDate);
              const end = new Date(leave.endDate);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              usedCount += diffDays;
            }
          });
          setUsedLeaves(usedCount);
        }
      }
    } catch (err) {
      console.error('Failed to load leaves', err);
      toast.error('Network Error: Failed to fetch leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          type,
          reason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Leave applied successfully.');
        setIsOpen(false);
        // Reset form
        setStartDate('');
        setEndDate('');
        setType('CASUAL');
        setReason('');
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to submit leave request.');
      }
    } catch (err: any) {
      toast.error('Failed to connect to backend: ' + err.message);
    }
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          remarks: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} via Portal`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request ${status.toLowerCase()} successfully.`);
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to update leave request status.');
      }
    } catch (err: any) {
      toast.error('Failed to complete action: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Apply, review, and keep track of employee off-duty schedules
          </p>
        </div>

        {!isAdminOrManager && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold shadow-md shadow-primary/20">
                <Plus className="w-4 h-4" /> Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-bold text-xl">Apply for Leave</DialogTitle>
                <DialogDescription>
                  Submit details of your leave request. Approval is subject to review by your manager.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="start" className="font-semibold text-xs">Start Date</Label>
                    <Input 
                      id="start" 
                      type="date" 
                      required 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end" className="font-semibold text-xs">End Date</Label>
                    <Input 
                      id="end" 
                      type="date" 
                      required 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type" className="font-semibold text-xs">Leave Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASUAL">Casual Leave</SelectItem>
                      <SelectItem value="SICK">Sick Leave</SelectItem>
                      <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                      <SelectItem value="PATERNITY">Paternity Leave</SelectItem>
                      <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reason" className="font-semibold text-xs">Reason</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Enter reason for leave..." 
                    required 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit">Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Annual Balance" value={`${totalBalance} Days`} icon={<Calendar className="w-5 h-5" />} color="text-primary bg-primary/10" />
        <StatCard title="Approved Absences" value={`${usedLeaves} Days`} icon={<CheckCircle2 className="w-5 h-5" />} color="text-green-600 bg-green-500/10" />
        <StatCard title="Remaining Balance" value={`${Math.max(0, totalBalance - usedLeaves)} Days`} icon={<Clock className="w-5 h-5" />} color="text-amber-600 bg-amber-500/10" />
      </div>

      <Card className="border border-border/80">
        <CardHeader>
          <CardTitle className="font-bold text-xl">{isAdminOrManager ? 'Pending Team Requests' : 'My Leave Status'}</CardTitle>
          <CardDescription>
            {isAdminOrManager 
              ? 'Review and approve/reject leave requests submitted by your team' 
              : 'Keep track of your applied leaves and review remarks'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 w-full animate-pulse bg-muted rounded-xl" />
              <div className="h-16 w-full animate-pulse bg-muted rounded-xl" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm font-semibold border-2 border-dashed rounded-xl">
              No leave requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-muted/20 border border-border/60 gap-4 hover:border-primary/35 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base capitalize">{leave.type.toLowerCase().replace('_', ' ')} Leave</h3>
                        {isAdminOrManager && (
                          <Badge variant="outline" className="text-[10px] bg-background">
                            {leave.user.name} ({leave.user.department?.name || 'Staff'})
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                      </p>
                      <p className="text-xs italic text-muted-foreground/90 font-medium pt-1">
                        Reason: "{leave.reason}"
                      </p>
                      {leave.remarks && (
                        <p className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                          Notes: {leave.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant="outline" className={`px-4 py-1 text-xs font-bold tracking-wider capitalize ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status.toLowerCase()}
                    </Badge>
                    
                    {isAdminOrManager && leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={actionLoadingId === leave.id}
                          onClick={() => handleAction(leave.id, 'APPROVED')}
                          className="text-green-600 border-green-600 hover:bg-green-500/10 rounded-lg h-9 font-bold px-3"
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={actionLoadingId === leave.id}
                          onClick={() => handleAction(leave.id, 'REJECTED')}
                          className="text-red-600 border-red-600 hover:bg-red-500/10 rounded-lg h-9 font-bold px-3"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
