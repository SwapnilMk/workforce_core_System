'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Download, Receipt, TrendingUp, Wallet, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SalaryCalculatorPage() {
  const [basic, setBasic] = useState(50000);
  const [hraPercent, setHraPercent] = useState(40);
  const [allowances, setAllowances] = useState(5000);
  const [bonus, setBonus] = useState(0);
  const [isYearly, setIsYearly] = useState(false);
  
  // Deductions
  const [pfEnabled, setPfEnabled] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(true);
  
  const hra = (basic * hraPercent) / 100;
  const gross = basic + hra + allowances + bonus;
  
  const pf = pfEnabled ? basic * 0.12 : 0;
  const esi = esiEnabled && gross < 21000 ? gross * 0.0075 : 0;
  const profTax = gross > 15000 ? 200 : 0;
  
  // Simple Tax calculation (mock)
  const taxableIncome = gross - pf - profTax;
  const tax = taxableIncome > 50000 ? (taxableIncome - 50000) * 0.2 : 0;
  
  const netSalary = gross - pf - esi - profTax - tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(isYearly ? amount * 12 : amount);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Salary Calculator</h1>
          <p className="text-muted-foreground mt-1">Real-time payroll simulation and planning</p>
        </div>
        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
          <Button 
            variant={!isYearly ? 'default' : 'ghost'} 
            onClick={() => setIsYearly(false)}
            className="rounded-lg px-6"
          >
            Monthly
          </Button>
          <Button 
            variant={isYearly ? 'default' : 'ghost'} 
            onClick={() => setIsYearly(true)}
            className="rounded-lg px-6"
          >
            Yearly
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-muted/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Earnings Structure
              </CardTitle>
              <CardDescription>Adjust components to see real-time impact on net pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Basic Salary</Label>
                  <span className="font-bold text-primary">{formatCurrency(basic)}</span>
                </div>
                <Slider 
                  value={[basic]} 
                  onValueChange={(val) => setBasic(val[0])} 
                  max={200000} 
                  step={1000} 
                  className="py-2"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">HRA %</Label>
                    <Input 
                      type="number" 
                      value={hraPercent} 
                      onChange={(e) => setHraPercent(Number(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Allowances</Label>
                    <Input 
                      type="number" 
                      value={allowances} 
                      onChange={(e) => setAllowances(Number(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t border-border' />
                </div>
                <div className='relative flex justify-center text-[10px] uppercase tracking-widest'>
                  <span className='bg-background px-3 text-muted-foreground font-bold'>
                    Deductions & Benefits
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">PF Contribution (12%)</Label>
                    <p className="text-xs text-muted-foreground">Employee share of Provident Fund</p>
                  </div>
                  <Switch checked={pfEnabled} onCheckedChange={setPfEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">ESI Contribution</Label>
                    <p className="text-xs text-muted-foreground">Employee State Insurance</p>
                  </div>
                  <Switch checked={esiEnabled} onCheckedChange={setEsiEnabled} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-none bg-blue-500/5 text-blue-600 dark:text-blue-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-5 h-5 opacity-50" />
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600">Earnings</Badge>
                </div>
                <div className="text-sm font-bold uppercase tracking-tighter opacity-70">Gross Salary</div>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(gross)}</div>
                <div className="flex items-center mt-2 text-[10px] font-bold">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12% vs last year
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-red-500/5 text-red-600 dark:text-red-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <ShieldAlert className="w-5 h-5 opacity-50" />
                  <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-600">Statutory</Badge>
                </div>
                <div className="text-sm font-bold uppercase tracking-tighter opacity-70">Total Deductions</div>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(pf + esi + profTax + tax)}</div>
                <div className="flex items-center mt-2 text-[10px] font-bold">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  Tax Optimized
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-primary/10 text-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Receipt className="w-5 h-5 opacity-50" />
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">Take Home</Badge>
                </div>
                <div className="text-sm font-bold uppercase tracking-tighter opacity-70">Net Salary</div>
                <div className="text-3xl font-black tracking-tight">{formatCurrency(netSalary)}</div>
                <div className="mt-2 text-[10px] font-bold uppercase opacity-60">In-hand after all taxes</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Payslip Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 p-4 rounded-xl bg-background border border-primary/10 shadow-inner">
                <div className="flex justify-between text-sm py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Basic Pay</span>
                  <span className="font-bold">{formatCurrency(basic)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-dashed">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-bold">{formatCurrency(hra)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-bold">{formatCurrency(allowances)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 pt-3">
                  <span className="font-bold uppercase text-[10px] tracking-widest">Total Earnings</span>
                  <span className="font-black text-primary">{formatCurrency(gross)}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-background border border-destructive/10 shadow-inner">
                <div className="flex justify-between text-sm py-1 border-b border-dashed text-destructive/80">
                  <span className="text-muted-foreground">PF</span>
                  <span className="font-bold">-{formatCurrency(pf)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-dashed text-destructive/80">
                  <span className="text-muted-foreground">ESI</span>
                  <span className="font-bold">-{formatCurrency(esi)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-dashed text-destructive/80">
                  <span className="text-muted-foreground">Income Tax</span>
                  <span className="font-bold">-{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 pt-3">
                  <span className="font-bold uppercase text-[10px] tracking-widest">Total Deductions</span>
                  <span className="font-black text-destructive">{formatCurrency(pf + esi + profTax + tax)}</span>
                </div>
              </div>

              <Button className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 group overflow-hidden relative">
                <div className="absolute inset-0 bg-primary group-hover:scale-105 transition-transform" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> Download Estimate PDF
                </span>
              </Button>
              <p className="text-[10px] text-center text-muted-foreground italic font-medium">
                *This is an estimated calculation based on standard Indian payroll norms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Payroll Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border bg-muted/20 flex gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold">Tax Saving Tip</div>
                  <p className="text-[10px] text-muted-foreground">Investing in 80C can save you up to ₹45,000 yearly in taxes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
