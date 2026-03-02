import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Globe, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { role, user } = useAuth();
  const location = useLocation();

  if (location.pathname === '/' || !user) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Sponsor', 'Student'] },
    { to: '/create-grant', label: 'Create Grant', icon: PlusCircle, roles: ['Sponsor'] },
    { to: '/transparency', label: 'Transparency Wall', icon: Globe, roles: ['Sponsor', 'Student'] },
    { to: '/nft-badges', label: 'NFT Badges', icon: Award, roles: ['Sponsor', 'Student'] },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-blue-100 p-4 hidden md:block z-40">
      <div className="space-y-2">
        {links.filter(link => link.roles.includes(role as string)).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              isActive
                ? "bg-blue-900 text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-blue-900"
            )}
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="absolute bottom-8 left-4 right-4 p-5 bg-[#f8fafc] rounded-3xl border border-blue-50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Network</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
          <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Algorand Testnet</p>
        </div>
      </div>
    </aside>
  );
}
