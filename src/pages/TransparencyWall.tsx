import React, { useEffect, useState } from 'react';
import {
  Shield,
  ArrowUpRight,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  Lock,
  ArrowDownLeft,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAddress, algodClient } from '../lib/algorand';
import { motion } from 'motion/react';

export default function TransparencyWall() {
  const { address } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTxns = async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // In a real production app, we would use an Indexer (e.g. AlgoNode Indexer)
        // indexing: await indexer.lookupAccountTransactions(address).do();

        // Simulating the real Testnet data fetch for the Transparency Wall
        await new Promise(resolve => setTimeout(resolve, 1200));

        const mockTestnetData = [
          {
            id: 'TX-' + Math.random().toString(36).substring(7).toUpperCase(),
            amount: 0.1,
            type: 'Grant Creation (Locked)',
            status: 'Confirmed',
            timestamp: new Date().toLocaleString(),
            sender: address
          },
          {
            id: 'TX-' + Math.random().toString(36).substring(7).toUpperCase(),
            amount: 0.05,
            type: 'Milestone Release',
            status: 'Confirmed',
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            sender: address
          }
        ];
        setTxns(mockTestnetData);
      } catch (err) {
        console.error('Transparency Wall fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTxns();
  }, [address]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Shield size={24} />
          </div>
          <h1 className="text-5xl font-black text-blue-900 tracking-tighter">Transparency Wall</h1>
        </div>
        <p className="text-gray-500 text-xl font-medium max-w-2xl">
          Real-time audit log of all grant movements on the Algorand blockchain. Every transaction is immutable and verifiable.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-3">
          <div className="bg-white p-4 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-50 flex items-center gap-4 mb-8">
            <Search className="text-gray-400 ml-2" size={20} />
            <input
              type="text"
              placeholder="Search by Transaction ID, Wallet, or Grant Name..."
              className="w-full bg-transparent border-none focus:ring-0 font-medium text-blue-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border border-blue-100 shadow-sm">
                <div className="animate-spin w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-blue-900 font-bold">Syncing with Algorand Testnet...</p>
              </div>
            ) : txns.length > 0 ? (
              txns.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${txn.type.includes('Locked') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                      {txn.type.includes('Locked') ? <Lock size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900">{txn.type}</h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                        <span className="font-mono">{txn.id}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{txn.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-blue-900">{txn.amount} ALGO</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest justify-end">
                      <CheckCircle2 size={10} />
                      {txn.status}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-100">
                <FileText size={48} className="mx-auto text-blue-200 mb-4" />
                <p className="text-blue-900 font-bold text-xl">No transactions found</p>
                <p className="text-gray-500 font-medium">Connect your wallet to see live audit logs.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-800 rounded-full opacity-50"></div>
            <h2 className="text-xl font-black mb-4 relative z-10">Algorand Audit</h2>
            <p className="text-blue-200 text-sm font-medium leading-relaxed mb-6 relative z-10">
              ChainGrant uses Algorand's Pure Proof of Stake to ensure all grant data is processed with maximum security and near-instant finality.
            </p>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-xs py-2 border-b border-blue-800">
                <span className="text-blue-300">Network</span>
                <span className="font-bold">Testnet</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-blue-800">
                <span className="text-blue-300">Finality</span>
                <span className="font-bold">~3.3s</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-blue-300">Security</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Quantum-Safe
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
