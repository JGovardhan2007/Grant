import React, { useEffect, useState } from 'react';
import {
  Shield,
  Search,
  ExternalLink,
  CheckCircle2,
  Lock,
  ShieldCheck,
  FileText,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function TransparencyWall() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'grants'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGrants(grantsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredGrants = grants.filter(g =>
    g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.sponsorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 mb-20">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-900 text-white rounded-[1.5rem] shadow-2xl shadow-blue-200">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-blue-900 tracking-tighter">Transparency Wall</h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Live Proof-of-Trust Ledger</p>
          </div>
        </div>
        <p className="text-gray-500 text-xl font-medium max-w-3xl leading-relaxed">
          The public ledger of all ecosystem grants. Every project, milestone, and fund movement is cryptographically verified on the Algorand blockchain and indexed here for total accountability.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-8">
          {/* Search Bar */}
          <div className="bg-white p-5 rounded-[2.5rem] border border-blue-50 shadow-2xl shadow-blue-100/30 flex items-center gap-5">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-900">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder="Search by Grant Title, Sponsor, or Student email..."
              className="w-full bg-transparent border-none focus:ring-0 font-bold text-blue-900 placeholder:text-gray-300 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-blue-50 shadow-sm">
                <Loader2 className="animate-spin w-12 h-12 text-blue-900 mx-auto mb-6" />
                <p className="text-blue-900 font-black text-xl tracking-tight">Syncing with Algorand & Firestore...</p>
              </div>
            ) : filteredGrants.length > 0 ? (
              filteredGrants.map((grant, index) => (
                <motion.div
                  key={grant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-xl shadow-blue-100/10 hover:shadow-blue-200/20 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors duration-500">
                        {grant.status === 'Completed' ? <CheckCircle2 size={32} /> : <TrendingUp size={32} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black text-blue-900 tracking-tight">{grant.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${grant.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {grant.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            Sponsor: <span className="text-blue-900">{grant.sponsorEmail}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            Student: <span className="text-blue-900">{grant.studentEmail}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 px-8 py-4 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Pool Amount</p>
                        <p className="text-2xl font-black text-blue-900">₹{grant.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200"></div>
                      <Link
                        to={`/grants/${grant.id}`}
                        className="p-3 bg-white text-blue-900 rounded-2xl shadow-sm border border-gray-100 hover:bg-blue-900 hover:text-white hover:border-blue-900 transition-all duration-300"
                      >
                        <ExternalLink size={20} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <FileText size={64} className="mx-auto text-gray-300 mb-6" />
                <p className="text-blue-900 font-black text-2xl mb-2 tracking-tight">No Grants Found</p>
                <p className="text-gray-500 font-medium">Try adjusting your search filters.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Ecosystem Stats */}
          <div className="bg-blue-900 p-10 rounded-[3rem] text-white shadow-3xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-800 rounded-full opacity-50 blur-2xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-8 tracking-tighter">Ecosystem Health</h2>
              <div className="space-y-8">
                <div>
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Value Locked</p>
                  <p className="text-4xl font-black">₹{grants.reduce((acc, g) => acc + g.totalAmount, 0).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Active Projects</p>
                    <p className="text-2xl font-black">{grants.filter(g => g.status === 'Active').length}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-2xl font-black">{grants.filter(g => g.status === 'Completed').length}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-blue-800">
                  <div className="flex items-center gap-3 text-xs font-bold text-emerald-400">
                    <ShieldCheck size={20} />
                    <span>Algorand Testnet Secured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-xl shadow-blue-100/10">
            <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-2">
              <Lock size={20} className="text-blue-600" />
              Proof of Reserve
            </h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Every grant pool visible here is backed 1:1 by funds locked in escrow on the Algorand blockchain. Use the Explorer to verify individual transaction IDs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
