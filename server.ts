import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Set up secure API key variables for the simulator
const APIGEE_API_KEY_EXPECTED = process.env.APIGEE_API_KEY || "apex-cb-sec-key-xyz123";

// --- SYSTEM STATE FOR APIGEE SIMULATOR ---
// In-memory buckets for tracking simulated spike arrest and quotas
const spikeTimestamps: number[] = [];
const quotaCounters = {
  used: 0,
  limit: 20, // 20 requests allowed per window
  resetTime: Date.now() + 60 * 1000, // 1-minute tracking window
};

function getIP(req: express.Request) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
}

// Helper to clean up arrays and check rate-limiting
function checkSpikeArrest(req: express.Request): { passed: boolean; rate: number } {
  const now = Date.now();
  // We define Spike Arrest as max 3 requests per 5 seconds
  // Remove logs older than 5 seconds
  while (spikeTimestamps.length > 0 && spikeTimestamps[0] < now - 5000) {
    spikeTimestamps.shift();
  }
  
  if (spikeTimestamps.length >= 3) {
    return { passed: false, rate: spikeTimestamps.length };
  }
  
  spikeTimestamps.push(now);
  return { passed: true, rate: spikeTimestamps.length };
}

function checkQuota(): { passed: boolean; used: number; max: number } {
  const now = Date.now();
  if (now > quotaCounters.resetTime) {
    quotaCounters.used = 0;
    quotaCounters.resetTime = now + 60 * 1000;
  }
  
  if (quotaCounters.used >= quotaCounters.limit) {
    return { passed: false, used: quotaCounters.used, max: quotaCounters.limit };
  }
  
  quotaCounters.used++;
  return { passed: true, used: quotaCounters.used, max: quotaCounters.limit };
}

// --- INITIALIZE REAL-TIME SERVER-SIDES GEMINI CLIENT ---
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("🚀 Server-side Gemini API Client successfully initialized.");
  } catch (error) {
    console.warn("⚠️ Failed to initialize Gemini API Client. Running regex fallbacks.", error);
  }
} else {
  console.log("ℹ️ No GEMINI_API_KEY detected. AI middleware will utilize high-fidelity local keyword classification fallbacks.");
}

// --- 3. BACKEND COMPANY SERVICE ENDPOINTS ---
// (Simulated to represent internal corporate resources behind firewalls)
const COMPANY_DATABASE = {
  details: {
    name: "VitalitySoft Maritime Solutions",
    slogan: "Next-Generation Vessel Tracking & Fleet Intelligence",
    industry: "Maritime Software Systems & Geospatial GIS Platforms",
    description: "VitalitySoft is an enterprise maritime GIS solutions provider. Our flagship tracking hub, accessible at maps.vitalitysoft.com, tracks active global fleets using high-frequency satellite Automatic Identification Systems (S-AIS), advanced geospatial rendering, and secure telemetry APIs under robust cybersecurity governance.",
    founded: "2020",
    founder: "Evelyn Sterling",
    headquarters: "San Francisco, CA (Maritime Hub Division)",
    revenue: "$45M ARR",
    employeesCount: "250+ Engineers and Maritime Data Architects"
  },
  services: {
    title: "VitalitySoft Maritime Solutions Portfolio",
    services: [
      {
        id: "svc-01",
        name: "Satellite AIS Fleet Tracking & Geofencing",
        category: "Visual Navigation",
        description: "Enables sub-second updates on vessel bearing, dead-reckoning vectors, zone transgression triggers, and precise historical coordinate trace routes."
      },
      {
        id: "svc-02",
        name: "Secure Apigee API Gateway Integration",
        category: "Enterprise Security",
        description: "Fully authorizes client portals accessing high-frequency boat tracking data. Injects Spike Arrest mitigations and granular subscription quotas to protect high-volume telemetry feeds."
      },
      {
        id: "svc-03",
        name: "Maritime Route Analytics & Fuel Efficiency",
        category: "Operations Analytics",
        description: "Evaluates historic weather corridors against log speeds and fuel burnt, producing predictive machine-learning routes for commercial shippers."
      },
      {
        id: "svc-04",
        name: "Custom GIS Application Development",
        category: "Software Development",
        description: "Tailored Mapbox, Leaflet, and standard geospatial tilesets with robust offline capability for deep-sea bridge navigation displays."
      }
    ]
  },
  contact: {
    officeName: "VitalitySoft Maritime Solutions Headquarters",
    email: "ops@vitalitysoft.com",
    phone: "+1 (800) 555-VITAL",
    address: "Pier 17, Maritime Technology Suite, San Francisco, CA 94111",
    salesDesk: "sales@vitalitysoft.com",
    supportDesk: "https://support.vitalitysoft.com",
    escalationContact: "escalations@vitalitysoft.com",
    whatsApp: "+91 8309616999 (Vessel Alerts Broadcast Channel)"
  },
  businessHours: {
    timeZone: "America/Los_Angeles (PST/PDT)",
    normalHours: "Monday - Friday, 8:00 AM - 6:00 PM PST",
    salesHours: "Monday - Friday, 9:00 AM - 5:00 PM PST",
    supportAvailability: "24/7/365 global email and dedicated phone hotline support for active vessel emergency operations.",
    holidayCoverage: "Standard international maritime holidays are covered by active secondary emergency standby engineers."
  }
};

