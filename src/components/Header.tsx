import React from "react";
import { Home, Compass, Sparkles, User, LogOut, Receipt } from "lucide-react";

interface HeaderProps {
  onGoHome: () => void;
  onShowPricing: () => void;
  userAccount: { name: string; email: string; plan: string } | null;
  onLogout: () => void;
  savedProposalsCount: number;
}

export default function Header({
  onGoHome,
  onShowPricing,
  userAccount,
  onLogout,
  savedProposalsCount
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/60 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          id="brand-logo"
        >
          <div className="bg-[#1C242B] text-[#FAF9F6] p-2 rounded-xl group-hover:bg-[#C47A5C] transition-colors duration-300">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span 
              className="text-lg font-bold text-[#1C242B] tracking-tight flex items-center gap-1.5"
              data-font="display"
            >
              Renovate Smarter
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-md bg-[#FAF9F6] border border-[#C47A5C] text-[#C47A5C] font-semibold">
                AI Planner
              </span>
            </span>
            <p className="text-[10px] text-stone-500 hidden sm:block">Singapore Smart Space Design Studio</p>
          </div>
        </div>

        {/* Global Nav links & Sessions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={onShowPricing}
            className="text-xs sm:text-sm font-medium text-stone-600 hover:text-[#C47A5C] transition-colors duration-200 flex items-center gap-1.5"
            id="nav-pricing-btn"
          >
            <Receipt className="w-4 h-4" />
            Pricing
          </button>

          {userAccount ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200" id="user-profile-badge">
              <div className="bg-[#C47A5C] text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs">
                {userAccount.name[0].toUpperCase()}
              </div>
              
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-stone-800 leading-tight">{userAccount.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-white bg-slate-700 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    {userAccount.plan === "free" ? "Starter" : userAccount.plan === "basic_10" ? "Standard ($10)" : "Pro ($30)"}
                  </span>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="p-1 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-200 transition-colors"
                title="Log Out Account"
                id="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onShowPricing}
              className="text-xs sm:text-sm font-medium bg-[#1C242B] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-[#C47A5C] transition-all duration-300 flex items-center gap-1.5 shadow-sm"
              id="login-register-btn"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
