import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GrantCardProps {
  grant: {
    id: string;
    title: string;
    sponsor: string;
    totalAmount: number;
    status: string;
    milestones: any[];
  };
}

const GrantCard: React.FC<GrantCardProps> = ({ grant }) => {
  const completedMilestones = grant.milestones.filter(m => m.status === 'Completed').length;
  const progress = (completedMilestones / grant.milestones.length) * 100;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-6 hover:shadow-lg transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-blue-900 group-hover:text-blue-700 transition-colors">{grant.title}</h3>
          <p className="text-sm text-gray-500">Sponsor: {grant.sponsor}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
          grant.status === 'Active' ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
        )}>
          {grant.status}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-bold text-blue-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-900 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
          <p className="text-xl font-bold text-blue-900">₹{grant.totalAmount.toLocaleString()}</p>
        </div>
        <Link 
          to={`/grants/${grant.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 rounded-xl text-sm font-bold hover:bg-blue-900 hover:text-white transition-all"
        >
          View Grant
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default GrantCard;
