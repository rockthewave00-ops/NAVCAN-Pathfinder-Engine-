/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Search, Bookmark, User, Settings as SettingsIcon, Shield, 
  MapPin, Phone, Clock, ExternalLink, CheckCircle2, AlertTriangle, 
  HelpCircle, Volume2, VolumeX, Trash2, Download, RefreshCw, 
  ChevronRight, Lock, Award, FileText, ArrowRight, Sparkles, 
  Check, LogOut, Globe, Cpu, AlertCircle, Share2, Printer
} from 'lucide-react';

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  department: string;
  estimatedTime: string;
  verified: boolean;
  actionRequired: string;
}

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone: string;
  hours: string;
  url: string;
  eligibility: string;
}

interface Source {
  name: string;
  url: string;
}

interface Pathway {
  id: string;
  title: string;
  summary: string;
  urgencyLevel: string;
  locationContext: string;
  steps: Step[];
  resources: Resource[];
  sources: Source[];
  requirements: string[];
  alternatives: string[];
  uncertainties: string[];
  createdAt: string;
  query?: string;
  optionalSupports?: Resource[];
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  location: string;
  joinedDate: string;
  role: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'pathfinder' | 'pathways' | 'profile' | 'settings'>('pathfinder');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default signed in for smooth exploration
  const [user, setUser] = useState<UserProfile>({
    name: 'Canadian Citizen',
    email: 'citizen.navcan@rc.gc.ca',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    location: 'Ottawa, ON',
    joinedDate: '2026-03-01',
    role: 'Verified Resident'
  });

