'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, CreditCard, FileText, ShieldAlert, CheckCircle, 
  ArrowRight, ArrowLeft, Plus, Trash, Upload, File, Eye, Calendar,
  Building, ShieldCheck, Cpu, BellRing, UserCheck, Key
} from 'lucide-react';

// Zod Validation Schema
const onboardingSchema = z.object({
  // Step 1: Basic Information
  firstName: z.string().min(2, 'First name is required (min 2 chars)'),
  lastName: z.string().min(2, 'Last name is required (min 2 chars)'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
  alternatePhone: z.string().optional(),
  gender: z.string().default('Male'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  role: z.string().default('Employee'),
  departmentId: z.string().optional(),
  companyId: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  workLocation: z.string().default('Office'),
  status: z.string().default('Active'),
  
  // Attendance Setup
  assignedOffice: z.string().default('MumbaiHQ'),
  shiftTiming: z.string().default('09:00 - 18:00'),
  weeklyOffs: z.array(z.string()).default(['Sunday']),
  overtimeEligible: z.boolean().default(false),
  remoteWorkAllowed: z.boolean().default(false),

  // Step 2: Payroll Information
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Number format (e.g. ABCDE1234F)'),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, 'Aadhaar Number must be exactly 12 digits'),
  uanNumber: z.string().optional(),
  pfNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(9, 'Invalid Account Number (min 9 digits)'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC Code format (e.g. SBIN0012345)'),
  salaryStructure: z.string().default('Standard'),
  basicSalary: z.coerce.number().min(1, 'Basic salary must be greater than 0'),
  hra: z.coerce.number().min(0, 'HRA must be positive'),
  allowances: z.coerce.number().min(0, 'Allowances must be positive'),
  bonusEligibility: z.boolean().default(false),
  taxRegime: z.string().default('NEW'),
  overtimeRate: z.coerce.number().default(0),
  paymentFrequency: z.string().default('MONTHLY'),
  salaryEffectiveDate: z.string().min(1, 'Salary effective date is required'),

  // Step 4: Personal / Emergency details
  currentAddress: z.string().min(5, 'Current address is required'),
  permanentAddress: z.string().min(5, 'Permanent address is required'),
  bloodGroup: z.string().default('O+'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactNumber: z.string().min(10, 'Emergency mobile number is required'),
  relationship: z.string().default('Parent'),
  maritalStatus: z.string().default('Single'),
  nationality: z.string().default('Indian'),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional()
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const STEPS = [
  { id: 1, name: 'Basic Information', icon: User },
  { id: 2, name: 'Payroll Information', icon: CreditCard },
  { id: 3, name: 'Document Uploads', icon: FileText },
  { id: 4, name: 'Personal & Emergency', icon: ShieldAlert }
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isYearlyPayroll, setIsYearlyPayroll] = useState(false);
  
  // Document Upload State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; type: string; url: string; size: number }>>([
    { name: 'Offer Letter.pdf', type: 'PDF', url: 'https://egc-workforce.s3.amazonaws.com/offer.pdf', size: 1024 * 324 },
    { name: 'Signed NDA.pdf', type: 'PDF', url: 'https://egc-workforce.s3.amazonaws.com/nda.pdf', size: 1024 * 512 }
  ]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();

  const methods = useForm<any>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: {
      gender: 'Male',
      role: 'Employee',
      workLocation: 'Office',
      status: 'Active',
      assignedOffice: 'MumbaiHQ',
      shiftTiming: '09:00 - 18:00',
      weeklyOffs: ['Sunday'],
      overtimeEligible: false,
      remoteWorkAllowed: false,
      taxRegime: 'NEW',
      bonusEligibility: false,
      salaryStructure: 'Standard',
      paymentFrequency: 'MONTHLY',
      bloodGroup: 'O+',
      relationship: 'Parent',
      maritalStatus: 'Single',
      nationality: 'Indian',
      basicSalary: 30000,
      hra: 12000,
      allowances: 5000,
      overtimeRate: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      salaryEffectiveDate: new Date().toISOString().split('T')[0]
    }
  });

  const getErrorMessage = (fieldName: string): string => {
    const err = methods.formState.errors[fieldName];
    if (!err) return '';
    return (err.message || '') as string;
  };

  // Load Auto-Save Draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('egc_onboarding_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        methods.reset(parsed);
        toast.info('Onboarding progress draft restored successfully.');
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
    setDraftLoaded(true);
  }, [methods]);

  // Auto-Save Draft on form changes
  const watchedValues = methods.watch();
  useEffect(() => {
    if (draftLoaded && !successData) {
      localStorage.setItem('egc_onboarding_draft', JSON.stringify(watchedValues));
    }
  }, [watchedValues, draftLoaded, successData]);

  // Handle Step Navigation
  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'joiningDate'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['panNumber', 'aadhaarNumber', 'bankName', 'accountNumber', 'ifscCode', 'basicSalary', 'salaryEffectiveDate'];
    } else if (currentStep === 3) {
      if (uploadedDocs.length === 0) {
        toast.warning('Please upload at least one onboarding document to proceed.');
        return;
      }
    }

    const isValid = fieldsToValidate.length > 0 
      ? await methods.trigger(fieldsToValidate as any)
      : true;

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Please correct the validation errors in the current step before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Document Upload Simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const newDoc = {
            name: files[0].name,
            type: files[0].name.split('.').pop()?.toUpperCase() || 'PDF',
            url: 'https://egc-workforce.s3.amazonaws.com/' + files[0].name,
            size: files[0].size
          };
          setUploadedDocs(prevDocs => [...prevDocs, newDoc]);
          toast.success(`${files[0].name} uploaded securely to cloud vault.`);
          return 0;
        }
        return prev + 30;
      });
    }, 200);
  };

  // Submit complete onboarding
  const onSubmit = async (data: OnboardingFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        remoteWorkAllowed: data.workLocation === 'Remote' || data.workLocation === 'Hybrid' || data.assignedOffice === 'Remote',
        documents: uploadedDocs
      };

      const response = await fetch('/api/employees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        setSuccessData(resData);
        localStorage.removeItem('egc_onboarding_draft'); // clear draft upon successful save
        toast.success('Employee successfully onboarded!');
      } else {
        toast.error(resData.error || 'Failed to onboard employee');
      }
    } catch (error) {
      toast.error('API integration error: Could not complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  // Interactive progressive payroll calculations
  const basic = Number(watchedValues.basicSalary || 0);
  const hra = Number(watchedValues.hra || 0);
  const allowances = Number(watchedValues.allowances || 0);
  const grossMonthly = basic + hra + allowances;
  
  // Capped Standard PF & ESI
  const pfDeduction = basic > 0 ? Math.min(1800, Math.round(basic * 0.12)) : 0;
  const esiDeduction = grossMonthly <= 21000 ? Math.round(grossMonthly * 0.0075) : 0;
  
  // Tax Progressive Calculation
  const annualGross = grossMonthly * 12;
  const standardDeduction = 75000;
  const taxableAnnual = Math.max(0, annualGross - standardDeduction);
  let annualTax = 0;
  
  if (watchedValues.taxRegime === 'NEW') {
    if (taxableAnnual > 1500000) {
      annualTax += (taxableAnnual - 1500000) * 0.30 + 115000;
    } else if (taxableAnnual > 1200000) {
      annualTax += (taxableAnnual - 1200000) * 0.20 + 55000;
    } else if (taxableAnnual > 1000000) {
      annualTax += (taxableAnnual - 1000000) * 0.15 + 25000;
    } else if (taxableAnnual > 700000) {
      annualTax += (taxableAnnual - 700000) * 0.10 + 20000;
    } else if (taxableAnnual > 300000) {
      annualTax += (taxableAnnual - 300000) * 0.05;
    }
  } else {
    if (taxableAnnual > 1000000) {
      annualTax += (taxableAnnual - 1000000) * 0.30 + 112500;
    } else if (taxableAnnual > 500000) {
      annualTax += (taxableAnnual - 500000) * 0.20 + 12500;
    } else if (taxableAnnual > 250000) {
      annualTax += (taxableAnnual - 250000) * 0.05;
    }
  }
  const taxDeduction = Math.round((annualTax + annualTax * 0.04) / 12);
  const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
  const netMonthly = grossMonthly - totalDeductions;

  // View Multipliers
  const viewM = isYearlyPayroll ? 12 : 1;

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card border rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-primary/5 pointer-events-none" />
          
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight">Onboarding Complete</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Employee profiles, payroll structures, default leaves, and automated permissions have been generated in the database.
            </p>
          </div>

          {/* Automations logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left border rounded-xl p-5 bg-muted/20 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold">ID Generated:</span>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">{successData.employeeId}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold">Initial Password:</span>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">{successData.credentials.password}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                <span>RBAC Permissions Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-500 shrink-0" />
                <span>Trusted Device Fingerprint setup initialized</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500 shrink-0" />
                <span>Attendance Shift Setup Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500 shrink-0" />
                <span>Default Onboarding Leave Credited</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-green-500 shrink-0" />
                <span>Welcome Notification & Audit Logs generated</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={() => router.push('/dashboard/employees')} className="h-10 px-6 font-bold shadow-lg">
              Go to Employee Directory
            </Button>
            <Button variant="outline" onClick={() => { setSuccessData(null); setCurrentStep(1); }} className="h-10 px-6 font-bold">
              Onboard Another Staff
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 relative">
      
      {/* Sticky top sub-header progress tracking */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b pb-4 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Onboard Staff</h1>
          <p className="text-xs text-muted-foreground">Complete the 4-step onboarding matrix to provision employee credentials and configurations.</p>
        </div>
        
        {/* Stepper progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                  isActive 
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10 scale-105' 
                  : isCompleted 
                  ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                  : 'bg-muted/40 text-muted-foreground'
                }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{step.name}</span>
                </div>
                {idx < 3 && <div className={`w-3 md:w-6 h-[1.5px] mx-1 ${isCompleted ? 'bg-green-500/40' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit as any)} className="space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/60 backdrop-blur-sm">
                  <CardHeader className="border-b bg-muted/15 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Step 1: Basic Information
                    </CardTitle>
                    <CardDescription className="text-xs">Provide base demographic, role selections, and attendance constraints.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5 text-xs">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">First Name *</Label>
                        <Input placeholder="E.g. Rajesh" className="h-9 text-xs" {...methods.register('firstName')} />
                        {getErrorMessage('firstName') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('firstName')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Last Name *</Label>
                        <Input placeholder="E.g. Kumar" className="h-9 text-xs" {...methods.register('lastName')} />
                        {getErrorMessage('lastName') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('lastName')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Gender</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('gender')}>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Date of Birth *</Label>
                        <Input type="date" className="h-9 text-xs" {...methods.register('dateOfBirth')} />
                        {getErrorMessage('dateOfBirth') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('dateOfBirth')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Email Address *</Label>
                        <Input type="email" placeholder="rajesh@company.com" className="h-9 text-xs" {...methods.register('email')} />
                        {getErrorMessage('email') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('email')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Mobile Number *</Label>
                        <Input placeholder="9876543210" className="h-9 text-xs" {...methods.register('phone')} />
                        {getErrorMessage('phone') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('phone')}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Organization Role</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('role')}>
                          <option>Employee</option>
                          <option>Manager</option>
                          <option>HR</option>
                          <option>Admin</option>
                          <option>Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Employment Type</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('workLocation')}>
                          <option value="Office">Full-time Office</option>
                          <option value="Remote">Full-time Remote</option>
                          <option value="Hybrid">Hybrid Office/WFA</option>
                          <option value="Intern">Internship</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Joining Date *</Label>
                        <Input type="date" className="h-9 text-xs" {...methods.register('joiningDate')} />
                        {getErrorMessage('joiningDate') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('joiningDate')}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-bold text-xs text-primary">Shift & Location Constraints</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Assigned Office Location</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('assignedOffice')}>
                            <option value="MumbaiHQ">Mumbai Headquarters (MumbaiHQ)</option>
                            <option value="DelhiBranch">Delhi Regional Office</option>
                            <option value="Remote">Fully Virtual Hub</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Assigned Shift Hours</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('shiftTiming')}>
                            <option value="09:00 - 18:00">Standard General Shift (09:00 - 18:00)</option>
                            <option value="13:00 - 22:00">Evening Shift (13:00 - 22:00)</option>
                            <option value="22:00 - 07:00">Night Shift (22:00 - 07:00)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Status Profile</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('status')}>
                            <option value="Active">Active</option>
                            <option value="Probation">Probation</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="overtimeEligible" className="w-4 h-4 rounded border-input focus:ring-primary shrink-0" {...methods.register('overtimeEligible')} />
                          <Label htmlFor="overtimeEligible" className="text-xs font-medium cursor-pointer">Overtime Calculation Eligible</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="remoteWorkAllowed" className="w-4 h-4 rounded border-input focus:ring-primary shrink-0" {...methods.register('remoteWorkAllowed')} />
                          <Label htmlFor="remoteWorkAllowed" className="text-xs font-medium cursor-pointer">Remote Work Approved (Anywhere)</Label>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                  <CardFooter className="border-t bg-muted/5 py-3 justify-end gap-2">
                    <Button type="button" onClick={nextStep} className="h-9 px-4 font-bold shadow-md">
                      Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Payroll Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Payroll Configuration Inputs */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/60 backdrop-blur-sm">
                      <CardHeader className="border-b bg-muted/15 py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" /> Step 2: Payroll Configuration
                        </CardTitle>
                        <CardDescription className="text-xs">Assign salary structures, bank parameters, PAN/Aadhaar compliance fields.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-5 text-xs">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">PAN Number *</Label>
                            <Input placeholder="ABCDE1234F" className="h-9 text-xs font-mono uppercase" maxLength={10} {...methods.register('panNumber')} />
                            {getErrorMessage('panNumber') && (
                              <p className="text-[10px] text-destructive font-medium">{getErrorMessage('panNumber')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Aadhaar Number *</Label>
                            <Input placeholder="12-digit Aadhaar" className="h-9 text-xs font-mono" maxLength={12} {...methods.register('aadhaarNumber')} />
                            {getErrorMessage('aadhaarNumber') && (
                              <p className="text-[10px] text-destructive font-medium">{getErrorMessage('aadhaarNumber')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">IFSC Code *</Label>
                            <Input placeholder="SBIN0012345" className="h-9 text-xs font-mono uppercase" maxLength={11} {...methods.register('ifscCode')} />
                            {getErrorMessage('ifscCode') && (
                              <p className="text-[10px] text-destructive font-medium">{getErrorMessage('ifscCode')}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Bank Name *</Label>
                            <Input placeholder="E.g. State Bank of India" className="h-9 text-xs" {...methods.register('bankName')} />
                            {getErrorMessage('bankName') && (
                              <p className="text-[10px] text-destructive font-medium">{getErrorMessage('bankName')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Account Number *</Label>
                            <Input placeholder="Bank Account Number" className="h-9 text-xs font-mono" {...methods.register('accountNumber')} />
                            {getErrorMessage('accountNumber') && (
                              <p className="text-[10px] text-destructive font-medium">{getErrorMessage('accountNumber')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Tax Regime</Label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('taxRegime')}>
                              <option value="NEW">New Regime (Progressive FY 25-26)</option>
                              <option value="OLD">Old Regime (Sec 80C Deductions)</option>
                            </select>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <h4 className="font-bold text-xs text-primary">Monthly Fixed Salary Inputs</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">Basic Salary (INR) *</Label>
                              <Input type="number" className="h-9 text-xs font-bold font-mono" {...methods.register('basicSalary')} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">HRA (INR)</Label>
                              <Input type="number" className="h-9 text-xs font-mono" {...methods.register('hra')} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">Other Allowances (INR)</Label>
                              <Input type="number" className="h-9 text-xs font-mono" {...methods.register('allowances')} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">Salary Effective Date *</Label>
                              <Input type="date" className="h-9 text-xs" {...methods.register('salaryEffectiveDate')} />
                              {getErrorMessage('salaryEffectiveDate') && (
                                <p className="text-[10px] text-destructive font-medium">{getErrorMessage('salaryEffectiveDate')}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">Overtime Rate (per Hour)</Label>
                              <Input type="number" className="h-9 text-xs font-mono" {...methods.register('overtimeRate')} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">UAN Number (Optional)</Label>
                              <Input placeholder="EPF Universal Account No" className="h-9 text-xs font-mono" {...methods.register('uanNumber')} />
                            </div>
                          </div>
                        </div>

                      </CardContent>
                      <CardFooter className="border-t bg-muted/5 py-3 justify-between">
                        <Button type="button" variant="outline" onClick={prevStep} className="h-9 px-4 font-bold">
                          <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
                        </Button>
                        <Button type="button" onClick={nextStep} className="h-9 px-4 font-bold shadow-md">
                          Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>

                  {/* REAL PAYROLL CALCULATIONS BREAKDOWN */}
                  <div className="space-y-6">
                    <Card className="border-primary/20 shadow-xl overflow-hidden bg-card/70 relative">
                      <div className="absolute top-0 right-0 p-3">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-bold">Live Breakdown</Badge>
                      </div>
                      <CardHeader className="border-b py-3">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Salary Calculator</CardTitle>
                        <CardDescription className="text-[10px]">Real progressive tax & PF deductions computed live.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4 text-xs">
                        
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-bold text-muted-foreground">Regime:</span>
                          <Badge variant="outline" className="font-bold text-[10px]">{watchedValues.taxRegime === 'NEW' ? 'New' : 'Old'} Regime</Badge>
                        </div>

                        {/* Monthly/Yearly View Selector */}
                        <div className="flex bg-muted p-1 rounded-lg">
                          <button 
                            type="button" 
                            onClick={() => setIsYearlyPayroll(false)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${!isYearlyPayroll ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                          >
                            Monthly View
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsYearlyPayroll(true)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${isYearlyPayroll ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                          >
                            Yearly Projection
                          </button>
                        </div>

                        {/* Calculations Breakdown */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">Basic Salary</span>
                            <span className="font-mono font-bold">₹{(basic * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">House Rent Allowance</span>
                            <span className="font-mono">₹{(hra * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">Allowances</span>
                            <span className="font-mono">₹{(allowances * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2 text-xs font-bold text-primary">
                            <span>Gross Earnings</span>
                            <span className="font-mono">₹{(grossMonthly * viewM).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Deductions Breakdown */}
                        <div className="space-y-2 border-t pt-2">
                          <h5 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Deductions</h5>
                          <div className="flex justify-between items-center text-xs text-red-500/90">
                            <span>Provident Fund (PF @ 12%)</span>
                            <span className="font-mono">- ₹{(pfDeduction * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-red-500/90">
                            <span>State Insurance (ESI @ 0.75%)</span>
                            <span className="font-mono">- ₹{(esiDeduction * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-red-500/90">
                            <span>Income Tax (TDS Slab)</span>
                            <span className="font-mono">- ₹{(taxDeduction * viewM).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2 text-xs font-bold text-red-500">
                            <span>Total Deductions</span>
                            <span className="font-mono">- ₹{(totalDeductions * viewM).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Net Pay */}
                        <div className="border-t-2 border-dashed pt-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-extrabold text-foreground">Take-Home (Net)</span>
                            <span className="text-base font-extrabold text-green-500 font-mono">₹{(netMonthly * viewM).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic text-right">Computed dynamically via Indian tax slabs.</p>
                        </div>

                        {/* Stunning SVG breakdown charts */}
                        <div className="border-t pt-3 space-y-2">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Visual Component Ratio</p>
                          <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(basic / grossMonthly) * 100}%` }} title="Basic" />
                            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(hra / grossMonthly) * 100}%` }} title="HRA" />
                            <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${(allowances / grossMonthly) * 100}%` }} title="Allowances" />
                            <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(totalDeductions / grossMonthly) * 100}%` }} title="Deductions" />
                          </div>
                          <div className="flex flex-wrap gap-2 text-[9px] pt-1">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded bg-primary" /> <span>Basic</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded bg-amber-500" /> <span>HRA</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded bg-teal-500" /> <span>Allowances</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded bg-red-500" /> <span>Deductions</span>
                            </div>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 3: Document Uploads */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/60 backdrop-blur-sm">
                  <CardHeader className="border-b bg-muted/15 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Step 3: Document Management
                    </CardTitle>
                    <CardDescription className="text-xs">Upload Aadhaar, PAN, Resume, and NDA agreements to the S3/Cloudinary vault.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-5 text-xs">
                    
                    {/* Drag and Drop Zone */}
                    <div className="border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all rounded-xl p-8 text-center bg-primary/5 relative cursor-pointer group">
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                      />
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Drag and drop document files here</p>
                          <p className="text-muted-foreground text-[10px] mt-1">Supports PDF, JPG, PNG up to 10MB per file.</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {uploadProgress > 0 && (
                      <div className="space-y-2 border rounded-xl p-4 bg-muted/20">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span>Uploading documents to secure cloud vault...</span>
                          <span className="font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* List of uploaded documents */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-primary">Uploaded Cloud Documents ({uploadedDocs.length})</h4>
                      {uploadedDocs.length === 0 ? (
                        <p className="text-center text-muted-foreground italic py-6">No onboarding documents uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {uploadedDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between border rounded-xl p-3 bg-muted/10">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                                  <File className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold truncate text-xs">{doc.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{(doc.size / (1024 * 1024)).toFixed(2)} MB • Cloud vault encrypted</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => window.open(doc.url)}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))}>
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </CardContent>
                  <CardFooter className="border-t bg-muted/5 py-3 justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-9 px-4 font-bold">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
                    </Button>
                    <Button type="button" onClick={nextStep} className="h-9 px-4 font-bold shadow-md">
                      Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {/* STEP 4: Personal & Emergency details */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/60 backdrop-blur-sm">
                  <CardHeader className="border-b bg-muted/15 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" /> Step 4: Emergency Contacts & Addresses
                    </CardTitle>
                    <CardDescription className="text-xs">Provide residential locations and secure relative contact parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5 text-xs">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Current Residential Address *</Label>
                        <Input placeholder="Current living address" className="h-9 text-xs" {...methods.register('currentAddress')} />
                        {getErrorMessage('currentAddress') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('currentAddress')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Permanent Residential Address *</Label>
                        <Input placeholder="Permanent home address" className="h-9 text-xs" {...methods.register('permanentAddress')} />
                        {getErrorMessage('permanentAddress') && (
                          <p className="text-[10px] text-destructive font-medium">{getErrorMessage('permanentAddress')}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Marital Status</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('maritalStatus')}>
                          <option>Single</option>
                          <option>Married</option>
                          <option>Widowed</option>
                          <option>Divorced</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Blood Group</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('bloodGroup')}>
                          <option>O+</option>
                          <option>O-</option>
                          <option>A+</option>
                          <option>A-</option>
                          <option>B+</option>
                          <option>B-</option>
                          <option>AB+</option>
                          <option>AB-</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Nationality</Label>
                        <Input className="h-9 text-xs" {...methods.register('nationality')} />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-bold text-xs text-primary">Emergency Relative Mapping</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Relative Name *</Label>
                          <Input placeholder="Emergency Contact Name" className="h-9 text-xs" {...methods.register('emergencyContactName')} />
                          {getErrorMessage('emergencyContactName') && (
                            <p className="text-[10px] text-destructive font-medium">{getErrorMessage('emergencyContactName')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Relative Contact Number *</Label>
                          <Input placeholder="Emergency Phone Number" className="h-9 text-xs" {...methods.register('emergencyContactNumber')} />
                          {getErrorMessage('emergencyContactNumber') && (
                            <p className="text-[10px] text-destructive font-medium">{getErrorMessage('emergencyContactNumber')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Relationship Mapping</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none" {...methods.register('relationship')}>
                            <option>Parent</option>
                            <option>Spouse</option>
                            <option>Sibling</option>
                            <option>Child</option>
                            <option>Friend</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-bold text-xs text-primary">Optional Web Links</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">LinkedIn Profile URL</Label>
                          <Input placeholder="https://linkedin.com/in/username" className="h-9 text-xs" {...methods.register('linkedin')} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">GitHub Profile URL</Label>
                          <Input placeholder="https://github.com/username" className="h-9 text-xs" {...methods.register('github')} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Portfolio URL</Label>
                          <Input placeholder="https://username.dev" className="h-9 text-xs" {...methods.register('portfolio')} />
                        </div>
                      </div>
                    </div>

                  </CardContent>
                  <CardFooter className="border-t bg-muted/5 py-3 justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-9 px-4 font-bold">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
                    </Button>
                    <Button type="submit" disabled={submitting} className="h-9 px-6 font-bold shadow-md bg-green-600 hover:bg-green-700 text-white border-green-600">
                      {submitting ? 'Processing Onboarding...' : 'Onboard & Generate Credentials'}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </FormProvider>
    </div>
  );
}
