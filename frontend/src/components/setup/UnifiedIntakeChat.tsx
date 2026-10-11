"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  User,
  RotateCcw,
  PenTool,
  RefreshCw,
  Send,
  ArrowRight,
  Sparkles,
  ScrollText,
  Cpu,
  Flame,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { ChatMessage, StoryLength } from "@/lib/types";
import { api } from "@/lib/api";
import type { ModelTier } from "@/components/morphicons/ModelSelectorMorphicon";


/**
 * Robust lightweight Markdown renderer component for spacious chat bubbles.
 * Parses headings, bullet lists, numbered lists, blockquotes, bold, italic, and inline code.
 */
function FormattedMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = useMemo(() => {
    if (!content) return [];
    return content.split(/\n\n+/);
  }, [content]);

  const renderInline = (text: string) => {
    // Regex for bold **text** or __text__, italic *text* or _text_, and code `text`
    const parts = text.split(/(\*\*[^\*]+\*\*|__[^_]+__|`[^`]+`|\*[^\*]+\*|_[^_]+_)/g);
    return parts.map((part, idx) => {
      if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
        return (
          <strong key={idx} className={isUser ? "font-bold text-white" : "font-bold text-slate-900 dark:text-white"}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
              isUser ? "bg-white/20 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white"
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
        return (
          <em key={idx} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        const lines = block.split(/\n/);

        // Check if block is blockquote
        if (lines.every((line) => line.trim().startsWith(">"))) {
          return (
            <blockquote
              key={bIdx}
              className={`border-l-2 pl-3 py-1 my-1.5 italic ${
                isUser
                  ? "border-white/50 text-white/90"
                  : "border-[#b78969]/70 dark:border-[#8e6650]/70 text-slate-600 dark:text-slate-300 bg-[#f7f2ec] dark:bg-[#332c26] rounded-r-md"
              }`}
            >
              {lines.map((l, lIdx) => (
                <div key={lIdx}>{renderInline(l.replace(/^>\s?/, ""))}</div>
              ))}
            </blockquote>
          );
        }

        // Check if block is unordered list
        if (lines.every((line) => /^\s*[-*•]\s+/.test(line))) {
          return (
            <ul key={bIdx} className="space-y-1 my-1 ml-4 list-disc">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="pl-1">
                  {renderInline(line.replace(/^\s*[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // Check if block is numbered list
        if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
          return (
            <ol key={bIdx} className="space-y-1 my-1 ml-4 list-decimal">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="pl-1">
                  {renderInline(line.replace(/^\s*\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        // Check headings
        if (lines.length === 1 && lines[0].startsWith("#")) {
          const match = lines[0].match(/^(#{1,3})\s+(.*)/);
          if (match) {
            const level = match[1].length;
            const headingText = match[2];
            if (level === 1) {
              return (
                <h1 key={bIdx} className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {renderInline(headingText)}
                </h1>
              );
            }
            if (level === 2) {
              return (
                <h2 key={bIdx} className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {renderInline(headingText)}
                </h2>
              );
            }
            return (
              <h3 key={bIdx} className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 uppercase tracking-wide">
                {renderInline(headingText)}
              </h3>
            );
          }
        }

        // Default Paragraph
        return (
          <p key={bIdx} className="whitespace-pre-wrap">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export interface ExtractedConcepts {
  entities: string[];
  setting?: string;
  genre: "historical" | "scifi" | "xianxia" | "detective" | "general";
}

export function extractNarrativeConcepts(text: string): ExtractedConcepts {
  const lower = text.toLowerCase();
  const entities: string[] = [];
  let genre: ExtractedConcepts["genre"] = "general";
  let setting: string | undefined;

  // Lịch sử Việt Nam
  const histKeywords = [
    "thánh gióng", "trần hưng đạo", "lý thường kiệt", "ngô quyền", "lê lợi", "quang trung", 
    "hai bà trưng", "bạch đằng", "đại việt", "nhà trần", "nhà lê", "nghĩa sĩ", "tây sơn",
    "chi lăng", "ngọc hồi", "như nguyệt"
  ];
  for (const kw of histKeywords) {
    if (lower.includes(kw)) {
      genre = "historical";
      entities.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Khoa học viễn tưởng / Cyberpunk
  const scifiKeywords = ["cyberpunk", "2099", "sài gòn 2099", "saigon 2099", "robot", "trí tuệ nhân tạo", "hacker", "ký ức số", "viễn tưởng", "vũ trụ", "người máy"];
  for (const kw of scifiKeywords) {
    if (lower.includes(kw)) {
      if (genre === "general") genre = "scifi";
      if (!setting && (kw.includes("sài gòn") || kw.includes("saigon") || kw.includes("2099"))) {
        setting = "Sài Gòn 2099";
      }
      if (kw === "hacker" || kw === "robot") {
        entities.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    }
  }

  // Tu chân / Tiên hiệp / Kỳ ảo
  const xianxiaKeywords = ["tu chân", "tiên hiệp", "kiếm hiệp", "đan điền", "ma pháp", "linh hồn", "cấm địa", "pháp bảo", "trận pháp", "huyền huyễn", "dị giới", "yêu thú"];
  for (const kw of xianxiaKeywords) {
    if (lower.includes(kw)) {
      if (genre === "general") genre = "xianxia";
      entities.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Trinh thám / Gián điệp
  const detKeywords = ["thám tử tư", "thám tử", "án mạng", "vụ án", "giết người", "điều tra", "manh mối", "hung thủ", "bắt cóc", "mật vụ"];
  for (const kw of detKeywords) {
    if (lower.includes(kw)) {
      if (genre === "general") genre = "detective";
      const cap = kw.charAt(0).toUpperCase() + kw.slice(1);
      if (!entities.some(e => e.toLowerCase() === kw || (kw === "thám tử" && e.toLowerCase().includes("thám tử tư")))) {
        entities.push(cap);
      }
    }
  }

  // Trích xuất các danh từ riêng viết hoa tiếng Việt
  const capitalizedWords = text.match(/[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g);
  if (capitalizedWords) {
    const stopWords = [
      "Tôi", "Bạn", "Một", "Khi", "Hãy", "Trong", "Để", "Nếu",
      "Chuyện", "Câu", "Viết", "Kể", "Vào", "Đây", "Đó", "Về", "Cuộc",
      "Và", "Nhưng", "Với", "Có", "Là", "Tác", "Ngày", "Ở"
    ];
    for (const w of capitalizedWords) {
      if (!stopWords.includes(w) && !entities.includes(w)) {
        entities.push(w);
      }
    }
  }

  return { entities: Array.from(new Set(entities)).slice(0, 3), setting, genre };
}

export function generateDynamicClientFallback(userInput: string, lang: Language): string {
  const concepts = extractNarrativeConcepts(userInput);
  const isVi = lang === "vi";

  const entityStr = concepts.entities.length > 0
    ? concepts.entities.join(", ")
    : (isVi ? "nhân vật chính" : "the protagonist");

  if (concepts.genre === "historical") {
    return isVi
      ? `NarrAI ghi nhận tiền đề lịch sử hào hùng xoay quanh **${entityStr}**.\n\nĐể khắc họa chiều sâu tác phẩm:\n1. Bạn muốn khai thác theo góc nhìn **Chính sử** bám sát sử liệu, hay **Dã sử phóng tác** từ góc nhìn của một nhân vật hư cấu bên cạnh danh nhân?\n2. Biến cố mang tính bước ngoặt hoặc bài học chiến lược/bang giao nào sẽ là nút thắt kịch tính nhất?`
      : `NarrAI captured your historical premise centered on **${entityStr}**.\n\nTo deepen this narrative:\n1. Are you aiming for strict historical fidelity, or fictional narrative through a grassroots lens?\n2. What pivotal sacrifice or turning point defines their heroic journey?`;
  }

  if (concepts.genre === "scifi") {
    const place = concepts.setting || (isVi ? "thế giới tương lai" : "the futuristic metropolis");
    return isVi
      ? `Ý tưởng khoa học viễn tưởng trong bối cảnh **${place}** rất giàu tiềm năng kịch tính!\n\nĐể định hình xung đột then chốt:\n1. **${entityStr}** đang đối đầu với thế lực nào (một tập đoàn công nghệ kiểm soát ý thức, hay một trí tuệ nhân tạo mất kiểm soát)?\n2. Nhân vật chính sở hữu năng lực đặc thù nào, và cái giá phải trả để duy trì nhân tính là gì?`
      : `High-octane sci-fi premise set in **${place}**!\n\nTo lock down the conflict:\n1. Who is the primary adversary opposing **${entityStr}** (a megacorporation controlling neural memories, or rogue synthetic AI)?\n2. What cybernetic edge or moral cost drives your protagonist forward?`;
  }

  if (concepts.genre === "xianxia") {
    return isVi
      ? `Tiền đề kỳ ảo phương Đông với yếu tố **${entityStr}** mở ra một thế giới quan rộng lớn.\n\nĐể thắt chặt mạch truyện:\n1. Đâu là bí mật cổ xưa hoặc nghịch thiên tạo hóa mà nhân vật chính tình cờ nắm giữ?\n2. Mâu thuẫn giữa các tông môn hoặc thế lực hắc ám nào sẽ đẩy nhân vật vào cuộc chiến sinh tử đầu tiên?`
      : `Rich cultivation fantasy premise involving **${entityStr}**.\n\nTo sharpen the narrative arc:\n1. What ancient artifact or forbidden soul secret does the protagonist harbor?\n2. Which sect rivalry or dark calamity will trigger their first life-or-death crisis?`;
  }

  if (concepts.genre === "detective") {
    return isVi
      ? `Vụ án trinh thám xoay quanh manh mối **${entityStr}** hứa hẹn nhiều tầng lớp bất ngờ.\n\nĐể tạo chiều sâu điều tra:\n1. Động cơ thực sự của thủ phạm là sự thù hận cá nhân hay che giấu một âm mưu lớn hơn?\n2. Nhân vật chính có bí mật quá khứ nào khiến vụ án này trở thành phép thử sinh tử đối với họ?`
      : `Intriguing detective mystery involving **${entityStr}**.\n\nTo craft the investigation:\n1. Is the culprit's motive personal vengeance or concealing a far larger conspiracy?\n2. What dark secret in the investigator's past makes this case deeply personal?`;
  }

  // Trường hợp tổng quát
  const snippet = userInput.length > 50 ? userInput.slice(0, 50) + "..." : userInput;
  return isVi
    ? `NarrAI đã tiếp nhận ý niệm then chốt của bạn: **"${snippet}"**.\n\nĐể biến ý tưởng này thành một câu chuyện hoàn chỉnh:\n1. Động cơ thôi thúc mạnh mẽ nhất của **${entityStr}** trong hồi mở đầu là gì?\n2. Trở ngại hoặc biến cố bất ngờ nào xuất hiện ngay chương 1 khiến kế hoạch của nhân vật bị đảo lộn hoàn toàn?`
    : `NarrAI registered your core premise: **"${snippet}"**.\n\nTo structure the dramatic hook:\n1. What urgent motivation propels **${entityStr}** in the opening sequence?\n2. What unforeseen complication disrupts their life right in Chapter 1?`;
}

export interface IntakeTransitionOptions {
  refinedPrompt?: string;
  chatHistory: ChatMessage[];
  storyLength: StoryLength;
  modelTier: ModelTier;
}

interface Props {
  lang: Language;
  onStartWriting: (options: IntakeTransitionOptions) => Promise<void> | void;
  isGenerating?: boolean;
  initialChatHistory?: ChatMessage[];
  onClearHistory?: () => void;
}

export function UnifiedIntakeChat({
  lang,
  onStartWriting,
  isGenerating = false,
  initialChatHistory = [],
  onClearHistory,
}: Props) {
  const t = translations[lang] || translations.vi;
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [modelTier, setModelTier] = useState<ModelTier>("versatile");
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [hasReadySignal, setHasReadySignal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial chat history if provided
  useEffect(() => {
    if (initialChatHistory && initialChatHistory.length > 0 && messages.length === 0) {
      setMessages(initialChatHistory);
      const isReadyDetected = initialChatHistory.some(
        (m) => m.is_ready || (m.role === "assistant" && m.content.includes("[READY]"))
      );
      if (isReadyDetected) setHasReadySignal(true);
    }
  }, [initialChatHistory]);

  // Auto-scroll on new messages or loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Readiness evaluation: either AI output [READY] / is_ready, or at least 1 assistant turn
  const assistantTurns = useMemo(
    () => messages.filter((m) => m.role === "assistant").length,
    [messages]
  );
  const isReady = hasReadySignal || assistantTurns >= 1;

  // Starter prompt suggestions covering Vietnamese History, Sci-Fi, Xianxia, Slice of Life
  const starterIdeas = useMemo(() => [
    {
      id: "history",
      title: t.starter_history_title || (lang === "vi" ? "Lịch sử Việt Nam · Chính sử & Dã sử" : "Vietnamese history · Fact & fiction"),
      badge: t.starter_history_badge || (lang === "vi" ? "Chính sử chuẩn mực • Dã sử phóng tác" : "Strict history • Fictional perspective"),
      prompt: t.starter_history_prompt || (lang === "vi"
        ? "Một nghĩa sĩ áo vải thời Hậu Lê mang gươm báu bảo vệ bến sông lịch sử, đứng trước ngã rẽ giữa đại cục quốc gia và nghĩa tình riêng biệt."
        : "A peasant warrior during the Later Le dynasty guarding a historic river port, torn between national destiny and personal affection."),
      icon: ScrollText,
    },
    {
      id: "scifi",
      title: t.starter_scifi_title || (lang === "vi" ? "Cyberpunk Sài Gòn 2099" : "Cyberpunk Saigon 2099"),
      badge: t.starter_scifi_badge || (lang === "vi" ? "Hư cấu cá nhân tự do" : "Unconstrained creative sci-fi"),
      prompt: t.starter_scifi_prompt || (lang === "vi"
        ? "Một thám tử tư trong khu ổ chuột ngầm Sài Gòn năm 2099, chuyên điều tra các vụ đánh cắp ký ức và nhân dạng số bất hợp pháp."
        : "A private eye in the subterranean districts of Saigon 2099, investigating illegal synthetic memory theft and cybernetic identity fraud."),
      icon: Cpu,
    },
    {
      id: "xianxia",
      title: t.starter_xianxia_title || (lang === "vi" ? "Tu Chân & Kỳ Ảo Đông Phương" : "Eastern cultivation fantasy"),
      badge: t.starter_xianxia_badge || (lang === "vi" ? "Sáng tạo thế giới độc bản • Bảo hộ IP" : "Original worldbuilding • Protected IP"),
      prompt: t.starter_xianxia_prompt || (lang === "vi"
        ? "Thiếu niên vô danh sở hữu thần hồn dị biến, từng bước phá giải cổ trận nghìn năm chôn vùi dưới cấm địa phong ấn đan điền."
        : "An unassuming youth with an anomalous soul core unravels a thousand-year-old array hidden beneath a forbidden realm."),
      icon: Flame,
    },
    {
      id: "life",
      title: t.starter_life_title || (lang === "vi" ? "Đời sống & Chữa lành" : "Urban life & healing"),
      badge: t.starter_life_badge || (lang === "vi" ? "Tâm lý sâu sắc • Show, don't tell" : "Introspective depth • Show, don't tell"),
      prompt: t.starter_life_prompt || (lang === "vi"
        ? "Hai tâm hồn cô đơn tình cờ gặp gỡ tại một quán cà phê sách mở thâu đêm ở phố cổ Hà Nội vào một đêm mưa lạnh, tìm thấy sự an ủi diệu kỳ."
        : "Two lonely souls meet by chance at an all-night book café in the Hanoi Old Quarter on a cold, rainy evening, discovering unexpected solace."),
      icon: BookOpen,
    },
  ], [lang, t]);

  const handleRetry = async (assistantMsgIndex: number, failedPrompt?: string) => {
    if (loading || isFinalizing) return;
    const promptToRetry = failedPrompt || (assistantMsgIndex > 0 ? messages[assistantMsgIndex - 1]?.content : "");
    if (!promptToRetry) return;

    // Retain history up to the user message that preceded this failed assistant turn
    const historyBeforeFailedAssistant = messages.slice(0, assistantMsgIndex);
    setLoading(true);

    try {
      const res = await api.chatInterview(historyBeforeFailedAssistant);
      if (res.status === "success" && res.message) {
        const cleanMsg = res.message.replace(/\[READY\]/g, "").trim();
        const isReadyFlag = !!(res.is_ready || res.message.includes("[READY]"));
        if (isReadyFlag) {
          setHasReadySignal(true);
        }
        const updated = [
          ...historyBeforeFailedAssistant,
          { role: "assistant" as const, content: cleanMsg, is_ready: isReadyFlag }
        ];
        setMessages(updated);
      } else {
        const fallbackText = generateDynamicClientFallback(promptToRetry, lang);
        const updated = [
          ...historyBeforeFailedAssistant,
          {
            role: "assistant" as const,
            content: fallbackText,
            is_offline_fallback: true,
            error_message: res?.message || (lang === "vi" ? "Mất kết nối với AI (Lỗi máy chủ)" : "Lost connection to AI (Server error)"),
            failed_prompt: promptToRetry,
          }
        ];
        setMessages(updated);
      }
    } catch (err: any) {
      const fallbackText = generateDynamicClientFallback(promptToRetry, lang);
      const updated = [
        ...historyBeforeFailedAssistant,
        {
          role: "assistant" as const,
          content: fallbackText,
          is_offline_fallback: true,
          error_message: err?.message || (lang === "vi" ? "Mất kết nối với AI (Lỗi mạng)" : "Lost connection to AI (Network error)"),
          failed_prompt: promptToRetry,
        }
      ];
      setMessages(updated);
    } finally {
      setLoading(false);
      // Restore focus to textarea so user can type immediately
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || loading || isFinalizing) return;

    const newHistory: ChatMessage[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await api.chatInterview(newHistory);
      if (res.status === "success" && res.message) {
        // Strip [READY] tag from assistant visible message prose
        const cleanMsg = res.message.replace(/\[READY\]/g, "").trim();
        const isReadyFlag = !!(res.is_ready || res.message.includes("[READY]"));
        if (isReadyFlag) {
          setHasReadySignal(true);
        }

        const updatedHistory: ChatMessage[] = [
          ...newHistory,
          { role: "assistant", content: cleanMsg, is_ready: isReadyFlag }
        ];
        setMessages(updatedHistory);
      } else {
        // Dynamic client fallback extracting concepts & providing retry
        const fallbackText = generateDynamicClientFallback(textToSend, lang);
        setMessages([
          ...newHistory,
          {
            role: "assistant",
            content: fallbackText,
            is_offline_fallback: true,
            error_message: res?.message || (lang === "vi" ? "Mất kết nối với AI (Lỗi máy chủ)" : "Lost connection to AI (Server error)"),
            failed_prompt: textToSend,
          }
        ]);
      }
    } catch (err: any) {
      console.error("Chat interview error:", err);
      const fallbackText = generateDynamicClientFallback(textToSend, lang);
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: fallbackText,
          is_offline_fallback: true,
          error_message: err?.message || (lang === "vi" ? "Mất kết nối với AI (Lỗi mạng hoặc ngoại tuyến)" : "Lost connection to AI (Network error)"),
          failed_prompt: textToSend,
        }
      ]);
    } finally {
      setLoading(false);
      // Restore focus to textarea so user can type immediately
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const triggerFinalize = async () => {
    if (messages.length === 0 && !input.trim()) return;
    setIsFinalizing(true);

    try {
      let historyToUse = [...messages];
      if (input.trim()) {
        historyToUse.push({ role: "user", content: input.trim() });
        setMessages(historyToUse);
        setInput("");
      }

      // Step 1: Call api.refinePrompt (1-2s compression into Refined Narrative Bible)
      let refined = "";
      if (historyToUse.length > 0) {
        try {
          const res = await api.refinePrompt(historyToUse);
          if (res.status === "success" && res.refined_prompt) {
            refined = res.refined_prompt;
          }
        } catch (e) {
          console.error("Refine prompt API error:", e);
        }
      }

      // Fallback if refine returned empty
      if (!refined) {
        const userTexts = historyToUse.filter((m) => m.role === "user").map((m) => m.content);
        refined = userTexts.join("\n\n") || (lang === "vi" ? "Một câu chuyện kịch tính, lôi cuốn." : "A captivating, thrilling story.");
      }

      // Step 2: Trigger seamless transition to StoryEditor
      await onStartWriting({
        refinedPrompt: refined,
        chatHistory: historyToUse,
        storyLength,
        modelTier,
      });
    } catch (err) {
      console.error("Error finalizing intake prompt:", err);
      const fallbackPrompt = messages.map((m) => m.content).join("\n") || input.trim();
      await onStartWriting({
        refinedPrompt: fallbackPrompt || "Một câu chuyện kịch tính, lôi cuốn.",
        chatHistory: messages,
        storyLength,
        modelTier,
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleResetChat = () => {
    if (messages.length === 0) return;
    const confirmMsg = t.intake_clear_confirm || (lang === "vi"
      ? "Bạn có chắc muốn xóa lịch sử trò chuyện và bắt đầu lại ý tưởng mới?"
      : "Are you sure you want to clear chat history and start a new story concept?");
    if (window.confirm(confirmMsg)) {
      setMessages([]);
      setInput("");
      setHasReadySignal(false);
      onClearHistory?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-50 dark:bg-black text-black dark:text-white relative font-sans">
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white dark:bg-black z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="max-w-[94px] truncate whitespace-nowrap text-xs font-bold tracking-tight text-black dark:text-white sm:max-w-none sm:text-sm">
                {t.intake_header_title || "NarrAI Co-creator"}
              </h2>
              <span className="hidden text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white sm:inline-flex">
                Q&A
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden md:block">
              {t.intake_header_sub || (lang === "vi"
                ? "Đa thể loại • Lịch sử Dân tộc chuẩn mực • Hư cấu tự do • Bảo hộ IP"
                : "Multi-genre • Authentic History • Creative Liberty • IP Protection")}
            </p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Reset Intake Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              disabled={loading || isFinalizing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-black dark:text-white transition-colors disabled:opacity-40"
              title={t.intake_clear_chat || (lang === "vi" ? "Làm mới trò chuyện" : "Reset intake chat")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === "vi" ? "Làm mới" : "Reset"}</span>
            </button>
          )}

          {/* Prominent Action Button: "Bắt đầu viết truyện ngay" / "Chốt cốt truyện" */}
          <button
            onClick={triggerFinalize}
            disabled={(messages.length === 0 && !input.trim()) || isFinalizing || isGenerating}
            className="px-3.5 py-1.5 rounded text-xs font-bold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            title={
              isReady
                ? (lang === "vi" ? "AI đã sẵn sàng! Chốt cốt truyện và chuyển thẳng sang chấp bút bản thảo" : "Ready! Finalize plot and start drafting manuscript")
                : (lang === "vi" ? "Bắt đầu viết truyện ngay với ý tưởng hiện tại" : "Start writing story now with current ideas")
            }
          >
            {isFinalizing ? (
              <span>[Đang xử lý...]</span>
            ) : isReady ? (
              <>
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bắt đầu viết ngay</span>
                <span className="sm:hidden">Viết ngay</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            ) : (
              <>
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.intake_finalize_plot || (lang === "vi" ? "Chốt cốt truyện" : "Finalize plot")}</span>
                <span className="sm:hidden">Chốt</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-6">
        <div className="max-w-4xl mx-auto w-full px-4 flex flex-col min-h-full justify-between">

          {/* Empty State: Warm Hero & 4 Starter Prompt Pills */}
          {messages.length === 0 && (
            <div className="my-auto py-6 sm:py-10 text-center flex flex-col items-center animate-fadeIn">
              <div className="px-3 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white font-mono text-sm font-bold mb-4">
                [NARR AI]
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight mb-2">
                {t.intake_welcome_title || (lang === "vi" ? "Bạn đang ấp ủ câu chuyện gì hôm nay?" : "What story are you dreaming of today?")}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mb-8 leading-relaxed">
                {t.intake_welcome_subtitle || (lang === "vi"
                  ? "Trò chuyện tự do bằng bất kỳ ý tưởng nào. NarrAI am hiểu mọi thể loại văn học, tôn trọng sự thật lịch sử và đồng hành cùng bạn từ ý niệm đầu tiên đến tác phẩm hoàn chỉnh."
                  : "Chat freely with any premise. NarrAI understands all literary genres, honors historical truth, and walks with you from initial spark to complete masterpiece.")}
              </p>

              {/* Starter Prompt Suggestion Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full text-left font-mono">
                {starterIdeas.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSend(item.prompt)}
                      className="p-5 rounded min-h-[140px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-colors text-left group shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2 font-sans">
                          <IconComp className="w-4 h-4 text-black dark:text-white shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-black dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded mb-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800">
                          {item.badge}
                        </span>
                        <p className="text-xs font-sans text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-mono font-bold text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>{lang === "vi" ? "Bắt đầu khám phá" : "Explore concept"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Message History with Spacious Bubbles & Markdown */}
          {messages.length > 0 && (
            <div className="space-y-6 pb-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fadeIn`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border font-mono text-xs font-bold ${
                        isUser
                          ? "bg-black text-white dark:bg-white dark:text-black border-neutral-700 dark:border-neutral-300"
                          : "bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] px-4.5 py-3.5 rounded-xl ${
                        isUser
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white shadow-xs"
                      }`}
                    >
                      <FormattedMarkdown content={msg.content} isUser={isUser} />

                      {/* Offline Fallback Connection Status & Retry Button */}
                      {!isUser && msg.is_offline_fallback && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-600 dark:text-neutral-400">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{lang === "vi" ? "Mất kết nối AI (Gợi ý dự phòng)" : "Lost AI connection (Fallback preview)"}</span>
                          </div>
                          <button
                            onClick={() => handleRetry(index, msg.failed_prompt)}
                            disabled={loading || isFinalizing}
                            className="px-2.5 py-1 rounded text-xs font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-black dark:text-white transition-all disabled:opacity-40 flex items-center gap-1"
                            title={lang === "vi" ? "Thử lại kết nối đến máy chủ AI" : "Retry connection to AI server"}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{lang === "vi" ? "Thử lại" : "Retry"}</span>
                          </button>
                        </div>
                      )}

                      {/* Ready Badge if assistant flagged readiness */}
                      {!isUser && msg.is_ready && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between font-mono text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-black dark:text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === "vi" ? "Cốt truyện đã định hình" : "Plot formed"}</span>
                          </div>
                          <button
                            onClick={triggerFinalize}
                            className="px-2.5 py-1 rounded text-xs font-bold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all flex items-center gap-1"
                          >
                            <span>{t.intake_start_writing_now || (lang === "vi" ? "Viết ngay" : "Write now")}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing State */}
              {loading && (
                <div className="flex items-start gap-3.5 animate-fadeIn">
                  <div className="w-9 h-9 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4.5 py-3.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {lang === "vi" ? "NarrAI đang suy nghĩ..." : "NarrAI is formulating..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>
      </div>

      {/* Bottom Input Dock */}
      <div className="shrink-0 p-3 sm:p-4 bg-neutral-50 dark:bg-black border-t border-neutral-200 dark:border-neutral-800 z-20">
        <div className="max-w-4xl mx-auto w-full px-4">

          {/* Quick Guidance & Readiness Notification Banner if ready */}
          {isReady && messages.length > 0 && !isFinalizing && (
            <div className="mb-2 px-3 py-1.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center justify-between text-xs text-black dark:text-white animate-fadeIn font-mono">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-sans font-normal">
                  {lang === "vi"
                    ? "Cốt truyện đã đủ độ chín! Bạn có thể bấm 'Bắt đầu viết truyện ngay' bất cứ lúc nào."
                    : "Plot premise is well formed! You can click 'Start writing story now' at any time."}
                </span>
              </div>
              <button
                onClick={triggerFinalize}
                className="font-bold underline hover:text-neutral-600 dark:hover:text-neutral-400 flex items-center gap-1 ml-2 shrink-0"
              >
                <span>{t.intake_jump_to_manuscript || (lang === "vi" ? "Chấp bút ngay" : "Draft now")}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input Capsule */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded p-2.5 sm:p-3 flex flex-col gap-2.5">

            {/* Controls Bar: Model Tier Selector & Story Length Pill */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-neutral-200 dark:border-neutral-800 pb-2 px-1 font-mono text-xs">
              {/* Compact model selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-neutral-500 uppercase shrink-0">
                  {t.intake_model_tier_label || (lang === "vi" ? "Mô hình:" : "Model:")}
                </span>
                <select
                  value={modelTier}
                  onChange={(e) => setModelTier(e.target.value as ModelTier)}
                  className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none cursor-pointer max-w-[120px] sm:max-w-[150px]"
                  title={lang === "vi" ? "Chọn cấp độ mô hình AI" : "Select AI model tier"}
                >
                  <option value="fast">{lang === "vi" ? "Nhanh" : "Fast"}</option>
                  <option value="versatile">{lang === "vi" ? "Linh hoạt" : "Versatile"}</option>
                  <option value="premium">{lang === "vi" ? "Cao cấp" : "Premium"}</option>
                </select>
              </div>

              {/* Story Length Pill Selector */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-500 px-1.5 hidden lg:inline uppercase">
                  {t.intake_length_label || (lang === "vi" ? "Độ dài:" : "Length:")}
                </span>
                {(["short", "medium", "long"] as StoryLength[]).map((len) => {
                  const isSelected = storyLength === len;
                  const labelMap = {
                    short: t.intake_len_short || (lang === "vi" ? "Ngắn" : "Short"),
                    medium: t.intake_len_medium || (lang === "vi" ? "Vừa" : "Medium"),
                    long: t.intake_len_long || (lang === "vi" ? "Tiểu thuyết" : "Novel"),
                  };
                  return (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setStoryLength(len)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        isSelected
                          ? "bg-black text-white dark:bg-white dark:text-black font-bold"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {labelMap[len]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Row: Auto-expanding Textarea & Send Button */}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading || isFinalizing}
                placeholder={
                  t.intake_input_placeholder || (lang === "vi"
                    ? "Nhập ý tưởng câu chuyện của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
                    : "Type your story concept... (Enter to send, Shift+Enter for newline)")
                }
                className="flex-1 max-h-40 min-h-[44px] bg-transparent resize-none px-3 py-2 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none leading-relaxed font-sans"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading || isFinalizing}
                className="px-4 h-10 rounded bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 flex items-center justify-center gap-1.5 shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs font-bold"
                title={t.intake_send || (lang === "vi" ? "Gửi ý tưởng" : "Send idea")}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Gửi" : "Send"}</span>
              </button>
            </div>
          </div>

          {/* Bottom Guardrail Footer */}
          <div className="flex items-center justify-between mt-2 px-2 text-[10px] sm:text-[11px] text-neutral-500 font-mono">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span>[BẢO MẬT]</span>
              <span className="min-w-0 truncate font-sans">
                {t.intake_guardrail_notice || (lang === "vi"
                  ? "Tự do hư cấu cá nhân • Tôn trọng lịch sử Dân tộc • Bảo mật tác quyền"
                  : "Creative freedom • Historical authenticity • IP copyright protected")}
              </span>
            </div>

            {messages.length > 0 && (
              <button
                onClick={triggerFinalize}
                disabled={isFinalizing}
                className="font-bold text-black dark:text-white hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>[{t.intake_start_writing_now || (lang === "vi" ? "Bắt đầu viết" : "Start writing")}] -&gt;</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default UnifiedIntakeChat;
