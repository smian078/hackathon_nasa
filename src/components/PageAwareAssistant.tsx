import { useState, type FormEvent } from 'react';
import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { REGION_DATASETS } from '../data/samples/asfVertexSamples.ts';
import { askPageAwareAssistant } from '../services/nisarApi.ts';
import type {
  AssistChatMessage,
  DatasetAspectId,
  LanguageCode,
  LayerMode,
  PageViewMode,
  RegionId,
} from '../types/sar.ts';
import { formatPageContextLabel } from '../utils/globeMath.ts';

interface PageAwareAssistantProps {
  pageView: PageViewMode;
  activeRegionId: RegionId;
  activeAspect: DatasetAspectId | null;
  zoneName?: string;
  passDate?: string;
  layerMode: LayerMode;
  metricsSummary: string;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export function PageAwareAssistant({
  pageView,
  activeRegionId,
  activeAspect,
  zoneName,
  passDate,
  layerMode,
  metricsSummary,
  language,
  onSelectLanguage,
}: PageAwareAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<AssistChatMessage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const contextLabel = formatPageContextLabel({
    currentView: pageView,
    regionId: pageView === 'REGION_2D_MAP' ? activeRegionId : undefined,
    activeAspect: activeAspect ?? undefined,
    zoneName: pageView === 'REGION_2D_MAP' ? zoneName : undefined,
  });

  const defaultPrompts =
    pageView === 'HOME_3D_GLOBE'
      ? [
          'Compare the 3 highlighted regions',
          'How does L-band pierce monsoon clouds?',
          'Which region has GCOV vs GUNW?',
        ]
      : [
          `Explain ${zoneName?.split(' ')[0] ?? 'this zone'} metrics`,
          'What does this dataset aspect show?',
          'What action should authorities take?',
        ];

  const activeSuggestions = followUps.length > 0 ? followUps : defaultPrompts;

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const userMsg: AssistChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    const resp = await askPageAwareAssistant({
      currentView: pageView,
      regionId: pageView === 'REGION_2D_MAP' ? activeRegionId : undefined,
      activeAspect: activeAspect ?? undefined,
      zoneName: pageView === 'REGION_2D_MAP' ? zoneName : undefined,
      passDate,
      layerMode: pageView === 'REGION_2D_MAP' ? layerMode : undefined,
      metricsSummary: pageView === 'REGION_2D_MAP' ? metricsSummary : undefined,
      question: trimmed,
      language,
    });

    const assistantMsg: AssistChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: resp.answer,
      source: resp.source,
      timestamp: resp.generatedAt,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setFollowUps(resp.suggestedFollowUps);
    setIsSending(false);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitQuestion(input);
  };

  const regionShort = REGION_DATASETS[activeRegionId].shortName.replace(/ \[.*\]$/, '');

  return (
    <div
      className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-2"
      aria-label="Page-Aware Radar AI Assistant"
    >
      {isOpen && (
        <section
          data-testid="page-aware-assistant-panel"
          aria-label="Context-aware AI assistant chat"
          className="w-[calc(100vw-2rem)] sm:w-[370px] border border-[#18181B] bg-[#EBEBE8] text-[#18181B] shadow-2xl flex flex-col max-h-[500px]"
        >
          {/* Header with Live Context Badge */}
          <div className="flex items-start justify-between gap-2 border-b border-[#D4D4D8] bg-[#18181B] px-3.5 py-3 text-[#EBEBE8]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#0066FF] shrink-0" aria-hidden="true" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                  Page-Aware Radar Guide
                </span>
              </div>
              <div
                data-testid="assistant-context-label"
                className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA]"
                title={contextLabel}
              >
                CTX: {contextLabel}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <select
                aria-label="Assistant language"
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
                className="border border-[#3F3F46] bg-[#27272A] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#EBEBE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
              >
                <option value="en">EN</option>
                <option value="mr">MR</option>
                <option value="hi">HI</option>
              </select>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize Page-Aware Assistant"
                className="p-1 text-[#EBEBE8] hover:text-[#0066FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Context Telemetry Strip */}
          <div className="border-b border-[#D4D4D8] bg-[#F4F4F5] px-3.5 py-2 font-mono text-[10px] text-[#52525B]">
            {pageView === 'HOME_3D_GLOBE'
              ? 'Aware: 3D Earth Home · 3 highlighted Cycle 035 corridors ready to inspect.'
              : `Aware: ${metricsSummary}`}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[160px] max-h-[250px]">
            {messages.length === 0 ? (
              <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3 text-xs text-[#52525B] leading-relaxed">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] mb-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>Active Context Synced</span>
                </div>
                {pageView === 'HOME_3D_GLOBE'
                  ? 'Ask me to compare Maharashtra, Northeast India, and Japan, or tap any highlighted 3D globe marker to morph into its 2D radar map.'
                  : `I am tracking your view in ${regionShort} (${activeAspect ?? 'telemetry'}). Ask about the current radar values, map controls, or next inspection step.`}
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 text-xs leading-relaxed border ${
                    m.role === 'user'
                      ? 'ml-6 border-[#18181B] bg-[#18181B] text-[#EBEBE8]'
                      : 'mr-4 border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B]'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.source && (
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#52525B]">
                      {m.source === 'GEMINI_4_HYDROGEN'
                        ? 'Gemini 4 Hydrogen'
                        : 'Grounded Physics Guide'}
                    </div>
                  )}
                </div>
              ))
            )}
            {isSending && (
              <div className="h-12 skeleton-shimmer border border-[#D4D4D8]" aria-busy="true" />
            )}
          </div>

          {/* Quick Context Prompts */}
          <div className="border-t border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2 flex flex-wrap gap-1.5">
            {activeSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void submitQuestion(prompt)}
                className="border border-[#D4D4D8] bg-[#EBEBE8] px-2 py-1 text-[10px] font-semibold text-[#18181B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="flex border-t border-[#D4D4D8] bg-[#EBEBE8]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                pageView === 'HOME_3D_GLOBE'
                  ? 'Ask about 3D Earth datasets...'
                  : `Ask about ${regionShort}...`
              }
              aria-label="Ask page-aware radar assistant"
              className="flex-1 bg-transparent px-3 py-2.5 text-xs text-[#18181B] placeholder:text-[#52525B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send assistant question"
              className="border-l border-[#D4D4D8] bg-[#0066FF] px-3.5 text-white hover:bg-[#18181B] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Docked Bottom-Right Toggle Launcher */}
      <button
        type="button"
        data-testid="assistant-launcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2.5 border border-[#18181B] bg-[#18181B] px-4 py-2.5 text-[#EBEBE8] shadow-lg hover:bg-[#0066FF] hover:border-[#0066FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
        </span>
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
          {isOpen
            ? 'Close Guide'
            : pageView === 'HOME_3D_GLOBE'
              ? 'AI Guide · 3D Earth'
              : `AI Guide · ${regionShort}`}
        </span>
      </button>
    </div>
  );
}
