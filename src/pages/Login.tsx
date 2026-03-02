import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export default function Login() {
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'Sponsor' | 'Student') => {
    setRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-blue-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200">
          <span className="text-white font-black text-4xl italic">C</span>
        </div>
        <h1 className="text-5xl font-black text-blue-900 tracking-tighter mb-4">ChainGrant</h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto font-medium">
          Transparent milestone-based funding for the next generation of builders.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleRoleSelect('Sponsor')}
          className="bg-white p-10 rounded-[2.5rem] border-2 border-transparent hover:border-blue-900 shadow-xl shadow-blue-100/50 text-left transition-all group"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-blue-900 mb-2">I am a Sponsor</h2>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            Create grants, define milestones, and release funds securely via Algorand smart contracts.
          </p>
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            Continue as Sponsor
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleRoleSelect('Student')}
          className="bg-white p-10 rounded-[2.5rem] border-2 border-transparent hover:border-emerald-600 shadow-xl shadow-emerald-100/50 text-left transition-all group"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <UserCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-emerald-900 mb-2">I am a Student</h2>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            Apply for grants, submit proof of work, and earn reputation NFTs for your contributions.
          </p>
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            Continue as Student
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </div>

      <p className="mt-12 text-sm text-gray-400 font-semibold uppercase tracking-widest">
        Powered by Algorand Blockchain
      </p>
    </div>
  );
}
