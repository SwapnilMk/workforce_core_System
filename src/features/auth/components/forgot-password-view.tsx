'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { useState } from 'react';
import { Mail, Briefcase, ShieldCheck, MapPin, Laptop, ArrowLeft, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ForgotPasswordViewPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call for password reset
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log(`Password reset requested for: ${email}`);
      toast.success('Recovery email sent successfully!');
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-y-auto lg:overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground transition-colors duration-300 lg:h-screen'>
      {/* Theme Toggles */}
      <div className='absolute right-4 top-4 z-50 flex items-center gap-2 bg-background/80 p-2 rounded-xl border border-border backdrop-blur-md shadow-lg'>
        <TooltipProvider delayDuration={0}>
          <ThemeModeToggle />
          <div className='hidden sm:block'>
            <ThemeSelector />
          </div>
        </TooltipProvider>
      </div>

      {/* Left panel - same premium dark panel as login */}
      <div className='relative hidden h-full flex-col p-10 lg:flex text-white'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#020617]' />
        <div className='relative z-20 flex items-center text-xl font-bold tracking-tight text-white'>
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
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-white"
          >
            <ShieldCheck className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Secure Auth</h3>
            <p className="text-sm text-gray-400">WebAuthn & Biometric security standard.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-white"
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
      
      {/* Right panel - Form wrapper */}
      <div className='flex min-h-screen lg:h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8 bg-card/20 border-l border-border/10 overflow-y-auto lg:overflow-hidden py-8 sm:py-12'>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex w-full max-w-md flex-col space-y-6 md:space-y-8'
        >
          {/* Mobile Logo / Brand Header */}
          <div className='flex items-center justify-center lg:hidden mb-2'>
            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/50">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">EGC Workforce Core</span>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className='flex flex-col space-y-2 text-center'>
                  <h1 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase italic'>
                    Reset Password
                  </h1>
                  <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
                    Enter your email to receive a secure recovery link
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        type="email" 
                        placeholder="name@company.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/30 focus:border-primary transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        <span>Sending Link...</span>
                      </div>
                    ) : "Send Recovery Link"}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                      <CheckCircle className="h-10 w-10" />
                    </motion.div>
                    <span className="absolute -inset-2 rounded-full border border-emerald-500/10 animate-ping opacity-75" />
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase italic'>
                      Check Your Email
                    </h1>
                    <p className='text-muted-foreground text-xs sm:text-sm font-medium max-w-sm'>
                      We have sent a secure password reset link to
                    </p>
                    <div className="px-4 py-2 bg-card rounded-lg border border-border inline-block font-mono text-sm text-foreground">
                      {email}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border flex gap-3 text-left">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Didn't receive the email? Make sure to check your spam or junk folder, or verify if the address entered is registered with EGC.
                  </p>
                </div>

                <div className="flex flex-col space-y-3 pt-2">
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="h-12 border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-semibold rounded-xl transition-all"
                  >
                    Resend Email Link
                  </Button>
                  <Link href="/auth/login" className="w-full">
                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col space-y-4 text-center pt-4">
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Laptop className="w-3 h-3" />
                <span>Device Tracked</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
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
