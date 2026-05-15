'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Mail, Lock, Eye, EyeOff, Briefcase, Fingerprint, ShieldCheck, MapPin, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { loginBiometric } from '@/lib/webauthn';

export default function SignInViewPage() {
  const [email, setEmail] = useState('admin@egc.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberDevice })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      setUser(data.user);
      toast.success('Welcome back, ' + data.user.name);
      router.push('/dashboard/overview');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      const data = await loginBiometric();
      if (data.success) {
        setUser(data.user);
        toast.success('Biometric authentication successful');
        router.push('/dashboard/overview');
      } else {
        throw new Error(data.error || 'Biometric login failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (role: string) => {
    const emailMap: Record<string, string> = {
      'Super Admin': 'admin@egc.com',
      'HR': 'hr@egc.com',
      'Manager': 'manager@egc.com',
      'Employee': 'employee@egc.com',
    };
    setEmail(emailMap[role]);
    setPassword(role.toLowerCase().replace(' ', '') + '123');
    toast.info(`Demo credentials set for ${role}`);
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-[#020817] text-white'>
      <div className='relative hidden h-full flex-col p-10 lg:flex'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#020617]' />
        <div className='relative z-20 flex items-center text-xl font-bold tracking-tight'>
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/50">
            <Briefcase className="h-6 w-6" />
          </div>
          EGC Workforce Core
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12 opacity-40'
          )}
        />
        
        <div className="relative z-20 mt-12 grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <ShieldCheck className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Secure Auth</h3>
            <p className="text-sm text-gray-400">WebAuthn & Biometric security standard.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <MapPin className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Geo-Fence</h3>
            <p className="text-sm text-gray-400">Precision location based attendance.</p>
          </motion.div>
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2 border-l-2 border-primary/50 pl-6 italic text-gray-300'>
            <p className='text-lg'>
              &ldquo;The next generation of workforce management is here. Precision, Security, and Intelligence combined into one seamless experience.&rdquo;
            </p>
            <footer className='text-primary font-medium not-italic'>ELSPL · EGC India · AECCI</footer>
          </blockquote>
        </div>
      </div>
      
      <div className='flex h-full items-center justify-center p-4 lg:p-8 bg-black/20'>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex w-full max-w-md flex-col space-y-8'
        >
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-3xl font-bold tracking-tight text-white'>
              Access System
            </h1>
            <p className='text-gray-400 text-sm'>
              Sign in with your secure organizational identity
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 focus:border-primary transition-all rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 focus:border-primary transition-all rounded-xl"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="remember" 
                checked={rememberDevice} 
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                className="border-white/20 data-[state=checked]:bg-primary"
              />
              <label htmlFor="remember" className="text-sm font-medium leading-none text-gray-400 cursor-pointer select-none">
                Trust this device for 30 days
              </label>
            </div>

            <Button 
              onClick={() => handleSignIn()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </div>
              ) : "Sign In with Credentials"}
            </Button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-white/10' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-[#020817] px-4 text-gray-500 font-medium'>
                  Secure Biometrics
                </span>
              </div>
            </div>

            <Button 
              onClick={handleBiometricLogin}
              variant="outline"
              className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all"
              disabled={isLoading}
            >
              <Fingerprint className="mr-2 h-5 w-5 text-primary" />
              Sign In with Fingerprint / Face ID
            </Button>
          </div>

          <div className="space-y-4">
            <div className='relative flex justify-center text-[10px] uppercase tracking-widest'>
              <span className='text-gray-500 font-bold'>
                Rapid Test Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Super Admin', 'HR', 'Manager', 'Employee'].map((role) => (
                <Button 
                  key={role}
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDemoAccount(role)}
                  className="h-10 text-[11px] font-bold border border-white/5 bg-white/5 hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4 text-center">
            <p className='text-gray-500 text-sm'>
              New employee?{' '}
              <Link
                href='/auth/signup'
                className='text-primary hover:underline underline-offset-4 font-bold'
              >
                Complete Onboarding
              </Link>
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-gray-600">
              <div className="flex items-center gap-1">
                <Laptop className="w-3 h-3" />
                <span>Device Tracked</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>AES-256 Encrypted</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
