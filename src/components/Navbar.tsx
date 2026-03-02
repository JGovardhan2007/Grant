import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Globe, Award, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const { role, logout, connectWallet, address } = useAuth();
  const location = useLocation();

  const shortenedAddress = address ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}` : '';

  if (location.pathname === '/') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-blue-100 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl italic">C</span>
        </div>
        <span className="text-xl font-bold text-blue-900 tracking-tight">ChainGrant</span>
      </div>

      <div className="flex items-center gap-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
          role === 'Sponsor' ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
        )}>
          <span className={cn("w-2 h-2 rounded-full", role === 'Sponsor' ? "bg-blue-600" : "bg-emerald-600")}></span>
          {role}
        </div>

        <button
          onClick={address ? undefined : connectWallet}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            address ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-900 hover:bg-blue-100"
          )}
        >
          <Wallet size={16} />
          {address ? shortenedAddress : "Connect Pera Wallet"}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Switch Role
        </button>
      </div>
    </nav>
  );
}
