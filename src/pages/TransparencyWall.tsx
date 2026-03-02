import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GRANTS } from '../data/mockData';
import { motion } from 'motion/react';

export default function ProofOfSpend() {
  const { id } = useParams();
  const { role } = useAuth();
  const grant = GRANTS.find(g => g.id === id) || GRANTS[0];
  const [receipts, setReceipts] = useState([
    { id: 'r1', name: 'Server Hosting Receipt', amount: 2500, date: '2024-02-18', hash: '0x8472...XKPL', txId: 'ALGO-TXN-8472XKPL' }
  ]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const newReceipt = {
        id: 'r' + (receipts.length + 1),
        name: 'New Expense Receipt',
        amount: 5000,
        date: new Date().toISOString().split('T')[0],
        hash: '0x' + Math.random().toString(16).slice(2, 10).toUpperCase() + '...',
        txId: 'ALGO-TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase()
      };
      setReceipts([newReceipt, ...receipts]);
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link to={`/grants/${id}`} className="flex items-center gap-2 text-blue-600 font-bold mb-8 hover:translate-x-1 transition-transform inline-flex">
        <ArrowLeft size={18} />
        Back to Milestone Tracker
      </Link>

      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tight mb-2">Proof of Spend</h1>
          <p className="text-gray-500 text-lg font-medium">Verify how grant funds are being utilized with on-chain receipts.</p>
        </div>
        {role === 'Student' && (
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all disabled:opacity-50"
          >
            {uploading ? 'Processing...' : (
              <>
                <Upload size={20} />
                Upload Receipt
              </>
            )}
          </button>
        )}
      </header>

      <div className="space-y-6">
        {receipts.map((receipt, index) => (
          <motion.div 
            key={receipt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <ImageIcon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">{receipt.name}</h3>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                  <span>{receipt.date}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-blue-900 font-bold">₹{receipt.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
                <ShieldCheck size={14} />
                SHA-256: {receipt.hash}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Verified on Algorand ✓
                </div>
                <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold">
                  {receipt.txId}
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {receipts.length === 0 && (
          <div className="text-center py-20 bg-blue-50/50 rounded-[2.5rem] border-2 border-dashed border-blue-100">
            <FileText size={48} className="mx-auto text-blue-200 mb-4" />
            <p className="text-blue-900 font-bold text-xl">No receipts uploaded yet</p>
            <p className="text-gray-500 font-medium">Upload spending receipts to maintain transparency.</p>
          </div>
        )}
      </div>

      <div className="mt-12 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">Immutable Transparency</h3>
            <p className="text-emerald-800/70 font-medium leading-relaxed">
              All receipts uploaded to ChainGrant are hashed and stored on the Algorand blockchain. This ensures that spending data cannot be tampered with after submission, providing a public audit trail for sponsors and the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
