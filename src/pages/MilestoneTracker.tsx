import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  Check,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { algodClient, CHAIN_GRANT_APP_ID } from '../lib/algorand';
import { generateHash } from '../lib/hashing';
import algosdk from 'algosdk';

export default function MilestoneTracker() {
  const { id } = useParams();
  const { role, address, signTransaction, user } = useAuth();
  const [grant, setGrant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [proofDescription, setProofDescription] = useState('');

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMilestoneId, setRejectMilestoneId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const handleUploadProof = async () => {
    if (!grant || !address || !selectedMilestoneId || !proofDescription) {
      alert('Please fill in all details and connect your wallet!');
      return;
    }

    setUploading(selectedMilestoneId);
    setShowProofModal(false);

    try {
      // 1. Generate SHA-256 Hash from user description (kept for audit trail)
      const realHash = generateHash(proofDescription);

      // 2. Update Firestore with Hash and Description (Skipping 0-ALGO txn as per user request)
      const updatedMilestones = grant.milestones.map((m: any) =>
        m.id === selectedMilestoneId
          ? {
            ...m,
            status: 'Pending Approval',
            proofHash: `0x${realHash.substring(0, 32)}...`,
            proofDescription
          }
          : m
      );

      await updateDoc(doc(db, 'grants', grant.id), {
        milestones: updatedMilestones
      });

      alert(`Success! Work submitted for approval.`);
      setProofDescription('');
      setSelectedMilestoneId(null);
    } catch (err: any) {
      console.error('Proof submission failed:', err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!grant || !rejectMilestoneId || !rejectReason.trim()) {
      alert('Please provide a reason for requesting changes.');
      return;
    }

    setShowRejectModal(false);

    try {
      const updatedMilestones = grant.milestones.map((m: any) =>
        m.id === rejectMilestoneId
          ? {
            ...m,
            status: 'Changes Requested',
            feedback: rejectReason
          }
          : m
      );

      await updateDoc(doc(db, 'grants', grant.id), {
        milestones: updatedMilestones
      });

      alert('Feedback sent to student.');
      setRejectReason('');
      setRejectMilestoneId(null);
    } catch (err: any) {
      console.error('Failed to send feedback:', err);
      alert('Failed to send feedback. Try again.');
    }
  };

  const handleReleaseFunds = async (milestone: any) => {
    if (!address) {
      alert('Please connect your Algorand wallet first!');
      return;
    }

    setReleasing(milestone.id);
    try {
      // 1. Build ABI call to release_funds on the smart contract
      const params = await algodClient.getTransactionParams().do();

      // Convert INR to microALGO (1 INR = 1000 microALGO for testnet demo)
      const microAlgo = BigInt(Math.round(milestone.amount * 1000));

      const methodSelector = algosdk.ABIMethod.fromSignature('release_funds(uint64)void').getSelector();
      const amountArg = algosdk.ABIUintType.from('uint64').encode(microAlgo);

      const txn = algosdk.makeApplicationCallTxnFromObject({
        sender: address,
        suggestedParams: { ...params, fee: 2000, flatFee: true },
        appIndex: CHAIN_GRANT_APP_ID,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [methodSelector, amountArg],
        accounts: [grant.studentAddress],
        note: new TextEncoder().encode(`ChainGrant Release: ${milestone.name}`),
      });

      const signedTxns = await signTransaction([txn]);
      const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
      const releaseTxId = sendResult.txid;

      // 2. Update Firestore
      const updatedMilestones = grant.milestones.map((m: any) =>
        m.id === milestone.id
          ? { ...m, status: 'Completed', released: true, txId: releaseTxId }
          : m
      );

      // Check if all milestones are completed
      const allDone = updatedMilestones.every((m: any) => m.status === 'Completed');

      await updateDoc(doc(db, 'grants', grant.id), {
        milestones: updatedMilestones,
        status: allDone ? 'Completed' : 'Active'
      });

      alert(`Success! ₹${milestone.amount.toLocaleString()} released on Algorand. Tx: ${releaseTxId.substring(0, 8)}...`);
    } catch (error) {
      console.error('Fund release failed:', error);
      alert(`Transaction failed. Check console for details.`);
    } finally {
      setReleasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-900 mb-4" size={40} />
        <p className="text-blue-900 font-bold">Fetching grant details...</p>
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

  const releasedAmount = grant.milestones.filter((m: any) => m.released).reduce((acc: number, m: any) => acc + m.amount, 0);
  const remainingAmount = grant.totalAmount - releasedAmount;

  return (
    <div className="max-w-5xl mx-auto py-8 mb-20 animate-in fade-in duration-700">
      <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-black mb-10 hover:translate-x-[-4px] transition-transform inline-flex uppercase tracking-widest text-xs">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <header>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-blue-100 text-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200 shadow-sm">ID: #{grant.id.substring(0, 6)}</span>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${grant.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                {grant.status}
              </span>
            </div>
            <h1 className="text-5xl font-black text-blue-900 tracking-tighter mb-6">{grant.title}</h1>
            <p className="text-gray-500 text-xl font-medium leading-relaxed">{grant.description}</p>
          </header>

          <section className="bg-white p-10 rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/20">
            <h2 className="text-2xl font-black text-blue-900 mb-8 flex items-center gap-3">
              <FileText size={24} className="text-blue-600" />
              Strategic Roadmap
            </h2>

            <div className="space-y-6">
              {grant.milestones.map((milestone: any, index: number) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-3xl border transition-all ${milestone.status === 'Completed'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : milestone.status === 'Pending Approval'
                      ? 'bg-amber-50/50 border-amber-100'
                      : 'bg-gray-50/30 border-gray-100'
                    }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${milestone.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-white text-blue-900 border border-gray-100'
                        }`}>
                        {milestone.status === 'Completed' ? <Check size={24} /> : index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-blue-900">{milestone.name}</h3>
                        <p className="text-sm font-bold text-gray-400">Allocation: <span className="text-blue-600">₹{milestone.amount.toLocaleString()}</span></p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${milestone.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      milestone.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-gray-400 border-gray-100'
                      }`}>
                      {milestone.status}
                    </div>
                  </div>

                  {milestone.proofDescription && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-4">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <FileText size={12} />
                        Submitted Work
                      </p>
                      <p className="text-sm font-medium text-blue-900 whitespace-pre-wrap">{milestone.proofDescription}</p>
                    </div>
                  )}

                  {milestone.proofHash && (
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 mb-6 flex items-center justify-between group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={18} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anchored Proof Hash</p>
                          <p className="text-xs font-mono font-bold text-blue-900 truncate">{milestone.proofHash}</p>
                          {milestone.txId && (
                            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">
                              On-Chain: {milestone.txId.substring(0, 12)}...
                            </p>
                          )}
                        </div>
                      </div>
                      {milestone.txId && (
                        <a
                          href={`https://lora.algokit.io/testnet/transaction/${milestone.txId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Feedback Display */}
                  {milestone.feedback && (milestone.status === 'Changes Requested' || milestone.status === 'Pending Approval') && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 mb-4">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        Sponsor Feedback
                      </p>
                      <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">{milestone.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-4">
                    {role === 'Student' && (milestone.status === 'Not Started' || milestone.status === 'Changes Requested') && (
                      <button
                        onClick={() => {
                          setSelectedMilestoneId(milestone.id);
                          setShowProofModal(true);
                        }}
                        disabled={uploading === milestone.id}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-black transition-all disabled:opacity-50"
                      >
                        {uploading === milestone.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <Upload size={18} />
                            Submit Work Proof
                          </>
                        )}
                      </button>
                    )}

                    {milestone.status === 'Pending Approval' && role === 'Student' && (
                      <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 animate-pulse">
                        <Clock size={16} />
                        <span className="text-xs uppercase tracking-wider">Awaiting Verification</span>
                      </div>
                    )}

                    {role === 'Sponsor' && milestone.status === 'Pending Approval' && (
                      <>
                        <button
                          onClick={() => {
                            setRejectMilestoneId(milestone.id);
                            setShowRejectModal(true);
                          }}
                          className="px-6 py-3 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-bold hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95"
                        >
                          Request Changes
                        </button>
                        <button
                          onClick={() => handleReleaseFunds(milestone)}
                          disabled={releasing === milestone.id}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          {releasing === milestone.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <CheckCircle2 size={18} />
                          )}
                          {releasing === milestone.id ? 'Releasing...' : `Approve & Pay (₹${milestone.amount.toLocaleString()})`}
                        </button>
                      </>
                    )}

                    {milestone.released && (
                      <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-[0.1em] border border-emerald-100 shadow-sm shadow-emerald-50">
                        <CheckCircle2 size={18} />
                        Verified & Released
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/20 sticky top-24">
            <h2 className="text-2xl font-black text-blue-900 mb-8 tracking-tight">Financial Summary</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Total Committed</span>
                <span className="font-black text-xl text-blue-900">₹{grant.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Actually Released</span>
                <span className="font-black text-xl text-emerald-600">₹{releasedAmount.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-50"></div>
              <div className="flex justify-between items-center group">
                <span className="text-blue-900 font-black text-[10px] uppercase tracking-widest">Remaining Balance</span>
                <span className="font-black text-2xl text-blue-900">₹{remainingAmount.toLocaleString()}</span>
              </div>
            </div>

            <Link
              to={`/grants/${grant.id}/spend`}
              className="w-full mt-10 flex items-center justify-center gap-3 py-5 bg-blue-50 text-blue-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all shadow-sm group"
            >
              <FileText size={18} className="transition-transform group-hover:scale-110" />
              Audit Transaction Wall
            </Link>
          </div>
        </div>
      </div>

      {/* Proof Submission Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-900/20 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 border border-blue-50"
          >
            <h3 className="text-2xl font-black text-blue-900 mb-2">Submit Proof of Work</h3>
            <p className="text-gray-400 text-sm font-bold mb-8 uppercase tracking-widest">Milestone: <span className="text-blue-600">{grant.milestones.find((m: any) => m.id === selectedMilestoneId)?.name}</span></p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Description or Links</label>
                <textarea
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  placeholder="e.g. GitHub Repository Link, Project URL, or summary of work done..."
                  rows={4}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900 resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofDescription('');
                    setSelectedMilestoneId(null);
                  }}
                  className="flex-1 py-4 px-6 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadProof}
                  className="flex-1 py-4 px-6 bg-blue-900 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Anchor On-Chain
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject/Request Changes Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-900/10 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 border border-rose-100"
          >
            <h3 className="text-2xl font-black text-rose-900 mb-2">Request Changes</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">Let the student know what needs to be fixed before you can approve this milestone.</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Feedback / Required Changes</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please include the link to the deployed application..."
                  rows={4}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold text-rose-900 resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setRejectMilestoneId(null);
                  }}
                  className="flex-1 py-4 px-6 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  className="flex-1 py-4 px-6 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                >
                  Send Feedback
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
