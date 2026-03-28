import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Share2, CheckCircle2, TrendingUp, Target, Zap, BarChart3, Clock, Layout as LayoutIcon, ChevronRight, Sparkles } from 'lucide-react';
import { ClientData, ReportData } from '../types';
import { db, doc, setDoc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { generateReport } from '../services/gemini';

interface ReportViewProps {
  clientData: ClientData;
  onContinue: () => void;
  publicData?: { client: ClientData, report: ReportData };
}

const generationSteps = [
  "Analyzing business profile...",
  "Scanning competitor landscape...",
  "Identifying automation gaps...",
  "Calculating ROI projections...",
  "Synthesizing 90-day roadmap...",
  "Selecting optimal AI stack...",
  "Finalizing executive summary...",
  "Polishing intelligence report..."
];

export const ReportView: React.FC<ReportViewProps> = ({ clientData: initialClientData, onContinue, publicData }) => {
  const [report, setReport] = useState<ReportData | null>(publicData?.report || null);
  const [loading, setLoading] = useState(!publicData);
  const [currentStep, setCurrentStep] = useState(publicData ? 7 : 0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData>(publicData?.client || initialClientData);

  useEffect(() => {
    if (publicData) return;
    
    let stepInterval: any;
    if (loading) {
      stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % generationSteps.length);
      }, 2000);
    }
    return () => clearInterval(stepInterval);
  }, [loading, publicData]);

  useEffect(() => {
    if (publicData) return;
    
    const generateReportData = async () => {
      try {
        const data = await generateReport(clientData);
        setReport(data);
        
        // Save report to Firebase
        const shareToken = Math.random().toString(36).substring(2, 15);
        const reportId = `${clientData.uid}_${Date.now()}`;
        await setDoc(doc(db, 'reports', reportId), {
          clientId: clientData.uid,
          reportData: data,
          generatedAt: new Date().toISOString(),
          shareToken
        });

        // Update client status
        await updateDoc(doc(db, 'clients', clientData.uid), {
          reportGenerated: true
        });

        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/report/${shareToken}`);
      } catch (error) {
        console.error("Report generation failed:", error);
      } finally {
        setLoading(false);
      }
    };

    generateReportData();
  }, [clientData, publicData]);

  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .print-only { display: block !important; }
            .page-break { page-break-before: always; }
          }
        `}</style>
        <div className="relative">
          <div className="w-24 h-24 border-4 border-purple-500/20 rounded-full" />
          <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <Sparkles className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Generating Your Intelligence Report</h2>
          <p className="text-purple-400 font-bold animate-pulse h-6">
            {generationSteps[currentStep]}
          </p>
          <p className="text-gray-400 max-w-md mx-auto mt-4">
            Gemini 2.5 Flash is processing your data to build a high-performance automation strategy.
          </p>
        </div>
        <div className="w-full max-w-md bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
            animate={{ width: `${((currentStep + 1) / generationSteps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 print:p-0 print:m-0">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#111111] border border-[#2a2a2a] p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FileText size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligence Report</h1>
            <p className="text-purple-400 font-medium">{clientData.businessName} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-gray-600 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <Download size={18} />
            <span>Download PDF</span>
          </button>
          <button 
            onClick={handleShare}
            className={`px-5 py-2.5 border rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
              copied ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-gray-600'
            }`}
          >
            {copied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button 
            onClick={onContinue}
            className="px-6 py-2.5 bg-white text-black rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <span>Go to Dashboard</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl page-break">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
          <CheckCircle2 className="text-purple-500" size={24} />
          <h2 className="text-xl font-bold uppercase tracking-widest text-purple-400">Executive Summary</h2>
        </div>
        <div className="p-8 space-y-6 text-gray-300 leading-relaxed text-lg">
          {report.executiveSummary.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Pain Point Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 page-break">
        <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 bg-gradient-to-r from-red-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
            <BarChart3 className="text-red-500" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest text-red-400">Pain Point Analysis</h2>
          </div>
          <div className="p-8 space-y-8">
            {report.painPointAnalysis.map((p, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Severity: {p.severity}/10</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.severity * 10}%` }}
                    className="h-full bg-red-500"
                  />
                </div>
                <p className="text-sm text-gray-400 italic">Solution: {p.solution}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 bg-gradient-to-r from-cyan-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
            <TrendingUp className="text-cyan-500" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest text-cyan-400">ROI Projection</h2>
          </div>
          <div className="p-8 space-y-6">
            <p className="text-gray-300 leading-relaxed">{report.roiProjection}</p>
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-6">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400">
                <Zap size={32} />
              </div>
              <div>
                <h4 className="font-bold text-cyan-400">Efficiency Boost</h4>
                <p className="text-sm text-gray-500">Estimated 40-60% reduction in manual task time within 6 months.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Roadmap */}
      <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl page-break">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
          <Clock className="text-purple-500" size={24} />
          <h2 className="text-xl font-bold uppercase tracking-widest text-purple-400">90-Day AI Roadmap</h2>
        </div>
        <div className="p-8">
          <div className="relative space-y-12 before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#2a2a2a] before:h-full">
            {[
              { title: 'Weeks 1-4: Foundation', content: report.roadmap90Day.week1_4 },
              { title: 'Month 2: Integration', content: report.roadmap90Day.month2 },
              { title: 'Month 3: Optimization', content: report.roadmap90Day.month3 }
            ].map((item, i) => (
              <div key={i} className="relative pl-12">
                <div className="absolute left-0 top-1.5 w-8 h-8 bg-purple-600 rounded-full border-4 border-[#111111] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Stack & Quick Wins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 page-break">
        <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
            <LayoutIcon className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest text-blue-400">Recommended AI Stack</h2>
          </div>
          <div className="p-8 grid grid-cols-1 gap-3">
            {report.recommendedStack.map((tool, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="font-medium">{tool}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 bg-gradient-to-r from-green-900/20 to-transparent border-b border-[#2a2a2a] flex items-center gap-3">
            <Zap className="text-green-500" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest text-green-400">Quick Wins</h2>
          </div>
          <div className="p-8 space-y-4">
            {report.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 flex-shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-gray-300">{win}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
