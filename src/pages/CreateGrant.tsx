import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Shield, Lock, IndianRupee, Users, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { useAuth } from '../context/AuthContext';
import { algodClient, CHAIN_GRANT_APP_ID, CHAIN_GRANT_APP_ADDR } from '../lib/algorand';
import algosdk from 'algosdk';

export default function CreateGrant() {
  const navigate = useNavigate();
  const { address, signTransaction, user, email } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentAddress, setStudentAddress] = useState('Z3JLOX2FYRMJOX2TY7LLL22VP7P7T34YDYNOS6PSISEFPMXC6GNI5XCAVQ');
  const [milestones, setMilestones] = useState([{ name: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [walletLookupStatus, setWalletLookupStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');

  // Auto-lookup wallet address when email changes
  React.useEffect(() => {
    const lookupWallet = async () => {
      if (!studentEmail || !studentEmail.includes('@')) {
        setWalletLookupStatus('idle');
        return;
      }

      setWalletLookupStatus('searching');
      try {
        const q = query(collection(db, 'walletUsers'), where('email', '==', studentEmail), where('role', '==', 'Student'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setStudentAddress(snapshot.docs[0].id); // The document ID is the wallet address
          setWalletLookupStatus('found');
        } else {
          setWalletLookupStatus('not_found');
        }
      } catch (err) {
        console.error('Failed to lookup wallet:', err);
        setWalletLookupStatus('not_found');
      }
    };

    const timeoutId = setTimeout(lookupWallet, 500); // debounce lookup
    return () => clearTimeout(timeoutId);
  }, [studentEmail]);

  // Derived: compute sum of milestone amounts
  const milestoneSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const totalNum = Number(totalAmount) || 0;
  const remainder = totalNum - milestoneSum;
  const isBalanced = totalNum > 0 && remainder === 0;

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const newMilestones = [...milestones];
    (newMilestones[index] as any)[field] = value;
    setMilestones(newMilestones);
  };

  React.useEffect(() => {
    if (milestones.length > 0) {
      setTotalAmount(milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0).toString());
    }
  }, [milestones]);

  const handleResetContract = async (e: any) => {
    e.preventDefault();
    setResetting(true);
    try {
      const params = await algodClient.getTransactionParams().do();
      const methodSelector = algosdk.ABIMethod.fromSignature('close_grant()void').getSelector();

      const txn = algosdk.makeApplicationCallTxnFromObject({
        sender: address as string,
        suggestedParams: { ...params, fee: 2000, flatFee: true },
        appIndex: CHAIN_GRANT_APP_ID,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [methodSelector],
      });

      const signedTxns = await signTransaction([txn]);
      await algodClient.sendRawTransaction(signedTxns).do();

      alert('Smart contract escrow successfully reset! You can now click "Authorize & Lock Funds" to create your new grant.');
      setNeedsReset(false);
    } catch (err: any) {
      console.error(err);
      alert('Failed to reset the contract. Make sure you are using the same Sponsor wallet that created the previous active grant: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please connect your Algorand wallet first!');
      return;
    }

    if (!isBalanced) {
      alert(`Milestone amounts (₹${milestoneSum.toLocaleString()}) must equal the total grant pool (₹${totalNum.toLocaleString()}).`);
      return;
    }

    setLoading(true);
    try {
      const params = await algodClient.getTransactionParams().do();

      // Convert INR to microALGO (1 INR = 1000 microALGO for testnet demo)
      const MIN_BALANCE_REQ = 300_000n;
      const grantAmount = BigInt(Math.round(Number(totalAmount) * 1000));
      const microAlgo = grantAmount + MIN_BALANCE_REQ;

      // ── PRE-FLIGHT CHECK 1: Wallet balance ─────────────────────────────────
      const accountInfo = await algodClient.accountInformation(address as string).do();
      const walletBalance = BigInt(accountInfo.amount);
      const txFees = 2000n; // two transactions
      const needed = microAlgo + txFees;
      if (walletBalance < needed) {
        const shortfall = ((needed - walletBalance) / 1_000_000n * 10n + 9n) / 10n; // ceil to 0.1 ALGO
        alert(
          `❌ Insufficient ALGO balance!\n\n` +
          `Your wallet: ${Number(walletBalance) / 1_000_000} ALGO\n` +
          `Required:    ${Number(needed) / 1_000_000} ALGO\n\n` +
          `Please top up your wallet with at least ${shortfall} more ALGO from:\n` +
          `https://bank.testnet.algorand.network`
        );
        setLoading(false);
        return;
      }

      // ── PRE-FLIGHT CHECK 2: Contract not already initialized ─────────────
      try {
        const appInfo = await algodClient.getApplicationByID(CHAIN_GRANT_APP_ID).do();
        const globalState = appInfo.params.globalState || [];
        const initializedVar = globalState.find((kv: any) => kv.key === 'aW5pdGlhbGl6ZWQ='); // base64 for 'initialized'
        if (initializedVar && initializedVar.value && Number(initializedVar.value.uint) === 1) {
          setLoading(false);
          setNeedsReset(true);
          return;
        }
      } catch (e) {
        // If we can't read app state, proceed anyway (non-blocking)
        console.warn('Could not read contract state — proceeding', e);
      }


      const methodSelector = algosdk.ABIMethod.fromSignature('initialize_grant(address,pay)void').getSelector();
      const encodedStudentAddr = algosdk.ABIAddressType.from('address').encode(studentAddress);

      // Payment FIRST (index 0) — ABI reads 'pay' arg at group_index - 1
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: address as string,
        receiver: CHAIN_GRANT_APP_ADDR,
        amount: microAlgo,
        suggestedParams: params,
      });

      // App call SECOND (index 1)
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: address as string,
        suggestedParams: params,
        appIndex: CHAIN_GRANT_APP_ID,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [methodSelector, encodedStudentAddr],
      });

      algosdk.assignGroupID([paymentTxn, appCallTxn]);
      const signedTxns = await signTransaction([paymentTxn, appCallTxn]);
      const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
      const fundingTxId = sendResult.txid;

      await addDoc(collection(db, 'grants'), {
        title,
        description,
        totalAmount: Number(totalAmount),
        studentEmail,
        studentAddress,
        sponsorEmail: email || 'sponsor@example.com',
        sponsorAddress: address,
        fundingTxId,
        status: 'Active',
        createdAt: new Date().toISOString(),
        milestones: milestones.map((m, i) => ({
          id: `m${i + 1}`,
          name: m.name,
          amount: Number(m.amount),
          status: 'Not Started',
          released: false,
          proofHash: null,
        })),
      });

      alert('Success! Grant created and funds locked on Algorand.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Grant creation failed:', error);
      alert('Creation failed. Make sure you signed both transactions and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header className="mb-12">
        <h1 className="text-5xl font-black text-blue-900 tracking-tighter mb-4">Create New Grant</h1>
        <p className="text-gray-500 text-xl font-medium max-w-2xl">
          Define your project goals, assign a student, and lock funds in a transparent smart contract.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info */}
        <div className="bg-white p-10 rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/20">
          <h2 className="text-2xl font-black text-blue-900 mb-8 flex items-center gap-3">
            <Shield size={24} className="text-blue-600" />
            Project Fundamentals
          </h2>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Grant Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Algorand Research Fellowship"
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Student Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Student Algorand Wallet Address</label>
                  {walletLookupStatus === 'searching' && <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Searching...</span>}
                  {walletLookupStatus === 'found' && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">Found linked wallet ✓</span>}
                  {walletLookupStatus === 'not_found' && studentEmail.includes('@') && <span className="text-[10px] font-bold text-amber-600">No student wallet linked to this email</span>}
                </div>
                <input
                  type="text"
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                  placeholder="Paste student's Algorand address (58 chars)"
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl focus:ring-0 transition-all font-bold font-mono text-sm tracking-tight ${walletLookupStatus === 'found' ? 'border-emerald-200 focus:border-emerald-400 bg-emerald-50/30 text-emerald-900' : 'border-transparent focus:border-blue-200 text-blue-900'
                    }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the research goals and expected outcomes..."
                rows={4}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900 resize-none"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Total Grant Pool (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="100000"
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Collaboration</label>
                <button type="button" className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-gray-100 text-gray-400 rounded-2xl font-bold hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 transition-all">
                  <Users size={20} />
                  Add Co-Sponsor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white p-10 rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-blue-900 flex items-center gap-3">
              <Lock size={24} className="text-blue-600" />
              Strategic Breakdown
            </h2>
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-1 text-sm font-black text-blue-600 hover:text-blue-900 transition-colors"
            >
              <Plus size={18} />
              Add Milestone
            </button>
          </div>

          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
              >
                <div className="md:col-span-7">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Objective</label>
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                    placeholder={`Milestone ${index + 1} Title`}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Allocation (₹)</label>
                  <input
                    type="number"
                    value={milestone.amount}
                    onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                    placeholder="25000"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-900 transition-all font-bold text-blue-900"
                    required
                  />
                </div>
                <div className="md:col-span-1 pb-1">
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="p-4 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    disabled={milestones.length === 1}
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Balance Indicator */}
          {totalNum > 0 && (
            <div className={`mt-6 p-5 rounded-2xl border-2 transition-all ${isBalanced ? 'bg-emerald-50 border-emerald-200'
              : remainder < 0 ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50 border-amber-200'
              }`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-600' : remainder < 0 ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                  {isBalanced
                    ? '✓ Balanced — Ready to submit'
                    : remainder < 0
                      ? `✗ Over-allocated by ₹${Math.abs(remainder).toLocaleString()}`
                      : `₹${remainder.toLocaleString()} still unallocated`}
                </span>
                <span className="text-xs font-black text-gray-400">
                  ₹{milestoneSum.toLocaleString()} / ₹{totalNum.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isBalanced ? 'bg-emerald-500' : remainder < 0 ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                  style={{ width: `${Math.min((milestoneSum / totalNum) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {needsReset ? (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-3xl font-bold flex flex-col gap-2 shadow-sm">
              <span className="flex items-center gap-2 text-rose-600 font-black tracking-widest uppercase text-xs">
                <Lock size={16} />
                Blockchain Security Block
              </span>
              <p className="text-sm">The decentralized escrow still holds locked funds (from a previous crashed/deleted test). You must forcibly reset it to proceed.</p>
            </div>

            <button
              type="button"
              onClick={handleResetContract}
              disabled={resetting}
              className="w-full py-6 rounded-[2.5rem] bg-rose-600 text-white font-black text-2xl shadow-lg shadow-rose-200/50 flex items-center justify-center gap-3 hover:bg-rose-700 transition-all transform hover:-translate-y-1"
            >
              {resetting ? <Loader2 className="animate-spin" size={28} /> : null}
              {resetting ? "Resetting Blockchain..." : "Force Reset & Refund ALGO"}
            </button>

            <button
              type="button"
              onClick={() => setNeedsReset(false)}
              className="w-full py-4 rounded-[2.5rem] bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading || !isBalanced}
            className={`w-full py-6 rounded-[2.5rem] font-black text-2xl shadow-3xl transition-all transform flex items-center justify-center gap-3 ${isBalanced
              ? 'bg-blue-900 text-white shadow-blue-200/50 hover:bg-black hover:-translate-y-1'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-70`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={28} />
                Processing Blockchain Tx...
              </>
            ) : (
              <>
                Authorize &amp; Lock Funds
                <Shield size={24} />
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
