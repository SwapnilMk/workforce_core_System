'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store/auth-store';
import { useThemeConfig } from '@/components/themes/active-theme';
import { 
  Building, 
  Plus, 
  MapPin, 
  CreditCard, 
  Palette, 
  CheckSquare, 
  ShieldAlert,
  Loader2,
  Trash2,
  Lock,
  Bell,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

// Compliance regex
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CIN_REGEX = /^[LU]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [showOtpDialog, setShowOtpDialog] = React.useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | null>(null);
  const [otpValue, setOtpValue] = React.useState('');
  const [otpSubmitting, setOtpSubmitting] = React.useState(false);

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCompanies(data.companies);
        }
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user, loadCompanies]);

  const handleDeleteCompanyClick = (id: string) => {
    setSelectedCompanyId(id);
    setOtpValue('');
    setShowOtpDialog(true);
  };

  const handleVerifyOtpAndDelete = async () => {
    if (!otpValue) {
      toast.error('Please enter the security authorization OTP.');
      return;
    }
    if (otpValue !== '123456') {
      toast.error('Invalid Security OTP. Access denied.');
      return;
    }
    if (!selectedCompanyId) return;

    setOtpSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Workspace scheduled for permanent deletion.');
        setShowOtpDialog(false);
        loadCompanies();
      } else {
        toast.error(data.error || 'Failed to schedule deletion.');
      }
    } catch (err) {
      toast.error('Connection issue to database engine.');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleCancelDeletion = async (id: string) => {
    try {
      toast.loading('Recovering workspace context...');
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        toast.success('Workspace status restored successfully to ACTIVE!');
        loadCompanies();
      } else {
        toast.error(data.error || 'Failed to restore company status.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Connection issue.');
    }
  };

  const activeCompany = React.useMemo(() => {
    if (!user?.companyId || companies.length === 0) return null;
    return companies.find((c) => c.id === user.companyId) || null;
  }, [user, companies]);

  const dynamicStyles = `
    :root {
      --primary-custom: ${activeCompany?.primaryColor || '#1a365d'};
      --secondary-custom: ${activeCompany?.secondaryColor || '#0f172a'};
    }
    .bg-primary-custom {
      background-color: var(--primary-custom) !important;
    }
    .text-primary-custom {
      color: var(--primary-custom) !important;
    }
    .border-primary-custom {
      border-color: var(--primary-custom) !important;
    }
    .hover-bg-primary-custom:hover {
      opacity: 0.9 !important;
    }
  `;

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto rounded-2xl border border-border/80 bg-background/50 backdrop-blur-xl p-4 sm:p-6 text-foreground min-h-[calc(100dvh-7.5rem)]">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      
      {/* Header matching Create Company Style */}
      <div className="w-full flex items-center justify-between pb-6 border-b border-border/50">
        <div className="flex items-center gap-4 text-left">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">SETTINGS</h1>
            <p className="text-[11px] text-muted-foreground">Configure workspaces, security parameters, notifications, and custom preferences.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton Tab List */}
          <div className="bg-muted/80 border border-border p-1 flex w-full md:w-fit overflow-x-auto gap-1 rounded-xl scrollbar-none shrink-0">
            <Skeleton className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
            <Skeleton className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
            <Skeleton className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2 text-left">
                <Skeleton className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
                <Skeleton className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
              </div>
              <Skeleton className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Skeleton Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-card border-border p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-12 rounded-lg bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1 text-left">
                      <Skeleton className="h-4 w-1/2 bg-muted animate-pulse" />
                      <Skeleton className="h-3 w-1/3 bg-muted animate-pulse" />
                    </div>
                    <Skeleton className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2.5 border-t border-border/40 pt-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-24 bg-muted animate-pulse" />
                      <Skeleton className="h-3.5 w-32 bg-muted animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-32 bg-muted animate-pulse" />
                      <Skeleton className="h-3.5 w-40 bg-muted animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-28 bg-muted animate-pulse" />
                      <Skeleton className="h-3.5 w-24 bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
                    <Skeleton className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
                    <Skeleton className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="bg-muted/80 border border-border p-1 flex w-full md:w-fit overflow-x-auto gap-1 rounded-xl scrollbar-none shrink-0">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <TabsTrigger value="companies" className="gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0">
                <Building className="w-4 h-4" /> Company Settings
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0">
              <Lock className="w-4 h-4" /> System Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          {/* UNIFIED COMPANY SETTINGS */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <TabsContent value="companies" className="space-y-6">
              
              {/* Only show the full companies listing if SUPER_ADMIN */}
              {user?.role === 'SUPER_ADMIN' ? (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">Companies</h2>
                      <p className="text-muted-foreground text-xs">Manage active companies across the EGC platform.</p>
                    </div>
                    
                    <Button 
                      onClick={() => router.push('/dashboard/settings/create-company')}
                      className="bg-primary-custom hover-bg-primary-custom text-xs gap-2 py-2 px-4 rounded-lg font-bold"
                    >
                      <Plus className="w-4 h-4" /> Add Company
                    </Button>
                  </div>

                  {/* COMPANY LIST GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companies.map((company) => (
                      <Card 
                        key={company.id} 
                        className={`bg-card border-border transition-all shadow-sm ${
                          company.status === 'DELETION_PENDING' ? 'opacity-70' : ''
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden border border-border shrink-0">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="size-full object-cover" />
                            ) : (
                              <Building className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <CardTitle className="text-md font-bold truncate">{company.name}</CardTitle>
                            <CardDescription className="text-[10px] text-muted-foreground truncate">Registered: {new Date(company.createdAt).toLocaleDateString()}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              company.status === 'ACTIVE' 
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' 
                                : company.status === 'DELETION_PENDING'
                                ? 'bg-rose-950 text-rose-400 border border-rose-900 animate-pulse'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-900'
                            }`}>
                              {company.status === 'DELETION_PENDING' ? 'DELETION PENDING' : company.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">{company.planType}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="text-left text-xs space-y-1.5 border-t border-border/40 pt-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Business Email:</span>
                              <span className="font-semibold">{company.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Compliance CIN:</span>
                              <span className="font-mono text-foreground font-semibold">{company.cinNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Active Location:</span>
                              <span className="font-semibold">{company.city ? `${company.city}, ${company.state}` : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
                            {company.status === 'DELETION_PENDING' ? (
                              <Button 
                                onClick={() => handleCancelDeletion(company.id)}
                                variant="outline" 
                                size="sm"
                                className="border-emerald-800 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/70 text-[10px] py-1 h-8 gap-1.5 rounded-lg"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Cancel Deletion
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  onClick={() => router.push(`/dashboard/settings/edit-company?id=${company.id}`)}
                                  variant="outline" 
                                  size="sm"
                                  className="border-border bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground text-[10px] py-1 h-8 gap-1.5 rounded-lg font-bold"
                                >
                                  Edit Company
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteCompanyClick(company.id)}
                                  variant="destructive"
                                  size="sm"
                                  className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 text-[10px] py-1 h-8 gap-1.5 rounded-lg font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Company
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                /* ADMIN WORKSPACE SETTINGS CARD */
                activeCompany && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold">My Company Settings</h2>
                      <p className="text-muted-foreground text-xs">Configure preferences, compliance, and location parameters for your company.</p>
                    </div>

                    <Card 
                      className={`bg-card border-border transition-all shadow-sm max-w-2xl ${
                        activeCompany.status === 'DELETION_PENDING' ? 'opacity-70' : ''
                      }`}
                    >
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="flex aspect-square size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground overflow-hidden border border-border shrink-0">
                          {activeCompany.logo ? (
                            <img src={activeCompany.logo} alt={activeCompany.name} className="size-full object-cover" />
                          ) : (
                            <Building className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <CardTitle className="text-lg font-bold truncate text-foreground">{activeCompany.name}</CardTitle>
                          <CardDescription className="text-[11px] text-muted-foreground truncate">Registered since: {new Date(activeCompany.createdAt).toLocaleDateString()}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            activeCompany.status === 'ACTIVE' 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' 
                              : activeCompany.status === 'DELETION_PENDING'
                              ? 'bg-rose-950 text-rose-400 border border-rose-900 animate-pulse'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-900'
                          }`}>
                            {activeCompany.status === 'DELETION_PENDING' ? 'DELETION PENDING' : activeCompany.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{activeCompany.planType}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <div className="text-left text-xs space-y-2 border-t border-border/40 pt-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact Email Address:</span>
                            <span className="font-semibold text-foreground">{activeCompany.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Official Phone Number:</span>
                            <span className="font-semibold text-foreground">{activeCompany.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Compliance PAN / GSTIN:</span>
                            <span className="font-mono text-foreground font-semibold">
                              {activeCompany.panNumber || 'N/A'} / {activeCompany.gstNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Active Geographic Location:</span>
                            <span className="font-semibold text-foreground">
                              {activeCompany.address ? `${activeCompany.address}, ${activeCompany.city}` : 'N/A'}
                            </span>
                          </div>
                          {activeCompany.latitude && activeCompany.longitude && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Geofencing Radius Boundary:</span>
                              <span className="text-emerald-400 font-semibold">
                                {activeCompany.officeRadius || '200'} Meters ({activeCompany.latitude}, {activeCompany.longitude})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-border/40">
                          <Button 
                            onClick={() => {
                              if (activeCompany.status !== 'DELETION_PENDING') {
                                router.push(`/dashboard/settings/edit-company?id=${activeCompany.id}`);
                              }
                            }}
                            disabled={activeCompany.status === 'DELETION_PENDING'}
                            className="bg-primary-custom hover-bg-primary-custom text-xs font-bold px-5 py-2 h-9 rounded-lg"
                          >
                            Edit Company Settings
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              )}
            </TabsContent>
          )}

          {/* SYSTEM SECURITY */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Authentication Security</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Configure how employees verify their identity inside the workplace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/40">
                  <div className="space-y-0.5 text-left">
                    <Label className="text-xs font-semibold block">Two-Factor Authentication (2FA)</Label>
                    <p className="text-[11px] text-muted-foreground">Require an active Google Authenticator or mobile token on login.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/40">
                  <div className="space-y-0.5 text-left">
                    <Label className="text-xs font-semibold block">Biometric Fingerprint Login</Label>
                    <p className="text-[11px] text-muted-foreground">Enable secure TouchID verification on native mobile devices.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5 text-left">
                    <Label className="text-xs font-semibold block">Secure Geofencing Auth</Label>
                    <p className="text-[11px] text-muted-foreground">Lock dashboard access completely if clocked-in outside the radius boundary.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEM NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Email Notifications</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Select which notifications should dispatch email alerts to your workforce.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'New Leave Request Alerts', desc: 'Dispatches when a subordinate submits a leave request.' },
                  { title: 'Monthly Payslip Credit Alerts', desc: 'Dispatches immediately when salaries are verified and disbursed.' },
                  { title: 'System Security Warnings', desc: 'Dispatches on failed biometric login attempts or geo-radius violations.' },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                    <div className="space-y-0.5 text-left">
                      <Label className="text-xs font-semibold block">{notif.title}</Label>
                      <p className="text-[11px] text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* OTP Authentication Modal for Company Deletions */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="bg-card text-foreground border-border max-w-sm rounded-2xl p-6">
          <DialogHeader className="text-left space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">Security Verification Required</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
              Initiating company decommissioning will lock active workspaces. Enter the secure 6-digit Admin OTP to schedule this action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Admin Authorization OTP</Label>
              <Input 
                value={otpValue} 
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="Enter 6-digit key (e.g. 123456)" 
                className="bg-muted border-border text-xs font-bold text-center tracking-[0.4em] placeholder:tracking-normal placeholder:font-normal h-10 text-foreground" 
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Demo Hint: Use the security override code <span className="text-rose-400 font-bold font-mono">123456</span> to authorize.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 justify-end pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOtpDialog(false)}
              className="border-border hover:bg-muted text-xs px-4 rounded-lg text-foreground bg-transparent"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyOtpAndDelete}
              disabled={otpSubmitting}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-rose-950/30 border-0"
            >
              {otpSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                'Schedule 24h Purge'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
