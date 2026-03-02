import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ProofOfSpend() {
  const { id } = useParams();
  const [grant, setGrant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'grants', id), (docSnap) => {
      if (docSnap.exists()) {
        setGrant({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-900 mb-4" size={40} />
        <p className="text-blue-900 font-bold">Accessing Audit Vault...</p>
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-blue-900">Grant not found</h2>
        <Link to="/dashboard" className="text-blue-600 font-bold hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  const proofMilestones = grant.milestones.filter((m: any) => m.proofHash);

  return (
    <div className="max-w-6xl mx-auto py-8 mb-20 animate-in fade-in duration-700">
      <Link to={`/grants/${grant.id}`} className="flex items-center gap-2 text-blue-600 font-black mb-10 hover:translate-x-[-4px] transition-transform inline-flex uppercase tracking-widest text-[10px]">
        <ArrowLeft size={16} />
        Back to Grant Details
      </Link>

      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-900 text-white rounded-[2rem] shadow-2xl shadow-blue-100">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-blue-900 tracking-tighter">Transaction Audit Vault</h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Immutable Verification Trail</p>
          </div>
        </div>
        <p className="text-gray-500 text-xl font-medium max-w-3xl leading-relaxed">
          Deep dive into the cryptographic proofs submitted for <span className="text-blue-900 font-black">{grant.title}</span>. Each entry represents a work submission verified on the Algorand blockchain.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-6">
          {proofMilestones.length > 0 ? (
            proofMilestones.map((milestone: any, index: number) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-[3rem] border border-blue-50 shadow-xl shadow-blue-100/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-900">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-blue-900 mb-1">{milestone.name}</h3>
                    <p className="text-sm font-bold text-gray-400">Released: <span className="text-emerald-600">₹{milestone.amount.toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Blockchain Hash</p>
                    <p className="text-xs font-mono font-bold text-blue-900 truncate">{milestone.proofHash}</p>
                  </div>
                </div>

                <a
                  href={`https://testnet.algoexplorer.io/address/${grant.sponsorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white text-blue-900 rounded-2xl border border-gray-100 shadow-sm hover:bg-blue-900 hover:text-white transition-all group"
                >
                  <ExternalLink size={24} className="group-hover:scale-110 transition-transform" />
                </a>
              </motion.div>
            ))
          ) : (
            <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <FileText size={64} className="mx-auto text-gray-300 mb-6" />
              <p className="text-blue-900 font-black text-2xl mb-2 tracking-tight">No Proofs Submitted Yet</p>
              <p className="text-gray-500 font-medium">Proofs appear here once the student submits work milestones.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-blue-900 p-10 rounded-[3rem] text-white shadow-3xl shadow-blue-200">
            <h2 className="text-2xl font-black mb-6 tracking-tight">Audit Summary</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Total Proofs</span>
                <span className="text-3xl font-black">{proofMilestones.length}</span>
              </div>
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Verified Value</span>
                <span className="text-3xl font-black">₹{proofMilestones.reduce((acc: number, m: any) => acc + m.amount, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-10 p-5 bg-white/10 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Lock size={16} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest">Vault Status</span>
              </div>
              <p className="text-blue-100 text-[11px] font-medium leading-relaxed">
                All hashes displayed here correspond to transaction notes on the Algorand blockchain. They cannot be altered or removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
