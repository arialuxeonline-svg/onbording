import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, db, doc, getDoc, collection, query, where, getDocs } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';
import { ClientData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Sparkles, ShieldCheck, Zap, X, Save, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'report' | 'public-report'>('onboarding');
  const [publicReportData, setPublicReportData] = useState<{ client: ClientData, report: any } | null>(null);
  
  // Settings & Error State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('gemini_api_key_override') || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // FIX 1 — APP TITLE
  useEffect(() => {
    document.title = 'GeniuzLab Content Factory | AI Content Empire';
  }, []);

  useEffect(() => {
    const checkPublicReport = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/report/')) {
        const token = path.split('/')[2];
        setLoading(true);
        try {
          const q = query(collection(db, 'reports'), where('shareToken', '==', token));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const reportDoc = querySnapshot.docs[0];
            const reportData = reportDoc.data();
            
            // Fetch client data for the report
            const clientSnap = await getDoc(doc(db, 'clients', reportData.clientId));
            if (clientSnap.exists()) {
              setPublicReportData({
                client: clientSnap.data() as ClientData,
                report: reportData.reportData
              });
              setView('public-report');
            }
          }
        } catch (error) {
          console.error("Error fetching public report:", error);
          setError("Failed to load the shared report. It may have expired or been removed.");
        }
        setLoading(false);
      }
    };
    checkPublicReport();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (window.location.pathname.startsWith('/report/')) {
        setLoading(false);
        return;
      }
      
      if (currentUser) {
        // Fetch client data
        try {
          const docRef = doc(db, 'clients', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as ClientData;
            setClientData(data);
            if (data.reportGenerated) {
              setView('dashboard');
            } else {
              setView('onboarding');
            }
          } else {
            setView('onboarding');
          }
        } catch (error) {
          console.error("Error fetching client data:", error);
          setError("Failed to load your profile data.");
        }
      } else {
        setView('onboarding');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
    }
  };

  // FIX 2 — LOGOUT BUTTON
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setClientData(null);
      setView('onboarding');
    } catch (error) {
      console.error('Sign out error:', error);
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  // FIX 3 — API KEY SETTINGS
  const handleSaveApiKey = () => {
    setSaveStatus('saving');
    try {
      if (apiKeyInput.trim()) {
        localStorage.setItem('gemini_api_key_override', apiKeyInput.trim());
      } else {
        localStorage.removeItem('gemini_api_key_override');
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (view === 'public-report' && publicReportData) {
    return (
      <Layout user={null}>
        <ReportView 
          clientData={publicReportData.client} 
          onContinue={() => window.location.href = '/'} 
          publicData={publicReportData}
        />
      </Layout>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onSignOut={handleSignOut} 
      onOpenSettings={() => setShowSettings(true)}
    >
      {/* FIX 6 — LOADING STATE OVERLAY */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-500/20 rounded-full mx-auto" />
                <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Generating Content...
                </h2>
                <p className="text-gray-400 italic">"⚡ SHIVA is generating your empire content..."</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIX 7 — ERROR DISPLAY */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-md p-4 rounded-xl flex items-start gap-3 shadow-2xl shadow-red-500/20">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm text-red-200 font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500/50 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIX 3 — SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-purple-500" size={24} />
                  System Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gemini API Key Override</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your API key here..."
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all font-mono text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    This key will be stored locally in your browser and used instead of the system default. 
                    Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">AI Studio</a>.
                  </p>
                </div>

                <button
                  onClick={handleSaveApiKey}
                  disabled={saveStatus === 'saving'}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    saveStatus === 'saved' ? 'bg-green-600 text-white' : 
                    saveStatus === 'error' ? 'bg-red-600 text-white' :
                    'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {saveStatus === 'saving' ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 
                   saveStatus === 'saved' ? <ShieldCheck size={20} /> : <Save size={20} />}
                  <span>
                    {saveStatus === 'saving' ? 'Saving...' : 
                     saveStatus === 'saved' ? 'Key Saved Successfully' : 
                     saveStatus === 'error' ? 'Error Saving Key' : 'Save API Configuration'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!user ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-semibold mb-8">
              <Sparkles size={16} />
              <span>Next-Gen AI Automation Agency</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Your AI Automation <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Command Center</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Unlock the full potential of your business with custom AI solutions. 
              Onboard in minutes, get your intelligence report, and scale your operations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
              {[
                { icon: Zap, title: "Instant Analysis", desc: "AI-driven competitor and market gap analysis." },
                { icon: ShieldCheck, title: "Secure Portal", desc: "Private dashboard for your automation roadmap." },
                { icon: Sparkles, title: "Custom AI Stack", desc: "Tailored tool recommendations for your niche." }
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl hover:border-purple-500/30 transition-all">
                  <feature.icon className="text-purple-500 mb-4" size={24} />
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogin}
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-white/10"
            >
              <LogIn size={20} />
              <span>Get Started with Google</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'onboarding' && (
            <OnboardingWizard 
              user={user} 
              onComplete={(data) => {
                setClientData(data);
                setView('report');
              }} 
            />
          )}
          {view === 'report' && clientData && (
            <ReportView 
              clientData={clientData} 
              onContinue={() => setView('dashboard')} 
            />
          )}
          {view === 'dashboard' && clientData && (
            <Dashboard clientData={clientData} />
          )}
        </AnimatePresence>
      )}
    </Layout>
  );
}
