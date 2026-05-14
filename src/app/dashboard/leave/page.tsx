'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/auth-store';

export default function LeavePage() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([
    { id: 1, type: 'Casual Leave', start: '2024-06-01', end: '2024-06-02', status: 'Pending', reason: 'Personal work' },
    { id: 2, type: 'Sick Leave', start: '2024-05-10', end: '2024-05-11', status: 'Approved', reason: 'Fever' },
    { id: 3, type: 'Privilege Leave', start: '2024-04-15', end: '2024-04-20', status: 'Rejected', reason: 'Urgent project' },
  ]);

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        {!isAdminOrManager && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Apply Leave
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Leaves" value="24" icon={<Calendar className="w-5 h-5" />} color="text-blue-500" />
        <StatCard title="Used Leaves" value="10" icon={<CheckCircle2 className="w-5 h-5" />} color="text-green-500" />
        <StatCard title="Available" value="14" icon={<Clock className="w-5 h-5" />} color="text-orange-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAdminOrManager ? 'Pending Requests' : 'My Leave Status'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaves.map((leave) => (
              <div key={leave.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{leave.type}</h3>
                    <p className="text-sm text-muted-foreground">{leave.start} to {leave.end}</p>
                    <p className="text-sm italic text-muted-foreground mt-1">"{leave.reason}"</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={`px-4 py-1 text-sm ${
                    leave.status === 'Approved' ? 'bg-green-500 hover:bg-green-600' : 
                    leave.status === 'Rejected' ? 'bg-red-500 hover:bg-red-600' : 
                    'bg-orange-500 hover:bg-orange-600'
                  }`}>
                    {leave.status}
                  </Badge>
                  
                  {isAdminOrManager && leave.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                        Approve
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-none shadow-sm bg-muted/20">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-white shadow-sm ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