// --- DATASET: VESSEL HISTORY RECORD DATABASE ---
// Tracks historical vessel coordinate indices to feed maps.vitalitysoft.com interface queries.
const VESSEL_DATABASE = [
  {
    name: "Vitality Sea",
    imo: "IMO 9876543",
    type: "Crude Oil Tanker",
    flag: "Panama",
    built: 2021,
    status: "Underway Using Engine",
    speed: "14.2 knots",
    destination: "Rotterdam",
    eta: "2026-06-20T18:00:00Z",
    records: [
      { date: "2026-06-10", latitude: "51.892° N", longitude: "4.312° E", speed: "14.5 knots", status: "Voyage normal", fuelCons: "42 tons/day" },
      { date: "2026-06-11", latitude: "51.120° N", longitude: "3.220° E", speed: "14.0 knots", status: "Passing English Channel", fuelCons: "40 tons/day" },
      { date: "2025-06-12", latitude: "49.560° N", longitude: "-4.510° W", speed: "13.9 knots", status: "Leaving Celtic Sea", fuelCons: "39 tons/day" },
      { date: "2026-06-12", latitude: "49.560° N", longitude: "-4.510° W", speed: "13.9 knots", status: "Leaving Celtic Sea", fuelCons: "33 tons/day" },
      { date: "2026-06-13", latitude: "46.210° N", longitude: "-8.110° W", speed: "14.4 knots", status: "Crossing Bay of Biscay", fuelCons: "43 tons/day" },
      { date: "2026-06-14", latitude: "42.110° N", longitude: "-10.050° W", speed: "14.2 knots", status: "Off Coast of Galicia", fuelCons: "41 tons/day" },
      { date: "2026-06-15", latitude: "37.540° N", longitude: "-12.210° W", speed: "14.2 knots", status: "Navigating near Atlantic Ridge", fuelCons: "41 tons/day" }
    ]
  },
  {
    name: "Ocean Navigator",
    imo: "IMO 9422019",
    type: "Container Ship",
    flag: "Singapore",
    built: 2018,
    status: "Moored",
    speed: "0.2 knots",
    destination: "Port of Singapore",
    eta: "Arrived",
    records: [
      { date: "2026-06-10", latitude: "1.265° N", longitude: "103.812° E", speed: "0.1 knots", status: "At anchorage", fuelCons: "4.2 tons/day" },
      { date: "2026-06-11", latitude: "1.264° N", longitude: "103.811° E", speed: "0.0 knots", status: "At anchorage", fuelCons: "4.1 tons/day" },
      { date: "2026-06-12", latitude: "1.265° N", longitude: "103.832° E", speed: "0.2 knots", status: "Docking procedures", fuelCons: "6.0 tons/day" },
      { date: "2026-06-13", latitude: "1.268° N", longitude: "103.840° E", speed: "0.0 knots", status: "Moored at Berth 5", fuelCons: "3.5 tons/day" },
      { date: "2026-06-14", latitude: "1.268° N", longitude: "103.840° E", speed: "0.0 knots", status: "Moored at Berth 5", fuelCons: "3.5 tons/day" },
      { date: "2026-06-15", latitude: "1.268° N", longitude: "103.840° E", speed: "0.0 knots", status: "Moored at Berth 5 (Unloading)", fuelCons: "3.5 tons/day" }
    ]
  },
  {
    name: "Galleon Star",
    imo: "IMO 9583112",
    type: "Bulk Carrier",
    flag: "Marshall Islands",
    built: 2019,
    status: "Underway Using Engine",
    speed: "12.8 knots",
    destination: "Yokohama",
    eta: "2026-06-25T02:00:00Z",
    records: [
      { date: "2026-06-10", latitude: "34.120° N", longitude: "139.820° E", speed: "12.5 knots", status: "En route", fuelCons: "28 tons/day" },
      { date: "2026-06-11", latitude: "33.850° N", longitude: "142.110° E", speed: "12.7 knots", status: "En route", fuelCons: "28.5 tons/day" },
      { date: "2026-06-12", latitude: "32.550° N", longitude: "145.890° E", speed: "13.0 knots", status: "En route", fuelCons: "29 tons/day" },
      { date: "2026-06-13", latitude: "31.200° N", longitude: "148.550° E", speed: "12.9 knots", status: "Steady course", fuelCons: "28.8 tons/day" },
      { date: "2026-06-14", latitude: "30.010° N", longitude: "151.200° E", speed: "12.6 knots", status: "Steady course", fuelCons: "28.2 tons/day" },
      { date: "2026-06-15", latitude: "28.950° N", longitude: "154.210° E", speed: "12.8 knots", status: "Underway Yokohama line", fuelCons: "28.6 tons/day" }
    ]
  }
];

// Real backend endpoints (unprotected - only accessible within private system subnet)
app.get("/api/company-backend/details", (req, res) => {
  res.json(COMPANY_DATABASE.details);
});

app.get("/api/company-backend/services", (req, res) => {
  res.json(COMPANY_DATABASE.services);
});

app.get("/api/company-backend/contact", (req, res) => {
  res.json(COMPANY_DATABASE.contact);
});

app.get("/api/company-backend/business-hours", (req, res) => {
  res.json(COMPANY_DATABASE.businessHours);
});

app.post("/api/company-backend/query", (req, res) => {
  const { query } = req.body;
  const matchQuery = (query || "").toLowerCase();
  
  // Custom smart retrieval
  let contextSnippet = "";
  if (matchQuery.includes("ceo") || matchQuery.includes("sterling") || matchQuery.includes("founder")) {
    contextSnippet = `Our CEO and Founder is ${COMPANY_DATABASE.details.founder}. `;
  }
  if (matchQuery.includes("revenue") || matchQuery.includes("size") || matchQuery.includes("people")) {
    contextSnippet += `ApexGlobal is a hyper-growth enterprise of ${COMPANY_DATABASE.details.employeesCount} with ${COMPANY_DATABASE.details.revenue}. `;
  }
  
  res.json({
    queryReceived: query,
    contextSnippet: contextSnippet || "General Inquiry processed.",
    systemNotice: "Routed through generic business fallback route.",
    answer: `Thank you for consulting ApexGlobal. ${contextSnippet}Regarding your inquiry: "${query}", our representatives are ready to assist. Please email ${COMPANY_DATABASE.contact.salesDesk} for commercial proposals.`
  });
});

