export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  apigeeStatus?: {
    status: number;
    errorCode?: string;
    faultString?: string;
  };
  apigeeTrace?: {
    timestamp: string;
    proxyName: string;
    basePath: string;
    routeTarget: string;
    policiesExecuted: string[];
    processDurationMs: number;
    logs: string[];
    errorCode?: string;
    faultString?: string;
  };
  backendData?: any;
  traceLogs?: string[];
}

export interface SimulationConfig {
  invalidKey: boolean;
  spikeArrest: boolean;
  quotaExceeded: boolean;
  backendDown: boolean;
  disableAIModel: boolean;
}

export interface ApigeePolicyTemplate {
  name: string;
  filename: string;
  purpose: string;
  type: 'policy' | 'endpoint' | 'doc';
  code: string;
}
