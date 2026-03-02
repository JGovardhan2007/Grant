import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Globe, Award, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();

  if (location.pathname === '/') return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Sponsor', 'Student'] },
    { to: '/create-grant', label: 'Create Grant', icon: PlusCircle, roles: ['Sponsor'] },
    { to: '/transparency', label: 'Transparency Wall', icon: Globe, roles: ['Sponsor', 'Student'] },
    { to: '/nft-badges', label: 'NFT Badges', icon: Award, roles: ['Sponsor', 'Student'] },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-blue-100 p-4 hidden md:block">
      <div className="space-y-2">
        {links.filter(link => link.roles.includes(role as string)).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive 
                ? "bg-blue-900 text-white shadow-md shadow-blue-200" 
                : "text-gray-600 hover:bg-blue-50 hover:text-blue-900"
            )}
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="absolute bottom-8 left-4 right-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Network</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-blue-800">Algorand Mainnet</p>
        </div>
      </div>
    </aside>
  );
}
