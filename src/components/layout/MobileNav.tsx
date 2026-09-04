import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, QrCode, Ticket, Settings, Sparkles, BookOpen, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const raffleId = user?.raffleId || '';

  const adminItems = [
    { to: '/dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/raffles', label: 'Raffles', icon: <Trophy className="w-5 h-5" /> },
    { to: '/scan', label: 'Scan', icon: <QrCode className="w-6 h-6 text-[#F97316]" />, highlight: true },
    { to: '/tickets', label: 'Tickets', icon: <Ticket className="w-5 h-5" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const managerItems = [
    { to: raffleId ? `/raffles/${raffleId}/generate` : '/scan', label: 'Generate', icon: <Sparkles className="w-5 h-5" /> },
    { to: raffleId ? `/raffles/${raffleId}#booklets` : '/booklets', label: 'Booklets', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/scan', label: 'Scan', icon: <QrCode className="w-6 h-6 text-[#F97316]" />, highlight: true },
    { to: raffleId ? `/raffles/${raffleId}#tickets` : '/tickets', label: 'Tickets', icon: <Ticket className="w-5 h-5" /> },
    { to: raffleId ? `/raffles/${raffleId}#printSets` : '/print-sets', label: 'Print Sets', icon: <Printer className="w-5 h-5" /> },
  ];

  const items = isManager ? managerItems : adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E5E5] px-2 py-1.5 flex items-center justify-around lg:hidden no-print shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors min-w-[56px] ${
              isActive ? 'text-[#ea580c] font-semibold' : 'text-neutral-500 hover:text-neutral-800'
            }`
          }
        >
          {item.highlight ? (
            <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center -mt-3 shadow-sm">
              {item.icon}
            </div>
          ) : (
            item.icon
          )}
          <span className="text-[10px] mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
