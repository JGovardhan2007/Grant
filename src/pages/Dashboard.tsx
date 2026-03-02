import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  Award, 
  IndianRupee,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SPONSOR_STATS, STUDENT_STATS, GRANTS } from '../data/mockData';
import GrantCard from '../components/GrantCard';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { role } = useAuth();

  const stats = role === 'Sponsor' ? [
    { label: 'Total Grants Created', value: SPONSOR_STATS.totalGrants, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Funds Locked', value: `₹${SPONSOR_STATS.totalFundsLocked.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Milestones Pending', value: SPONSOR_STATS.milestonesPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Grants Completed', value: SPONSOR_STATS.grantsCompleted, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ] : [
    { label: 'Active Grants', value: STUDENT_STATS.activeGrants, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Milestones Completed', value: STUDENT_STATS.milestonesCompleted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Funds Received', value: `₹${STUDENT_STATS.fundsReceived.toLocaleString()}`, icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'NFT Badges Earned', value: STUDENT_STATS.badgesEarned, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">Welcome back, {role}!</h1>
          <p className="text-gray-500 font-medium">Here's what's happening with your grants today.</p>
        </div>
        {role === 'Sponsor' && (
          <Link 
            to="/create-grant"
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all"
          >
            <PlusCircle size={20} />
            Create New Grant
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-blue-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Recent Grants</h2>
          <Link to="/transparency" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            View All Transparency Wall <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GRANTS.map((grant) => (
            <GrantCard key={grant.id} grant={grant} />
          ))}
        </div>
      </section>
    </div>
  );
}