// --- 4. SIMULATED APIGEE GATEWAY PROXY ---
// Path: /api/v1/company/*
// Simulates CORS, Verify API Key, Spike Arrest, Quota, Assign Message HTTP response headers
app.all("/api/v1/company/*", (req, res) => {
  const apigeeLogs: string[] = [];
  const startTimestamp = Date.now();
  
  // Custom control headers to manipulate simulation from frontend
  const simulateError = req.headers["x-simulate-apigee-error"] as string || "";
  const apiKeyProvided = req.headers["x-api-key"] as string || req.query.apikey as string || "";
  
  apigeeLogs.push(`[Apigee Inbound] ${req.method} ${req.url}`);
  apigeeLogs.push(`[CORS Policy] Evaluating Origin Header... Origin allowed.`);
  
  // Add CORS headers to mimic CORS Policy
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("X-Apigee-Proxy-Name", "company-chatbot-api");
  res.setHeader("X-Apigee-Developer-App", "Chatbot-Widget-Prod");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // A. SPIKE ARREST POLICY Check
  if (simulateError === "spike_arrest") {
    apigeeLogs.push(`[Spike Arrest] TRIGGERED: Forced simulation fail.`);
    res.setHeader("X-Apigee-Fault-Code", "policies.ratelimit.SpikeArrestViolation");
    return res.status(429).json({
      fault: {
        faultstring: "Spike arrest limit exceeded",
        detail: {
          errorcode: "policies.ratelimit.SpikeArrestViolation",
          description: "Traffic spiked beyond configured limit of 2 requests per second. Policy active on PreFlow."
        }
      }
    });
  }

  const spikeCheck = checkSpikeArrest(req);
  apigeeLogs.push(`[Spike Arrest] Flow verification. Current rate: ${spikeCheck.rate}/sec. Spike Limit: 3req/5sec.`);
  if (!spikeCheck.passed) {
    apigeeLogs.push(`[Spike Arrest Violation] Rate safety boundary crossed! Blocked request.`);
    res.setHeader("X-Apigee-Fault-Code", "policies.ratelimit.SpikeArrestViolation");
    return res.status(429).json({
      fault: {
        faultstring: "Spike arrest limit exceeded",
        detail: {
          errorcode: "policies.ratelimit.SpikeArrestViolation",
          description: "Traffic spiked beyond target threshold. Under flow enforcement in PreFlow."
        }
      }
    });
  }

  // B. VERIFY API KEY POLICY Check
  apigeeLogs.push(`[Verify API Key] Verifying parameter 'x-api-key'. Key length: ${apiKeyProvided.length} characters.`);
  if (simulateError === "invalid_key" || apiKeyProvided !== APIGEE_API_KEY_EXPECTED) {
    apigeeLogs.push(`[Verify API Key Failed] Key is invalid or expired! Fault triggered.`);
    res.setHeader("X-Apigee-Fault-Code", "oauth.v2.InvalidApiKey");
    return res.status(401).json({
      fault: {
        faultstring: "Failed to resolve API Key for client app.",
        detail: {
          errorcode: "oauth.v2.InvalidApiKey",
          description: "VerifyApiKey policy enforced. Ensure 'x-api-key' header contains the correct deployment token."
        }
      }
    });
  }
  apigeeLogs.push(`[Verify API Key] MATCH: Resolved to Developer App 'ChatbotWidgetProduction'`);

  // C. QUOTA POLICY Check
  if (simulateError === "quota_exceeded") {
    apigeeLogs.push(`[Quota Policy] TRIGGERED: Forced simulation fail.`);
    res.setHeader("X-Apigee-Fault-Code", "policies.ratelimit.QuotaViolation");
    return res.status(429).json({
      fault: {
        faultstring: "Quota limit exceeded for developer application.",
        detail: {
          errorcode: "policies.ratelimit.QuotaViolation",
          description: "Monthly or Minute limit crossed. Configured: max 20 requests per key per minute."
        }
      }
    });
  }

  const quotaCheck = checkQuota();
  apigeeLogs.push(`[Quota Policy] Verification. Consumption: ${quotaCheck.used}/${quotaCheck.max} requests this minute.`);
  if (!quotaCheck.passed) {
    apigeeLogs.push(`[Quota Violation] Limit exceeded! Blocked request.`);
    res.setHeader("X-Apigee-Fault-Code", "policies.ratelimit.QuotaViolation");
    return res.status(429).json({
      fault: {
        faultstring: "Rate limit quota exceeded",
        detail: {
          errorcode: "policies.ratelimit.QuotaViolation",
          description: "Request count exceeded the assigned threshold of 20 requests/min. Contact admin for upgrade."
        }
      }
    });
  }

  // Simulating custom HTTP headers injection using ASSIGN MESSAGE policy in PostFlow
  res.setHeader("X-Apigee-Quota-Used", quotaCheck.used.toString());
  res.setHeader("X-Apigee-Quota-Limit", quotaCheck.max.toString());
  res.setHeader("X-Apigee-Response-Source", "ApigeeGateway_ClouRun_Target");

  // D. ROUTING TO TARGET ENDPOINT
  // Map Request sub-path to backend company API
  const subPath = req.params[0] || "";
  apigeeLogs.push(`[Target Endpoint] Routing request on TargetEndpoint 'CompanyBackendService' to URL: http://localhost:3000/api/company-backend/${subPath}`);

  if (simulateError === "backend_down") {
    apigeeLogs.push(`[Target Failure] Remote backend is unreachable or returning status 503.`);
    res.setHeader("X-Apigee-Fault-Code", "messaging.adaptors.http.flow.ServiceUnavailable");
    return res.status(503).json({
      fault: {
        faultstring: "The service is temporarily unavailable",
        detail: {
          errorcode: "messaging.adaptors.http.flow.ServiceUnavailable",
          description: "TargetEndpoint returned status 503. Raising Fault inside TargetEndpoint PostFlow."
        }
      }
    });
  }

  // Internal forwarding (no actual fetch dependency on outward ports, avoiding sandbox failures)
  let mockResponseData: any = {};
  if (subPath === "details") {
    mockResponseData = COMPANY_DATABASE.details;
  } else if (subPath === "services") {
    mockResponseData = COMPANY_DATABASE.services;
  } else if (subPath === "contact") {
    mockResponseData = COMPANY_DATABASE.contact;
  } else if (subPath === "business-hours") {
    mockResponseData = COMPANY_DATABASE.businessHours;
  } else if (subPath === "vessels") {
    // Process vessel queries (either via query parameters or POST body)
    const vesselName = (req.query.vessel || req.body.vesselName || req.body.vessel || "").toString().toLowerCase().trim();
    const startDate = (req.query.startDate || req.body.startDate || "").toString().trim();
    const endDate = (req.query.endDate || req.body.endDate || "").toString().trim();

    if (!vesselName) {
      mockResponseData = {
        error: "Vessel name is required. Please specify a valid vessel name (e.g., 'Vitality Sea').",
        availableVessels: VESSEL_DATABASE.map(v => v.name)
      };
    } else {
      const foundVessel = VESSEL_DATABASE.find(v => 
        v.name.toLowerCase().includes(vesselName) || vesselName.includes(v.name.toLowerCase())
      );
      if (foundVessel) {
        // Filter historical records if date identifiers are provided
        let records = foundVessel.records;
        if (startDate || endDate) {
          records = foundVessel.records.filter(r => {
            if (startDate && r.date < startDate) return false;
            if (endDate && r.date > endDate) return false;
            return true;
          });
        }
        mockResponseData = {
          vessel: foundVessel.name,
          imo: foundVessel.imo,
          type: foundVessel.type,
          flag: foundVessel.flag,
          built: foundVessel.built,
          status: foundVessel.status,
          speed: foundVessel.speed,
          destination: foundVessel.destination,
          eta: foundVessel.eta,
          recordsCount: records.length,
          requestedDateRange: { start: startDate || "all available", end: endDate || "all available" },
          records: records
        };
      } else {
        mockResponseData = {
          error: `Vessel '${vesselName}' could not be located in maps.vitalitysoft.com active telemetry database.`,
          availableVessels: VESSEL_DATABASE.map(v => v.name)
        };
      }
    }
  } else if (subPath === "query") {
    const { query } = req.body;
    const matchQuery = (query || "").toLowerCase();
    
    let contextSnippet = "";
    if (matchQuery.includes("ceo") || matchQuery.includes("sterling") || matchQuery.includes("founder")) {
      contextSnippet = `Our CEO and Founder is ${COMPANY_DATABASE.details.founder}. `;
    }
    if (matchQuery.includes("revenue") || matchQuery.includes("size") || matchQuery.includes("people")) {
      contextSnippet += `VitalitySoft is structured with ${COMPANY_DATABASE.details.employeesCount} operating with ${COMPANY_DATABASE.details.revenue}. `;
    }
    if (matchQuery.includes("vessel") || matchQuery.includes("boat") || matchQuery.includes("ship") || matchQuery.includes("track")) {
      contextSnippet += `We track active ocean fleets including Vitality Sea, Ocean Navigator, and Galleon Star with precision GPS histories on maps.vitalitysoft.com. `;
    }
    
    mockResponseData = {
      queryReceived: query,
      contextSnippet: contextSnippet,
      answer: `Thank you for contacting the VitalitySoft Support Desk regarding: "${query}". ${contextSnippet}Our maritime support representatives are on standby at ${COMPANY_DATABASE.contact.email} to assist.`
    };
  } else {
    apigeeLogs.push(`[Warning] No matching endpoint found for subpath: ${subPath}`);
    return res.status(404).json({ error: "Endpoint not found" });
  }

  const duration = Date.now() - startTimestamp;
  apigeeLogs.push(`[Target Success] Backend responded in ${duration}ms. Processing PostFlow.`);
  apigeeLogs.push(`[Apigee Outbound] Successfully added custom security audit and trace headers.`);

  return res.status(200).json({
    data: mockResponseData,
    _apigeeTrace: {
      timestamp: new Date().toISOString(),
      proxyName: "company-chatbot-api",
      basePath: "/v1/company",
      routeTarget: "CompanyBackendService",
      policiesExecuted: ["CORS-Policy-01", "VerifyApiKey-01", "SpikeArrest-01", "QuotaEnforcement-01", "HeadersInjection-01"],
      processDurationMs: duration,
      logs: apigeeLogs
    }
  });
});


