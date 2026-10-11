"use client";

import { useState } from "react";
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

  const handleQuickPrompt = (prompt: string) => {
    if (loading || streaming) return;
    onSendCopilotMessage(prompt);
  };

  const quickPrompts = [
    {
      text: lang === "vi" ? "Tạo phần mở đầu khác đi" : "Write a completely different opening for this story",
      label: t.quick_cmd_intro,
    },
    {
      text: lang === "vi" ? "Sửa lại đoạn kết kịch tính và bất ngờ hơn" : "Make the ending much more dramatic and suspenseful",
      label: t.quick_cmd_outro,
    },
    {
      text: lang === "vi" ? "Viết lại giọng văn u tối và hồi hộp hơn" : "Rewrite in a darker, more gripping thriller tone",
      label: t.quick_cmd_tone,
    },
    {
      text: lang === "vi" ? "Bổ sung thêm diễn biến tâm lý và thoại cho nhân vật" : "Add deeper internal thoughts and character dialogues",
      label: t.quick_cmd_depth,
    },
  ];

  return (
    <aside
      className={`${
        mobileOpen
          ? "fixed inset-x-3 top-3 bottom-20 z-40 flex w-auto flex-col rounded shadow-xl lg:static lg:h-full lg:w-96 lg:rounded-none lg:shadow-none"
          : "hidden lg:flex lg:h-full lg:w-96"
      } flex-col border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black shrink-0 px-4 py-4 transition-colors font-sans`}
    >
      {/* Copilot Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs font-mono font-bold text-black dark:text-white">
            [AI]
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-black dark:text-white leading-tight">
              {t.ai_copilot}
            </h3>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
              [TRỰC TIẾP] {t.live_editor_title}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs">
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-black dark:text-white transition-colors"
              title={t.undo_tooltip}
            >
              [{t.undo_btn}]
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={lang === "vi" ? "Đóng trợ lý" : "Close assistant"}
              className="lg:hidden px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-black dark:text-white"
            >
              [Đóng]
            </button>
          )}
        </div>
      </div>

      {/* Compact AI Model Tier selector */}
      <div className="py-2 border-b border-neutral-200 dark:border-neutral-800 shrink-0 flex items-center gap-2 px-0.5">
        <span className="text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 shrink-0 uppercase">
          {lang === "vi" ? "Mô hình:" : "Model:"}
        </span>
        <select
          value={modelTier}
          onChange={(e) => setModelTier(e.target.value as ModelTier)}
          className="flex-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none cursor-pointer"
          title={lang === "vi" ? "Chọn cấp độ mô hình AI" : "Select AI model tier"}
        >
          <option value="fast">{lang === "vi" ? "[Nhanh] Llama 8B" : "[Fast] Llama 8B"}</option>
          <option value="versatile">{lang === "vi" ? "[Linh hoạt] Llama 70B" : "[Versatile] Llama 70B"}</option>
          <option value="premium">{lang === "vi" ? "[Cao cấp] Qwen 27B" : "[Premium] Qwen 27B"}</option>
        </select>
      </div>

      {/* Main Copilot Content: Scrollable */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-3 space-y-3 pr-1">
        {/* If text is selected in the editor: Quick edit block */}
        {selectedText ? (
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                {t.selected_text}
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {selectedText.length} {t.chars_count}
              </span>
            </div>
            <p className="text-xs italic text-neutral-700 dark:text-neutral-300 line-clamp-2 border-l-2 border-neutral-400 dark:border-neutral-600 pl-2">
              "{selectedText}"
            </p>

            <div className="pt-2 space-y-2">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                placeholder={t.ai_instruction_placeholder}
                className="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 font-sans"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={loading || !customInstruction.trim()}
                className="w-full py-1.5 rounded text-xs font-mono font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors"
              >
                [{t.ai_request_btn}]
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5">
            <p className="font-semibold text-black dark:text-white">
              {t.ai_welcome_1}
            </p>
            <p className="text-[11px] leading-relaxed">
              {t.ai_welcome_2}
            </p>
          </div>
        )}

        {/* Proposed Text Diff/Preview */}
        {proposedText && (
          <div className="p-3 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black dark:text-white block">
              [KẾT QUẢ ĐỀ XUẤT]
            </span>
            <p className="text-xs text-black dark:text-white whitespace-pre-wrap leading-relaxed font-serif">
              {proposedText ? proposedText.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() : ""}
            </p>
            <div className="flex gap-2 pt-1 font-mono text-xs">
              <button
                onClick={onAcceptEdit}
                className="flex-1 py-1.5 rounded font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
              >
                [{t.accept_btn}]
              </button>
              <button
                onClick={onRejectEdit}
                className="px-3 py-1.5 rounded font-semibold text-black dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                [{t.reject_btn}]
              </button>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {(loading || streaming) && (
          <div className="p-2.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center gap-2 text-xs font-mono text-black dark:text-white">
            <span className="animate-pulse">[•••]</span>
            <span>
              {streaming ? t.live_drafting : t.ai_thinking}
            </span>
          </div>
        )}

        {/* Interactive Chat Box Messages */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
            {t.copilot_chat_title}
          </span>
          {copilotMessages.map((msg, i) => (
            <div
              key={i}
              className={`min-w-0 break-words p-2.5 rounded text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black ml-6"
                  : "bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white mr-4 border border-neutral-200 dark:border-neutral-800 whitespace-pre-line"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <span className="text-[10px] font-mono font-semibold text-neutral-500 block mb-1">
          {t.quick_commands_label}
        </span>
        <div className="flex flex-wrap gap-1 mb-2 font-mono">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              disabled={loading || streaming}
              onClick={() => handleQuickPrompt(qp.text)}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-black dark:text-white transition-colors border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
            >
              [{qp.label}]
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="shrink-0 mb-2 font-mono">
        <div className="relative">
          <textarea
            rows={2}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
              }
            }}
            placeholder={t.copilot_placeholder}
            className="w-full pl-3 pr-16 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 resize-none font-sans"
          />
          <button
            onClick={handleChatSubmit}
            disabled={loading || streaming || !chatInput.trim()}
            className="absolute right-2 top-2 px-2 py-1 rounded text-[11px] font-mono font-bold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 transition-all"
          >
            [Gửi]
          </button>
        </div>
      </div>

      {/* Action Buttons: Continue chapter / End story */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2 shrink-0 font-mono text-xs">
        <button
          onClick={onContinueChapter}
          disabled={loading || streaming}
          className="w-full py-2 rounded font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          <span>[{t.continue_chapter_btn}]</span>
        </button>

        <button
          onClick={onEndStory}
          disabled={loading || streaming}
          className="w-full py-2 rounded font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <span>[{t.end_story_btn}]</span>
        </button>
      </div>
    </aside>
  );
}
