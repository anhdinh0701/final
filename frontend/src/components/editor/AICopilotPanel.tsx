"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Undo2,
  X,
  Check,
  Sparkles,
  MessageSquare,
  Wand2,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { translations, Language } from "@/lib/i18n";
import { ChatMessage } from "@/lib/types";
import type { ModelTier } from "@/components/morphicons/ModelSelectorMorphicon";

interface Props {
  lang: Language;
  selectedText: string;
  proposedText: string | null;
  copilotMessages: ChatMessage[];
  onAcceptEdit: () => void;
  onRejectEdit: () => void;
  onSubmitCustomInstruction: (instruction: string) => void;
  onSendCopilotMessage: (msg: string) => void;
  onContinueChapter: () => void;
  onEndStory: () => void;
  loading: boolean;
  streaming: boolean;
  onUndo?: () => void;
  canUndo?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AICopilotPanel({
  lang,
  selectedText,
  proposedText,
  copilotMessages,
  onAcceptEdit,
  onRejectEdit,
  onSubmitCustomInstruction,
  onSendCopilotMessage,
  onContinueChapter,
  onEndStory,
  loading,
  streaming,
  onUndo,
  canUndo,
  mobileOpen = false,
  onCloseMobile,
}: Props) {
  const [modelTier, setModelTier] = useState<ModelTier>("versatile");
  const [customInstruction, setCustomInstruction] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"tools" | "chat">("tools");
  const t = translations[lang];

  const handleCustomSubmit = () => {
    if (!customInstruction.trim() || loading) return;
    onSubmitCustomInstruction(customInstruction.trim());
    setCustomInstruction("");
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() || loading || streaming) return;
    onSendCopilotMessage(chatInput.trim());
    setChatInput("");
  };

  const quickPrompts = [
    {
      text: lang === "vi" ? "Tiếp tục viết phát triển mạch truyện hiện tại" : "Continue writing the story forward",
      label: lang === "vi" ? "Viết tiếp đoạn sau" : "Continue narrative",
      icon: "✍️",
    },
    {
      text: lang === "vi" ? "Làm sâu sắc thêm đối thoại và diễn biến tâm lý nhân vật" : "Deepen character dialogue and internal thoughts",
      label: lang === "vi" ? "Trau chuốt đối thoại" : "Polish dialogue",
      icon: "💬",
    },
    {
      text: lang === "vi" ? "Tăng thêm nhịp độ kịch tính, bất ngờ trước xung đột" : "Heighten dramatic pacing and tension before the clash",
      label: lang === "vi" ? "Tăng kịch tính" : "Increase suspense",
      icon: "⚡",
    },
    {
      text: lang === "vi" ? "Tra cứu điển tích và bổ sung phong tục cổ phong Việt phù hợp" : "Incorporate authentic ancient Vietnamese customs and lore",
      label: lang === "vi" ? "Bổ sung văn hóa cổ" : "Add authentic lore",
      icon: "📜",
    },
  ];

