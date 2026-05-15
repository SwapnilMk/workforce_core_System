'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, Bell, Calendar, User } from 'lucide-react';

export default function AnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      title: 'Company Annual Meet 2026',
      content: 'We are excited to announce our annual meet scheduled for next month at EGC India HQ.',
      date: 'May 20, 2026',
      category: 'Event',
      author: 'HR Department'
    },
    {
      id: 2,
      title: 'New Health Insurance Policy',
      content: 'Important updates regarding the company health insurance benefits for all employees.',
      date: 'May 15, 2026',
      category: 'Policy',
      author: 'Finance'
    },
    {
      id: 3,
      title: 'Quarterly Performance Awards',
      content: 'Congratulations to the winners of the Q1 2026 Performance Excellence Awards!',
      date: 'May 10, 2026',
      category: 'Achievement',
      author: 'Management'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with company news and events.</p>
        </div>
        <Button className="gap-2 bg-[#1a365d]">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      <div className="grid gap-6">
        {announcements.map((item) => (
          <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px]">
                  {item.category}
                </Badge>
                <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
              </div>
              <Megaphone className="h-5 w-5 text-[#1a365d]" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{item.content}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {item.date}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {item.author}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
