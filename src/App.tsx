import React, { useState } from 'react';
import EnterpriseHome from './components/EnterpriseHome';
import ChatWidget from './components/ChatWidget';
import DeveloperConsole from './components/DeveloperConsole';
import { SimulationConfig, ChatMessage } from './types';

export default function App() {
  // 0. Shared login/auth state for maps.vitalitysoft.com sessions
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Controls configuration for the active Apigee Gateway Simulator
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    invalidKey: false,
    spikeArrest: false,
    quotaExceeded: false,
    backendDown: false,
    disableAIModel: false
  });

  // 2. Holds the metadata trace associated with the latest chatbot request
  const [activeTrace, setActiveTrace] = useState<ChatMessage | null>(null);

  // 3. Visibility flag mapping floating chatbot window states
  const [chatbotOpen, setChatbotOpen] = useState(true);

  // Triggered when widget successfully executes client transactions
  const handleNewMessageLogged = (prompt: string, replyMessage: ChatMessage) => {
    setActiveTrace(replyMessage);
  };

  const handleCtaTriggerChat = () => {
    setChatbotOpen(true);
    // Find the widget input and focus it
    setTimeout(() => {
      const widgetInput = document.getElementById('chatbot-input') || document.querySelector('input[type="text"]');
      if (widgetInput) {
        (widgetInput as HTMLInputElement).focus();
      }
    }, 150);
  };

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-slate-900 overflow-hidden font-sans select-none">
      
      {/* LEFT HALF VIEWPORT - CLIENT FRONTEND LANDING PAGE (With Chat Widget) */}
      <div className="flex-1 md:flex-[6] h-1/2 md:h-full relative overflow-hidden flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
        
        {/* Render mock corporate website template */}
        <EnterpriseHome 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
          onTriggerChat={handleCtaTriggerChat} 
        />

        {/* Real-time floating CRM Chatbot Widget */}
        <ChatWidget 
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          simulationConfig={simulationConfig} 
          onNewMessageLogged={handleNewMessageLogged}
          isOpen={chatbotOpen}
          setIsOpen={setChatbotOpen}
        />
        
      </div>

      {/* RIGHT HALF VIEWPORT - DEVS OBSERVABILITY CONTROL TOWER & CONFIG BLUEPRINTS */}
      <div className="flex-1 md:flex-[4] h-1/2 md:h-full overflow-hidden">
        <DeveloperConsole 
          simulationConfig={simulationConfig}
          setSimulationConfig={setSimulationConfig}
          activeTrace={activeTrace}
        />
      </div>

    </div>
  );
}
