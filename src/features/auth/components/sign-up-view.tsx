'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/lib/store/auth-store';
import { Mail, Lock, Eye, EyeOff, Briefcase, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignUpViewPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Employee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      login(data.user.email, data.user.role, data.user.name);
      setIsLoading(false);
      router.push('/dashboard/overview');
    } catch (error: any) {
      setIsLoading(false);
      alert(error.message);
    }
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
              &ldquo;Join the EGC Workforce network. Our integrated platform empowers professionals and organizations to achieve excellence together.&rdquo;
            </p>
            <footer className='text-sidebar-foreground/70 text-sm'>ELSPL · EGC India · AECCI</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Create Account
            </h1>
            <p className='text-muted-foreground text-sm'>
              Join the organizational workforce system
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-sidebar"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="Email Address" 
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
            <div className="space-y-2">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger className="pl-10 h-11 bg-white/5 border-white/10 text-white focus:ring-sidebar">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#020817] border-white/10 text-white">
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => handleSignUp()}
              className="w-full h-11 bg-[#1a365d] hover:bg-[#0f2a4a] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </div>

          <p className='text-muted-foreground px-8 text-center text-sm'>
            Already have an account?{' '}
            <Link
              href='/auth/login'
              className='hover:text-primary underline underline-offset-4 font-semibold'
            >
              Sign In
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
