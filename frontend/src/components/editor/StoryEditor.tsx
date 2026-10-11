"use client";

import { useEffect, useRef, useState } from "react";
import { translations, Language } from "@/lib/i18n";

interface Props {
  content: string;
  onContentChange: (newContent: string) => void;
  lang: Language;
  onToggleCopilot?: () => void;
  onAdaptToComic: () => void;
  onDownload: () => void;
  onPublish?: () => void;
  onSelectText: (text: string, cursorPosition?: number) => void;
  onQuickAction: (action: 'rewrite' | 'expand' | 'shorten', targetText?: string) => void;
  onOpenCustomAI?: (text: string) => void;
  narrativeMode?: string;
  modeLabel?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
}

function getCaretCharacterOffsetWithin(element: HTMLElement): { start: number; end: number } {
  let start = 0;
  let end = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (element.contains(range.commonAncestorContainer)) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      start = preCaretRange.toString().length;
      end = start + range.toString().length;
    }
  }
  return { start, end };
}

function sanitizeProseSafetyNet(text: string): string {
  if (!text) return "";
  let clean = String(text).trim();

  const candidateKeys = [
    "updated_story_content",
    "story_content",
    "story",
    "content",
    "new_story_content",
    "revised_text",
    "text",
  ];

  for (let i = 0; i < 5; i++) {
    const prev = clean;
    // Strip markdown code fences
    clean = clean.replace(/^```(?:json|markdown)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    if (
      (clean.startsWith("{") && clean.endsWith("}")) ||
      clean.includes('"updated_story_content"') ||
      clean.includes('"action_params"')
    ) {
      try {
        const parsed = JSON.parse(clean);
        if (typeof parsed === "string") {
          clean = parsed.trim();
        } else if (typeof parsed === "object" && parsed !== null) {
          let found: string | null = null;
          for (const k of candidateKeys) {
            const v = (parsed as Record<string, unknown>)[k];
            if (v && typeof v === "string") {
              found = v;
              break;
            }
          }
          if (!found && parsed.action_params && typeof parsed.action_params === "object") {
            const sub = parsed.action_params as Record<string, unknown>;
            for (const k of candidateKeys) {
              const v = sub[k];
              if (v && typeof v === "string") {
                found = v;
                break;
              }
            }
          }
          if (found) {
            clean = found.trim();
          }
        }
      } catch {
        const match = clean.match(
          /"updated_story_content"\s*:\s*"([\s\S]*?)(?:",\s*"(?:summary_of_changes|message|action|instruction)"\s*:|"\s*\}[\}\]]?\s*$)/
        );
        if (match && match[1]) {
          clean = match[1].trim();
        }
      }
    }

    if (clean.includes("\\n") || clean.includes("\\r") || clean.includes('\\"') || clean.includes("\\\\")) {
      clean = clean
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }

    if (clean === prev) break;
  }

  clean = clean.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  clean = clean.replace(/\n{3,}/g, "\n\n");

  // Strip all HTML tags completely — editor dùng innerText nên <b>, <i>, <em>... hiện raw
  clean = clean.replace(/<[^>]+>/g, "");

  // Unescape common HTML entities
  clean = clean
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Strip raw English dramatic beat meta-tags (Hook, Rising Friction, Turning Point, etc.)
  clean = clean.replace(/^\s*\*\*(?:Hook|Rising Friction(?:\s*\/\s*Complication)?|Turning Point|Visceral Climax|Lingering Cliffhanger|Beat\s*\d+|Nhịp\s*\d+)\*\*\s*\n?/gim, "");
  clean = clean.replace(/\*\*(?:Hook|Rising Friction(?:\s*\/\s*Complication)?|Turning Point|Visceral Climax|Lingering Cliffhanger)\*\*\s*/gi, "");

  return clean.trim();
}

export function StoryEditor({
  content,
  onContentChange,
  lang,
  onToggleCopilot,
  onAdaptToComic,
  onDownload,
  onPublish,
  onSelectText,
  onQuickAction,
  onOpenCustomAI,
  narrativeMode,
  modeLabel,
  isLoading,
  isStreaming,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const isTypingRef = useRef(false);
  const t = translations[lang];

  // Feature 23: Loading Skeleton state during Intake-to-Editor transition
  const isSkeletonVisible = Boolean(
    (isLoading || isStreaming) && (!content || content.trim().length === 0)
  );

  // Determine narrative mode (passed or auto-detected from content)
  const resolvedMode = (() => {
    if (narrativeMode) return narrativeMode.toUpperCase();
    const lower = (content || "").toLowerCase();
    const canonHeroes = ["trần hưng đạo", "bạch đằng", "quang trung", "lê lợi", "lý thường kiệt", "hai bà trưng", "ngô quyền", "đinh bộ lĩnh", "võ nguyên giáp", "điện biên phủ", "thánh gióng", "hùng vương", "an dương vương", "bà triệu", "như nguyệt", "ngọc hồi"];
    if (canonHeroes.some(h => lower.includes(h))) return "CHINH_SU";
    const daSuTerms = ["thời nhà trần", "thời nhà lê", "thời nguyễn", "thời lý", "kinh thành thăng long", "cấm vệ quân", "nghĩa quân"];
    if (daSuTerms.some(term => lower.includes(term))) return "DA_SU";
    return "HU_CAU_TU_DO";
  })();

  const resolvedLabel = (() => {
    if (modeLabel) return modeLabel;
    if (resolvedMode === "CHINH_SU") return "Chính sử";
    if (resolvedMode === "DA_SU") return "Dã sử";
    return "Hư cấu tự do";
  })();

  // Sync content when streaming or loaded externally
  useEffect(() => {
    if (editorRef.current && !isTypingRef.current) {
      const displayContent = sanitizeProseSafetyNet(content);
      if (editorRef.current.innerText !== displayContent) {
        editorRef.current.innerText = displayContent;
      }
    }
  }, [content, isSkeletonVisible]);

  // Calculate word count
  const words = content.trim() ? content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  // Handle text selection for floating toolbar and DOM caret position calculation
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) {
      setFloatingPos(null);
      setSelectedText("");
      onSelectText("");
      return;
    }

    const { start } = getCaretCharacterOffsetWithin(editorRef.current);

    if (selection.isCollapsed) {
      setFloatingPos(null);
      setSelectedText("");
      onSelectText("", start);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingPos({
        x: Math.max(10, rect.left + rect.width / 2 - 140),
        y: Math.max(10, rect.top - 48 + window.scrollY),
      });
      setSelectedText(text);
      onSelectText(text, start);
    } else {
      setFloatingPos(null);
      setSelectedText("");
      onSelectText("", start);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-neutral-100 dark:bg-black transition-colors font-sans">
      {/* Editor Top Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 sm:px-6 flex items-center justify-between gap-2 shrink-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h2 className="max-w-[82px] sm:max-w-none font-bold text-xs sm:text-sm text-black dark:text-white font-mono uppercase tracking-wider truncate">
            {t.editor_title}
          </h2>
          <span className="hidden sm:inline-flex text-xs font-mono font-bold px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
            {words} {t.words}
          </span>
          {/* Narrative Mode Badge */}
          <div
            className="hidden md:inline-flex items-center text-xs px-2.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white font-mono font-bold"
            title={`Chế độ sáng tác: ${resolvedLabel}`}
          >
            <span>[{resolvedLabel}]</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {onToggleCopilot && (
            <button
              type="button"
              onClick={onToggleCopilot}
              className="lg:hidden px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-black dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <span>{lang === "vi" ? "[Trợ lý]" : "[Assistant]"}</span>
            </button>
          )}
          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-black dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              title={lang === "vi" ? "Lưu bản thảo và xuất bản lên Bảng tin cộng đồng" : "Save and publish to community feed"}
            >
              <span>[{t.btn_publish}]</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAdaptToComic}
            className="px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <span>[{t.comic_btn}]</span>
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-black dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <span>[{t.download_btn}]</span>
          </button>
        </div>
      </div>

      {/* Manuscript Reading Paper Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        <div className="relative w-full max-w-3xl min-h-[85vh] bg-white dark:bg-black rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 sm:p-14 transition-colors">
          {isSkeletonVisible ? (
            <div
              className="space-y-6 animate-pulse select-none"
              data-testid="manuscript-loading-skeleton"
            >
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-black dark:text-white">
                    [ĐANG SOẠN]
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-white font-serif tracking-wide">
                      {lang === "vi" ? "Đang khởi tạo bản thảo văn học..." : "Composing literary manuscript..."}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {lang === "vi"
                        ? "AI đang kiến tạo dàn ý, thiết lập phân cảnh và chấp bút những dòng đầu tiên..."
                        : "AI is structuring narrative beats and drafting opening lines..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white text-xs font-mono">
                  <span>[NARR AI]</span>
                </div>
              </div>

              {/* Animated pulse placeholder title bar */}
              <div className="h-9 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 shadow-sm mb-8" />

              {/* Multi-line shimmering paragraph blocks */}
              <div className="space-y-3.5">
                <div className="h-4 w-[90%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[80%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[95%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[70%] rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>

              {/* Decorative separator */}
              <div className="py-2 flex items-center justify-center opacity-60">
                <div className="w-20 h-0.5 bg-neutral-300 dark:bg-neutral-700" />
              </div>

              {/* Shimmer paragraph 2 */}
              <div className="space-y-3.5">
                <div className="h-4 w-[92%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[85%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[90%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[75%] rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>

              {/* Shimmer paragraph 3 */}
              <div className="space-y-3.5 pt-2">
                <div className="h-4 w-[88%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[95%] rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-[65%] rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onFocus={() => { isTypingRef.current = true; }}
              onBlur={() => { isTypingRef.current = false; }}
              onInput={(e) => {
                const newTxt = e.currentTarget.innerText;
                onContentChange(newTxt);
              }}
              className="outline-none font-serif text-black dark:text-white text-base sm:text-lg leading-[1.85] tracking-wide whitespace-pre-wrap min-h-[70vh]"
              data-placeholder={t.editor_placeholder}
            />
          )}
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      {floatingPos && (
        <div
          style={{ left: `${floatingPos.x}px`, top: `${floatingPos.y}px` }}
          className="fixed z-40 flex items-center gap-1.5 p-1.5 bg-neutral-900 dark:bg-neutral-950 text-white rounded border border-neutral-700 shadow-xl animate-in fade-in zoom-in-95 duration-150 font-mono text-xs"
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onQuickAction("rewrite", selectedText);
              setFloatingPos(null);
            }}
            className="px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors"
          >
            [Viết lại]
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onQuickAction("expand", selectedText);
              setFloatingPos(null);
            }}
            className="px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors"
          >
            [Mở rộng]
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onQuickAction("shorten", selectedText);
              setFloatingPos(null);
            }}
            className="px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors"
          >
            [Rút gọn]
          </button>
          {onOpenCustomAI && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onOpenCustomAI(selectedText);
                setFloatingPos(null);
              }}
              className="px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors"
            >
              [AI]
            </button>
          )}
        </div>
      )}
    </div>
  );
}
