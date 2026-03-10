import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Mode = 'login' | 'signup' | 'forgot';

const OwnerAuth = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    window.location.href = '/owner-portal';
  };

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.name || !form.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);

    // Sign up with owner role metadata
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          role: 'owner', // Triggers our DB hook
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Create owner record
    if (data.user) {
      await supabase.from('owners').insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        user_id: data.user.id,
      });
    }

    setLoading(false);
    toast.success('Account created! Please check your email to verify.');
  };

  const handleForgot = async () => {
    if (!form.email) { toast.error('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/owner-portal`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Reset link sent to your email');
    setMode('login');
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, hsl(225 25% 8%) 0%, hsl(240 20% 12%) 100%)',
      }}
    >
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Gharpayy</h1>
              <p className="text-white/40 text-xs">Owner Portal</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Manage your<br />
              <span className="text-indigo-400">properties</span><br />
              effortlessly.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Track bookings, confirm room statuses, view your earnings, and stay connected with your tenants — all from one place.
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          {[
            { label: 'Active Properties', value: '100+' },
            { label: 'Monthly Bookings', value: '500+' },
            { label: 'Avg Occupancy', value: '87%' },
            { label: 'Payout Speed', value: '48hrs' },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">Gharpayy Owner</span>
          </div>

          {/* Back button (for forgot mode) */}
          {mode === 'forgot' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {mode === 'login' ? 'Sign in to your owner account'
                : mode === 'signup' ? 'Join Gharpayy as a property owner'
                : "We'll send you a reset link"}
            </p>
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <>
                <InputField
                  icon={<User size={14} />}
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={v => set('name', v)}
                />
                <InputField
                  icon={<Phone size={14} />}
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={v => set('phone', v)}
                />
              </>
            )}

            <InputField
              icon={<Mail size={14} />}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={v => set('email', v)}
            />

            {mode !== 'forgot' && (
              <div className="relative">
                <InputField
                  icon={<Lock size={14} />}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={v => set('password', v)}
                  onEnter={() => mode === 'login' ? handleLogin() : handleSignup()}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              disabled={loading}
              onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </div>

          <p className="text-center text-white/40 text-sm mt-6">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Register as Owner
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Sign In
                </button>
              </>
            )}
          </p>

          <p className="text-center text-white/20 text-xs mt-8">
            <a href="/auth" className="hover:text-white/40 transition-colors">Staff login →</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const InputField = ({
  icon,
  type,
  placeholder,
  value,
  onChange,
  onEnter,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
    />
  </div>
);

export default OwnerAuth;
