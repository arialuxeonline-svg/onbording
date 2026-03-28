import React from 'react';
import { motion } from 'motion/react';
import { LogOut, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onSignOut?: () => void;
  onOpenSettings?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onSignOut, onOpenSettings }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-lg md:text-xl font-bold italic">G</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">GeniuzLab</h1>
              <p className="text-[8px] md:text-[10px] text-purple-400 uppercase tracking-[0.2em] font-semibold">Intelligence Portal</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4 md:gap-8 text-sm font-medium text-gray-400">
            <div className="hidden lg:flex items-center gap-8">
              <a href="#" className="hover:text-white transition-colors">Solutions</a>
              <a href="#" className="hover:text-white transition-colors">Case Studies</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
            </div>
            {user ? (
              <div className="flex items-center gap-3 md:gap-4 pl-4 md:pl-8 border-l border-[#2a2a2a]">
                <button 
                  onClick={onOpenSettings}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all"
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
                
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">
                    {user.displayName?.length > 20 ? user.displayName.substring(0, 20) + '...' : user.displayName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</p>
                </div>
                
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=7c3aed&color=fff`} 
                  alt={user.displayName} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-purple-500/50" 
                  referrerPolicy="no-referrer" 
                />

                <button 
                  onClick={onSignOut}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button className="px-4 py-2 md:px-5 md:py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold text-xs md:text-sm">
                Book a Demo
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-[#2a2a2a] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-gray-500 text-sm">
            © 2026 GeniuzLab AI Automation Agency. All rights reserved.
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
