import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Shield, Lock, IndianRupee, Users } from 'lucide-react';
import { motion } from 'motion/react';

import { useAuth } from '../context/AuthContext';
import { sendPayment, algodClient } from '../lib/algorand';

export default function CreateGrant() {
  const navigate = useNavigate();
  const { address, signTransaction } = useAuth();
  const [milestones, setMilestones] = useState([{ name: '', amount: '' }]);

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      // For demo, we send a small amount to a placeholder address or back to self
      const txn = await sendPayment(address, address, 0.1, 'ChainGrant: New Grant Creation');
      const signedTxns = await signTransaction([txn]);
      await algodClient.sendRawTransaction(signedTxns).do();

      alert('Success! Funds locked on Algorand Testnet.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Grant creation failed:', error);
      alert('Transaction failed. Check console for details.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-blue-900 tracking-tight mb-2">Create New Grant</h1>
        <p className="text-gray-500 text-lg font-medium">Define your project goals and lock funds in a secure smart contract.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-50">
          <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Basic Information
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Grant Title</label>
              <input
                type="text"
                placeholder="e.g. Web3 Research Fellowship"
                className="w-full px-5 py-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Describe the goals and requirements of this grant..."
                rows={4}
                className="w-full px-5 py-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                required
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Total Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    placeholder="50000"
                    className="w-full pl-12 pr-5 py-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Co-Sponsors</label>
                <button type="button" className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all">
                  <Users size={18} />
                  Add Co-Sponsor
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Lock size={20} className="text-blue-600" />
              Milestone Breakdown
            </h2>
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} />
              Add Milestone
            </button>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
              >
                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Milestone Name</label>
                  <input
                    type="text"
                    placeholder={`Milestone ${index + 1}`}
                    className="w-full px-4 py-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                    required
                  />
                </div>
                <div className="md:col-span-1 pb-1">
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    disabled={milestones.length === 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-800 transition-all transform hover:-translate-y-1"
        >
          Lock Funds on Algorand
        </button>
      </form>
    </div>
  );
}
