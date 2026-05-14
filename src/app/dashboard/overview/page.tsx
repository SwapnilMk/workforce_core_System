'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardOverview() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
          Role: {user.role}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user.role === 'Admin' && (
          <>
            <StatCard title="Total Employees" value="128" icon={<Users className="w-5 h-5" />} description="+4 from last month" />
            <StatCard title="Present Today" value="112" icon={<Calendar className="w-5 h-5" />} description="87.5% attendance rate" />
            <StatCard title="Pending Leaves" value="12" icon={<Clock className="w-5 h-5" />} description="Requires immediate action" />
            <StatCard title="Active Projects" value="8" icon={<CheckCircle className="w-5 h-5" />} description="On track" />
          </>
        )}

        {user.role === 'Manager' && (
          <>
            <StatCard title="Team Attendance" value="92%" icon={<Calendar className="w-5 h-5" />} description="18/20 present today" />
            <StatCard title="Team Leaves" value="3" icon={<Clock className="w-5 h-5" />} description="This week" />
            <StatCard title="Active Tasks" value="24" icon={<FileText className="w-5 h-5" />} description="5 overdue" />
            <StatCard title="Approvals" value="2" icon={<AlertCircle className="w-5 h-5" />} description="Pending your review" />
          </>
        )}

        {user.role === 'Employee' && (
          <>
            <StatCard title="My Attendance" value="98%" icon={<Calendar className="w-5 h-5" />} description="Month-to-date" />
            <StatCard title="Leave Balance" value="14 Days" icon={<Clock className="w-5 h-5" />} description="8 Casual, 6 Sick" />
            <StatCard title="Active Tasks" value="4" icon={<FileText className="w-5 h-5" />} description="2 due today" />
            <StatCard title="Profile Status" value="Complete" icon={<User className="w-5 h-5" />} description="Last updated 2 days ago" />
          </>
        )}
      </div>

      {user.role === 'Admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Users className="w-6 h-6" /> Add Employee
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Calendar className="w-6 h-6" /> Generate Report
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="w-6 h-6" /> System Settings
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <AlertCircle className="w-6 h-6" /> View Logs
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
