"use client";

import { useState, useEffect } from "react";
import { translations, Language } from "@/lib/i18n";
import { ComicPanel } from "@/lib/types";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  BookOpen, 
  PenTool,
  MessageSquareQuote
} from "lucide-react";

interface Props {
  panels: ComicPanel[];
  hasMore: boolean;
  lang: Language;
  onBackToEditor: () => void;
  onContinueComic: () => void;
  onAdaptToComic?: () => void;
  loadingMore: boolean;
  coinBalance?: number;
  onOpenCoinModal?: () => void;
}

function parseComicDialogue(rawText: string) {
  const clean = sanitizeComicCaption(rawText);
  if (!clean) return { speaker: null, text: "", isDialogue: false };

  // Match Speaker: "Speech" or Speaker: Speech
  const match = clean.match(/^([^:：]{2,25})[:：]\s*(.*)$/);
  if (match) {
    const speaker = match[1].trim();
    let text = match[2].trim();
    text = text.replace(/^["“](.*)["”]$/, "$1").trim();
    return { speaker, text, isDialogue: true };
  }

  // Check if text is wrapped in quotes
  const quoteMatch = clean.match(/^["“](.*)["”]$/);
  if (quoteMatch) {
    return { speaker: null, text: quoteMatch[1].trim(), isDialogue: true };
  }

  return { speaker: null, text: clean, isDialogue: false };
}

