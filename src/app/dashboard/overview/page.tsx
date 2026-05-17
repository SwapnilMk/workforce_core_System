'use client';

import * as React from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, Calendar, Clock, CheckCircle, AlertCircle, FileText, User, 
  TrendingUp, Wallet, ShieldCheck, Activity, Bell, Briefcase, 
  ArrowUpRight, ArrowDownRight, Zap, Building2, ShieldAlert, Check,
  Building, Globe, Layers, AlertOctagon, Power, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [adminData, setAdminData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSuperAdminData = React.useCallback(async () => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    try {
      const res = await fetch('/api/dashboard/super-admin');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load Super Admin dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        fetchSuperAdminData();
      } else {
        setLoading(false);
      }
    }
  }, [user, fetchSuperAdminData]);

  if (!user) return null;

  const role = user.role.toUpperCase();

  const handleToggleCompany = async (companyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Company status changed successfully.`);
        fetchSuperAdminData();
      } else {
        toast.error('Failed to change company status.');
      }
    } catch (err) {
      toast.error('Connection issue.');
    }
  };

  // Rendering the SUPER ADMIN Portal view
  if (role === 'SUPER_ADMIN') {
    const stats = adminData?.stats || {
      totalCompanies: 0,
      activeCompanies: 0,
      suspendedCompanies: 0,
      totalUsers: 0,
      plans: { trial: 0, growth: 0, enterprise: 0 }
    };

    const chartData = adminData?.companies?.map((c: any) => ({
      name: c.name.length > 15 ? c.name.slice(0, 12) + '...' : c.name,
      employees: c.employeeCount
    })) || [];

    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto text-white min-h-screen bg-neutral-950">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-500 via-teal-400 to-white bg-clip-text text-transparent italic">SUPER ADMIN</span>
              <span className="opacity-40 text-sm font-medium tracking-widest uppercase border border-neutral-800 px-2 py-0.5 rounded">Core Console</span>
            </h1>
            <p className="text-neutral-400 text-sm font-medium mt-1">Hello, {user.name} • Master Management & Platform Overseer</p>
          </div>
          <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
            <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 gap-2 hover:bg-neutral-800 text-xs">
              <Bell className="w-4 h-4 text-neutral-400" />
              <Badge className="h-5 min-w-[20px] px-1 bg-blue-600 text-[10px] text-white">Live</Badge>
            </Button>
            <Button onClick={fetchSuperAdminData} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 shadow-lg text-xs font-bold">
              <Zap className="w-4 h-4 mr-2" /> Sync Engine
            </Button>
          </div>
        </div>

        {/* Global Business KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Registered Sandboxes" 
            value={stats.totalCompanies.toString()} 
            sub={`Active: ${stats.activeCompanies} | Suspended: ${stats.suspendedCompanies}`} 
            icon={<Building2 className="text-blue-400" />} 
            trend="+100%" 
            positive 
          />
          <StatCard 
            title="Global Active Workforce" 
            value={stats.totalUsers.toString()} 
            sub="Across all active corporate tenants" 
            icon={<Users className="text-teal-400" />} 
            trend="Active Accounts" 
            positive 
          />
          <StatCard 
            title="Enterprise Tiers" 
            value={stats.plans.enterprise.toString()} 
            sub={`Growth: ${stats.plans.growth} | Trial: ${stats.plans.trial}`} 
            icon={<Layers className="text-purple-400" />} 
            trend="Growth Curve" 
            positive 
          />
          <StatCard 
            title="Total Compliance Coverage" 
            value={`${stats.activeCompanies} / ${stats.totalCompanies}`} 
            sub="Validated PAN / GST registrations" 
            icon={<ShieldCheck className="text-emerald-400" />} 
            trend="100% Legit" 
            positive 
          />
        </div>

        {/* Visualization Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recharts Workspace Size Bar Chart */}
          <Card className="lg:col-span-2 border border-neutral-800 bg-neutral-950 shadow-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Active Workspace Performance</CardTitle>
                <CardDescription className="text-xs text-neutral-400">Total registered employee count distributed per corporate workspace</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] p-0 pr-4">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-neutral-500">No company details loaded.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8f8f8f' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8f8f8f' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="employees" fill="#1a365d" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1a365d' : '#2563eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Subscription Tier visual checklist */}
          <Card className="border border-neutral-800 bg-neutral-950">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Subscription Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Enterprise Elite Plan</span>
                  <span className="font-mono font-bold text-purple-400">{stats.plans.enterprise} Companies</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full" 
                    style={{ width: `${stats.totalCompanies > 0 ? (stats.plans.enterprise / stats.totalCompanies) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Growth Premium Plan</span>
                  <span className="font-mono font-bold text-blue-400">{stats.plans.growth} Companies</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${stats.totalCompanies > 0 ? (stats.plans.growth / stats.totalCompanies) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Trial Sandbox Plan</span>
                  <span className="font-mono font-bold text-amber-500">{stats.plans.trial} Companies</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${stats.totalCompanies > 0 ? (stats.plans.trial / stats.totalCompanies) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global User Overview Table */}
        <Card className="border border-neutral-800 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Global Corporate Workspace Registry</CardTitle>
            <CardDescription className="text-xs text-neutral-400">Complete listing of sandboxes, verification tags, user capacities, and status switches.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : !adminData?.companies || adminData.companies.length === 0 ? (
              <div className="text-center py-10 text-xs text-neutral-500">No workspaces registered in live system.</div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Workspace / Branch</th>
                    <th className="py-3 px-4">Active Capacity</th>
                    <th className="py-3 px-4">Compliance CIN</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4 text-center">PAN / GST Verification</th>
                    <th className="py-3 px-4">Workspace Switch</th>
                    <th className="py-3 px-4 text-right font-bold">Workspace status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {adminData.companies.map((company: any) => (
                    <tr key={company.id} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="block truncate font-bold">{company.name}</span>
                            <span className="block text-[10px] text-neutral-500 truncate">{company.email || 'No contact email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <Badge className="bg-neutral-900 text-neutral-300 border border-neutral-800 font-mono text-[10px]">
                          {company.employeeCount} active accounts
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                        {company.cinNumber || 'NOT REGISTERED'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          company.planType === 'Enterprise'
                            ? 'bg-purple-950/80 text-purple-400 border border-purple-900'
                            : company.planType === 'Growth'
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-900'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-900'
                        }`}>
                          {company.planType} Plan
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${company.panNumber ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'}`}>
                            PAN
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${company.gstNumber ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'}`}>
                            GSTIN
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {company.id === user.companyId ? (
                          <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30">Active Switched</Badge>
                        ) : (
                          <span className="text-neutral-500 text-[10px]">Inactive context</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleCompany(company.id, company.status)}
                            className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                              company.status === 'ACTIVE' 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/80' 
                                : 'bg-rose-950/40 text-rose-400 border-rose-900/60 hover:bg-rose-950/80'
                            }`}
                            title={company.status === 'ACTIVE' ? 'Suspend Context' : 'Activate Context'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rendering standard corporate tenant dashboard for other roles
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
        {(role === 'ADMIN') && (
          <>
            <StatCard title="Company Workforce" value="48 Employees" sub="100% Dedicated Sandbox" icon={<Users />} trend="+4.5%" positive />
            <StatCard title="Average Attendance" value="94.2%" sub="Last 30 Days" icon={<CheckCircle />} trend="+2.4%" positive />
            <StatCard title="Pending Approvals" value="4" sub="Leaves & Claims" icon={<Clock />} trend="Action Required" negative />
            <StatCard title="Total Payroll" value="₹4.8L" sub="Current Month Projection" icon={<Wallet />} trend="+5.2%" positive />
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
              <AreaChart data={[
                { name: 'Mon', attendance: 85 },
                { name: 'Tue', attendance: 92 },
                { name: 'Wed', attendance: 88 },
                { name: 'Thu', attendance: 95 },
                { name: 'Fri', attendance: 90 },
                { name: 'Sat', attendance: 45 },
                { name: 'Sun', attendance: 10 },
              ]}>
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
                  data-testid="attendance-area"
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
      <Card className="border border-neutral-800 shadow-xl bg-neutral-950 backdrop-blur-sm overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-blue-400 transition-colors">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-neutral-900 text-neutral-400 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-all border border-neutral-800">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tighter text-white">{value}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] font-medium text-neutral-400 line-clamp-1">{sub}</p>
            <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              positive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' : negative ? 'bg-rose-950/80 text-rose-400 border border-rose-900' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
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
