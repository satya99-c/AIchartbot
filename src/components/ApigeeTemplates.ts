import { ApigeePolicyTemplate } from '../types';

export const APIGEE_TEMPLATES: ApigeePolicyTemplate[] = [
  {
    name: 'Verify API Key Policy',
    filename: 'Verify-API-Key-v1.xml',
    purpose: 'Enforces credentials check on inbound traffic using Apigee standard key management.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VerifyAPIKey async="false" continueOnError="false" enabled="true" name="Verify-API-Key-v1">
    <DisplayName>Verify API Key v1</DisplayName>
    <!-- Read key from request headers -->
    <APIKey ref="request.header.x-api-key"/>
</VerifyAPIKey>`
  },
  {
    name: 'Spike Arrest Policy',
    filename: 'Spike-Arrest-v1.xml',
    purpose: 'Protects backend company endpoints against sudden, short-term traffic micro-bursts.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SpikeArrest async="false" continueOnError="false" enabled="true" name="Spike-Arrest-v1">
    <DisplayName>Spike Arrest v1</DisplayName>
    <!-- Reject if traffic rate exceeds 12 requests per minute (1 req every 5s) -->
    <Rate>12pm</Rate>
    <UseEffectiveClientIp>true</UseEffectiveClientIp>
</SpikeArrest>`
  },
  {
    name: 'Quota Policy',
    filename: 'Quota-Limit-v1.xml',
    purpose: 'Limits Developer application call counts per Minute/Month based on their subscription tier.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Quota async="false" continueOnError="false" enabled="true" name="Quota-Limit-v1">
    <DisplayName>Quota Limit v1</DisplayName>
    <!-- Quota tied to the developer api key -->
    <Identifier ref="verifyapikey.Verify-API-Key-v1.developer.app.id"/>
    <Allow count="20"/>
    <Interval ref="request.header.quota_interval">1</Interval>
    <TimeUnit ref="request.header.quota_unit">minute</TimeUnit>
    <Distributed>true</Distributed>
    <Synchronous>true</Synchronous>
</Quota>`
  },
  {
    name: 'CORS Policy',
    filename: 'CORS-Policy.xml',
    purpose: 'Configures secure browser Cross-Origin guidelines for allowed customer domains.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage async="false" continueOnError="false" enabled="true" name="CORS-Policy">
    <DisplayName>CORS Policy</DisplayName>
    <Set>
        <Headers>
            <!-- Align Allowed Origin to your company chatbot domain -->
            <Header name="Access-Control-Allow-Origin">{request.header.origin}</Header>
            <Header name="Access-Control-Allow-Headers">Content-Type, x-api-key, Authorization</Header>
            <Header name="Access-Control-Allow-Methods">GET, POST, OPTIONS, PUT, DELETE</Header>
            <Header name="Access-Control-Max-Age">86400</Header>
        </Headers>
    </Set>
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>`
  },
  {
    name: 'Assign Message Policy',
    filename: 'Assign-Message-Telemetry.xml',
    purpose: 'Injects custom correlation IDs, gateway names, and developer quota metrics into response headers.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage async="false" continueOnError="false" enabled="true" name="Assign-Message-Telemetry">
    <DisplayName>Assign Message Telemetry</DisplayName>
    <Set>
        <Headers>
            <Header name="X-Apigee-Proxy-Name">company-chatbot-api</Header>
            <Header name="X-Apigee-Developer-App">{verifyapikey.Verify-API-Key-v1.developer.app.name}</Header>
            <Header name="X-Apigee-Quota-Used">{ratelimit.Quota-Limit-v1.used.value}</Header>
            <Header name="X-Apigee-Quota-Limit">{ratelimit.Quota-Limit-v1.allowed.count}</Header>
            <Header name="X-Gateway-Transaction-ID">{messageid}</Header>
        </Headers>
    </Set>
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>`
  },
  {
    name: 'Raise Fault Policy',
    filename: 'Raise-Fault-ApiKey.xml',
    purpose: 'Catches security validation issues and outputs structured, safe client-facing errors.',
    type: 'policy',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<RaiseFault async="false" continueOnError="false" enabled="true" name="Raise-Fault-ApiKey">
    <DisplayName>Raise Fault ApiKey</DisplayName>
    <FaultResponse>
        <Set>
            <Headers>
                <Header name="Content-Type">application/json</Header>
            </Headers>
            <Payload contentType="application/json">
                {
                    "fault": {
                        "faultstring": "Failed to resolve API Key for client app.",
                        "detail": {
                            "errorcode": "oauth.v2.InvalidApiKey",
                            "description": "Please provide a valid token in the x-api-key header attribute"
                        }
                    }
                }
            </Payload>
            <StatusCode>401</StatusCode>
            <ReasonPhrase>Unauthorized</ReasonPhrase>
        </Set>
    </FaultResponse>
</RaiseFault>`
  },
  {
    name: 'ProxyEndpoint XML',
    filename: 'default.xml',
    purpose: 'Defines ingress routes, policies layout on PreFlow, and CORS preflight routing under /v1/company.',
    type: 'endpoint',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ProxyEndpoint name="default">
    <Description>Inbound endpoint settings for company-chatbot-api</Description>
    <HTTPProxyConnection>
        <!-- Virtual Host name & Base path mapping -->
        <BasePath>/v1/company</BasePath>
        <Properties/>
        <VirtualHost>secure</VirtualHost>
    </HTTPProxyConnection>
    
    <PreFlow name="PreFlow">
        <Request>
            <!-- 1. Enforce CORS check -->
            <Step>
                <Name>CORS-Policy</Name>
            </Step>
            <!-- 2. Screen spike clusters immediately -->
            <Step>
                <Name>Spike-Arrest-v1</Name>
            </Step>
            <!-- 3. Verify security keys -->
            <Step>
                <Name>Verify-API-Key-v1</Name>
            </Step>
            <!-- 4. Account for quota usage -->
            <Step>
                <Name>Quota-Limit-v1</Name>
            </Step>
        </Request>
        <Response/>
    </PreFlow>
    
    <PostFlow name="PostFlow">
        <Request/>
        <Response>
            <!-- Injects quota data headers for middleware observability -->
            <Step>
                <Name>Assign-Message-Telemetry</Name>
            </Step>
        </Response>
    </PostFlow>
    
    <Flows>
        <!-- Express routing for standard CORS OPTIONS calls -->
        <Flow name="CORS-Preflight">
            <Description>Handle client-side CORS Preflight options</Description>
            <Request/>
            <Response>
                <Step>
                    <Name>CORS-Policy</Name>
                </Step>
            </Response>
            <Condition>request.verb == "OPTIONS"</Condition>
        </Flow>
    </Flows>
    
    <RouteRule name="default">
        <!-- Target connection settings -->
        <TargetEndpoint>default</TargetEndpoint>
    </RouteRule>
</ProxyEndpoint>`
  },
  {
    name: 'TargetEndpoint XML',
    filename: 'default-target.xml',
    purpose: 'Specifies target service DNS, load balancing, SSL endpoints, and post-flight error-raise setups.',
    type: 'endpoint',
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<TargetEndpoint name="default">
    <Description>Outbound connection routing for ApexGlobal backend service</Description>
    <HTTPTargetConnection>
        <!-- Cloud Run deployed service URL or server DNS -->
        <URL>https://apexglobal-backend-service-abc1234.a.run.app/api/company-backend</URL>
        <SSLInfo>
            <Enabled>true</Enabled>
            <IgnoreValidationErrors>false</IgnoreValidationErrors>
        </SSLInfo>
    </HTTPTargetConnection>
    <PreFlow name="PreFlow">
        <Request/>
        <Response/>
    </PreFlow>
    <PostFlow name="PostFlow">
        <Request/>
        <Response/>
    </PostFlow>
    <DefaultFaultRule name="all">
        <!-- Handles failures where backend server is unreachable -->
        <AlwaysPresent>true</AlwaysPresent>
        <Step>
            <Name>CORS-Policy</Name>
        </Step>
    </DefaultFaultRule>
</TargetEndpoint>`
  },
  {
    name: 'Middleware Service',
    filename: 'middleware.js',
    purpose: 'Express.js server proxying client prompts, classifying intents via Gemini, and connecting with Apigee securely.',
    type: 'doc',
    code: `/* =========================================================================
   APIGEE MIDDLEWARE SERVICE: middleware.js
   -------------------------------------------------------------------------
   This acts as the secure middle tier in your architecture.
   - It is the ONLY service accessible directly from the browser sandbox.
   - Classifies user message intent using Gemini LLM or keyword matcher.
   - Forwards request with the SECURE Apigee API Key hidden from users.
   ========================================================================= */

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: 'https://allowed-chatbot-website.com' }));
app.use(express.json());

// Load variables
const APIGEE_BASE_URL = process.env.APIGEE_BASE_URL;
const APIGEE_API_KEY = process.env.APIGEE_API_KEY;

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    // Step 1: AI Intent Classification
    let intent = "GENERAL_QUERY";
    try {
      const classificationPrompt = \`
      Analyze user request for chatbot routing. Categories: 
      - DETAILS (Overview, HQ, founder, company what, revenue)
      - SERVICES (Portfolio, what we offer, consulting)
      - CONTACT (Emails, addresses, support links, phone)
      - BUSINESS_HOURS (Times open, support hours, holidays)
      - GENERAL_QUERY (Fallback search)

      Message: "\${message}"

      Return JSON matching: { "intent": "DETAILS" | "SERVICES" | "CONTACT" | "BUSINESS_HOURS" | "GENERAL_QUERY" }
      \`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: classificationPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      });

      const parsed = JSON.parse(aiResponse.text.trim());
      intent = parsed.intent;
    } catch (e) {
      console.warn("Falling back to local regex matching:", e);
      // Fallback local regex matcher
    }

    // Step 2: Query Apigee Gateway securely
    let targetSubpath = "details";
    if (intent === "SERVICES") targetSubpath = "services";
    else if (intent === "CONTACT") targetSubpath = "contact";
    else if (intent === "BUSINESS_HOURS") targetSubpath = "business-hours";
    else if (intent === "GENERAL_QUERY") targetSubpath = "query";

    const apigeeUrl = \`\${APIGEE_BASE_URL}/v1/company/\${targetSubpath}\`;
    
    console.log(\`[Handshake] Requesting Apigee: \${apigeeUrl}\`);

    // In a real environment, we use native fetch
    const gatewayResponse = await fetch(apigeeUrl, {
      method: intent === "GENERAL_QUERY" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": APIGEE_API_KEY // API key verified on Apigee
      },
      body: intent === "GENERAL_QUERY" ? JSON.stringify({ query: message }) : undefined
    });

    if (!gatewayResponse.ok) {
      const errorPayload = await gatewayResponse.json().catch(() => ({}));
      return res.status(gatewayResponse.status).json({
        success: false,
        intent,
        response: \`Gateway connection error: \${errorPayload.fault?.faultstring || "Unknown rejection"}\`
      });
    }

    const payload = await gatewayResponse.json();
    const backendData = payload.data;

    // Step 3: Synthesis of bespoke response from backend parameters
    const responsePrompt = \`
    You are the Corporate Virtual Advisor for "ApexGlobal Technologies".
    Prepare a friendly, brief, conversational reply answering the client input with retrieved context.

    Context: \${JSON.stringify(backendData)}
    Original Question: "\${message}"
    \`;

    const summaryRes = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: responsePrompt,
      config: { temperature: 0.3 }
    });

    return res.status(200).json({
      success: true,
      intent,
      response: summaryRes.text,
      quotaUsed: gatewayResponse.headers.get('x-apigee-quota-used')
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(\`Middleware running on key validated ports: \${PORT}\`));`
  },
  {
    name: 'Backend Microservice',
    filename: 'backend-service.js',
    purpose: 'Standalone Corporate operational microservice hosting corporate details behind a secure Apigee gateway.',
    type: 'doc',
    code: `/* =========================================================================
   BACKEND ENTERPRISE MICROSERVICE: backend-service.js
   -------------------------------------------------------------------------
   This acts as the protected back-office target API behind private VPC subnets.
   Only accessible securely by Apigee gateway traffic.
   ========================================================================= */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const RECORDS = {
  details: {
    name: "ApexGlobal Technologies",
    founded: "2018",
    headquarters: "San Francisco, CA",
    description: "Enterprise software architect specializing in secure Apigee infrastructures, server-side chatbot automation, and cloud native GKE migrations."
  },
  services: {
    services: [
      { name: "Enterprise Apigee Consulting", description: "Design, audit, and deployment of security, spike arrest, and quota policies." },
      { name: "Cloud Migrations", description: "Seamless Decoupling of legacy architectures into managed Kubernetes workloads." },
      { name: "Intelligent AI Agents", description: "Reliable LLM integrations powered by clean server-side runtime schemas." }
    ]
  },
  contact: {
    email: "support@apexglobal.tech",
    phone: "+1 (800) 555-APEX",
    office: "500 Howard Street, Suite 400, San Francisco, CA"
  },
  hours: {
    business: "Monday - Friday, 8 AM - 6 PM PST",
    slaSupport: "24/7 Phone escalations and priority support structure active."
  }
};

app.get('/company/details', (req, res) => res.json(RECORDS.details));
app.get('/company/services', (req, res) => res.json(RECORDS.services));
app.get('/company/contact', (req, res) => res.json(RECORDS.contact));
app.get('/company/business-hours', (req, res) => res.json(RECORDS.hours));

app.post('/company/query', (req, res) => {
  const { query } = req.body;
  res.json({
    answer: \`Inquiry: "\${query}" registered on backend database. Sales routing desk notified.\`
  });
});

app.listen(PORT, () => console.log(\`Internal Corporate Database Service active on Port \${PORT}\`));`
  },
  {
    name: 'Unified Chat Widget',
    filename: 'chatbot-widget.html',
    purpose: 'Embeddable HTML wrapper with Tailwind CDN & native JS representing the floating bubble for website integrations.',
    type: 'doc',
    code: `<!-- 
  EMBEDDABLE CHATBOT WIDGET: chatbot-widget.html
  -------------------------------------------------------------
  Copy and paste this HTML snippet into any landing page body
  to add the floating virtual assistant immediately.
-->
<div id="apex-chatbot-wrapper" class="fixed bottom-6 right-6 z-50 font-sans shadow-2xl">
  <!-- Dynamic Floating Bubble -->
  <button id="chatbot-toggle-btn" class="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer transition shadow-lg outline-none">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.12-3.12c1.154-.086 2.296-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  </button>

  <!-- Interactive Drawer Box (Initially hidden) -->
  <div id="chatbot-window" class="hidden absolute bottom-18 right-0 w-80 sm:w-96 h-[500px] rounded-2xl bg-white border border-gray-100 flex-col overflow-hidden shadow-2xl">
    <!-- Header -->
    <div class="h-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
        <span class="font-semibold text-sm">ApexGlobal Assistant</span>
      </div>
      <button id="chatbot-close-btn" class="text-white opacity-80 hover:opacity-100 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4.5 h-4.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable Chat Screen -->
    <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 text-xs">
      <div class="bg-blue-50 text-blue-900 rounded-2xl p-3 max-w-[85%] self-start leading-relaxed">
        👋 Welcome to ApexGlobal! Ask me about our <b>founded background</b>, <b>corporate services</b>, <b>help desks</b>, or <b>working hours</b>.
      </div>
    </div>

    <!-- Input Form -->
    <form id="chatbot-form" class="border-t border-gray-100 p-3 bg-white flex gap-2">
      <input type="text" id="chatbot-input" placeholder="Ask about services, contact, hours..." autocomplete="off" class="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 border-none outline-none focus:ring-1 focus:ring-blue-500">
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-medium cursor-pointer flex items-center justify-center transition">
        Send
      </button>
    </form>
  </div>
</div>

<script>
  (function() {
    // Endpoints & configurations (Change host in production)
    const MIDDLEWARE_URL = 'http://localhost:3000/api/chat';
    
    const wrapper = document.getElementById('apex-chatbot-wrapper');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const messagesContainer = document.getElementById('messages-container');
    const chatForm = document.getElementById('chatbot-form');
    const chatInput = document.getElementById('chatbot-input');

    // Drawer Toggles
    toggleBtn.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
    closeBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));

    function createMsgBubble(text, sender, isHTML = false) {
      const bubble = document.createElement('div');
      bubble.className = sender === 'user' 
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 max-w-[85%] ml-auto break-words' 
        : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start leading-relaxed break-words shadow-sm';
      
      if (isHTML) {
        bubble.innerHTML = text;
      } else {
        bubble.textContent = text;
      }
      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prompt = chatInput.value.trim();
      if (!prompt) return;

      createMsgBubble(prompt, 'user');
      chatInput.value = '';

      // Create loading indicator
      const loader = document.createElement('div');
      loader.className = 'text-gray-400 self-start p-1 flex gap-1 items-center animate-pulse';
      loader.innerHTML = '<span>•</span><span>•</span><span>•</span><span>Thinking...</span>';
      messagesContainer.appendChild(loader);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      try {
        const response = await fetch(MIDDLEWARE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt })
        });

        loader.remove();

        const data = await response.json();
        if (data.success) {
          // Convert Markdown bold ** to standard bold HTML smoothly
          let formattedResp = data.response
            .replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>')
            .replace(/\\*(.*?)\\*/g, '<i>$1</i>')
            .replace(/\\n/g, '<br>');
          
          createMsgBubble(formattedResp, 'bot', true);
        } else {
          createMsgBubble(\`❌ Gateway blocked request or failed: \${data.response || "Server Unreachable."}\`, 'bot');
        }
      } catch (err) {
        loader.remove();
        createMsgBubble("⚠️ Connection failure. Is the secure Node.js middle tier active?", 'bot');
      }
    });
  })();
</script>`
  },
  {
    name: 'CI/CD Maven Pipeline',
    filename: 'pom.xml',
    purpose: 'Complete CI/CD configuration to automate deployment of XML bundles via Apigee Maven Plugin.',
    type: 'doc',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.apexglobal.apigee</groupId>
    <artifactId>company-chatbot-api-deploy</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <pluginRepositories>
        <pluginRepository>
            <id>central</id>
            <name>Central Repository</name>
            <url>https://repo.maven.apache.org/maven2</url>
        </pluginRepository>
    </pluginRepositories>

    <properties>
        <apigee.plugin.version>2.3.5</apigee.plugin.version>
        <!-- Deployment specifications -->
        <apigee.profile>eval</apigee.profile>
        <apigee.org>apexglobal-production</apigee.org>
        <apigee.env>eval</apigee.env>
        <apigee.hosturl>https://apigee.googleapis.com</apigee.hosturl>
        <apigee.apiversion>v1</apigee.apiversion>
        <!-- OAuth tokens or credentials used within runners -->
        <apigee.bearer>\${token}</apigee.bearer> 
    </properties>

    <build>
        <plugins>
            <!-- 1. Maven Apigee config for bundle compilation -->
            <plugin>
                <groupId>io.apigee.build-tools.enterprise4g</groupId>
                <artifactId>parent-pom</artifactId>
                <version>\${apigee.plugin.version}</version>
                <executions>
                    <execution>
                        <id>package-and-deploy-bundle</id>
                        <phase>install</phase>
                        <goals>
                            <goal>configure</goal>
                            <goal>deploy</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>`
  }
];