function ComicPanelFrame({ panel, t, lang, slot, eager }: {
  panel: ComicPanel;
  t: (typeof translations)[Language];
  lang: Language;
  slot: number;
  eager: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const imageUrl = api.getComicImageUrl(panel.image_url);
  const imageFailed = error || !imageUrl;
  const parsed = parseComicDialogue(panel.dialogue_text || "");

  // Auto-retry when GPU is rendering images sequentially in ComfyUI queue
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (error && retryKey < 25) {
      timer = setTimeout(() => {
        setError(false);
        setRetryKey((prev) => prev + 1);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [error, retryKey]);

  return (
    <figure className="manga-panel" data-slot={slot}>
      {/* Panel Index Pill Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
        <span>{lang === "vi" ? `Khung ${panel.panel_index || slot}` : `Panel ${panel.panel_index || slot}`}</span>
      </div>

      <div className={`manga-artwork${imageFailed ? " has-error" : ""}`}>
        {imageUrl && (
          <img
            key={retryKey}
            src={`${imageUrl}${imageUrl.includes("?") ? "&" : "?"}retry=${retryKey}`}
            alt={panel.image_prompt || (lang === "vi" ? "Khung truyện manga" : "Manga panel")}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => {
              setLoaded(true);
              setError(false);
            }}
            onError={() => {
              setLoaded(false);
              setError(true);
            }}
            className={loaded ? "is-loaded" : "is-loading"}
          />
        )}
      </div>

      {(imageFailed || !loaded || parsed.text) && (
        <figcaption className="manga-caption" aria-live={imageFailed ? "polite" : undefined}>
          {parsed.text && (
            <div className="mb-1.5">
              {parsed.isDialogue ? (
                <div className="flex flex-col gap-1">
                  {parsed.speaker && (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-xs dark:bg-red-700">
                        💬 {parsed.speaker}
                      </span>
                    </div>
                  )}
                  <p className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs font-semibold leading-relaxed text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100">
                    &ldquo;{parsed.text}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center rounded-sm bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase dark:bg-slate-700">
                      📖 {lang === "vi" ? "Bối cảnh / Diễn biến" : "Scene / Beat"}
                    </span>
                  </div>
                  <p className="rounded-md border border-slate-200/80 bg-slate-50/70 p-2 text-xs italic leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                    {parsed.text}
                  </p>
                </div>
              )}
            </div>
          )}

          {imageFailed ? (
            <div className="manga-image-error">
              <span>
                {error && retryKey < 25
                  ? (lang === "vi" 
                      ? `Đang xếp hàng vẽ qua GPU ComfyUI... (Lượt ${retryKey + 1}/25)` 
                      : `ComfyUI GPU rendering in progress... (Attempt ${retryKey + 1}/25)`)
                  : (t.panel_load_error || (lang === "vi" ? "Chưa tạo được ảnh. Hãy bấm thử lại để yêu cầu ảnh mới." : "Image generation failed. Click retry."))}
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setError(false);
                    setRetryKey(0);
                  }}
                  className="manga-image-retry"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t.retry_btn || (lang === "vi" ? "Thử lại ngay" : "Retry now")}</span>
                </button>
              )}
            </div>
          ) : !loaded ? (
            <span className="manga-image-status">{t.loading_comic}</span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}

function sanitizeComicCaption(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, "")
    .replace(/(\*\*|__|~~|`{1,3})([\s\S]*?)\1/g, "$2")
    .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=$|\s|[.,!?])/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoPages(panels: ComicPanel[], panelsPerPage = 4): ComicPanel[][] {
  const pages: ComicPanel[][] = [];
  for (let index = 0; index < panels.length; index += panelsPerPage) {
    pages.push(panels.slice(index, index + panelsPerPage));
  }
  return pages;
}

export function ComicViewer({
  panels,
  hasMore,
  lang,
  onBackToEditor,
  onContinueComic,
  loadingMore,
  coinBalance = 0,
  onOpenCoinModal,
}: Props) {
  const t = translations[lang];
  const pages = splitIntoPages(panels, 4);

  const totalPanels = panels.length;
  const completedBatches = Math.floor(totalPanels / 4);
  const isFreeTier = totalPanels < 12;
  const currentBatchNumber = Math.min(3, completedBatches + 1);
  const remainingFreeBatches = Math.max(0, 3 - completedBatches);

  const handleContinueClick = () => {
    if (!isFreeTier && coinBalance < 100) {
      if (onOpenCoinModal) onOpenCoinModal();
      return;
    }
    onContinueComic();
  };

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-[#e5e5e5] dark:bg-slate-950">
      {/* Navigation & Action Header */}
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-300 bg-white px-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBackToEditor}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
            title={t.back_to_editor}
            aria-label={t.back_to_editor}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden text-xs font-semibold sm:inline">{lang === "vi" ? "Bản thảo chữ" : "Manuscript"}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm dark:bg-red-500">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                {t.comic_view_title}
              </h2>
              <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                {lang === "vi" 
                  ? `Đã tạo ${totalPanels} khung tranh manga (4 khung/đợt đồng bộ phong cách)` 
                  : `${totalPanels} manga panels rendered (4 panels/batch, unified art)`}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges & Continue Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Free / Paid Progress Badge */}
          {isFreeTier ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 md:inline-flex">
              🎁 {lang === "vi" ? `Miễn phí: ${totalPanels}/12 khung (Đợt ${currentBatchNumber}/3)` : `Free: ${totalPanels}/12 panels (Batch ${currentBatchNumber}/3)`}
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 md:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {lang === "vi" ? `100 xu / 4 khung tiếp theo` : `100 coins / next 4 panels`}
            </span>
          )}

          {/* User Coin Balance */}
          {onOpenCoinModal && (
            <button
              type="button"
              onClick={onOpenCoinModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-all hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
              title={lang === "vi" ? "Nạp thêm xu" : "Top up coins"}
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span>{coinBalance}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">{lang === "vi" ? "xu" : "coins"}</span>
            </button>
          )}

          {/* Header Action Button */}
          {hasMore && (
            <button
              type="button"
              onClick={handleContinueClick}
              disabled={loadingMore}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow transition-all disabled:opacity-50 ${
                isFreeTier
                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingMore ? "animate-spin" : ""}`} />
              <span>
                {isFreeTier
                  ? (lang === "vi" ? `➕ Tạo tiếp 4 khung (Lần ${currentBatchNumber}/3 Free)` : `➕ Next 4 panels (Batch ${currentBatchNumber}/3 Free)`)
                  : (lang === "vi" ? "💎 Tạo tiếp 4 khung (100 xu)" : "💎 Next 4 panels (100 coins)")}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Manga Gallery */}
      <main className="flex-1 overflow-y-auto px-3 py-5 sm:px-8 sm:py-8">
        <div className="manga-pages">
          {pages.map((page, pageIndex) => (
            <section className="manga-page" key={`page-${pageIndex + 1}`} aria-label={`Trang ${pageIndex + 1}`}>
              <div className="col-span-full mb-1 flex items-center justify-between border-b border-slate-700 pb-1.5 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                  {lang === "vi" ? `Trang ${pageIndex + 1} (Khung ${pageIndex * 4 + 1} - ${pageIndex * 4 + page.length})` : `Page ${pageIndex + 1} (Panels ${pageIndex * 4 + 1} - ${pageIndex * 4 + page.length})`}
                </span>
                <span className="text-slate-400">NarrAI 2D Manga Studio</span>
              </div>
              {page.map((panel, panelIndex) => (
                <ComicPanelFrame
                  key={panel.panel_id || `${pageIndex}-${panelIndex}`}
                  panel={panel}
                  t={t}
                  lang={lang}
                  slot={panelIndex + 1}
                  eager={pageIndex === 0}
                />
              ))}
            </section>
          ))}
        </div>

        {/* Loading Indicator */}
        {loadingMore && (
          <div className="my-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm dark:border-emerald-800 dark:bg-slate-900/90" role="status">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></div>
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                {lang === "vi" ? "Đang phân tích kịch bản và vẽ tiếp 4 khung tranh..." : "AI Director is framing and drawing the next 4 panels..."}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {lang === "vi" ? "GPU đang xuất ảnh từng khung với phong cách Manga 2D sắc nét..." : "Rendering 2D manga panels sequentially..."}
              </p>
            </div>
          </div>
        )}

        {/* Continuation Action Banner at bottom of pages */}
        {!loadingMore && (
          <div className="mx-auto my-8 max-w-2xl">
            {hasMore ? (
              <div className={`rounded-2xl border p-6 text-center shadow-md backdrop-blur-sm ${
                isFreeTier 
                  ? "border-emerald-200 bg-gradient-to-b from-white to-emerald-50/50 dark:border-emerald-800/80 dark:from-slate-900 dark:to-emerald-950/30" 
                  : "border-amber-200 bg-gradient-to-b from-white to-amber-50/50 dark:border-amber-800/80 dark:from-slate-900 dark:to-amber-950/30"
              }`}>
                {isFreeTier ? (
                  <>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {lang === "vi" 
                        ? `🎉 Bạn còn ${remainingFreeBatches} lần tạo tranh MIỄN PHÍ!` 
                        : `🎉 You have ${remainingFreeBatches} FREE panel batches remaining!`}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {lang === "vi" 
                        ? `Đã tạo ${totalPanels}/12 khung miễn phí. Sau 12 khung (3 đợt x 4 khung), mỗi đợt 4 khung tiếp theo sẽ có phí 100 xu.` 
                        : `${totalPanels}/12 free panels generated. After 12 panels, each 4-panel batch costs 100 coins.`}
                    </p>
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={handleContinueClick}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>{lang === "vi" ? `Tạo tiếp 4 khung tranh (Miễn phí: Lần ${currentBatchNumber}/3)` : `Generate next 4 panels (Free: Batch ${currentBatchNumber}/3)`}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      <Coins className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {lang === "vi" ? "💎 Tiếp tục sáng tác 4 khung tranh Manga" : "💎 Continue Manga with 4 Next Panels"}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {lang === "vi" 
                        ? `Bạn đã hoàn thành 12 khung tranh miễn phí. Chi phí cho 4 khung tiếp theo là 100 xu (Số dư hiện tại: ${coinBalance} xu).` 
                        : `You have completed 12 free panels. Next 4 panels cost 100 coins (Your balance: ${coinBalance} coins).`}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      {coinBalance < 100 ? (
                        <button
                          type="button"
                          onClick={onOpenCoinModal}
                          className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg"
                        >
                          <Coins className="h-4 w-4" />
                          <span>{lang === "vi" ? `Nạp thêm xu (Hiện có ${coinBalance}/100 xu)` : `Top up coins (Have ${coinBalance}/100 coins)`}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleContinueClick}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{lang === "vi" ? "Dùng 100 xu để tạo tiếp 4 khung tranh" : "Spend 100 coins to create next 4 panels"}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === "vi" ? "✨ Đã chuyển thể toàn bộ nội dung bản thảo!" : "✨ All current manuscript text has been adapted!"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {lang === "vi" 
                    ? "Hãy quay lại Bản thảo chữ để viết tiếp chương tiếp theo hoặc chỉ đạo Copilot trước khi vẽ thêm tranh." 
                    : "Return to the text editor to draft the next chapter or direct Copilot before rendering more panels."}
                </p>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={onBackToEditor}
                    className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>{lang === "vi" ? "Quay lại Sáng tác Bản thảo" : "Back to Manuscript Editor"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
