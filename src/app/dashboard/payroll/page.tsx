'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Download, CheckCircle2, Clock, Filter } from 'lucide-react';

export default function PayrollPage() {
  const payrolls = [
    { id: 'PAY-2026-005', month: 'May', year: 2026, amount: '₹1,25,000', status: 'Pending', date: '--' },
    { id: 'PAY-2026-004', month: 'April', year: 2026, amount: '₹1,25,000', status: 'Paid', date: 'April 30, 2026' },
    { id: 'PAY-2026-003', month: 'March', year: 2026, amount: '₹1,25,000', status: 'Paid', date: 'March 31, 2026' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Manage and view salary disbursements.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2 bg-[#1a365d]">
            <Wallet className="w-4 h-4" /> Run Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a365d] text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Total Disbursements (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹5,00,000</div>
            <p className="text-xs opacity-60 mt-1">+12% from last year</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-green-500 mt-1">All processed for May</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Payment Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">May 31, 2026</div>
            <p className="text-xs text-muted-foreground mt-1">15 days remaining</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Recent Payroll Cycles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {payrolls.map((pay) => (
              <div key={pay.id} className="py-4 flex items-center justify-between group hover:bg-muted/50 px-2 transition-colors rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${pay.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {pay.status === 'Paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold">{pay.month} {pay.year}</p>
                    <p className="text-xs text-muted-foreground">{pay.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="font-bold">{pay.amount}</p>
                    <p className="text-xs text-muted-foreground">{pay.date}</p>
                  </div>
                  <Badge className={pay.status === 'Paid' ? 'bg-green-500' : 'bg-orange-500'}>
                    {pay.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
