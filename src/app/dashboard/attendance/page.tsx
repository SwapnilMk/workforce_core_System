'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AttendancePage() {
  const [status, setStatus] = useState<'checked-in' | 'checked-out'>('checked-out');
  const [history] = useState([
    { date: '2024-05-14', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present' },
    { date: '2024-05-13', checkIn: '08:55 AM', checkOut: '06:05 PM', status: 'Present' },
    { date: '2024-05-12', checkIn: '09:10 AM', checkOut: '05:50 PM', status: 'Present' },
    { date: '2024-05-11', checkIn: '-', checkOut: '-', status: 'Absent' },
  ]);

  const handleCheckInOut = () => {
    setStatus(status === 'checked-in' ? 'checked-out' : 'checked-in');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Real-time Punching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center py-8">
            <div className="text-5xl font-mono font-bold tracking-tighter">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> Office Location: Mumbai (Main Office)
            </p>
            <Button 
              size="lg" 
              onClick={handleCheckInOut}
              className={`w-full h-20 text-xl font-bold rounded-2xl transition-all ${
                status === 'checked-in' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {status === 'checked-in' ? 'Check Out' : 'Check In'}
            </Button>
            {status === 'checked-in' && (
              <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> You are currently checked in since 09:00 AM
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((record, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-muted">
                  <div>
                    <p className="font-bold">{record.date}</p>
                    <p className="text-xs text-muted-foreground">{record.checkIn} - {record.checkOut}</p>
                  </div>
                  <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full mt-4">View Full History</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
