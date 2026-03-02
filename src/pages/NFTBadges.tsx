import React, { useEffect, useState } from 'react';
import { Award, ShieldCheck, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { mintBadge, algodClient } from '../lib/algorand';
import algosdk from 'algosdk';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MintedBadge {
  milestoneName: string;
  grantTitle: string;
  amount: number;
  assetId?: bigint;
  txId?: string;
  minted: boolean;
  color: string;
  icon: string;
}

const COLORS = [
  'bg-gradient-to-br from-blue-500 to-indigo-700',
  'bg-gradient-to-br from-emerald-500 to-teal-700',
  'bg-gradient-to-br from-purple-500 to-pink-700',
  'bg-gradient-to-br from-amber-500 to-orange-700',
  'bg-gradient-to-br from-rose-500 to-red-700',
  'bg-gradient-to-br from-cyan-500 to-sky-700',
];
const ICONS = ['🏆', '💎', '🚀', '🛡️', '⚡', '🌟', '🔥', '💻'];

export default function NFTBadges() {
  const { address, signTransaction, role } = useAuth();
  const [badges, setBadges] = useState<MintedBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [minting, setMinting] = useState<string | null>(null);

  // Load completed milestones from Firestore and build badge list
  useEffect(() => {
    const loadBadges = async () => {
      if (!address) { setLoadingBadges(false); return; }

      try {
        // Fetch grants where this address is the student
        const q = query(collection(db, 'grants'), where('studentAddress', '==', address));
        const snapshot = await getDocs(q);

        const earnedBadges: MintedBadge[] = [];
        snapshot.forEach((docSnap) => {
          const grant = docSnap.data();
          const milestones = grant.milestones || [];
          milestones.forEach((m: any, idx: number) => {
            if (m.status === 'Completed' || m.released) {
              earnedBadges.push({
                milestoneName: m.name || `Milestone ${idx + 1}`,
                grantTitle: grant.title,
                amount: m.amount,
                assetId: m.badgeAssetId,
                txId: m.badgeTxId,
                minted: !!m.badgeAssetId,
                color: COLORS[earnedBadges.length % COLORS.length],
                icon: ICONS[earnedBadges.length % ICONS.length],
              });
            }
          });
        });

        setBadges(earnedBadges);
      } catch (err) {
        console.error('Failed to load badges:', err);
      } finally {
        setLoadingBadges(false);
      }
    };

    loadBadges();
  }, [address]);

  const handleMint = async (badge: MintedBadge, idx: number) => {
    if (!address) {
      alert('Please connect your Algorand wallet first!');
      return;
    }
    if (badge.minted) {
      alert('This badge is already minted!');
      return;
    }

    const mintKey = `${badge.grantTitle}-${badge.milestoneName}`;
    setMinting(mintKey);

    try {
      const unitName = badge.milestoneName.substring(0, 8).toUpperCase().replace(/\s/g, '');
      const assetName = `ChainGrant: ${badge.milestoneName}`;
      const url = `https://chaingrant.io/badges/${badge.grantTitle.replace(/\s/g, '-')}/${unitName}`;

      const txn = await mintBadge(address, assetName, unitName, url);
      const signedTxns = await signTransaction([txn]);
      const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = sendResult.txid;

      // Wait for real on-chain confirmation
      const confirmation = await algosdk.waitForConfirmation(algodClient, txId, 10);
      const assetId = confirmation.assetIndex;

      // Update badge state locally
      setBadges(prev => prev.map((b, i) =>
        i === idx ? { ...b, minted: true, assetId, txId } : b
      ));

      alert(`✅ NFT Badge minted!\nAsset ID: ${assetId}\nView on Lora: https://lora.algokit.io/testnet/asset/${assetId}`);
    } catch (error: any) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT. Make sure your wallet has enough Testnet ALGO (at least 0.1).');
    } finally {
      setMinting(null);
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
          Earn verifiable credentials for every milestone you complete. Your reputation is stored on-chain forever on Algorand.
        </p>
      </header>

      {!address ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-50">
          <p className="text-xl font-black text-gray-400 mb-2">Connect your wallet to see your badges</p>
          <p className="text-sm text-gray-400">Use the "Connect Wallet" button in the top-right corner</p>
        </div>
      ) : loadingBadges ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-blue-300" />
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-50">
          <p className="text-4xl mb-4">🏅</p>
          <p className="text-xl font-black text-gray-400 mb-2">No badges yet!</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Complete milestones and get approved by sponsors to earn Algorand NFT badges. Each completed milestone unlocks one badge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {badges.map((badge, index) => {
            const mintKey = `${badge.grantTitle}-${badge.milestoneName}`;
            const isMinting = minting === mintKey;

            return (
              <motion.div
                key={mintKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-50 overflow-hidden group"
              >
                <div className={`h-48 ${badge.color} flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <span className="text-7xl mb-2 relative z-10 group-hover:scale-110 transition-transform duration-500">{badge.icon}</span>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/30">
                    {badge.minted ? '✓ Minted on Algorand' : 'NFT Asset — Ready to Mint'}
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black text-blue-900 mb-1">{badge.milestoneName}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-4">{badge.grantTitle} · ₹{badge.amount?.toLocaleString()}</p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Status</span>
                      <span className={badge.minted ? 'text-emerald-600' : 'text-amber-600'}>
                        {badge.minted ? '✓ Minted' : 'Not yet minted'}
                      </span>
                    </div>

                    {badge.minted && badge.assetId && (
                      <>
                        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                          <span>Asset ID</span>
                          <span className="text-blue-900">{badge.assetId}</span>
                        </div>
                        <a
                          href={`https://lora.algokit.io/testnet/asset/${badge.assetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          <ShieldCheck size={12} />
                          Verified on Algorand
                          <ExternalLink size={10} />
                        </a>
                      </>
                    )}
                  </div>

                  {badge.minted ? (
                    <div className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100">
                      <CheckCircle2 size={18} />
                      Badge Minted!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMint(badge, index)}
                      disabled={isMinting}
                      className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Minting...
                        </>
                      ) : (
                        'Mint NFT Badge'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Banner */}
      <div className="mt-16 p-10 bg-blue-900 rounded-[3rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4 tracking-tight">Build Your Web3 Resume</h2>
            <p className="text-blue-200 text-lg font-medium leading-relaxed">
              Every badge you earn is a non-transferable Algorand Standard Asset (ASA) — a permanent, cryptographic proof on the blockchain that proves your skills to future sponsors.
            </p>
          </div>
          <div className="flex -space-x-4">
            {['🏆', '💻', '🌟', '🛡️'].map((icon, i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-blue-900 bg-blue-800 flex items-center justify-center text-2xl shadow-xl">
                {icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