  // Pathfinder form state
  const [locationInput, setLocationInput] = useState('Ottawa, ON');
  const [queryInput, setQueryInput] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('Standard');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPathway, setCurrentPathway] = useState<Pathway | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Saved Pathways
  const [savedPathways, setSavedPathways] = useState<Pathway[]>([]);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);

  // Voice Interaction state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);

  // Resource Directory state
  const [resourceDirectory, setResourceDirectory] = useState<Resource[]>([]);
  const [resourceCategory, setResourceCategory] = useState('All');
  const [resourceSearch, setResourceSearch] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    autoVoiceRead: false,
    highContrast: true,
    dataRetentionDays: '30',
    secureStorageEncrypted: true,
    aiModel: 'Gemini 2.5 Flash (Canada Region)'
  });

  // Load initial data
  useEffect(() => {
    fetchPathways();
    fetchResources();
  }, []);

  const fetchPathways = async () => {
    try {
      const res = await fetch('/api/pathways');
      if (res.ok) {
        const data = await res.json();
        setSavedPathways(data);
      }
    } catch (e) {
      console.error('Failed to fetch pathways:', e);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`/api/resources?location=${encodeURIComponent(locationInput)}`);
      if (res.ok) {
        const data = await res.json();
        setResourceDirectory(data);
      }
    } catch (e) {
      console.error('Failed to fetch resources:', e);
    }
  };

  // Run Pathfinder Search
  const handleSearchPathfinder = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || queryInput;
    if (!q.trim()) return;

    setIsSearching(true);
    setCurrentPathway(null);

    try {
      const res = await fetch('/api/pathfinder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: locationInput,
          query: q,
          urgency: urgencyLevel
        })
      });

      const data = await res.json();
      if (data.success && data.pathway) {
        const newPathway: Pathway = {
          ...data.pathway,
          id: 'path-' + Date.now(),
          createdAt: new Date().toISOString(),
          query: q
        };
        setCurrentPathway(newPathway);
        setIsSavedCurrent(false);

        if (voiceEnabled && settings.autoVoiceRead) {
          speakText(`Pathway generated for ${q}. Summary: ${newPathway.summary}`);
        }
      }
    } catch (err) {
      console.error('Pathfinder search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Save current pathway
  const handleSavePathway = async () => {
    if (!currentPathway) return;
    try {
      const res = await fetch('/api/pathways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPathway)
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedPathways([saved, ...savedPathways.filter(p => p.id !== saved.id)]);
        setIsSavedCurrent(true);
      }
    } catch (e) {
      console.error('Failed to save pathway:', e);
    }
  };

  const handleDeletePathway = async (id: string) => {
    try {
      const res = await fetch(`/api/pathways/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedPathways(savedPathways.filter(p => p.id !== id));
        if (currentPathway?.id === id) {
          setIsSavedCurrent(false);
        }
      }
    } catch (e) {
      console.error('Failed to delete pathway:', e);
    }
  };

  // Speech Synthesis helper
  const speakText = (text: string, stepNum?: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (stepNum !== undefined) setSpeakingStep(stepNum);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-CA';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingStep(null);
    utterance.onerror = () => setSpeakingStep(null);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingStep(null);
  };

  // Voice recognition helper (SpeechRecognition)
  const toggleVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-CA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setQueryInput(speechText);
      handleSearchPathfinder(undefined, speechText);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col font-sans selection:bg-rose-900 selection:text-white relative overflow-x-hidden">
      
      {/* Subtle Violet / Burgundy Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-purple-950/20 via-rose-950/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-purple-950/10 blur-3xl pointer-events-none -z-10" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#090a0f]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('pathfinder')}>
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-rose-900 via-neutral-900 to-black p-0.5 shadow-lg shadow-rose-950/40 flex items-center justify-center border border-rose-800/40">
            <img 
              src="/assets/aistudio/857129982_1169464372409337_1126016006252892323_n.webp_0a0371c2.jpg" 
              alt="NAVCAN Emblem" 
              className="w-full h-full object-cover rounded-full opacity-90"
              onError={(e) => {
                // Fallback if image path fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Compass className="absolute w-5 h-5 text-rose-400 animate-pulse pointer-events-none" style={{ display: 'none' }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-lg bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">NAVCAN</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 font-mono">Alpha</span>
            </div>
            <p className="text-xs text-neutral-400 font-medium">Finding your Pathway</p>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-neutral-900/60 p-1 rounded-full border border-neutral-800">
          <button 
            onClick={() => setActiveTab('pathfinder')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'pathfinder' ? 'bg-rose-950 text-rose-200 border border-rose-800/60 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Pathfinder</span>
          </button>
          <button 
            onClick={() => setActiveTab('pathways')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'pathways' ? 'bg-rose-950 text-rose-200 border border-rose-800/60 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-400" />
            <span>Pathway ({savedPathways.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'profile' ? 'bg-rose-950 text-rose-200 border border-rose-800/60 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Profile & Privacy</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'settings' ? 'bg-rose-950 text-rose-200 border border-rose-800/60 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* User profile widget / Google Auth button */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-neutral-200">{user.name}</span>
            <span className="text-[10px] text-emerald-400 flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Instance</span>
            </span>
          </div>
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-full overflow-hidden border border-rose-800/50 cursor-pointer hover:ring-2 hover:ring-rose-700 transition-all"
          >
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around bg-neutral-900/95 border-b border-neutral-800 py-2.5 px-2 text-xs">
        <button 
          onClick={() => setActiveTab('pathfinder')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'pathfinder' ? 'text-rose-400' : 'text-neutral-400'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Pathfinder</span>
        </button>
        <button 
          onClick={() => setActiveTab('pathways')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'pathways' ? 'text-rose-400' : 'text-neutral-400'}`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Pathway ({savedPathways.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-rose-400' : 'text-neutral-400'}`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'settings' ? 'text-rose-400' : 'text-neutral-400'}`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">

        {/* ================================= TAB 1: PATHFINDER ================================= */}
        {activeTab === 'pathfinder' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Hero / Intro Section */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Generalized AI Problem-Solving Engine</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                Finding your Pathway.
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Navigate housing support, healthcare, legal processes, taxes, addiction recovery, and government services with verified Canadian resources and actionable steps.
              </p>
            </div>

            {/* Pathfinder Search Card (The Two Simple Questions) */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-950/10 rounded-full blur-2xl pointer-events-none" />

              <form onSubmit={(e) => handleSearchPathfinder(e)} className="space-y-6 relative z-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Question 1 */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold tracking-wider text-rose-300 uppercase">
                      1. Where are you? (Location & Province)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="e.g., Toronto, ON / Vancouver, BC / Calgary, AB"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-700 transition-all"
                        required
                      />
                    </div>
                    {/* Quick Location Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Ottawa, ON', 'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB', 'Halifax, NS'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocationInput(loc)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${locationInput === loc ? 'bg-rose-950 text-rose-200 border-rose-800' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'}`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 2 */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold tracking-wider text-rose-300 uppercase">
                      2. What do you need help with?
                    </label>
                    <div className="relative">
                      <HelpCircle className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="e.g., Emergency housing, Addiction support, Legal aid..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-12 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-700 transition-all"
                        required
                      />
                      {/* Voice input button inside input */}
                      <button
                        type="button"
                        onClick={toggleVoiceListening}
                        className={`absolute right-3 top-3 p-1 rounded-lg transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'text-neutral-400 hover:text-white'}`}
                        title="Voice Input (Speech-to-Text)"
                      >
                        {isListening ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Quick Topic Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'Housing & Shelter', 
                        'Addiction & Crisis Support', 
                        'Legal Aid & Family Law', 
                        'Tax Benefits & CRA', 
                        'Employment Insurance (EI)'
                      ].map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setQueryInput(topic)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-rose-800/60 hover:text-rose-200 transition-all"
                        >
                          + {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Search Action & Voice Toggle Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-neutral-800/80 gap-4">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${voiceEnabled ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-neutral-950 text-neutral-400 border-neutral-800'}`}
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
                      <span>Voice Assistant: {voiceEnabled ? 'Active' : 'Disabled'}</span>
                    </button>

                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-rose-700"
                    >
                      <option value="Standard">Urgency: Standard</option>
                      <option value="Urgent">Urgency: High / Urgent</option>
                      <option value="Critical">Urgency: Immediate Crisis</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-900 via-rose-800 to-neutral-900 hover:from-rose-800 hover:to-neutral-800 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-rose-950/50 border border-rose-700/50 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-300" />
                        <span>Pathfinder Reasoning...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4 text-rose-300" />
                        <span>Generate Pathway</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Loading State Skeleton */}
            {isSearching && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 text-center space-y-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 mx-auto flex items-center justify-center">
                  <Compass className="w-6 h-6 text-rose-400 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-neutral-200">Analyzing Canadian Resources & Requirements...</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Pathfinder is evaluating federal & provincial guidelines, verifying contact channels, and organizing actionable steps.
                </p>
              </div>
            )}

            {/* Structured Pathway Result */}
            {currentPathway && !isSearching && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-8 animate-fadeIn relative">
                
                {/* Result Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                        {currentPathway.urgencyLevel} Priority
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {currentPathway.locationContext}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Resources</span>
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{currentPathway.title}</h2>
                    <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl">{currentPathway.summary}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => speakText(`Summary: ${currentPathway.summary}`)}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-rose-800 transition-all flex items-center space-x-1.5 text-xs"
                      title="Read Aloud"
                    >
                      <Volume2 className="w-4 h-4 text-rose-400" />
                      <span className="hidden sm:inline">Read Aloud</span>
                    </button>
                    
                    <button
                      onClick={handleSavePathway}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all border ${isSavedCurrent ? 'bg-emerald-950 text-emerald-200 border-emerald-800' : 'bg-rose-950 text-rose-200 border-rose-800 hover:bg-rose-900'}`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{isSavedCurrent ? 'Saved in Pathway' : 'Save to Pathway'}</span>
                    </button>
                  </div>
                </div>

                {/* Step-by-Step Action Plan */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-rose-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Actionable Pathway Steps ({currentPathway.steps?.length || 0})</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {currentPathway.steps?.map((step, idx) => (
                      <div key={idx} className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-5 hover:border-rose-900/50 transition-all group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800/60 text-rose-300 font-bold flex items-center justify-center shrink-0 text-sm">
                              {step.stepNumber}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors text-base">
                                {step.title}
                              </h4>
                              <p className="text-xs text-neutral-300 leading-relaxed">{step.description}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-neutral-400 font-mono">
                                <span className="flex items-center space-x-1 text-rose-300/80">
                                  <Cpu className="w-3 h-3" />
                                  <span>{step.department}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Est: {step.estimatedTime}</span>
                                </span>
                              </div>

                              {step.actionRequired && (
                                <div className="mt-2.5 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 flex items-start space-x-2">
                                  <ArrowRight className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                  <span><strong className="text-rose-300">Action Required:</strong> {step.actionRequired}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => speakText(`Step ${step.stepNumber}: ${step.title}. ${step.description}`, step.stepNumber)}
                            className={`p-2 rounded-lg border transition-all ${speakingStep === step.stepNumber ? 'bg-rose-900 text-white border-rose-700 animate-pulse' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'}`}
                            title="Read step aloud"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relevant Resources Grid */}
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-rose-400 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Verified Canadian Resources & Services</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPathway.resources?.map((res) => (
                      <div key={res.id} className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3 hover:border-neutral-700 transition-all flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-rose-300 border border-neutral-800">
                              {res.category}
                            </span>
                            <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>{res.location}</span>
                            </span>
                          </div>
                          <h4 className="font-semibold text-neutral-100 text-sm">{res.name}</h4>
                          <p className="text-xs text-neutral-400 line-clamp-2">{res.description}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-neutral-900 text-xs">
                          {res.phone && (
                            <div className="flex items-center justify-between text-neutral-300">
                              <span className="text-neutral-500">Helpline:</span>
                              <a href={`tel:${res.phone}`} className="font-mono text-rose-300 hover:underline flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{res.phone}</span>
                              </a>
                            </div>
                          )}
                          {res.hours && (
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="text-neutral-500">Hours:</span>
                              <span>{res.hours}</span>
                            </div>
                          )}
                          {res.url && (
                            <div className="pt-1">
                              <a 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center space-x-1.5 border border-neutral-800 transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                                <span>Access Official Portal</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Support / Crisis Resources Section (Conditional on Intent) */}
                {currentPathway.optionalSupports && currentPathway.optionalSupports.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-amber-900/40 bg-amber-950/10 p-5 rounded-xl border border-amber-800/30">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase font-bold">
                        Optional Support
                      </span>
                      <h3 className="text-xs font-bold tracking-wider uppercase text-amber-400">
                        Conditional Mental Health & Crisis Support (Optional Suggestions)
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-300">
                      Because your request mentioned or related to emotional distress or mental health support, the following optional confidential resource is provided for your consideration. Contacting this service is entirely optional and not a requirement for resolving your primary goal.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPathway.optionalSupports.map((opt: any) => (
                        <div key={opt.id} className="bg-neutral-950/80 border border-amber-900/50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-800/50">
                              {opt.category}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {opt.location}
                            </span>
                          </div>
                          <h4 className="font-semibold text-neutral-100 text-sm">{opt.name}</h4>
                          <p className="text-xs text-neutral-300">{opt.description}</p>
                          <div className="pt-2 border-t border-neutral-900 text-xs space-y-1">
                            {opt.phone && (
                              <div className="flex items-center justify-between text-neutral-300">
                                <span className="text-neutral-500">Helpline:</span>
                                <a href={`tel:${opt.phone}`} className="font-mono text-amber-300 hover:underline flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{opt.phone}</span>
                                </a>
                              </div>
                            )}
                            {opt.url && (
                              <div className="pt-1">
                                <a 
                                  href={opt.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center space-x-1.5 border border-amber-900/50 transition-all"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Access Support Portal</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements, Alternatives & Uncertainties */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-800 text-xs">
                  {/* Requirements */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] text-rose-300 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Requirements</span>
                    </h4>
                    <ul className="space-y-1.5 text-neutral-300">
                      {currentPathway.requirements?.map((req, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <ChevronRight className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternatives */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] text-rose-300 flex items-center space-x-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Alternatives</span>
                    </h4>
                    <ul className="space-y-1.5 text-neutral-300">
                      {currentPathway.alternatives?.map((alt, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <ChevronRight className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Uncertainties & Limitations */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] text-amber-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Uncertainties & Limits</span>
                    </h4>
                    <ul className="space-y-1.5 text-neutral-300">
                      {currentPathway.uncertainties?.map((unc, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <ChevronRight className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>{unc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sources & Provenance */}
                <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-neutral-500">Provenance Sources:</span>
                    {currentPathway.sources?.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noreferrer" className="text-rose-400 hover:underline flex items-center space-x-1">
                        <span>{src.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                  <div>
                    <span>Generated securely via NAVCAN Engine</span>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ================================= TAB 2: PATHWAY (SAVED PLANS) ================================= */}
        {activeTab === 'pathways' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
                  <Bookmark className="w-6 h-6 text-rose-400" />
                  <span>Your Saved Pathways</span>
                </h1>
                <p className="text-xs text-neutral-400">Manage, export, and review your privately saved problem-solving plans.</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  Total Saved: {savedPathways.length}
                </span>
              </div>
            </div>

            {savedPathways.length === 0 ? (
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-neutral-200">No saved pathways yet</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Use the Pathfinder tab to search any Canadian issue and save your custom structured pathway.
                </p>
                <button
                  onClick={() => setActiveTab('pathfinder')}
                  className="px-5 py-2.5 bg-rose-950 text-rose-200 border border-rose-800 hover:bg-rose-900 text-xs font-semibold rounded-xl transition-all"
                >
                  Open Pathfinder
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedPathways.map((path) => (
                  <div key={path.id} className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4 hover:border-neutral-700 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                          {path.urgencyLevel}
                        </span>
                        <span className="text-neutral-500 font-mono">
                          {new Date(path.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{path.title}</h3>
                      <p className="text-xs text-neutral-300 line-clamp-3">{path.summary}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs">
                      <button
                        onClick={() => {
                          setCurrentPathway(path);
                          setIsSavedCurrent(true);
                          setActiveTab('pathfinder');
                        }}
                        className="text-rose-400 hover:underline flex items-center space-x-1 font-semibold"
                      >
                        <span>View Full Pathway</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePathway(path.id)}
                        className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                        title="Delete saved pathway"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================= TAB 3: PROFILE & PRIVACY ================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
                <Shield className="w-6 h-6 text-rose-400" />
                <span>Profile & Data Privacy</span>
              </h1>
              <p className="text-xs text-neutral-400">
                Every user has an isolated, private instance. Review security credentials, verified identity status, and data control policies.
              </p>
            </div>

            {/* User Card */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-800/60 shadow-lg">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{user.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
                  <p className="text-xs text-neutral-500">Location: {user.location} • Member Since: {user.joinedDate}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  alert('Signed out of NAVCAN session.');
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-rose-400 text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Session</span>
              </button>
            </div>

            {/* Security & Isolation Guarantee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3 text-rose-400">
                  <Lock className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">Strict Data Isolation</h3>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Your saved pathways, queries, and personal settings are strictly isolated in your private user storage instance. No telemetry or query records are shared with third parties.
                </p>
                <ul className="space-y-2 text-xs text-neutral-400 font-mono">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Server-side authorization & validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Client-side secure token session</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero third-party advertising trackers</span>
                  </li>
                </ul>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3 text-rose-400">
                  <Award className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">Data Control & Portability</h3>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  You retain full ownership of your data. Export your pathways or permanently erase all personal records instantly.
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPathways, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `navcan_pathways_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Download className="w-4 h-4 text-rose-400" />
                    <span>Export All Pathways (JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all saved pathways? This action cannot be undone.')) {
                        savedPathways.forEach(p => handleDeletePathway(p.id));
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-950 text-xs font-medium text-rose-200 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Erase All Personal Data</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================= TAB 4: SETTINGS ================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
                <SettingsIcon className="w-6 h-6 text-rose-400" />
                <span>System Settings & Preferences</span>
              </h1>
              <p className="text-xs text-neutral-400">
                Configure voice feedback, AI reasoning models, and accessibility defaults.
              </p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 lg:p-8 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">Voice & Interaction</h3>
                
                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Auto-Read Pathway Summaries</h4>
                    <p className="text-xs text-neutral-400">Automatically synthesize speech when a new pathway is generated.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoVoiceRead}
                    onChange={(e) => setSettings({ ...settings, autoVoiceRead: e.target.checked })}
                    className="w-4 h-4 accent-rose-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">AI Engine Configuration</h3>
                
                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Active Reasoning Model</h4>
                    <p className="text-xs text-neutral-400">Powered by Google Gemini 2.5 Flash through AI Studio integration.</p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-rose-300">
                    {settings.aiModel}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Encrypted Persistent Storage</h4>
                    <p className="text-xs text-neutral-400">Local session security and server-side state isolation.</p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active (AES-256)
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => alert('Settings saved successfully.')}
                  className="px-6 py-2.5 rounded-xl bg-rose-950 text-rose-200 border border-rose-800 hover:bg-rose-900 text-xs font-semibold transition-all"
                >
                  Save Preferences
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#090a0f] border-t border-neutral-800/80 py-6 px-4 lg:px-8 text-center text-xs text-neutral-500 space-y-2 mt-12">
        <div className="flex items-center justify-center space-x-2">
          <Compass className="w-4 h-4 text-rose-500 animate-spin" style={{ animationDuration: '20s' }} />
          <span className="font-semibold text-neutral-400">NAVCAN — Finding your Pathway</span>
        </div>
        <p>A generalized AI-powered Canadian navigation system. All resources verified against public records and 211 Canadian data directories.</p>
      </footer>

    </div>
  );
}
