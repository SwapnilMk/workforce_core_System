'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, FileText, Search, Plus, Filter } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface DailyLog {
  id: string;
  date: string;
  tasksCompleted: string;
  tasksPending: string;
  hoursWorked: number;
  remarks: string | null;
  user: {
    name: string;
    email: string;
    role: string;
    department?: {
      name: string;
    } | null;
  };
}

export default function DailyJdPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states for today's entry
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [tasksPending, setTasksPending] = useState('');
  const [hoursWorked, setHoursWorked] = useState('8');
  const [remarks, setRemarks] = useState('');
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  // Search/Filter states
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const isManagement = user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchLogs = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jd?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.jds) {
          setLogs(data.jds);
          
          // Check if current user has already logged today
          const currentUserLog = data.jds.find((log: any) => log.user.email === user?.email);
          if (currentUserLog) {
            setHasLoggedToday(true);
            setTasksCompleted(currentUserLog.tasksCompleted);
            setTasksPending(currentUserLog.tasksPending);
            setHoursWorked(currentUserLog.hoursWorked.toString());
            setRemarks(currentUserLog.remarks || '');
          } else {
            // Reset form if checking another date or no log exists for today
            if (dateStr === new Date().toISOString().split('T')[0]) {
              setHasLoggedToday(false);
              setTasksCompleted('');
              setTasksPending('');
              setHoursWorked('8');
              setRemarks('');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      toast.error('Network Error: Failed to retrieve daily work logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchLogs(filterDate);
    }
  }, [user, filterDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksCompleted.trim() || !hoursWorked) {
      toast.error('Tasks completed and hours worked are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasksCompleted,
          tasksPending,
          hoursWorked: Number(hoursWorked),
          remarks
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(hasLoggedToday ? 'Daily work log updated.' : 'Daily work log submitted successfully.');
        setHasLoggedToday(true);
        fetchLogs(filterDate);
      } else {
        toast.error(data.error || 'Failed to record work log.');
      }
    } catch (err: any) {
      toast.error('Failed to connect to backend: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'ADMIN': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'HR': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tasksCompleted.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Work Logs (JD)</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Submit today's accomplishments and audit workspace accomplishments in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary">
            Logged-in: {user?.role.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form log section (Left/Main side) */}
        <Card className="lg:col-span-1 border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-bold text-xl">
              <FileText className="w-5 h-5 text-primary" />
              {hasLoggedToday ? "Update Today's JD" : "Fill Today's Log"}
            </CardTitle>
            <CardDescription>
              {hasLoggedToday 
                ? "You have already logged work for today. You can modify it below." 
                : "Fill out your daily tasks accomplished, pending tasks, and active hours."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="completed" className="font-semibold text-xs text-foreground">Tasks Completed *</Label>
                <Textarea 
                  id="completed"
                  required
                  placeholder="- Refactored core auth hooks&#10;- Fixed Prisma Mongo indexes&#10;- Ran test suite"
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                  className="min-h-[120px] font-sans text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pending" className="font-semibold text-xs text-foreground">Pending Tasks (Optional)</Label>
                <Textarea 
                  id="pending"
                  placeholder="- Syncing Leave balance hooks&#10;- Clean up unused styles"
                  value={tasksPending}
                  onChange={(e) => setTasksPending(e.target.value)}
                  className="min-h-[80px] font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="hours" className="font-semibold text-xs text-foreground">Hours Worked *</Label>
                  <Input 
                    id="hours"
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="remarks" className="font-semibold text-xs text-foreground">Remarks / Blockers</Label>
                  <Input 
                    id="remarks"
                    placeholder="None / Waiting on design approval"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full font-bold shadow-md shadow-primary/20 mt-2"
              >
                {submitting ? "Saving Log..." : hasLoggedToday ? "Update Daily Log" : "Submit Today's Log"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit / Logs List Section (Right side) */}
        <Card className="lg:col-span-2 border border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-bold text-xl">
                  {isManagement ? "Workforce Daily Audit Feed" : "My Log History"}
                </CardTitle>
                <CardDescription>
                  {isManagement 
                    ? "Monitor and audit tasks submitted by all workforce personnel"
                    : "Review your submitted daily accomplishments"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <Input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-[140px] h-9 text-xs font-semibold py-1 px-2"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2 relative">
              <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3" />
              <Input 
                placeholder="Search logs by staff name, email, department, tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {loading ? (
              <div className="space-y-3 pt-2">
                <div className="h-24 w-full animate-pulse bg-muted rounded-xl" />
                <div className="h-24 w-full animate-pulse bg-muted rounded-xl" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground text-sm font-semibold border-2 border-dashed rounded-xl">
                No work logs recorded for the selected date.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={log.id} 
                    className="p-5 rounded-xl bg-muted/20 border border-border/60 hover:border-primary/35 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">{log.user.name}</p>
                        <Badge variant="outline" className={`text-[9.5px] uppercase font-bold tracking-wider py-0 ${getRoleBadgeColor(log.user.role)}`}>
                          {log.user.role.toLowerCase().replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          ({log.user.department?.name || 'Staff'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{log.hoursWorked} hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          Accomplishments
                        </h4>
                        <p className="text-xs text-muted-foreground/90 font-medium whitespace-pre-line leading-relaxed pl-1.5 border-l-2 border-green-500/20">
                          {log.tasksCompleted}
                        </p>
                      </div>

                      {log.tasksPending && (
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Next Day Actions
                          </h4>
                          <p className="text-xs text-muted-foreground/90 font-medium whitespace-pre-line leading-relaxed pl-1.5 border-l-2 border-amber-500/20">
                            {log.tasksPending}
                          </p>
                        </div>
                      )}
                    </div>

                    {log.remarks && (
                      <div className="bg-background/40 border border-border/50 rounded-lg p-2.5 text-[11px] font-semibold text-muted-foreground/90 leading-normal flex items-start gap-1.5">
                        <FileText className="w-4.5 h-4.5 text-muted-foreground/80 shrink-0" />
                        <span>Remarks: {log.remarks}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
