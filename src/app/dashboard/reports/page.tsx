'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart3, PieChart, TrendingUp, Filter } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { name: 'Monthly Attendance Summary', type: 'Excel', size: '2.4 MB', date: 'May 01, 2026' },
    { name: 'Quarterly Financial Report', type: 'PDF', size: '5.1 MB', date: 'April 15, 2026' },
    { name: 'Employee Performance Metrics', type: 'Excel', size: '1.8 MB', date: 'April 01, 2026' },
    { name: 'Leave Utilization Analysis', type: 'PDF', size: '3.2 MB', date: 'March 20, 2026' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your workforce data.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2 bg-[#1a365d]">
            <BarChart3 className="w-4 h-4" /> Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Efficiency', value: '94%', icon: TrendingUp, color: 'text-green-500' },
          { title: 'Retention', value: '98%', icon: PieChart, color: 'text-blue-500' },
          { title: 'Avg. Attendance', value: '92%', icon: BarChart3, color: 'text-orange-500' },
          { title: 'Cost/Employee', value: '₹45k', icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="w-6 h-6 text-[#1a365d]" />
                  </div>
                  <div>
                    <p className="font-bold">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.type} • {report.size} • {report.date}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
