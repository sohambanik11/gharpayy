import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('demo@gharpayy.com');
  const [password, setPassword] = useState('demo1234');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-create demo account on first visit
  const ensureDemoAccount = async () => {
    const { error } = await supabase.auth.signUp({
      email: 'demo@gharpayy.com',
      password: 'demo1234',
      options: { data: { full_name: 'Demo User' } },
    });
    // Ignore if already exists
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Ensure demo account exists first
    if (email === 'demo@gharpayy.com') await ensureDemoAccount();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Welcome back!');
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) toast.error(error.message);
    else toast.success('Check your email to verify your account!');
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success('Password reset link sent to your email');
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error instanceof Error ? error.message : 'Google sign-in failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ background: 'hsl(220, 16%, 8%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-display font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white tracking-tight">Gharpayy</h1>
              <p className="text-[11px] text-white/40">Lead Management CRM</p>
            </div>
          </div>
        </div>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-display text-2xl font-bold text-white leading-tight mb-4 tracking-tight">
            Every lead tracked.<br />Every deal closed.
          </h2>
          <p className="text-white/40 text-sm max-w-md leading-relaxed">
            Automated follow-ups, AI scoring, and real-time pipeline visibility for your entire team.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Response Time', value: '<5 min' },
              { label: 'Lead Scoring', value: 'AI' },
              { label: 'Pipeline Stages', value: '8' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border border-white/[0.06]" style={{ background: 'hsl(220, 14%, 12%)' }}>
                <p className="font-display font-bold text-white text-base">{s.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-[10px] text-white/20">© 2026 Gharpayy. All rights reserved.</p>

        {/* Subtle gradient orb */}
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(25, 95%, 53%), transparent)' }} />
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-[380px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-display font-bold">G</span>
            </div>
            <h1 className="font-display font-bold text-base text-foreground tracking-tight">Gharpayy</h1>
          </div>

          <h2 className="font-display font-bold text-xl text-foreground mb-1 tracking-tight">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>
          <p className="text-xs text-muted-foreground mb-8">
            {mode === 'login' ? 'Sign in to your CRM dashboard' : mode === 'signup' ? 'Join your team on Gharpayy' : 'Enter your email to reset password'}
          </p>

          {mode !== 'forgot' && (
            <>
              <Button variant="outline" className="w-full gap-2 mb-5 h-11 rounded-xl" onClick={handleGoogle} disabled={loading}>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-2xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
              </div>
            </>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label className="text-2xs">Full Name</Label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9 h-11 rounded-xl" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-2xs">Email</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 h-11 rounded-xl" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label className="text-2xs">Password</Label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9 pr-9 h-11 rounded-xl" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-2xs text-accent hover:underline">
                Forgot password?
              </button>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="text-2xs text-center text-muted-foreground mt-8">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-accent hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-accent hover:underline">Sign in</button></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
