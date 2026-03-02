import React from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Wallet, User as UserIcon, Unlink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const { user, role, logout, connectWallet, disconnectWallet, address } = useAuth();
  const location = useLocation();

  const shortenedAddress = address ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}` : '';
  const userDisplayName = user?.email?.split('@')[0] || (address ? shortenedAddress : 'User');

  if (location.pathname === '/') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-blue-100 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
          <span className="text-white font-bold text-xl italic">C</span>
        </div>
        <span className="text-xl font-black text-blue-900 tracking-tighter">ChainGrant</span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Role Badge */}
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
          role === 'Sponsor' ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", role === 'Sponsor' ? "bg-blue-600" : "bg-emerald-600")}></span>
          {role}
        </div>

        {/* Firebase User Info */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
          <UserIcon size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-600">{userDisplayName}</span>
        </div>

        {/* Pera Wallet Connection — clickable to disconnect */}
        {address ? (
          <button
            onClick={disconnectWallet}
            title="Click to disconnect wallet"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group"
          >
            <Wallet size={14} className="group-hover:hidden" />
            <Unlink size={14} className="hidden group-hover:block" />
            <span className="group-hover:hidden">{shortenedAddress}</span>
            <span className="hidden group-hover:inline">Disconnect</span>
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-blue-900 text-white hover:bg-black shadow-lg shadow-blue-100"
          >
            <Wallet size={14} />
            Connect Wallet
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
