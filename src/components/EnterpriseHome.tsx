import React from 'react';
import { Shield, Sparkles, Server, ArrowDownRight, ArrowRight, LogIn, LogOut, User } from 'lucide-react';

interface EnterpriseHomeProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  onTriggerChat: () => void;
}

export default function EnterpriseHome({ isLoggedIn, setIsLoggedIn, onTriggerChat }: EnterpriseHomeProps) {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-y-auto">
      
      {/* Sleek Navigation Menu */}
      <nav className="w-full h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-sm text-slate-800 tracking-tight block">VitalitySoft</span>
            <span className="text-[9px] text-slate-400 font-mono -mt-0.5 block uppercase tracking-wider">Vessel GIS Sandbox Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="hidden lg:flex items-center gap-6 text-slate-500">
            <a href="#about" className="hover:text-indigo-600 transition tracking-tight">Overview</a>
            <a href="#services" className="hover:text-indigo-600 transition tracking-tight">Services Catalog</a>
            <a href="#architecture" className="hover:text-indigo-600 transition tracking-tight">Security Blueprint</a>
            <span className="h-4 w-[1px] bg-slate-200"></span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Systems Operational
            </span>
            <span className="h-4 w-[1px] bg-slate-200"></span>
          </div>

          {/* Authentic Session Control Action */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono text-[10px] shadow-2xs">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold sm:inline hidden">PEPAKAYALA_ANALYST</span>
                <span className="font-bold inline sm:hidden">PEPAKAYALA</span>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs select-none transition active:scale-95 cursor-pointer font-bold duration-150"
                id="btn-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoggedIn(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs select-none shadow-sm shadow-indigo-600/10 cursor-pointer active:scale-95 transition font-bold duration-150"
              id="btn-login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 space-y-12 pb-24 w-full">
        
        {/* Sleek Hero Banner Frame */}
        <section className="bg-white rounded-2xl p-8 md:p-10 text-slate-800 relative overflow-hidden shadow-sm border border-slate-200">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-70"></div>
          
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono">
              Apigee Maritime Cluster: maps.vitalitysoft.com
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-800 leading-tight">
              Vessel Telemetry AI Chatbot Gateway
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
              Query active satellite-AIS tracking records, fleet metrics, and corporate details behind fully secure Apigee proxies. Authenticate client-side sessions, monitor API thresholds, and track voyages in real-time.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={onTriggerChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-lg shadow-md shadow-indigo-600/10 cursor-pointer transition flex items-center gap-2"
              >
                <span>Launch virtual chatbot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="#services"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-3 rounded-lg transition flex items-center gap-1.5 border border-slate-200"
              >
                <span>Browse our portfolio</span>
              </a>
            </div>
          </div>
        </section>

        {/* Floating Interactive Callout Box */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4 shadow-xs">
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-display">Sandbox Interactive Instructions</h4>
            <p className="text-xs text-indigo-700/90 leading-relaxed">
              We have integrated VitalitySoft's Vessel Intelligence chatbot directly on this page. Toggle Apigee quota settings, API key models, or backend database simulators in the <b>Developer Control Tower</b> on the right, and use the floating chat widget to safely query private ship GPS histories, speeds, and fleet statuses.
            </p>
          </div>
        </div>

        {/* Core Pillars Grid */}
        <section id="services" className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-indigo-600" />
                <span>Architecture Blueprint Nodes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Enforcing strict governance layers across standard secure client pathways.</p>
            </div>
            <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              4 Active Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs space-y-3 hover:border-indigo-400 hover:shadow-xs transition">
              <div className="p-3 w-12 h-12 bg-slate-50 text-indigo-600 rounded-lg flex items-center justify-center border border-slate-200">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-bold text-slate-800">1. Apigee Gateway Proxy</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                PreFlow security policies including complete Client Key validations, CORS header configurations, Spike Arrest monitors, and customized error payload controllers.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs space-y-3 hover:border-indigo-400 hover:shadow-xs transition">
              <div className="p-3 w-12 h-12 bg-slate-50 text-indigo-600 rounded-lg flex items-center justify-center border border-slate-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-bold text-slate-800">2. Secure Node.js Middleware</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our lightweight AI controller executes text processing on Cloud Run environment instances, fully keeping Google API Credentials hidden from downstream browser access.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs space-y-3 hover:border-indigo-400 hover:shadow-xs transition">
              <div className="p-3 w-12 h-12 bg-slate-50 text-indigo-600 rounded-lg flex items-center justify-center border border-slate-200">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-bold text-slate-800">3. Protected ERP Backend</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Secured backend ERP directory storing database queries, service records, opening times, support desks, and returning localized answers.
              </p>
            </div>

          </div>
        </section>

        {/* Corporate Trust KPIs */}
        <section className="bg-white rounded-xl p-6 text-center grid grid-cols-3 gap-6 border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <span className="block text-2xl font-display font-bold text-slate-800 tracking-tight">45M+</span>
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Requests Handled</span>
          </div>
          <div className="space-y-1 border-x border-slate-200/80">
            <span className="block text-2xl font-display font-bold text-indigo-600 tracking-tight">&lt; 30ms</span>
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Apigee Latency</span>
          </div>
          <div className="space-y-1">
            <span className="block text-2xl font-display font-bold text-emerald-600 tracking-tight">100%</span>
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">SOC-2 Certified</span>
          </div>
        </section>

      </main>

      {/* Corporate Footer */}
      <footer className="w-full h-14 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[11px] text-slate-400 mt-auto">
        <p>© 2026 VitalitySoft Maritime Solutions. All rights reserved.</p>
        <p className="flex items-center gap-1 font-mono uppercase text-[9px] tracking-wider text-slate-400">
          <span>Enterprise Secure Sandbox v1.0.4</span>
        </p>
      </footer>

    </div>
  );
}

