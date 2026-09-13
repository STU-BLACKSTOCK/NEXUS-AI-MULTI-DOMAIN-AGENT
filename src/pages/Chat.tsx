import { ChatProvider } from "@/context/ChatContext";
import DomainSidebar from "@/components/DomainSidebar";
import ChatWindow from "@/components/ChatWindow";
import InputBox from "@/components/InputBox";
import VoiceController from "@/components/VoiceController";

export default function Chat() {
  return (
    <ChatProvider>
      <div className="min-h-screen pt-16 flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4 max-h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <DomainSidebar />

          {/* Main chat area */}
          <div className="flex-1 flex flex-col glass rounded-xl overflow-hidden min-h-0">
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  NexusAI Multi-Domain Intelligence
                </h2>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Autonomous Pipelines: Finance • Cooking • Education • Healthcare
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>

            <ChatWindow />
            <div className="p-3 border-t border-border/30 space-y-3">
              {/* Voice Mode control panel */}
              <VoiceController />
              <InputBox />
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