  return (
    <aside
      className={`${
        mobileOpen
          ? "fixed inset-x-2 top-2 bottom-20 z-40 flex w-auto flex-col rounded-xl shadow-2xl lg:static lg:h-full lg:w-96 lg:rounded-none lg:shadow-none"
          : "hidden lg:flex lg:h-full lg:w-96"
      } flex-col border-l border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] shrink-0 transition-colors font-sans select-none`}
    >
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-[#171717] text-black dark:text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-black dark:text-[#F5F5F5] font-mono">
              AI Co-pilot Studio
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono block">
              {streaming ? "Đang phản hồi..." : "Sẵn sàng hỗ trợ"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-1 rounded border border-neutral-300 dark:border-white/10 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#171717] dark:hover:bg-neutral-800 text-black dark:text-white transition-colors flex items-center gap-1"
              title={t.undo_tooltip}
            >
              <Undo2 className="w-3 h-3" />
              <span>{t.undo_btn}</span>
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode / Tabs Switcher */}
      <div className="grid grid-cols-2 p-1.5 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#080808] shrink-0 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("tools")}
          className={`py-1.5 rounded text-center transition-colors font-bold ${
            activeTab === "tools"
              ? "bg-white dark:bg-[#171717] text-black dark:text-white shadow-sm border border-neutral-200 dark:border-white/10"
              : "text-neutral-500 hover:text-black dark:hover:text-white"
          }`}
        >
          [Công cụ AI]
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`py-1.5 rounded text-center transition-colors font-bold ${
            activeTab === "chat"
              ? "bg-white dark:bg-[#171717] text-black dark:text-white shadow-sm border border-neutral-200 dark:border-white/10"
              : "text-neutral-500 hover:text-black dark:hover:text-white"
          }`}
        >
          [Hội thoại Copilot]
        </button>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        
        {/* PROPOSED TEXT PREVIEW CARD (NEVER OVERWRITES WITHOUT EXPLICIT CONFIRMATION) */}
        {proposedText && (
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-[#171717] border-2 border-black dark:border-white/30 space-y-3 shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black dark:text-white">
                ✨ BẢN ĐỀ XUẤT CỦA AI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                Chờ duyệt
              </span>
            </div>
            
            <p className="text-xs text-black dark:text-[#F5F5F5] whitespace-pre-wrap leading-relaxed font-serif border-l-2 border-black dark:border-white pl-2.5 max-h-48 overflow-y-auto">
              {proposedText ? proposedText.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() : ""}
            </p>

            <div className="flex gap-2 pt-1 font-mono text-xs">
              <button
                onClick={onAcceptEdit}
                className="flex-1 py-2 rounded-lg font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp dụng vào bản thảo</span>
              </button>
              <button
                onClick={onRejectEdit}
                className="px-3 py-2 rounded-lg font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Bỏ qua</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Text Focus Box */}
        {selectedText ? (
          <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              <span>Đoạn văn đang chọn:</span>
              <span className="text-neutral-500">{selectedText.length} ký tự</span>
            </div>
            <p className="text-xs italic text-neutral-700 dark:text-neutral-300 line-clamp-3 border-l-2 border-neutral-400 dark:border-neutral-600 pl-2">
              "{selectedText}"
            </p>
            <div className="pt-1.5 space-y-2">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                placeholder="Yêu cầu AI sửa đoạn này..."
                className="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 font-sans"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={loading || !customInstruction.trim()}
                className="w-full py-1.5 rounded text-xs font-mono font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors shadow-sm"
              >
                [Gửi chỉ đạo sửa đổi]
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "tools" ? (
          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                Chỉ Đạo Bẻ Lái Nhanh
              </span>
              <div className="space-y-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendCopilotMessage(p.text)}
                    disabled={loading || streaming}
                    className="w-full text-left p-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#171717] hover:border-black dark:hover:border-white text-xs font-mono transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{p.icon}</span>
                      <span className="truncate text-black dark:text-[#F5F5F5] font-medium">{p.label}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-black dark:group-hover:text-white shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Narrative Advancement */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2 font-mono text-xs">
              <button
                type="button"
                onClick={onContinueChapter}
                disabled={loading || streaming}
                className="w-full py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-40"
              >
                ✍️ {t.continue_chapter_btn}
              </button>
              <button
                type="button"
                onClick={onEndStory}
                disabled={loading || streaming}
                className="w-full py-2 rounded-lg border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                🔚 {t.end_story_btn}
              </button>
            </div>
          </div>
        ) : (
          /* Chat History View */
          <div className="space-y-3 font-sans">
            {copilotMessages.length === 0 ? (
              <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 text-center text-xs text-neutral-500">
                Chưa có trao đổi nào. Hãy nhập lệnh ở khung chat bên dưới để cùng AI phát triển cốt truyện.
              </div>
            ) : (
              copilotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-neutral-200 dark:bg-[#171717] text-black dark:text-white ml-4 border border-neutral-300 dark:border-white/10"
                      : "bg-neutral-100 dark:bg-[#080808] text-neutral-800 dark:text-neutral-200 mr-4 border border-neutral-200 dark:border-white/5"
                  }`}
                >
                  <div className="font-mono text-[10px] text-neutral-500 uppercase font-bold mb-1">
                    {msg.role === "user" ? "Bạn" : "AI Co-pilot"}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Bottom Chat Input */}
      <div className="p-3 border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] shrink-0">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
            placeholder="Ra lệnh bẻ lái hoặc hỏi ý tưởng..."
            disabled={loading || streaming}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-[#080808] text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white font-sans"
          />
          <button
            type="button"
            onClick={handleChatSubmit}
            disabled={loading || streaming || !chatInput.trim()}
            className="absolute right-2 top-2 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-black dark:text-white disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AICopilotPanel;
