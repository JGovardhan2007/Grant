import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  ShieldCheck,
  Mail,
  Wallet,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { signupWithWallet, loginWithWallet } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Sponsor' | 'Student'>('Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── LOGIN: just open Pera wallet, no email input ──────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithWallet();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'WALLET_NOT_REGISTERED') {
        setError('Wallet not found. Please sign up first by clicking "Sign Up" above.');
      } else if (err?.message?.includes('closed by user')) {
        setError(null); // User cancelled — no error shown
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN UP: take email + role, then open Pera wallet ────────────────────
  const handleSignup = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signupWithWallet(email.trim(), role);
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.message?.includes('closed by user')) {
        setError(null);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-100 rounded-full blur-[100px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
              <span className="text-white font-black text-3xl italic">C</span>
            </div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">ChainGrant</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Transparent grant funding on Algorand</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${tab === t ? 'bg-white shadow text-blue-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100 mb-5"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <p className="text-center text-sm text-gray-500 font-medium">
                  Connect your Pera Wallet to log in. No password needed.
                </p>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
                  {loading ? 'Connecting...' : 'Login with Pera Wallet'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all font-medium outline-none text-blue-900"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('Student')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'Student' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-100 bg-gray-50 text-gray-400'
                        }`}
                    >
                      <UserCircle size={24} />
                      <span className="text-xs font-black">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('Sponsor')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'Sponsor' ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-gray-100 bg-gray-50 text-gray-400'
                        }`}
                    >
                      <ShieldCheck size={24} />
                      <span className="text-xs font-black">Sponsor</span>
                    </button>
                  </div>
                </div>

                {/* Connect wallet to complete signup */}
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
                  {loading ? 'Connecting wallet...' : 'Connect Pera Wallet & Sign Up'}
                </button>
                <p className="text-center text-xs text-gray-400 font-medium">
                  Your email is bound to your wallet address. Next time, just use Login.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">
          SECURED BY ALGORAND & FIREBASE
        </p>
      </motion.div>
    </div>
  );
}