// --- 5. MIDDLEWARE AI SERVICE ENDPOINT ---
// Path: /api/chat POST
// Handled by our Node.js Express AI Gateway Middleware. It acts as the orchestrator:
// 1. Receives chat text.
// 2. Uses Gemini (or regex fallback) to extract the context/intent.
// 3. Formulates a secure API header request and sends it to our Apigee Proxy layer.
// 4. Receives raw company structured metrics from Apigee.
// 5. Feeds backend metrics back into Gemini to write a bespoke conversational, professional reply!
app.post("/api/chat", async (req, res) => {
  const { message, simulateConfig = {}, isLoggedIn = false } = req.body;
  const traceLogs: string[] = [];
  const startMs = Date.now();

  try {
    if (!message) {
      return res.status(400).json({ error: "The 'message' parameter is required." });
    }

    traceLogs.push(`[Middleware Router] Received inbound user message: "${message}"`);

    // STEP 1: INTENT CLASSIFICATION AND PARAMETERS EXTRACTION (using Gemini or regex)
    let intent: "DETAILS" | "SERVICES" | "CONTACT" | "BUSINESS_HOURS" | "VESSEL_TRACK" | "GENERAL_QUERY" = "GENERAL_QUERY";
    let confidence = 1.0;
    let fallbackUsed = false;

    // Parameter extraction for vessel inquiries
    let extractedVessel = "";
    let extractedStart = "";
    let extractedEnd = "";

    const msgLower = message.toLowerCase();
    if (msgLower.includes("vitality") || msgLower.includes("sea")) {
      extractedVessel = "Vitality Sea";
    } else if (msgLower.includes("navigator") || msgLower.includes("ocean")) {
      extractedVessel = "Ocean Navigator";
    } else if (msgLower.includes("galleon") || msgLower.includes("star")) {
      extractedVessel = "Galleon Star";
    }

    // Try to extract dates of form June XX or 2026-06-XX
    const dateRegexes = [
      /\b(June\s+\d{1,2})\b/gi,
      /\b(Jun\s+\d{1,2})\b/gi,
      /\b(\d{4}-\d{2}-\d{2})\b/g,
      /\b(06-\d{2})\b/g
    ];

    const foundDates: string[] = [];
    for (const r of dateRegexes) {
      let match;
      while ((match = r.exec(message)) !== null) {
        foundDates.push(match[1]);
      }
    }

    const parseDateToISO = (dStr: string) => {
      if (!dStr) return "";
      const d = dStr.toLowerCase();
      if (d.includes("june") || d.includes("jun")) {
        const num = d.replace(/[^\d]/g, "");
        if (num) {
          const padded = num.padStart(2, "0");
          return `2026-06-${padded}`;
        }
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
        return dStr;
      }
      if (/^06-\d{2}$/.test(dStr)) {
        return `2026-06-${dStr.split("-")[1]}`;
      }
      return "";
    };

    if (foundDates.length > 0) {
      extractedStart = parseDateToISO(foundDates[0]);
      if (foundDates.length > 1) {
        extractedEnd = parseDateToISO(foundDates[1]);
      } else {
        extractedEnd = extractedStart; // Single day match
      }
    }

    if (ai) {
      traceLogs.push(`[Middleware AI Engine] Invoking Gemini model 'gemini-3.5-flash' for intent classification & parameters extraction...`);
      try {
        const classificationPrompt = `
        You are the Routing Classifier for the VitalitySoft Support Assistant (maps.vitalitysoft.com).
        Your task is to analyze the user inquiry and classify it into one of these 6 strict domains:
        
        - DETAILS (If the user asks about the company overview, background, history, founder, size, revenue, employees, headquarters, or "who is VitalitySoft")
        - SERVICES (If the user asks about products, GIS solutions, active tracking packages, geofencing offerings, consulting)
        - CONTACT (If the user asks about emails, customer support links, suites, office locations, phone lines)
        - BUSINESS_HOURS (If the user asks about opening hours, availability of operators, international holiday routines)
        - VESSEL_TRACK (If the user asks about tracking a specific ship, boat position, IMO detail, or coordinates. Active ships inside database are 'Vitality Sea', 'Ocean Navigator', and 'Galleon Star'. Users may query custom ranges such as 'June 10 to June 15')
        - GENERAL_QUERY (Anything else, or questions that require customized exploration)

        Analyze user inquiry: "${message}"

        Return exactly a JSON object matching this structure (do not append extra keys, do not wrap in markdown quotes except JSON):
        {
          "intent": "DETAILS" | "SERVICES" | "CONTACT" | "BUSINESS_HOURS" | "VESSEL_TRACK" | "GENERAL_QUERY",
          "confidence": 0.0 to 1.0,
          "extractedVessel": "Vitality Sea" | "Ocean Navigator" | "Galleon Star" | "",
          "extractedStartDate": "YYYY-MM-DD" | "",
          "extractedEndDate": "YYYY-MM-DD" | ""
        }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: classificationPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });

        const txt = response.text || "";
        const cleanJson = txt.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        
        intent = parsed.intent;
        confidence = parsed.confidence || 0.9;
        
        if (parsed.extractedVessel) extractedVessel = parsed.extractedVessel;
        if (parsed.extractedStartDate) extractedStart = parsed.extractedStartDate;
        if (parsed.extractedEndDate) extractedEnd = parsed.extractedEndDate;

        traceLogs.push(`[Middleware AI Engine] Gemini identified intent: ${intent} (Confidence: ${(confidence * 100).toFixed(1)}%). Parms: Vessel=${extractedVessel}, DateRange=${extractedStart || "Unspecified"} to ${extractedEnd || "Unspecified"}`);
      } catch (classifyErr) {
        traceLogs.push(`[Middleware Error] Gemini classification failed. Engaging local keyword matcher fallback.`);
        fallbackUsed = true;
      }
    } else {
      traceLogs.push(`[Middleware Local Router] Active. No API key provided for model, running keyword recognizer...`);
      fallbackUsed = true;
    }

    // High fidelity Keyword Recognizer Fallback
    if (fallbackUsed) {
      const u = message.toLowerCase();
      if (u.includes("sea") || u.includes("navigator") || u.includes("galleon") || u.includes("vessel") || u.includes("ship") || u.includes("track") || u.includes("imo") || u.includes("position") || u.includes("coordinate")) {
        intent = "VESSEL_TRACK";
      } else if (u.includes("what do you do") || u.includes("about") || u.includes("who is") || u.includes("company") || u.includes("founded") || u.includes("founder") || u.includes("revenue") || u.includes("details") || u.includes("overview") || u.includes("vitalitysoft")) {
        intent = "DETAILS";
      } else if (u.includes("services") || u.includes("products") || u.includes("do you offer") || u.includes("solutions") || u.includes("consulting") || u.includes("competencies") || u.includes("catalog") || u.includes("gis") || u.includes("map")) {
        intent = "SERVICES";
      } else if (u.includes("contact") || u.includes("email") || u.includes("phone") || u.includes("telephone") || u.includes("address") || u.includes("location") || u.includes("office") || u.includes("headquarters") || u.includes("support desk")) {
        intent = "CONTACT";
      } else if (u.includes("hours") || u.includes("open") || u.includes("close") || u.includes("schedule") || u.includes("time") || u.includes("working days") || u.includes("holidays")) {
        intent = "BUSINESS_HOURS";
      } else {
        intent = "GENERAL_QUERY";
      }
      traceLogs.push(`[Middleware Local Router] Keyword Match output: ${intent} (Confidence: 1.0 - Local Deterministic)`);
    }

    // SECURITY HANDSHAKE FOR SENSITIVE INTENTS (VESSEL METRICS REQUIRE LOGIN)
    if (intent === "VESSEL_TRACK" && !isLoggedIn) {
      traceLogs.push(`[Security Check] handcheck BLOCKED: intent "VESSEL_TRACK" requires verified login.`);
      return res.status(200).json({
        success: false,
        intent,
        confidence,
        response: "🔒 **Authentication Required**: Satellite AIS telemetry coordinates, historic ship tracks, speeds, and voyage fuel records on maps.vitalitysoft.com are restricted corporate assets. Please **Sign In** to maps.vitalitysoft.com using the login button in the top navigation or the portal inside the chat window to view live tracking data.",
        traceLogs,
        loginRequired: true,
        apigeeTrace: null,
        backendData: null
      });
    }

    // STEP 2: MAP INTENT TO APIGEE API GATEWAY CALL PATHS
    let apigeePath = "details";
    if (intent === "SERVICES") apigeePath = "services";
    else if (intent === "CONTACT") apigeePath = "contact";
    else if (intent === "BUSINESS_HOURS") apigeePath = "business-hours";
    else if (intent === "VESSEL_TRACK") apigeePath = "vessels";
    else if (intent === "GENERAL_QUERY") apigeePath = "query";

    traceLogs.push(`[Middleware Http] Dispatching API request to Apigee Proxy base route: /api/v1/company/${apigeePath}`);

    // Set up request to simulated Apigee Proxy endpoint
    // We send an internal virtual request to represent the API-to-API network traffic
    const headersToApigee: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": simulateConfig.invalidKey ? "INVALID_CLIENT_KEY_ABC" : APIGEE_API_KEY_EXPECTED,
    };

    if (simulateConfig.spikeArrest) {
      headersToApigee["x-simulate-apigee-error"] = "spike_arrest";
    } else if (simulateConfig.quotaExceeded) {
      headersToApigee["x-simulate-apigee-error"] = "quota_exceeded";
    } else if (simulateConfig.backendDown) {
      headersToApigee["x-simulate-apigee-error"] = "backend_down";
    }

    let apigeeSimulatorResult: { status: number; body: any; headers: any };

    const useRealApigee = process.env.APIGEE_BASE_URL && 
                         process.env.APIGEE_BASE_URL.startsWith("http") && 
                         !process.env.APIGEE_BASE_URL.includes("apexglobal-eval-prod.apigee.net");

    if (useRealApigee) {
      const targetUrl = process.env.APIGEE_BASE_URL.replace(/\/$/, "");
      traceLogs.push(`[Apigee Live] Forwarding request to LIVE Apigee Gateway URL: ${targetUrl}/${apigeePath}`);
      try {
        const method = (intent === "GENERAL_QUERY" || intent === "VESSEL_TRACK") ? "POST" : "GET";
        const requestBody = (method === "POST") ? JSON.stringify({
          query: message,
          vesselName: extractedVessel,
          startDate: extractedStart,
          endDate: extractedEnd
        }) : undefined;

        let queryParams = "";
        if (method === "GET" && (extractedVessel || extractedStart || extractedEnd)) {
          const params = new URLSearchParams();
          if (extractedVessel) params.append("vessel", extractedVessel);
          if (extractedStart) params.append("startDate", extractedStart);
          if (extractedEnd) params.append("endDate", extractedEnd);
          queryParams = `?${params.toString()}`;
        }

        const apigeeUrl = `${targetUrl}/${apigeePath}${queryParams}`;
        const response = await fetch(apigeeUrl, {
          method,
          headers: headersToApigee,
          body: requestBody
        });

        const respHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          respHeaders[key.toLowerCase()] = val;
        });

        const responseText = await response.text();
        let bodyParsed: any;
        try {
          bodyParsed = JSON.parse(responseText);
        } catch {
          bodyParsed = { rawResponse: responseText };
        }

        apigeeSimulatorResult = {
          status: response.status,
          body: bodyParsed,
          headers: respHeaders
        };
      } catch (err: any) {
        traceLogs.push(`[Apigee Live Action Failure] Error making fetch to real Apigee Gateway: ${err.message}`);
        apigeeSimulatorResult = {
          status: 502,
          body: {
            fault: {
              faultstring: `Unable to make request to live Apigee Gateway at ${process.env.APIGEE_BASE_URL}`,
              detail: {
                errorcode: "messaging.adaptors.http.flow.BadGateway",
                description: err.message
              }
            }
          },
          headers: {}
        };
      }
    } else {
      // Sub-invocation inside Node.js router to avoid external networking locks:
      // Create mock req & res to query our own endpoint safely, securing realistic payloads and telemetry!
      apigeeSimulatorResult = await new Promise<{ status: number; body: any; headers: any }>((resolve) => {
        let resolvedStatus = 200;
        let resolvedJson: any = null;
        const respHeaders: Record<string, string> = {};

        const mockReq = {
          method: (intent === "GENERAL_QUERY" || intent === "VESSEL_TRACK") ? "POST" : "GET",
          url: `/api/v1/company/${apigeePath}`,
          params: { 0: apigeePath },
          headers: headersToApigee,
          body: { 
            query: message,
            vesselName: extractedVessel,
            startDate: extractedStart,
            endDate: extractedEnd
          },
          query: {
            vessel: extractedVessel,
            startDate: extractedStart,
            endDate: extractedEnd
          },
          socket: { remoteAddress: getIP(req) }
        } as any;

        const mockRes = {
          status(code: number) {
            resolvedStatus = code;
            return this;
          },
          json(data: any) {
            resolvedJson = data;
            return this;
          },
          setHeader(name: string, value: string) {
            respHeaders[name.toLowerCase()] = value;
            return this;
          },
          end() {
            resolve({ status: resolvedStatus, body: resolvedJson, headers: respHeaders });
          }
        } as any;

        // Execute route directly (avoids standard network timeouts and socket limits)
        app._router.handle(mockReq, mockRes, () => {
          resolve({ status: 500, body: { fault: "Endpoint failure" }, headers: {} });
        });
      });
    }

    traceLogs.push(`[Middleware Http] Received Apigee Proxy response status: ${apigeeSimulatorResult.status}`);
    
    // E. APIGEE GATEWAY FAILURES HANDLING
    if (apigeeSimulatorResult.status !== 200) {
      const fault = apigeeSimulatorResult.body?.fault || {};
      const faultString = fault.faultstring || "Unknown Apigee Security Gateway Block";
      const errorCode = fault.detail?.errorcode || "unknown.Fault";
      
      traceLogs.push(`[Middleware Handler] Gateway Blocked Request: ${errorCode} - ${faultString}`);

      // Craft helpful AI responses for Apigee technical failures
      let friendlyFaultMsg = "";
      if (errorCode === "policies.ratelimit.SpikeArrestViolation") {
        friendlyFaultMsg = "⚠️ **[Apigee Gateway Warning]** Slower requests secure client stability. Our automated Apigee Spike Arrest protection triggered. Slower chat pacing preserves company bandwidth.";
      } else if (errorCode === "oauth.v2.InvalidApiKey") {
        friendlyFaultMsg = "🔒 **[Apigee Gateway Alert]** Unauthorized secure middleware handshake detected. The middleware's configured API Key is invalid or expired. Apigee blocked access to safeguard business details.";
      } else if (errorCode === "policies.ratelimit.QuotaViolation") {
        friendlyFaultMsg = "🛡️ **[Apigee Gateway Notice]** This client application has consumed its hourly standard query plan quota (20 allowable API requests/min). High-volume subscribers can request limit elevation.";
      } else if (errorCode === "messaging.adaptors.http.flow.ServiceUnavailable") {
        friendlyFaultMsg = "🛰️ **[Apigee Gateway Notice]** Connection handshake succeeded, but our primary target ERP records office returned state 503 (Temporary Overload). Backup nodes are currently syncing.";
      } else {
        friendlyFaultMsg = `⚠️ Gateway policy rejected traffic: ${faultString} (${errorCode}).`;
      }

      return res.status(apigeeSimulatorResult.status).json({
        success: false,
        intent,
        confidence,
        response: friendlyFaultMsg,
        traceLogs,
        gatewayError: true,
        apigeeTrace: {
          status: apigeeSimulatorResult.status,
          errorCode,
          faultString,
          headers: apigeeSimulatorResult.headers,
          logs: [
            `Inbound Blocked on PreFlow: ${errorCode}`,
            `Quota-Used: --`,
            `Quota-Limit: --`
          ]
        },
        backendData: null
      });
    }

    const apigeeDataEnvelope = apigeeSimulatorResult.body;
    const backendData = apigeeDataEnvelope.data;
    const apigeeTrace = apigeeDataEnvelope._apigeeTrace;

    traceLogs.push(`[Middleware Router] Backend payload successfully parsed from Apigee target response.`);
    traceLogs.push(`[Middleware AI Engine] Directing retrieved context payload to Gemini for user personalization...`);

    // STEP 3: CONVERSATIONAL ANSWER FORMULATION
    let finalAnswer = "";
    if (ai && simulateConfig.disableAIModel !== true) {
      try {
        const generationPrompt = `
        You are the Voice of VitalitySoft Maritime Solutions Support Assistant, active on maps.vitalitysoft.com.
        An automated API call to our background service successfully retrieved structured context parameters.
        Your task is to review the original client inquiry and compile an extremely professional, welcoming, precise web-chat agent response based ONLY on the validated background JSON parameters.

        Background Records Content retrieved for intent [${intent}]:
        ${JSON.stringify(backendData, null, 2)}

        Original User Inquiry: "${message}"

        Writing Style Manual:
        - Maintain a highly reliable, knowledgeable maritime fleet engineer and GIS advisor persona.
        - If the user is asking about vessel records (VESSEL_TRACK), present matching tracking log coordinates, speeds, status, and fuel indicators cleanly in standard bullet points or markdown tables summarizing their route segments.
        - Inform users they can subscribe to the **VitalitySoft WhatsApp Live Alerts Channel** (+91 8309616999) to track active vessels directly on their mobile!
        - Avoid technical database phrases like "JSON payload", "API endpoints", "backend key", or "sub-path details" in user communication; focus purely on the boat's travel events and vessel statistics (such as IMO, flag, and destination).
        - If the vessel was not found or has no logs in the custom date range, state that clearly and list the available vessels for tracking instead.
        - Respond in clear human-friendly bullet points where appropriate.
        - DO NOT invent details outside of what is explicitly given in the retrieved JSON background content.
        `;

        const finalReport = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: generationPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 800
          }
        });

        finalAnswer = finalReport.text?.trim() || "";
        traceLogs.push(`[Middleware AI Engine] Custom Gemini response compiled.`);
      } catch (gemSummaryErr) {
        traceLogs.push(`[Middleware Error] Conversational synthesis failed. Relying on programmatic summary output.`);
      }
    }

    if (!finalAnswer) {
      // Programmatic High-Fidelity Local Summaries
      if (intent === "DETAILS") {
        finalAnswer = `🏢 **VitalitySoft Maritime Solutions** specializes in ${backendData.industry}. Founded in ${backendData.founded} by maritime systems pioneer **${backendData.founder}**, we deliver active satellite-AIS tracking portals, secure Apigee interfaces, and custom GIS display software. Our global headquarters is located in **${backendData.headquarters}**, operating with a team of ${backendData.employeesCount}.`;
      } else if (intent === "SERVICES") {
        const serviceItems = backendData.services.map((s: any) => `🔹 **${s.name}** (${s.category}): ${s.description}`).join("\n\n");
        finalAnswer = `💼 **VitalitySoft Portfolio of Customer Solutions**:\n\n${serviceItems}\n\nFor customized architectural pricing or API integration tokens, please email our consultation desk at **${COMPANY_DATABASE.contact.salesDesk}**.`;
      } else if (intent === "CONTACT") {
        finalAnswer = `📞 **Connecting with VitalitySoft Corporate Division**:\n\n📍 **Suite Address**: ${backendData.address} (${backendData.officeName})\n📧 **Operations Desk**: ${backendData.email}\n☎️ **General Phone Hotline**: ${backendData.phone}\n💬 **WhatsApp Live Alerts**: ${backendData.whatsApp}\n💼 **Enterprise Subscription Sales**: ${backendData.salesDesk}\n🛠️ **Customer Support Link**: [Visit Support Portal](${backendData.supportDesk})`;
      } else if (intent === "BUSINESS_HOURS") {
        finalAnswer = `⏰ **Operating Hours (PST Time Zone)**:\n\n📅 **Office Hours**: ${backendData.normalHours}\n💼 **Sales Operations Office**: ${backendData.salesHours}\n🛠️ **Vessel Tracking Operations Support**: ${backendData.supportAvailability}\n🏖️ **Holidays Policy**: ${backendData.holidayCoverage}`;
      } else if (intent === "VESSEL_TRACK") {
        if (backendData.error) {
          finalAnswer = `❌ **Target Vessel Alert**: ${backendData.error}\n\n🚢 **Active Ships Tracked inside maps.vitalitysoft.com**:\n${backendData.availableVessels?.map((v: string) => `• **${v}**`).join("\n") || "• Vitality Sea\n• Ocean Navigator\n• Galleon Star"}`;
        } else {
          const tableRows = backendData.records?.map((r: any) => `• **Date**: ${r.date} | **GPS**: ${r.latitude}, ${r.longitude} | **Speed**: ${r.speed} | **Status**: ${r.status} | **Fuel**: ${r.fuelCons}`).join("\n") || "No logs located in specified range.";
          finalAnswer = `🚢 **Telemetry Report: ${backendData.vessel}**\n\n` +
            `• **IMO Registration**: ${backendData.imo}\n` +
            `• **Vessel Type**: ${backendData.type}\n` +
            `• **Registry Flag**: ${backendData.flag}\n` +
            `• **Current Status**: ${backendData.status}\n` +
            `• **Target Destination**: ${backendData.destination} (ETA: ${backendData.eta})\n\n` +
            `📅 **Historical Voyage Positions (${backendData.requestedDateRange?.start || "All"} to ${backendData.requestedDateRange?.end || "Now"})**:\n${tableRows}`;
        }
      } else {
        finalAnswer = backendData.answer || `Thank you for contacting VitalitySoft. Regarding: "${message}". Our tracking center has logged this request.`;
      }
      traceLogs.push(`[Middleware Local Summarizer] Compiled deterministic static format responses.`);
    }

    const totalDuration = Date.now() - startMs;
    traceLogs.push(`[Middleware Response] Completed successfully in ${totalDuration}ms.`);

    return res.status(200).json({
      success: true,
      intent,
      confidence,
      response: finalAnswer,
      traceLogs,
      apigeeTrace,
      backendData
    });

  } catch (error: any) {
    console.error("Critical error in Middleware Chat controller:", error);
    return res.status(500).json({
      success: false,
      response: `🔥 **[Middleware Critical Core Fault]** An unexpected system execution error occurred: ${error.message || error}`,
      traceLogs: [...traceLogs, `[CRITICAL CORE EXCEPTION] ${error.message || error}`],
      backendData: null
    });
  }
});


// --- 6. VITE OR PRODUCTION MIDDLEWARE SETUP ---
// Handle client files using Vite dev server (development) or express.static (production)
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ App booting in Development Mode. Starting Vite asset middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 App running in Production Mode. Serving static compiled resources...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 [Express Core] Gateway, Middleware, Backend, & Client listening on Port 3000.`);
  });
};

startServer().catch((err) => {
  console.error("🚩 Fatal error launching Express Node.js Core:", err);
});
