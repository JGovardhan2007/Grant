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
  Clock,
  AlertTriangle,
  MessageSquare,
  Upload,
  Banknote
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));
}

type EventType = 'submitted' | 'changes_requested' | 'approved';

interface AuditEvent {
  type: EventType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const EVENT_MAP: Record<EventType, AuditEvent> = {
  submitted: {
    type: 'submitted',
    label: 'Work Submitted',
    icon: Upload,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100'
  },
  changes_requested: {
    type: 'changes_requested',
    label: 'Changes Requested',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100'
  },
  approved: {
    type: 'approved',
    label: 'Approved & Released',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100'
  }
};

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

  const allMilestones: any[] = grant.milestones ?? [];
  const completedCount = allMilestones.filter((m: any) => m.status === 'Completed' || m.released).length;
  const pendingCount = allMilestones.filter((m: any) => m.status === 'Pending Approval').length;
  const changesCount = allMilestones.filter((m: any) => m.status === 'Changes Requested').length;
  const releasedValue = allMilestones.filter((m: any) => m.released).reduce((acc: number, m: any) => acc + m.amount, 0);

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
          Complete audit log for <span className="text-blue-900 font-black">{grant.title}</span>. Every submission, revision request, and payment release is recorded here.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main timeline */}
        <div className="lg:col-span-3 space-y-8">
          {/* Grant Creation Event */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[3rem] border border-blue-50 shadow-xl shadow-blue-100/10"
          >
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Lock size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Grant Created</span>
                  <span className="text-[10px] font-mono text-gray-400">{formatDate(grant.createdAt)}</span>
                </div>
                <h3 className="text-xl font-black text-blue-900 mb-1">{grant.title}</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">{grant.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pool</p>
                    <p className="text-base font-black text-blue-900">₹{grant.totalAmount?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Milestones</p>
                    <p className="text-base font-black text-blue-900">{allMilestones.length}</p>
                  </div>
                  {grant.fundingTxId && (
                    <div className="bg-gray-50 rounded-2xl p-3 col-span-2 md:col-span-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Funding Tx</p>
                      <a
                        href={`https://lora.algokit.io/testnet/transaction/${grant.fundingTxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        {grant.fundingTxId.substring(0, 12)}... <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Per-milestone audit cards */}
          {allMilestones.map((milestone: any, index: number) => {
            // Build ordered list of events for this milestone
            const events: { type: EventType; data?: any }[] = [];
            if (milestone.proofHash) events.push({ type: 'submitted', data: milestone });
            if (milestone.feedback) events.push({ type: 'changes_requested', data: milestone });
            if (milestone.released) events.push({ type: 'approved', data: milestone });

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.08 }}
                className="bg-white rounded-[3rem] border border-blue-50 shadow-xl shadow-blue-100/10 overflow-hidden"
              >
                {/* Milestone Header */}
                <div className="p-8 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-black text-blue-900">{index + 1}</span>
                      <h3 className="text-xl font-black text-blue-900">{milestone.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${milestone.status === 'Completed' || milestone.released
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : milestone.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : milestone.status === 'Changes Requested'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 ml-11 font-bold">
                    Allocation: <span className="text-blue-600">₹{milestone.amount?.toLocaleString()}</span>
                  </p>
                </div>

                {events.length === 0 ? (
                  <div className="px-8 pb-8">
                    <div className="bg-gray-50 rounded-2xl p-5 flex items-center gap-3 text-gray-400">
                      <Clock size={18} />
                      <span className="text-sm font-bold">No activity yet — waiting for student submission.</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-8 pb-8 space-y-4">
                    {/* Work Submitted */}
                    {milestone.proofHash && (
                      <div className={`rounded-2xl border p-5 ${EVENT_MAP.submitted.bg} ${EVENT_MAP.submitted.border}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Upload size={14} className={EVENT_MAP.submitted.color} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${EVENT_MAP.submitted.color}`}>Work Submitted</span>
                        </div>
                        {milestone.proofDescription && (
                          <div className="mb-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquare size={9} /> Description</p>
                            <p className="text-sm font-medium text-blue-900 whitespace-pre-wrap">{milestone.proofDescription}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">SHA-256 Proof Hash</p>
                          <p className="text-xs font-mono font-bold text-blue-900 break-all">{milestone.proofHash}</p>
                        </div>
                      </div>
                    )}

                    {/* Changes Requested */}
                    {milestone.feedback && (
                      <div className={`rounded-2xl border p-5 ${EVENT_MAP.changes_requested.bg} ${EVENT_MAP.changes_requested.border}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle size={14} className={EVENT_MAP.changes_requested.color} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${EVENT_MAP.changes_requested.color}`}>Sponsor Requested Changes</span>
                        </div>
                        <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">{milestone.feedback}</p>
                      </div>
                    )}

                    {/* Approved & Released */}
                    {milestone.released && (
                      <div className={`rounded-2xl border p-5 ${EVENT_MAP.approved.bg} ${EVENT_MAP.approved.border}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 size={14} className={EVENT_MAP.approved.color} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${EVENT_MAP.approved.color}`}>Approved & Released</span>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <Banknote size={16} className="text-emerald-600" />
                            <span className="text-base font-black text-emerald-700">₹{milestone.amount?.toLocaleString()} Released</span>
                          </div>
                          {milestone.txId && (
                            <a
                              href={`https://lora.algokit.io/testnet/transaction/${milestone.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 hover:underline"
                            >
                              Tx: {milestone.txId.substring(0, 12)}... <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-blue-900 p-8 rounded-[3rem] text-white shadow-3xl shadow-blue-200 sticky top-24">
            <h2 className="text-xl font-black mb-6 tracking-tight">Audit Summary</h2>
            <div className="space-y-5">
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Total Milestones</span>
                <span className="text-3xl font-black">{allMilestones.length}</span>
              </div>
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Completed</span>
                <span className="text-3xl font-black text-emerald-400">{completedCount}</span>
              </div>
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Pending Review</span>
                <span className="text-3xl font-black text-amber-400">{pendingCount}</span>
              </div>
              <div className="flex justify-between items-end border-b border-blue-800 pb-4">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Changes Req.</span>
                <span className="text-3xl font-black text-rose-400">{changesCount}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-widest">Value Released</span>
                <span className="text-2xl font-black text-emerald-400">₹{releasedValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Lock size={14} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest">Vault Status</span>
              </div>
              <p className="text-blue-100 text-[11px] font-medium leading-relaxed">
                All hashes correspond to transaction notes on the Algorand Testnet. They cannot be altered or removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
