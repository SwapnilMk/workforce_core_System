'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Download, CheckCircle2, Clock, Filter, Plus, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';

interface Payroll {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  pf: number;
  esi: number;
  tax: number;
  professionalTax: number;
  netSalary: number;
  status: string;
  paymentDate: string | null;
  transactionId: string | null;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function PayrollPage() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Run payroll states
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState('5');
  const [year, setYear] = useState('2026');

  // Stats
  const [ytdDisbursements, setYtdDisbursements] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const isHrOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'ADMIN';

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.payrolls) {
          setPayrolls(data.payrolls);

          // Compute YTD disbursements (sum of paid payrolls in 2026)
          const sum = data.payrolls
            .filter((p: Payroll) => p.status === 'PAID' && p.year === 2026)
            .reduce((acc: number, p: Payroll) => acc + p.netSalary, 0);
          setYtdDisbursements(sum);

          // Compute active payroll list size
          setActiveCount(data.payrolls.length);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll logs:', err);
      toast.error('Network Error: Failed to fetch payroll listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Payroll cycle run successfully.');
        setIsOpen(false);
        fetchPayrolls();
      } else {
        toast.error(data.error || 'Failed to run payroll cycle.');
      }
    } catch (err: any) {
      toast.error('Failed to connect to backend: ' + err.message);
    }
  };

  const handleDisburse = async (id: string) => {
    setActionLoadingId(id);
    const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          transactionId: txnId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Disbursement completed. Transaction ID: ${txnId}`);
        fetchPayrolls();
      } else {
        toast.error(data.error || 'Disbursement failed.');
      }
    } catch (err: any) {
      toast.error('Connection failed: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getMonthName = (num: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[num - 1] || 'Unknown';
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage and view salary structures and disbursements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Filter className="w-4 h-4" /> Filter
          </Button>

          {isHrOrAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#1a365d] hover:bg-[#2b4c7e] font-bold shadow-md shadow-slate-900/10">
                  <Wallet className="w-4 h-4" /> Run Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="font-bold text-xl">Generate Payroll Cycle</DialogTitle>
                  <DialogDescription>
                    Automate salary processing for all registered workforce employees for the selected period.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRunPayroll} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="month" className="font-semibold text-xs">Payroll Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="year" className="font-semibold text-xs">Payroll Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#1a365d] hover:bg-[#2b4c7e]">Generate Cycle</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a365d] text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-85">Disbursements (YTD 2026)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">₹{ytdDisbursements.toLocaleString()}</div>
            <p className="text-xs opacity-75 mt-1 font-medium">Auto-aggregated from live PAID transactions</p>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-sm bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payroll Slips Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{activeCount} Records</div>
            <p className="text-xs text-emerald-600 font-bold mt-1">Live active salary structures</p>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-sm bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disbursement Window</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">Monthly End</div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Disbursements unlocked for Admins</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="font-bold text-xl">Recent Payroll Cycles</CardTitle>
          <CardDescription>View, disburse, and download dynamic employee salary statements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 w-full animate-pulse bg-muted rounded-xl" />
              <div className="h-16 w-full animate-pulse bg-muted rounded-xl" />
            </div>
          ) : payrolls.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm font-semibold border-2 border-dashed rounded-xl">
              No payroll statements processed yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {payrolls.map((pay) => (
                <div key={pay.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-muted/30 px-3 transition-colors rounded-lg gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${pay.status === 'PAID' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {pay.status === 'PAID' ? <CheckCircle2 className="w-5.5 h-5.5" /> : <Clock className="w-5.5 h-5.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base">{getMonthName(pay.month)} {pay.year}</p>
                        {isHrOrAdmin && (
                          <Badge variant="outline" className="text-[9.5px] font-semibold bg-background py-0">
                            {pay.user.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">SLIP ID: {pay.id}</p>
                      {pay.transactionId && (
                        <p className="text-[10px] font-semibold text-emerald-600">TXN: {pay.transactionId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="text-right">
                      <p className="font-extrabold text-base text-foreground">₹{pay.netSalary.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground font-medium">Paid on: {formatDate(pay.paymentDate)}</p>
                    </div>
                    <Badge variant="outline" className={`capitalize px-3 py-0.5 text-xs font-bold tracking-wider ${
                      pay.status === 'PAID' 
                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {pay.status.toLowerCase()}
                    </Badge>
                    
                    {isHrOrAdmin && pay.status === 'UNPAID' && (
                      <Button 
                        size="sm" 
                        disabled={actionLoadingId === pay.id}
                        onClick={() => handleDisburse(pay.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-3 rounded-lg text-xs"
                      >
                        Disburse
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                      <Download className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground" />
                    </Button>
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
