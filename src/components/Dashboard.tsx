import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, PenTool, ClipboardList, Lightbulb, MessageSquare, 
  Zap, Clock, FileText, TrendingUp, Sparkles, Send, CheckCircle2, 
  Circle, ChevronRight, Plus, History, Bot, User, Trash2
} from 'lucide-react';
import { ClientData, ReportData } from '../types';
import { db, collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDocs, setDoc } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { generateContent, generateInsights, chatWithAI } from '../services/gemini';

interface DashboardProps {
  clientData: ClientData;
}

export const Dashboard: React.FC<DashboardProps> = ({ clientData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'tasks' | 'insights' | 'support'>('overview');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    // Store clientId in localStorage as requested
    localStorage.setItem('clientId', clientData.uid);

    // Fetch report data to parse roadmap
    const q = query(collection(db, 'reports'), where('clientId', '==', clientData.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setReport(snapshot.docs[0].data().reportData);
      }
    });
    return () => unsubscribe();
  }, [clientData.uid]);

  const calculateScore = () => {
    const ppCount = clientData.painPoints?.length || 0;
    const budgetScore = Math.min(30, (clientData.budget / 10000) * 30); // Max 30 points for budget
    const goalScore = clientData.primaryGoal ? 20 : 0; // 20 points for goal clarity
    const baseScore = Math.min(50, ppCount * 10); // Max 50 points for pain points
    return Math.round(baseScore + budgetScore + goalScore);
  };

  const automationScore = calculateScore();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'content', label: 'Content Lab', icon: PenTool },
    { id: 'tasks', label: 'Roadmap', icon: ClipboardList },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'support', label: 'AI Support', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === tab.id 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <Overview clientData={clientData} score={automationScore} />}
            {activeTab === 'content' && <ContentGenerator clientData={clientData} />}
            {activeTab === 'tasks' && <TaskTracker clientData={clientData} roadmap={report?.roadmap90Day} />}
            {activeTab === 'insights' && <InsightsFeed clientData={clientData} />}
            {activeTab === 'support' && <SupportChat clientData={clientData} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Sub-components ---

const Overview: React.FC<{ clientData: ClientData, score: number }> = ({ clientData, score }) => {
  const stats = [
    { label: 'Automation Score', value: score.toString(), icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active AI Tools', value: clientData.tools?.length || '5', icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Content Generated', value: '12', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Hours Saved', value: (score * 0.4).toFixed(1), icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-[#111111] border border-[#2a2a2a] rounded-2xl shadow-xl">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500" size={24} />
            Growth Trajectory
          </h3>
          <div className="h-64 flex items-end justify-between gap-4">
            {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="w-full bg-gradient-to-t from-purple-600 to-cyan-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-[10px] text-gray-600 font-bold">W{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="text-cyan-500" size={24} />
            Quick Actions
          </h3>
          <div className="space-y-4">
            {[
              "Generate Social Media Post",
              "Review Competitor Update",
              "Update Automation Roadmap",
              "Analyze New Market Gap"
            ].map((action, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-purple-500/50 transition-all group">
                <span className="font-medium text-gray-300 group-hover:text-white">{action}</span>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-purple-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentGenerator: React.FC<{ clientData: ClientData }> = ({ clientData }) => {
  const [topic, setTopic] = useState(`AI Strategy for ${clientData.businessName} in ${clientData.location || 'London'}`);
  const [platforms, setPlatforms] = useState<string[]>(['LinkedIn']);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentContent, setCurrentContent] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'content'), where('clientId', '==', clientData.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
    });
    return () => unsubscribe();
  }, [clientData.uid]);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const content = await generateContent(
        clientData.industry, 
        clientData.businessName,
        topic,
        platforms
      );
      setCurrentContent(content);
      
      await addDoc(collection(db, 'content'), {
        clientId: clientData.uid,
        industry: clientData.industry,
        platforms,
        content,
        topic,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Content generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PenTool className="text-purple-500" size={24} />
            Content Lab
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Topic / Campaign</label>
              <input 
                type="text" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. New AI Product Launch"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {['LinkedIn', 'Twitter', 'Instagram', 'Email', 'Blog'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      platforms.includes(p) ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={generate}
              disabled={loading || !topic}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
              <span>Generate Content</span>
            </button>
          </div>
        </div>

        <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <History className="text-gray-500" size={20} />
            History
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => setCurrentContent(item.content)}
                className="w-full text-left p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-purple-500/30 transition-all"
              >
                <p className="text-sm font-bold truncate">{item.topic}</p>
                <p className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl min-h-[600px] flex flex-col">
          {currentContent ? (
            <div className="prose prose-invert max-w-none flex-1">
              <ReactMarkdown>{currentContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <PenTool size={64} />
              <p className="text-xl font-bold">Your generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskTracker: React.FC<{ clientData: ClientData, roadmap?: any }> = ({ clientData, roadmap }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const initializing = React.useRef(false);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('clientId', '==', clientData.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && roadmap && !initializing.current) {
        initializing.current = true;
        // Parse roadmap into tasks if none exist
        const initialTasks = [
          { title: roadmap.week1_4, phase: 'Phase 1: Foundation' },
          { title: roadmap.month2, phase: 'Phase 2: Integration' },
          { title: roadmap.month3, phase: 'Phase 3: Optimization' }
        ];
        
        try {
          for (const t of initialTasks) {
            await addDoc(collection(db, 'tasks'), {
              clientId: clientData.uid,
              title: t.title,
              phase: t.phase,
              completed: false,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error creating initial tasks:", error);
        } finally {
          initializing.current = false;
        }
      } else {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, [clientData.uid, roadmap]);

  const addTask = async () => {
    if (!newTask) return;
    await addDoc(collection(db, 'tasks'), {
      clientId: clientData.uid,
      title: newTask,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setNewTask('');
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await updateDoc(doc(db, 'tasks', id), { completed: !completed });
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <ClipboardList className="text-purple-500" size={24} />
          90-Day Roadmap Tasks
        </h3>
        
        <div className="flex gap-2 mb-8">
          <input 
            type="text" 
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Add a new automation milestone..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
          />
          <button
            onClick={addTask}
            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={`flex items-center justify-between p-4 bg-[#1a1a1a] border rounded-xl transition-all ${
                task.completed ? 'border-green-500/20 opacity-50' : 'border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <button onClick={() => toggleTask(task.id, task.completed)}>
                  {task.completed ? <CheckCircle2 className="text-green-500" size={20} /> : <Circle className="text-gray-600" size={20} />}
                </button>
                <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                  {task.title}
                </span>
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InsightsFeed: React.FC<{ clientData: ClientData }> = ({ clientData }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Check cache in Firebase
        const q = query(collection(db, 'insights_cache'), where('industry', '==', clientData.industry));
        const snapshot = await getDocs(q);
        
        let cachedData = null;
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          const createdAt = new Date(data.createdAt).getTime();
          const now = new Date().getTime();
          
          // Cache for 24 hours
          if (now - createdAt < 24 * 60 * 60 * 1000) {
            cachedData = data.insights;
          }
        }

        if (cachedData) {
          setInsights(cachedData);
        } else {
          // Generate new insights
          const newInsights = await generateInsights(clientData.industry);
          setInsights(newInsights);
          
          // Update cache
          await setDoc(doc(db, 'insights_cache', clientData.industry), {
            industry: clientData.industry,
            insights: newInsights,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [clientData.industry]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Lightbulb className="text-yellow-500" size={28} />
          Daily Intelligence Feed
        </h3>
        <div className="px-4 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20">
          Updated Daily
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-[#111111] border border-[#2a2a2a] rounded-3xl animate-pulse" />
          ))
        ) : (
          insights.map((insight, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="p-8 bg-[#111111] border border-[#2a2a2a] rounded-3xl shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 flex-shrink-0">
                  <Sparkles size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-lg text-gray-200 leading-relaxed font-medium">
                    {insight}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span>AI Insight</span>
                    <span>•</span>
                    <span>{clientData.industry}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const SupportChat: React.FC<{ clientData: ClientData }> = ({ clientData }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: `Hello! I'm your GeniuzLab AI Strategist. I've analyzed your business profile for ${clientData.businessName}. How can I help you with your automation strategy today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = `You are an AI automation consultant for ${clientData.businessName}, a ${clientData.industry} business in ${clientData.location || 'London'}. Their main pain points are ${clientData.painPoints.map(p => p.name).join(", ")}. Their 90-day goal is ${clientData.primaryGoal}. Answer all questions in context of their specific business.`;
      
      const content = await chatWithAI(
        systemPrompt,
        userMsg,
        messages.map(m => ({ role: m.role, text: m.text }))
      );
      setMessages(prev => [...prev, { role: 'bot', text: content }]);
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[700px] flex flex-col bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl">
      <div className="px-8 py-6 border-b border-[#2a2a2a] flex items-center justify-between bg-purple-900/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold">AI Strategist</h3>
            <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest">Always Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-cyan-600' : 'bg-purple-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-cyan-600/20 text-cyan-50 border border-cyan-600/30' : 'bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]'
              }`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about your AI strategy..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input}
            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
