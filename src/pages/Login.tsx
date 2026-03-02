import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { login, signup, connectWalletAndLogin } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Sponsor' | 'Student'>('Student');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletRolePicker, setShowWalletRolePicker] = useState(false);
  const [walletUsername, setWalletUsername] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, role);
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async (selectedRole: 'Sponsor' | 'Student') => {
    if (!walletUsername.trim() || !walletUsername.includes('@')) {
      setError('Please enter a valid email address before connecting your wallet.');
      return;
    }
    setWalletLoading(true);
    setError(null);
    setShowWalletRolePicker(false);
    try {
      // Derive display name from email (part before @)
      const derivedName = walletUsername.trim().split('@')[0];
      await connectWalletAndLogin(selectedRole, derivedName);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Wallet login failed. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-100 rounded-full blur-[100px] opacity-40"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          <header className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
              <span className="text-white font-black text-3xl italic">C</span>
            </div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : 'Join ChainGrant'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'Log in to manage your grants' : 'Start your building journey today'}
            </p>
          </header>

          {/* Wallet Login — Primary CTA */}
          <div className="mb-6">
            {!showWalletRolePicker ? (
              <button
                onClick={() => setShowWalletRolePicker(true)}
                disabled={walletLoading}
                className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {walletLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Wallet size={20} />
                    Sign In with Pera Wallet
                  </>
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3"
              >
                <p className="text-xs font-black text-blue-700 uppercase tracking-widest text-center">Your Email &amp; Role</p>
                {/* Email field */}
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={walletUsername}
                  onChange={(e) => setWalletUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-blue-200 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleWalletLogin('Student')}
                    className="p-4 bg-white rounded-xl border-2 border-emerald-400 flex flex-col items-center gap-2 hover:bg-emerald-50 transition-all"
                  >
                    <UserCircle size={24} className="text-emerald-600" />
                    <span className="text-xs font-black text-emerald-800">Student</span>
                  </button>
                  <button
                    onClick={() => handleWalletLogin('Sponsor')}
                    className="p-4 bg-white rounded-xl border-2 border-blue-900 flex flex-col items-center gap-2 hover:bg-blue-50 transition-all"
                  >
                    <ShieldCheck size={24} className="text-blue-900" />
                    <span className="text-xs font-black text-blue-900">Sponsor</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowWalletRolePicker(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 font-bold pt-1"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">or use email</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all font-medium outline-none text-blue-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all font-medium outline-none text-blue-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Student')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'Student' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-50 bg-gray-50/50 text-gray-400'}`}
                  >
                    <UserCircle size={24} />
                    <span className="text-xs font-black">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Sponsor')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'Sponsor' ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-gray-50 bg-gray-50/50 text-gray-400'}`}
                  >
                    <ShieldCheck size={24} />
                    <span className="text-xs font-black">Sponsor</span>
                  </button>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Log In with Email' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-gray-500 hover:text-blue-900 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">
          SECURED BY ALGORAND & FIREBASE
        </p>
      </motion.div>
    </div>
  );
}
