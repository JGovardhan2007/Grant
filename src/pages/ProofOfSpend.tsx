import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Upload, 
  Check, 
  ArrowLeft,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GRANTS } from '../data/mockData';
import { motion } from 'motion/react';

export default function MilestoneTracker() {
  const { id } = useParams();
  const { role } = useAuth();
  const grant = GRANTS.find(g => g.id === id) || GRANTS[0];
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUploadProof = (milestoneId: string) => {
    setUploading(milestoneId);
    setTimeout(() => {
      setUploading(null);
      alert('Proof uploaded! SHA-256 Hash generated: 0x' + Math.random().toString(16).slice(2, 10).toUpperCase() + '...');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-bold mb-8 hover:translate-x-1 transition-transform inline-flex">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <header>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-widest">Grant ID: #{grant.id}</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-widest">{grant.status}</span>
            </div>
            <h1 className="text-4xl font-black text-blue-900 tracking-tight mb-4">{grant.title}</h1>
            <p className="text-gray-600 text-lg leading-relaxed font-medium">{grant.description}</p>
          </header>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-blue-900 tracking-tight mb-6">Milestone Roadmap</h2>
            {grant.milestones.map((milestone, index) => (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white p-6 rounded-3xl border ${milestone.status === 'Completed' ? 'border-emerald-100 bg-emerald-50/30' : 'border-blue-100'} shadow-sm`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      milestone.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {milestone.status === 'Completed' ? <Check size={20} /> : index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">{milestone.name}</h3>
                      <p className="text-sm font-bold text-blue-600">₹{milestone.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    milestone.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                    milestone.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {milestone.status}
                  </div>
                </div>

                {milestone.proofHash && (
                  <div className="bg-white border border-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-blue-600" />
                      <span className="text-xs font-mono text-gray-500">Proof Hash: {milestone.proofHash}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {role === 'Student' && milestone.status === 'Not Started' && (
                    <button 
                      onClick={() => handleUploadProof(milestone.id)}
                      disabled={uploading === milestone.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all disabled:opacity-50"
                    >
                      {uploading === milestone.id ? 'Uploading...' : (
                        <>
                          <Upload size={16} />
                          Upload Proof
                        </>
                      )}
                    </button>
                  )}
                  {role === 'Student' && milestone.status === 'Pending Approval' && (
                    <span className="text-sm font-bold text-amber-600 italic">Waiting for Sponsor Review...</span>
                  )}
                  {role === 'Sponsor' && milestone.status === 'Pending Approval' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all">
                      <CheckCircle2 size={16} />
                      Approve & Release Funds
                    </button>
                  )}
                  {milestone.released && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} />
                      Funds Released ✓
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-50">
            <h2 className="text-xl font-black text-blue-900 mb-6">Grant Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-blue-50">
                <span className="text-gray-500 font-medium">Total Funds</span>
                <span className="font-bold text-blue-900">₹{grant.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-blue-50">
                <span className="text-gray-500 font-medium">Released</span>
                <span className="font-bold text-emerald-600">₹{grant.milestones.filter(m => m.released).reduce((acc, m) => acc + m.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500 font-medium">Remaining</span>
                <span className="font-bold text-blue-900">₹{grant.milestones.filter(m => !m.released).reduce((acc, m) => acc + m.amount, 0).toLocaleString()}</span>
              </div>
            </div>
            <Link 
              to={`/grants/${grant.id}/spend`}
              className="w-full mt-8 flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-900 rounded-2xl font-bold hover:bg-blue-100 transition-all"
            >
              <FileText size={18} />
              View Proof of Spend
            </Link>
          </div>

          <div className="bg-blue-900 p-8 rounded-[2rem] text-white">
            <h2 className="text-xl font-black mb-4">Smart Contract</h2>
            <p className="text-blue-200 text-sm font-medium mb-6 leading-relaxed">
              This grant is secured by an Algorand Smart Contract. Funds are locked and can only be released upon milestone approval.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono bg-blue-800/50 p-3 rounded-xl border border-blue-700">
              <ShieldCheck size={14} className="text-emerald-400" />
              ALGO-SC-9283-XPL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
