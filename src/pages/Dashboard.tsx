import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  IndianRupee,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GrantCard from '../components/GrantCard';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard() {
  const { role, user } = useAuth();
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const grantsRef = collection(db, 'grants');
    // If Sponsor, show grants they created. If Student, show grants assigned to them.
    // In a real app, you'd filter by user email or ID.
    const q = role === 'Sponsor'
      ? query(grantsRef, where('sponsorEmail', '==', user.email))
      : query(grantsRef, where('studentEmail', '==', user.email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGrants(grantsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role]);

  const stats = role === 'Sponsor' ? [
    { label: 'Grants Created', value: grants.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Funds Locked', value: `₹${grants.reduce((acc, g) => acc + g.totalAmount, 0).toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Milestones', value: grants.reduce((acc, g) => acc + g.milestones.filter((m: any) => m.status === 'Pending Approval').length, 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: grants.filter(g => g.status === 'Completed').length, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ] : [
    { label: 'Active Grants', value: grants.filter(g => g.status === 'Active').length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Milestones Done', value: grants.reduce((acc, g) => acc + g.milestones.filter((m: any) => m.status === 'Completed').length, 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Value', value: `₹${grants.reduce((acc, g) => acc + g.totalAmount, 0).toLocaleString()}`, icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Badges', value: grants.filter(g => g.status === 'Completed').length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-900 mb-4" size={40} />
        <p className="text-blue-900 font-bold">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tight">Welcome, {user?.email?.split('@')[0]}!</h1>
          <p className="text-gray-500 font-medium">Here's your real-time grant overview.</p>
        </div>
        {role === 'Sponsor' && (
          <Link
            to="/create-grant"
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-black transition-all"
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
            className="bg-white p-7 rounded-[2rem] border border-blue-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-blue-900 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Active Grants</h2>
          <Link to="/transparency" className="text-sm font-bold text-blue-600 hover:text-blue-900 flex items-center gap-2 transition-colors">
            Transparency Wall <ArrowRight size={16} />
          </Link>
        </div>

        {grants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {grants.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-bold text-blue-900 mb-2">No grants found</p>
            <p className="text-gray-500 font-medium">
              {role === 'Sponsor' ? "Create your first grant to get started!" : "Wait for a sponsor to assign you a grant."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
