'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/lib/store/auth-store';
import { Mail, Lock, Eye, EyeOff, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function SignInViewPage() {
  const [email, setEmail] = useState('admin@egc.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      login(data.user.email, data.user.role, data.user.name);
      setIsLoading(false);
      router.push('/dashboard/overview');
    } catch (error: any) {
      setIsLoading(false);
      alert(error.message);
    }
  };

  const setDemoAccount = (type: Role) => {
    const emailMap = {
      Admin: 'admin@egc.com',
      Manager: 'manager@egc.com',
      Employee: 'employee@egc.com',
    };
    setEmail(emailMap[type]);
    setPassword(type.toLowerCase() + '123');
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-[#020817] text-white'>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center text-lg font-medium'>
          <Briefcase className="mr-2 h-6 w-6" />
          EGC Workforce
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;The EGC Workforce Core System has revolutionized how we manage our global talent pool, providing real-time insights and seamless coordination.&rdquo;
            </p>
            <footer className='text-sidebar-foreground/70 text-sm'>ELSPL · EGC India · AECCI</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Sign In
            </h1>
            <p className='text-muted-foreground text-sm'>
              Enter your organizational credentials to access the system
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-sidebar"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-sidebar"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button 
              onClick={() => handleSignIn()}
              className="w-full h-11 bg-[#1a365d] hover:bg-[#0f2a4a] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-[#020817] px-2 text-muted-foreground'>
                Demo Accounts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Admin', 'Manager', 'Employee'] as Role[]).map((role) => (
              <Button 
                key={role}
                variant="outline" 
                size="sm"
                onClick={() => setDemoAccount(role)}
                className="h-9 text-[10px] font-bold"
              >
                {role}
              </Button>
            ))}
          </div>

          <p className='text-muted-foreground px-8 text-center text-sm'>
            Don't have an account?{' '}
            <Link
              href='/auth/signup'
              className='hover:text-primary underline underline-offset-4 font-semibold'
            >
              Sign Up
            </Link>
          </p>
          <p className='text-muted-foreground px-8 text-center text-[10px]'>
            By clicking continue, you agree to our{' '}
            <Link href='/terms' className='underline underline-offset-4'>Terms of Service</Link> and <Link href='/privacy' className='underline underline-offset-4'>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
