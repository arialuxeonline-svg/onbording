import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Sparkles, Globe, Users, Building2, Target, Rocket, ShieldCheck, Zap, BarChart3, Search, CreditCard } from 'lucide-react';
import { ClientData, CompetitorAnalysis } from '../types';
import { db, doc, setDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { analyzeCompetitor } from '../services/gemini';

const industries = [
  "E-commerce", "SaaS", "Real Estate", "Healthcare", "Finance", "Legal", "Education", "Marketing Agency", 
  "Construction", "Hospitality", "Manufacturing", "Retail", "Technology", "Entertainment", "Logistics",
  "Consulting", "Fitness", "Beauty", "Automotive", "Non-profit", "Media", "Agriculture", "Energy",
  "Fashion", "Food & Beverage", "Gaming", "Insurance", "Recruitment", "Travel", "Wellness",
  "Architecture", "Design", "Event Planning", "Photography", "Software Development", "Translation",
  "Veterinary", "Writing", "Art", "Music", "Sports", "Government", "Human Resources", "Public Relations",
  "Security", "Telecommunications", "Utilities", "Wholesale", "Other"
];

const painPointOptions = [
  "Lead Generation", "Content Creation", "Social Media", "Email Marketing", 
  "Customer Follow-up", "Reporting", "Competitor Analysis", "SEO", 
  "Paid Ads", "Customer Support"
];

const goals = [
  "More Leads", "More Sales", "Save Time", "Scale Operations", "Beat Competitors", "Build Authority"
];

interface OnboardingWizardProps {
  user: any;
  onComplete: (data: ClientData) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem(`onboarding_step_${user.uid}`);
    return saved ? parseInt(saved) : 1;
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientData>>(() => {
    const saved = localStorage.getItem(`onboarding_data_${user.uid}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      businessName: '',
      websiteUrl: '',
      industry: 'Technology',
      businessSize: 'Solo',
      yearsInBusiness: 1,
      monthlyRevenue: '£0 - £5k',
      location: '',
      painPoints: [],
      tools: [],
      budget: 5000,
      primaryGoal: 'More Leads',
      target90Day: '',
      vision12Month: '',
      successMetric: '',
      competitors: [],
      uid: user.uid,
      createdAt: new Date().toISOString()
    };
  });

  React.useEffect(() => {
    localStorage.setItem(`onboarding_step_${user.uid}`, step.toString());
  }, [step, user.uid]);

  React.useEffect(() => {
    localStorage.setItem(`onboarding_data_${user.uid}`, JSON.stringify(formData));
  }, [formData, user.uid]);

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateField = (field: keyof ClientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePainPointToggle = (name: string) => {
    const current = formData.painPoints || [];
    const exists = current.find(p => p.name === name);
    if (exists) {
      updateField('painPoints', current.filter(p => p.name !== name));
    } else {
      updateField('painPoints', [...current, { name, score: 5 }]);
    }
  };

  const updatePainPointScore = (name: string, score: number) => {
    updateField('painPoints', (formData.painPoints || []).map(p => p.name === name ? { ...p, score } : p));
  };

  const addCompetitor = async (url: string) => {
    if (!url) return;
    setLoading(true);
    try {
      const analysis = await analyzeCompetitor(url, formData.industry || 'Technology');
      updateField('competitors', [...(formData.competitors || []), { url, ...analysis }]);
    } catch (error) {
      console.error("Competitor analysis failed:", error);
      updateField('competitors', [...(formData.competitors || []), { url }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (packageSelected: string) => {
    setLoading(true);
    
    // Simulate Stripe Checkout Redirect
    const stripeUrl = `https://checkout.stripe.com/pay/placeholder_${packageSelected}_${Date.now()}`;
    console.log("Redirecting to Stripe:", stripeUrl);
    
    // In a real app, we'd use window.location.href = stripeUrl;
    // For this demo, we'll show a simulated payment success state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalData = { ...formData, packageSelected, reportGenerated: false } as ClientData;
    try {
      await setDoc(doc(db, 'clients', user.uid), finalData);
      localStorage.removeItem(`onboarding_step_${user.uid}`);
      localStorage.removeItem(`onboarding_data_${user.uid}`);
      onComplete(finalData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={e => updateField('businessName', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                  placeholder="e.g. Acme AI"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Website URL</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={e => updateField('websiteUrl', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Industry</label>
                <select
                  value={formData.industry}
                  onChange={e => updateField('industry', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                >
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Business Size</label>
                <select
                  value={formData.businessSize}
                  onChange={e => updateField('businessSize', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                >
                  {["Solo", "2-10", "11-50", "51-200", "200+"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Years in Business</label>
                <input
                  type="number"
                  value={formData.yearsInBusiness}
                  onChange={e => updateField('yearsInBusiness', parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Monthly Revenue Range</label>
                <select
                  value={formData.monthlyRevenue}
                  onChange={e => updateField('monthlyRevenue', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                >
                  {["£0 - £5k", "£5k - £20k", "£20k - £100k", "£100k - £500k", "£500k+"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Primary Location (City, Country)</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => updateField('location', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                placeholder="London, UK"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-lg font-bold">Select your primary pain points</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {painPointOptions.map(p => {
                  const isSelected = formData.painPoints?.find(pp => pp.name === p);
                  return (
                    <button
                      key={p}
                      onClick={() => handlePainPointToggle(p)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                        isSelected 
                        ? 'bg-purple-500/20 border-purple-500 text-white' 
                        : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.painPoints && formData.painPoints.length > 0 && (
              <div className="space-y-6">
                <label className="text-lg font-bold">Rate the severity (1-10)</label>
                {formData.painPoints.map(p => (
                  <div key={p.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="text-purple-400 font-bold">{p.score}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={p.score}
                      onChange={e => updatePainPointScore(p.name, parseInt(e.target.value))}
                      className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-lg font-bold">Monthly Budget for AI Automation</label>
              <div className="flex justify-between text-sm text-gray-400">
                <span>£500</span>
                <span>£50,000+</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={formData.budget}
                onChange={e => updateField('budget', parseInt(e.target.value))}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="text-center text-2xl font-bold text-cyan-400">
                £{formData.budget?.toLocaleString()}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Primary Goal</label>
              <select
                value={formData.primaryGoal}
                onChange={e => updateField('primaryGoal', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
              >
                {goals.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">90-Day Target</label>
              <textarea
                value={formData.target90Day}
                onChange={e => updateField('target90Day', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all h-32"
                placeholder="What do you want to achieve in the next 3 months?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">12-Month Vision</label>
              <textarea
                value={formData.vision12Month}
                onChange={e => updateField('vision12Month', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all h-32"
                placeholder="Where do you see the business in a year?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Success Metric</label>
              <input
                type="text"
                value={formData.successMetric}
                onChange={e => updateField('successMetric', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                placeholder="e.g. 30% reduction in operational costs"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-lg font-bold">Competitor Intelligence</label>
              <p className="text-sm text-gray-400">Add up to 5 competitor URLs for AI analysis.</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="competitor-url"
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                  placeholder="https://competitor.com"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('competitor-url') as HTMLInputElement;
                    addCompetitor(input.value);
                    input.value = '';
                  }}
                  disabled={loading || (formData.competitors?.length || 0) >= 5}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={20} />}
                  <span>Analyze</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {formData.competitors?.map((c, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-purple-400 font-bold">
                      <Globe size={18} />
                      <span>{c.url}</span>
                    </div>
                    {c.socialPresenceScore && (
                      <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-bold">
                        Score: {c.socialPresenceScore}/10
                      </div>
                    )}
                  </div>
                  
                  {c.estimatedTraffic ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Traffic</p>
                        <p>{c.estimatedTraffic}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Strategy</p>
                        <p>{c.contentStrategy}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Identified Weakness</p>
                        <p className="text-red-400">{c.weaknessIdentified}</p>
                      </div>
                      <div className="md:col-span-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                        <p className="text-purple-400 uppercase text-[10px] font-bold tracking-wider mb-1">Your Advantage</p>
                        <p className="italic">"{c.competitiveAdvantage}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Select Your AI Package</h2>
              <p className="text-gray-400">Based on your pain points and budget, we recommend the following:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'starter',
                  name: 'Starter',
                  price: '£997',
                  period: 'one-time',
                  desc: 'AI Content System',
                  features: ['Content Strategy', 'Basic Automation', 'Weekly Reports'],
                  color: 'gray',
                  recommended: false
                },
                {
                  id: 'growth',
                  name: 'Growth',
                  price: '£2,500',
                  period: 'per month',
                  desc: 'Full AI Automation Suite',
                  features: ['Full CRM Automation', 'AI Lead Gen', 'Competitor Tracking', 'Priority Support'],
                  color: 'purple',
                  recommended: true
                },
                {
                  id: 'enterprise',
                  name: 'Enterprise',
                  price: '£8,000',
                  period: 'per month',
                  desc: 'Complete AI Empire',
                  features: ['Custom AI Models', 'Full Operations Scaling', 'Dedicated AI Strategist', '24/7 Monitoring'],
                  color: 'cyan',
                  recommended: false
                }
              ].map(pkg => (
                <div
                  key={pkg.id}
                  className={`relative p-8 bg-[#1a1a1a] border-2 rounded-3xl transition-all flex flex-col ${
                    pkg.recommended ? 'border-purple-500 scale-105 shadow-2xl shadow-purple-500/10' : 'border-[#2a2a2a] hover:border-gray-600'
                  }`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                      Recommended
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className="text-gray-500 text-sm">{pkg.period}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-8">{pkg.desc}</p>
                  
                  <div className="space-y-4 mb-12 flex-1">
                    {pkg.features.map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm">
                        <Check size={16} className="text-green-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubmit(pkg.id)}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      pkg.recommended ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Select Package</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`flex items-center gap-2 ${step >= i ? 'text-purple-400' : 'text-gray-600'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${
                step === i ? 'border-purple-500 bg-purple-500/10' : 
                step > i ? 'border-purple-500 bg-purple-500 text-black' : 'border-gray-700'
              }`}>
                {step > i ? <Check size={16} /> : i}
              </div>
              <span className="hidden md:block text-xs font-bold uppercase tracking-widest">
                {['Identity', 'Pains', 'Vision', 'Intel', 'Package'][i-1]}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            animate={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          {renderStep()}

          {step < 5 && (
            <div className="flex justify-between mt-12 pt-8 border-t border-[#2a2a2a]">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 py-3 text-gray-400 font-bold hover:text-white disabled:opacity-0 flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                <span>Back</span>
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
