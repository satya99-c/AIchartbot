import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, ServerOff, Code, Terminal, FileCode, Check, Copy, FileText, ChevronRight, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { SimulationConfig, ChatMessage } from '../types';
import { APIGEE_TEMPLATES } from './ApigeeTemplates';

interface DeveloperConsoleProps {
  simulationConfig: SimulationConfig;
  setSimulationConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  activeTrace: ChatMessage | null;
}

export default function DeveloperConsole({ simulationConfig, setSimulationConfig, activeTrace }: DeveloperConsoleProps) {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'trace' | 'policies' | 'source' | 'docs'>('trace');
  const [selectedPolicyIndex, setSelectedPolicyIndex] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Default trace logs for initial display
  const defaultLogs = [
    "[System Initialization] API Gateway Sandbox Online.",
    "[System Config] Listening on local address mapping: 0.0.0.0:3000",
    "[System Config] Gemini fallback initialized.",
    "[System Instruction] Standard chatbot widget mounted.",
    "[System Guide] Enter a message in the left-hand chatbot panel to trace a live payload here!"
  ];

  const currentLogs = activeTrace?.traceLogs || defaultLogs;
  const currentApigeeLogs = activeTrace?.apigeeTrace?.logs || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const handleToggle = (key: keyof SimulationConfig) => {
    setSimulationConfig((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper files for general developer instructions
  const deploymentDocs = `# GATEWAY DEPLOYMENT & TESTING MANUAL

## 1. Local Testing Commands (Curl & Postman)

### Test A: Check Mock Background Endpoints Direct
\`\`\`bash
# Test Core Details
curl -X GET http://localhost:3000/api/company-backend/details

# Test Company Services List
curl -X GET http://localhost:3000/api/company-backend/services

# Test General Fallback Query
curl -X POST http://localhost:3000/api/company-backend/query \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Who is Evelyn Sterling?"}'
\`\`\`

### Test B: Secure Handshake via Apigee Gateway Simulation
\`\`\`bash
# Query Details with correct API Key
curl -X GET http://localhost:3000/api/v1/company/details \\
  -H "x-api-key: vital-cb-sec-key-xyz123"

# Blocked request due to invalid API Key
curl -X GET http://localhost:3000/api/v1/company/details \\
  -H "x-api-key: INVALID_BAD_TOKEN"
\`\`\`

### Test C: Query the Node.js AI Chatbot Middleware Engine
\`\`\`bash
# Ask the chatbot a maritime query
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Check Vitality Sea position June 10"}'
\`\`\`

---

## 2. Google Cloud Run Deployment

To host your Middleware and protect corporate operational parameters behind serverless limits:

### Create Environment Secrets File
\`\`\`bash
# Create and write env variables securely
cat <<EOF > prod.env
GEMINI_API_KEY=YOUR_SECURE_GEMINI_API_KEY
APIGEE_API_KEY=vital-cb-sec-key-xyz123
APIGEE_BASE_URL=https://vitalitysoft-prod.apigee.net
NODE_ENV=production
EOF
\`\`\`

### Build and Deploy via gcloud CLI
\`\`\`bash
# Authenticate with Google Cloud
gcloud auth login

# Configure target project
gcloud config set project YOUR_GCP_PROJECT_ID

# Build container and push to Cloud Run
gcloud run deploy vitalitysoft-ai-middleware \\
  --source . \\
  --env-vars-file=prod.env \\
  --region=us-central1 \\
  --allow-unauthenticated \\
  --port=3000
\`\`\`

---

## 3. Apigee Proxy Setup Steps (Google Cloud Console)

### Step 1: Initialize New API Proxy
1. Open Google Cloud Console -> Search **Apigee**.
2. Select **API Proxies** -> Click **+ Create New**.
3. Choose **Reverse Proxy** -> Click **Next**.
4. Configure Proxy Settings:
   - **Proxy Name**: \`vessel-chatbot-api\`
   - **Base Path**: \`/v1/company\`
   - **Target Endpoint**: Enter your deployed Cloud Run URL suffix: e.g., \`https://vitalitysoft-backend-service-abc1234.a.run.app/api/company-backend\`
5. Confirm and click **Create**.

### Step 2: Policy Placement Locations
To enable security, apply policies into these specific phases under the **Develop** tab:

1. **Verify API Key Policy**:
   - Attach to **ProxyEndpoint -> PreFlow -> Request**.
   - Enforces key validation before any traffic reaches downstream lanes.

2. **Spike Arrest Policy**:
   - Attach to **ProxyEndpoint -> PreFlow -> Request** (directly *before* Verify API Key).
   - Deflects DDoS attacks before CPU-heavy authentication processes.

3. **Quota Policy**:
   - Attach to **ProxyEndpoint -> PreFlow -> Request** (directly *after* Verify API Key).
   - Accounts call counts and manages quota buckets linked to app keys.

4. **CORS Policy**:
   - Attach to **ProxyEndpoint -> PreFlow -> Request** and **ProxyEndpoint -> Flows (CORS-Preflight)**.
   - Inject headers permitting client website domains.

5. **Assign Message Policy (Telemetry Responses)**:
   - Attach to **ProxyEndpoint -> PostFlow -> Response**.
   - Injects custom tracing, transaction IDs, and quota headers back into chatbot headers.

6. **Raise Fault Policy**:
   - Attach to **FaultRules** or conditional steps in PreFlow/TargetEndpoint.
   - Standardizes response messages for revoked API keys.

---

## 4. Advanced: CI/CD Deployment with Apigee Maven Plugin

Deploying your proxy from source control via code-driven CI/CD:

\`\`\`bash
# 1. Clone proxy configurations structure
mkdir -p vessel-chatbot-api/apiproxy/{policies,proxies,targets}

# 2. Deploy bundle to Apigee environment using Maven
mvn clean install \\
  -Dorg=vitalitysoft-production \\
  -Denv=prod \\
  -Dtoken=$(gcloud auth print-access-token)
\`\`\`
`;

  return (
    <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden border-l border-slate-800 shadow-2xl">
      
      {/* Console Header Bar */}
      <div className="h-16 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-xs tracking-wide uppercase text-slate-200">Developer Control Tower</h3>
            <p className="text-[10px] text-slate-400">Security Sandbox Admin Panel</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px] font-semibold gap-1">
          <button
            onClick={() => setActiveConsoleTab('trace')}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${activeConsoleTab === 'trace' ? 'bg-indigo-605 text-white bg-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Trace Log
          </button>
          <button
            onClick={() => setActiveConsoleTab('policies')}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${activeConsoleTab === 'policies' ? 'bg-indigo-605 text-white bg-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Apigee Policies
          </button>
          <button
            onClick={() => setActiveConsoleTab('source')}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${activeConsoleTab === 'source' ? 'bg-indigo-60s text-white bg-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Source Files
          </button>
          <button
            onClick={() => setActiveConsoleTab('docs')}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${activeConsoleTab === 'docs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Deploy Docs
          </button>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* TAB 1: INTERACTIVE TRADING LOGS */}
        {activeConsoleTab === 'trace' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Quick Threat Simulators Controls */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 grid grid-cols-2 lg:grid-cols-5 gap-3.5 shrink-0 text-left">
              
              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide">Handshake Keys</span>
                <button
                  onClick={() => handleToggle('invalidKey')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-left cursor-pointer hover:border-slate-700 transition"
                >
                  <span className="text-[10px] truncate">Invalid Key</span>
                  {simulationConfig.invalidKey ? (
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full ring-4 ring-rose-500/20"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></span>
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide">Spike Arrest</span>
                <button
                  onClick={() => handleToggle('spikeArrest')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-left cursor-pointer hover:border-slate-700 transition"
                >
                  <span className="text-[10px] truncate">Force Spike</span>
                  {simulationConfig.spikeArrest ? (
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full ring-4 ring-rose-500/20"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></span>
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide">Monthly Quota</span>
                <button
                  onClick={() => handleToggle('quotaExceeded')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-left cursor-pointer hover:border-slate-700 transition"
                >
                  <span className="text-[10px] truncate">Exceed Quota</span>
                  {simulationConfig.quotaExceeded ? (
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full ring-4 ring-rose-500/20"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></span>
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide">Target Server</span>
                <button
                  onClick={() => handleToggle('backendDown')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-left cursor-pointer hover:border-slate-700 transition"
                >
                  <span className="text-[10px] truncate">Database Offline</span>
                  {simulationConfig.backendDown ? (
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full ring-4 ring-rose-500/20"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></span>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 col-span-2 lg:col-span-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide">AI Models Mode</span>
                <button
                  onClick={() => handleToggle('disableAIModel')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-left cursor-pointer hover:border-slate-700 transition"
                  title="Toggles Gemini AI synthesis off to force middleware keyword-matching fallback"
                >
                  <span className="text-[10px] truncate">Local Regex</span>
                  {simulationConfig.disableAIModel ? (
                    <span className="text-[9px] text-amber-500 font-bold uppercase">Active</span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-semibold">Inactive</span>
                  )}
                </button>
              </div>

            </div>

            {/* Layout divided in Visual Flow + Telemetry Logs */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Traffic Flow Pipeline Map */}
              <div className="w-full md:w-56 bg-slate-950 p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 text-left">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Interactive Proxy Blueprint</span>
                </h4>

                <div className="flex-1 flex flex-col justify-between py-2 text-[10px] space-y-4 font-mono relative">
                  {/* Visual Connection line */}
                  <div className="absolute top-4 bottom-4 left-3.5 w-[1px] bg-dashed bg-slate-800"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <span className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center font-bold text-blue-400">UI</span>
                    <div>
                      <span className="block font-semibold text-slate-200 text-[9px]">Frontend Widget</span>
                      <span className="text-[8px] text-slate-500">chatbot-widget.html</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                      activeTrace ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}>AI</span>
                    <div>
                      <span className="block font-semibold text-slate-200 text-[9px]">Node.js Middleware</span>
                      <span className="text-[8px] text-slate-500">POST /api/chat</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                      activeTrace?.apigeeStatus 
                        ? activeTrace?.apigeeStatus?.status === 200 
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                          : 'bg-rose-600/20 border-rose-500 text-rose-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}>APG</span>
                    <div>
                      <span className="block font-semibold text-slate-200 text-[9px]">Apigee API Proxy</span>
                      <span className="text-[8px] text-slate-500">v1/company/*</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                      activeTrace && !simulationConfig.backendDown ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}>DB</span>
                    <div>
                      <span className="block font-semibold text-slate-200 text-[9px]">Target Backend</span>
                      <span className="text-[8px] text-slate-500">company-backend/*</span>
                    </div>
                  </div>
                </div>

                {activeTrace && (
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1">
                    <div className="text-slate-400">Classified Intent:</div>
                    <div className="font-mono font-bold text-blue-400 uppercase">{activeTrace.intent}</div>
                    <div className="text-slate-400 mt-1">Confidence Score:</div>
                    <div className="font-mono text-emerald-400">{(activeTrace.confidence || 0 * 100).toFixed(0)}%</div>
                  </div>
                )}
              </div>

              {/* Glowing Console Output */}
              <div className="flex-1 bg-slate-900 overflow-y-auto p-4 flex flex-col font-mono text-xs text-left">
                
                {/* Simulated Apigee Trace Log */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Live Handshake System Stream</span>
                    </span>
                    <span className="text-[8px] text-slate-500">UTC REALTIME TELEMETRY</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    {currentLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 items-start leading-relaxed">
                        <span className="text-slate-600 leading-none select-none">{i+1}.</span>
                        <span className={
                          log.includes('[Middleware Error]') || log.includes('[Warning]') ? 'text-amber-400' :
                          log.includes('[CRITICAL') || log.includes('[Verify API Key Failed]') || log.includes('[Spike Arrest Violation]') ? 'text-rose-400' :
                          log.includes('[Target Success]') || log.includes('Gemini identified') ? 'text-emerald-400' :
                          'text-slate-300'
                        }>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* If there are specific Apigee simulator audit logs */}
                  {currentApigeeLogs && currentApigeeLogs.length > 0 && (
                    <div className="border-t border-slate-800 pt-3 mt-4 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-805 pb-1.5 mb-1.5 select-none text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                        <span>🛡️ Simulated Gateway Policies CheckLogs</span>
                        <span>APIGEE CONSOLE</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        {currentApigeeLogs.map((gLog, gIdx) => (
                          <div key={gIdx} className="flex gap-2 items-start">
                            <span className="text-slate-700 leading-none select-none">GW-{gIdx+1}.</span>
                            <span className={
                              gLog.includes('PASSED') || gLog.includes('Success') ? 'text-emerald-500' :
                              gLog.includes('Violation') || gLog.includes('Blocked') || gLog.includes('invalid') || gLog.includes('Limit exceeded') ? 'text-rose-400' : 
                              gLog.includes('TRIGGERED') ? 'text-amber-500' :
                              'text-slate-400 font-mono'
                            }>
                              {gLog}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Backend Raw Context Inspection */}
                  {activeTrace?.backendData && (
                    <div className="border-t border-slate-800 pt-3 mt-4 space-y-2">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        🔌 Contextual Database Records Fetched
                      </div>
                      <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] text-slate-300 border border-slate-805/40 overflow-x-auto leading-relaxed max-h-40">
                        {JSON.stringify(activeTrace.backendData, null, 2)}
                      </pre>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: APIGEE XML PLACEMENT */}
        {activeConsoleTab === 'policies' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Policies Selection Drawer Sidebar */}
            <div className="w-56 bg-slate-950 border-r border-slate-800 overflow-y-auto p-3 shrink-0 flex flex-col gap-2.5 text-left select-none">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide px-1.5 mb-1">
                Proxy Policy Flow
              </span>
              
              {APIGEE_TEMPLATES.map((policy, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPolicyIndex(idx)}
                  className={`w-full rounded-lg p-2.5 text-left cursor-pointer transition ${
                    selectedPolicyIndex === idx 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px] truncate">{policy.name}</div>
                  <div className={`text-[9px] mt-0.5 truncate ${selectedPolicyIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {policy.filename}
                  </div>
                </button>
              ))}
            </div>

            {/* XML Document Codebox Viewer */}
            <div className="flex-1 bg-slate-900 overflow-y-auto p-4 flex flex-col relative text-left">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 select-none">
                <div>
                  <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <FileCode className="w-4.5 h-4.5 text-blue-400" />
                    <span>{APIGEE_TEMPLATES[selectedPolicyIndex].name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {APIGEE_TEMPLATES[selectedPolicyIndex].purpose}
                  </p>
                </div>
                
                <button
                  onClick={() => handleCopy(APIGEE_TEMPLATES[selectedPolicyIndex].code, `policy-${selectedPolicyIndex}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText === `policy-${selectedPolicyIndex}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Bundle xml</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-blue-300 overflow-x-auto font-mono leading-relaxed flex-1">
                <code>{APIGEE_TEMPLATES[selectedPolicyIndex].code}</code>
              </pre>

              {/* Custom Blueprint Tip Box */}
              <div className="mt-4 bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-200">Recommended Placement:</span> Attach this XML declaration into your Apigee configurations. Ensure the corresponding policy file is correctly mapped in your proxy bundle under <code className="bg-slate-950 p-0.5 rounded text-blue-400">/apiproxy/policies/{APIGEE_TEMPLATES[selectedPolicyIndex].filename}</code>.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SOURCE FILES */}
        {activeConsoleTab === 'source' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* List source files */}
            <div className="w-56 bg-slate-950 border-r border-slate-800 overflow-y-auto p-3 shrink-0 flex flex-col gap-2 text-left select-none">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wide px-1.5 mb-1">
                Source Repositories
              </span>
              
              {APIGEE_TEMPLATES.filter(f => f.type === 'doc').map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPolicyIndex(APIGEE_TEMPLATES.findIndex(t => t.name === file.name))}
                  className={`w-full rounded-lg p-2.5 text-left cursor-pointer transition ${
                    APIGEE_TEMPLATES[selectedPolicyIndex].name === file.name 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px] truncate">{file.name}</div>
                  <div className={`text-[9px] mt-0.5 truncate ${APIGEE_TEMPLATES[selectedPolicyIndex].name === file.name ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {file.filename}
                  </div>
                </button>
              ))}
            </div>

            {/* Source Display */}
            <div className="flex-1 bg-slate-900 overflow-y-auto p-4 flex flex-col table-left text-left">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0 select-none">
                <div>
                  <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <Code className="w-4.5 h-4.5 text-blue-400" />
                    <span>{APIGEE_TEMPLATES[selectedPolicyIndex].name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{APIGEE_TEMPLATES[selectedPolicyIndex].purpose}</p>
                </div>
                
                <button
                  onClick={() => handleCopy(APIGEE_TEMPLATES[selectedPolicyIndex].code, `source-${selectedPolicyIndex}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText === `source-${selectedPolicyIndex}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Source content</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 overflow-x-auto font-mono leading-relaxed flex-1">
                <code>{APIGEE_TEMPLATES[selectedPolicyIndex].code}</code>
              </pre>

            </div>

          </div>
        )}

        {/* TAB 4: DEPLOYMENT COMMANDS DOCUMENTATION */}
        {activeConsoleTab === 'docs' && (
          <div className="flex-1 bg-slate-900 p-6 overflow-y-auto text-left relative flex flex-col">
            
            <div className="absolute top-4 right-4 shrink-0 select-none">
              <button
                onClick={() => handleCopy(deploymentDocs, 'deploy-docs')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedText === 'deploy-docs' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Documentation</span>
                  </>
                )}
              </button>
            </div>

            <article className="prose prose-invert prose-xs leading-relaxed max-w-full text-slate-300">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-2.5 mb-4 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-blue-400" />
                <span>Enterprise Architecture Deployment Manual</span>
              </h2>

              <div className="space-y-6 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                {deploymentDocs.replace(/#/g, '').replace(/`/g, '')}
              </div>
            </article>

          </div>
        )}

      </div>
    </div>
  );
}
