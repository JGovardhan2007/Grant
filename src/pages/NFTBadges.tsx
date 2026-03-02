import React from 'react';
import { Award, ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';
import { BADGES } from '../data/mockData';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { mintBadge, algodClient } from '../lib/algorand';

export default function NFTBadges() {
  const { address, signTransaction } = useAuth();

  const handleMint = async (badge: any) => {
    if (!address) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const unitName = badge.name.substring(0, 8).toUpperCase();
      const txn = await mintBadge(address, badge.name, unitName, 'https://chaingrant.io/metadata/' + badge.id);
      const signedTxns = await signTransaction([txn]);
      await algodClient.sendRawTransaction(signedTxns).do();

      alert(`Success! ${badge.name} NFT minted on Algorand Testnet.`);
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT. Make sure you have enough Testnet Algos.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-50">
          <Award size={32} />
        </div>
        <h1 className="text-5xl font-black text-blue-900 tracking-tighter mb-4">Reputation NFT Badges</h1>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto">
          Earn verifiable credentials for your contributions. Your reputation is stored on-chain forever.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BADGES.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-50 overflow-hidden group"
          >
            <div className={`h-48 ${badge.color} flex flex-col items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <span className="text-7xl mb-2 relative z-10 group-hover:scale-110 transition-transform duration-500">{badge.icon}</span>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/30">
                NFT Asset
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-black text-blue-900 mb-1">{badge.name}</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-4">{badge.project}</p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Minted On</span>
                  <span className="text-blue-900">{badge.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    Verified on Algorand ✓
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleMint(badge)}
                className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
              >
                Mint NFT Badge
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 p-10 bg-blue-900 rounded-[3rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4 tracking-tight">Build Your Web3 Resume</h2>
            <p className="text-blue-200 text-lg font-medium leading-relaxed">
              Every badge you earn is a soulbound token that proves your skills and reliability to future sponsors. Start building your decentralized reputation today.
            </p>
          </div>
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-blue-900 bg-blue-800 flex items-center justify-center text-2xl shadow-xl">
                {['🏆', '💻', '🌟', '🛡️'][i - 1]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
