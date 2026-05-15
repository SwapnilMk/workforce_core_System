'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, Calendar, Clock, CheckCircle, AlertCircle, FileText, User, 
  TrendingUp, Wallet, ShieldCheck, Activity, Bell, Briefcase, 
  ArrowUpRight, ArrowDownRight, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const data = [
  { name: 'Mon', attendance: 85 },
  { name: 'Tue', attendance: 92 },
  { name: 'Wed', attendance: 88 },
  { name: 'Thu', attendance: 95 },
  { name: 'Fri', attendance: 90 },
  { name: 'Sat', attendance: 45 },
  { name: 'Sun', attendance: 10 },
];

export default function DashboardOverview() {
  const { user } = useAuthStore();

  if (!user) return null;

  const role = user.role.toUpperCase();

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent italic">CONTROL</span>
            <span className="opacity-50 text-xl font-medium tracking-widest uppercase">Center</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Hello, {user.name} • {role.replace('_', ' ')} Access</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border">
          <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 gap-2">
            <Bell className="w-4 h-4" />
            <Badge className="h-5 min-w-[20px] px-1 bg-primary text-[10px]">12</Badge>
          </Button>
          <Button size="sm" className="rounded-xl h-9 px-4 shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 mr-2" />
            Quick Pulse
          </Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <>
            <StatCard title="Total Workforce" value="1,248" sub="Across 12 Company Branches" icon={<Users />} trend="+14.5%" positive />
            <StatCard title="Average Attendance" value="94.2%" sub="Last 30 Days" icon={<CheckCircle />} trend="+2.4%" positive />
            <StatCard title="Pending Approvals" value="42" sub="Leaves & Claims" icon={<Clock />} trend="Action Required" negative />
            <StatCard title="Total Payroll" value="₹42.8L" sub="Current Month Projection" icon={<Wallet />} trend="+5.2%" positive />
          </>
        )}

        {role === 'HR' && (
          <>
            <StatCard title="New Joinees" value="12" sub="Pending Onboarding" icon={<User />} trend="+4" positive />
            <StatCard title="Leave Approvals" value="28" sub="Require Action" icon={<Clock />} trend="Urgent" negative />
            <StatCard title="Payroll Status" value="Processing" sub="85% Generated" icon={<FileText />} trend="On Track" positive />
            <StatCard title="Active Jobs" value="8" sub="145 Applications" icon={<Briefcase />} trend="Active" positive />
          </>
        )}

        {role === 'MANAGER' && (
          <>
            <StatCard title="Team Attendance" value="18/20" sub="92% Consistency" icon={<CheckCircle />} trend="+2%" positive />
            <StatCard title="Open Tasks" value="45" sub="12 High Priority" icon={<FileText />} trend="+5" negative />
            <StatCard title="Performance" value="8.4" sub="Team Rating Index" icon={<TrendingUp />} trend="+0.2" positive />
            <StatCard title="Team Leaves" value="2" sub="Next 7 Days" icon={<Calendar />} trend="Normal" positive />
          </>
        )}

        {role === 'EMPLOYEE' && (
          <>
            <StatCard title="Today's Hours" value="06:45" sub="Shift: 09:00 - 18:00" icon={<Clock />} trend="On Track" positive />
            <StatCard title="Attendance Score" value="98%" sub="Top 5% in Dept" icon={<ShieldCheck />} trend="+1%" positive />
            <StatCard title="Leave Balance" value="14.5" sub="Days Available" icon={<Calendar />} trend="Safe" positive />
            <StatCard title="Upcoming Bonus" value="₹2.5K" sub="Performance Linked" icon={<Wallet />} trend="Pending" positive />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <Card className="lg:col-span-2 border-none bg-muted/10 shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold italic uppercase tracking-tighter">Performance Matrix</CardTitle>
              <CardDescription>Attendance and productivity trends over the last 7 days</CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Real-time</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-0 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAttend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dynamic Widget Section */}
        <div className="space-y-6">
          <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent shadow-xl shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> System Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="text-xs font-bold">Encrypted Login</div>
                  <Badge className="bg-green-500/20 text-green-600 border-none">Active</Badge>
               </div>
               <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="text-xs font-bold">Geo-Fence Radius</div>
                  <div className="text-xs font-mono font-bold">200 Meters</div>
               </div>
               <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="text-xs font-bold">Biometric Auth</div>
                  <Badge className="bg-primary/20 text-primary border-none">Verified</Badge>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" /> Recent Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { user: 'Rahul Sharma', action: 'Punch In', time: '2m ago', icon: <CheckCircle className="text-green-500" /> },
                 { user: 'Anita Gupta', action: 'Leave Request', time: '15m ago', icon: <Clock className="text-amber-500" /> },
                 { user: 'HR System', action: 'Payroll Generated', time: '1h ago', icon: <FileText className="text-blue-500" /> },
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{item.user}</div>
                      <div className="text-[10px] text-muted-foreground">{item.action}</div>
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground">{item.time}</div>
                 </div>
               ))}
               <Button variant="ghost" className="w-full text-xs font-bold h-8 mt-2">View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend: string;
  positive?: boolean;
  negative?: boolean;
}

function StatCard({ title, value, sub, icon, trend, positive, negative }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tighter">{value}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">{sub}</p>
            <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              positive ? 'bg-green-500/10 text-green-600' : negative ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'
            }`}>
              {positive && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
              {negative && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
