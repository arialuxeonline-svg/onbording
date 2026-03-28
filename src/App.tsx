import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, db, doc, getDoc, collection, query, where, getDocs } from './lib/firebase';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';
import { ClientData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'report' | 'public-report'>('onboarding');
  const [publicReportData, setPublicReportData] = useState<{ client: ClientData, report: any } | null>(null);

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
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Layout user={null}>
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
      </Layout>
    );
  }

  return (
    <Layout user={user}>
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
    </Layout>
  );
}
