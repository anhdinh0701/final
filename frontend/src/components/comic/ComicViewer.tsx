"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Coins, Sparkles, RefreshCw } from "lucide-react";
import { translations, Language } from "@/lib/i18n";
import { ComicPanel } from "@/lib/types";
import { api } from "@/lib/api";

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

  const parsed = parseComicDialogue(panel.dialogue_text || "");
  const dialogueText = parsed.text || sanitizeComicCaption(panel.dialogue_text || "");
  const speakerName = parsed.speaker;
  const isDialogue = parsed.isDialogue;

  const panelIdentifier = panel.id || panel.panel_id;
  const rawUrl = panel.image_url || (panelIdentifier ? `/api/comic/image/${panelIdentifier}` : "");
  const fullUrl = rawUrl ? api.getComicImageUrl(rawUrl) : "";
  const imageUrl = fullUrl
    ? `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}v=${retryKey}&retry=${retryKey}&t=${retryKey}&refresh=${retryKey > 0 ? "true" : "false"}`
    : "";
  const imageFailed = !imageUrl || error;

  return (
    <figure className="manga-panel relative" data-slot={slot}>
      <div className={`manga-artwork relative overflow-hidden ${imageFailed ? "has-error" : ""}`}>
        {/* Loading overlay when waiting for ComfyUI GPU generation */}
        {imageUrl && !loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-xs font-mono z-10 animate-fadeIn">
            <RefreshCw className="w-5 h-5 animate-spin text-black dark:text-white mb-2" />
            <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
              {lang === "vi" ? "Đang tạo tranh ComfyUI..." : "Generating Manga..."}
            </span>
            <p className="mt-1 text-[11px] text-neutral-500 max-w-xs">
              {lang === "vi"
                ? "Mô hình AI đang kết xuất tranh manga qua GPU..."
                : "AI model is rendering high-fidelity artwork via GPU..."}
            </p>
          </div>
        )}

        {imageUrl && !error ? (
          <img
            src={imageUrl}
            alt={dialogueText || `Manga panel ${panel.panel_index}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={loaded ? "is-loaded" : "is-loading opacity-0"}
            onLoad={() => {
              setLoaded(true);
              setError(false);
            }}
            onError={() => {
              if (retryKey < 5) {
                // Auto-retry after 5s to allow queued GPU jobs to complete
                setTimeout(() => {
                  setError(false);
                  setRetryKey((k) => k + 1);
                }, 5000);
              } else {
                setError(true);
              }
            }}
          />
        ) : null}

        {imageFailed && (
          <div className="flex flex-col items-center justify-center p-6 text-center font-mono">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {lang === "vi" ? "[Chưa có hình ảnh]" : "[Image not loaded]"}
            </span>
            <p className="mt-2 text-[11px] text-neutral-400 max-w-xs">
              {lang === "vi" 
                ? "Máy chủ hình ảnh hoặc ComfyUI chưa sẵn sàng." 
                : "Image renderer or ComfyUI is not ready."}
            </p>
            {imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setError(false);
                  setLoaded(false);
                  setRetryKey((k) => k + 1);
                }}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded border border-neutral-400 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900 transition-colors cursor-pointer active:scale-95 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Thử lại kết nối tranh" : "Retry render"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {dialogueText && (
        <figcaption className="manga-caption">
          {speakerName ? (
            <p className="font-sans text-xs leading-relaxed text-black dark:text-neutral-900">
              <strong className="font-bold uppercase tracking-wide mr-1.5 font-mono">{speakerName}:</strong>
              <span>{dialogueText}</span>
            </p>
          ) : isDialogue ? (
            <p className="font-sans text-xs italic leading-relaxed text-black dark:text-neutral-900">
              &ldquo;{dialogueText}&rdquo;
            </p>
          ) : (
            <p className="font-sans text-xs leading-relaxed text-neutral-800 dark:text-neutral-800">
              {dialogueText}
            </p>
          )}

          {imageFailed ? (
            <div className="manga-image-error mt-2 pt-1 border-t border-neutral-200">
              <span className="text-[11px] font-mono text-neutral-500">
                {lang === "vi" ? "Chưa tải được ảnh." : "Failed to load image."}
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setError(false);
                    setLoaded(false);
                    setRetryKey((k) => k + 1);
                  }}
                  className="text-xs font-mono font-bold underline text-black dark:text-neutral-900 cursor-pointer ml-1.5"
                >
                  [{lang === "vi" ? "Thử lại" : "Retry"}]
                </button>
              )}
            </div>
          ) : !loaded ? (
            <span className="manga-image-status block mt-1 text-[11px] font-mono text-neutral-400 animate-pulse">
              {lang === "vi" ? "Đang kết nối ComfyUI & tạo tranh..." : t.loading_comic}
            </span>
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
  onAdaptToComic,
  loadingMore,
  coinBalance = 100,
  onOpenCoinModal,
}: Props) {
  const t = translations[lang];
  const pages = splitIntoPages(panels, 4);

  const totalPanels = panels.length;
  const isFreeTier = totalPanels < 12;
  const remainingFreeBatches = Math.max(0, 3 - Math.floor(totalPanels / 4));
  const currentBatchNumber = Math.min(3, Math.floor(totalPanels / 4) + 1);

  const [comfyStatus, setComfyStatus] = useState<{ available: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    api.getComfyUIStatus().then((res) => {
      if (active) setComfyStatus({ available: !!res.available });
    }).catch(() => {
      if (active) setComfyStatus({ available: false });
    });
    return () => { active = false; };
  }, []);

  const handleContinueClick = () => {
    if (!isFreeTier && coinBalance < 100) {
      if (onOpenCoinModal) {
        onOpenCoinModal();
        return;
      }
    }
    onContinueComic();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 text-black dark:bg-black dark:text-white font-sans select-none">
      {/* Top Bar Header */}
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToEditor}
            className="flex items-center gap-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white transition-colors"
            title={t.back_to_editor}
            aria-label={t.back_to_editor}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.back_to_editor || (lang === "vi" ? "Bản thảo chữ" : "Editor")}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-xs font-mono font-bold">
              MANGA
            </span>
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white font-mono sm:text-base">
                {t.comic_view_title}
              </h2>
              <p className="hidden text-[11px] font-mono text-neutral-500 sm:block">
                {lang === "vi" 
                  ? `Đã tạo ${totalPanels} khung tranh manga (4 khung/đợt)` 
                  : `${totalPanels} manga panels rendered (4 panels/batch)`}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges & Continue Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ComfyUI GPU Status Badge */}
          <div
            className="hidden items-center gap-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-mono font-bold lg:inline-flex"
            title={comfyStatus?.available ? "ComfyUI GPU đang kết nối qua ngrok" : "Đang kết nối ComfyUI qua ngrok"}
          >
            <span className={`w-2 h-2 rounded-full ${comfyStatus?.available ? "bg-black dark:bg-white" : "bg-neutral-400 animate-pulse"}`} />
            <span>{comfyStatus?.available ? "COMFYUI GPU: SẴN SÀNG" : "COMFYUI GPU: ĐANG KẾT NỐI"}</span>
          </div>
          {/* Free / Paid Progress Badge */}
          {isFreeTier ? (
            <span className="hidden items-center rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-mono font-bold text-black dark:text-white md:inline-flex">
              {lang === "vi" ? `[MIỄN PHÍ: ${totalPanels}/12 KHUNG]` : `[FREE: ${totalPanels}/12 PANELS]`}
            </span>
          ) : (
            <span className="hidden items-center rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-mono font-bold text-black dark:text-white md:inline-flex">
              {lang === "vi" ? `[100 XU / 4 KHUNG TIẾP THEO]` : `[100 COINS / NEXT 4 PANELS]`}
            </span>
          )}

          {/* User Coin Balance */}
          {onOpenCoinModal && (
            <button
              type="button"
              onClick={onOpenCoinModal}
              className="flex items-center gap-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 px-2.5 py-1.5 text-xs font-mono font-bold text-black dark:text-white transition-colors"
              title={lang === "vi" ? "Nạp thêm xu" : "Top up coins"}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{coinBalance} XU</span>
            </button>
          )}

          {/* Header Action Button */}
          {hasMore && (
            <button
              type="button"
              onClick={handleContinueClick}
              disabled={loadingMore}
              className="flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {loadingMore
                  ? (lang === "vi" ? "Đang vẽ tranh..." : "Rendering...")
                  : isFreeTier
                    ? (lang === "vi" ? `Tạo tiếp 4 khung (Lần ${currentBatchNumber}/3 Free)` : `Next 4 Panels (Batch ${currentBatchNumber}/3 Free)`)
                    : (lang === "vi" ? "Tạo tiếp 4 khung (100 Xu)" : "Next 4 Panels (100 Coins)")}
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
              <div className="col-span-full mb-1 flex items-center justify-between border-b border-neutral-800 pb-1.5 text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-2 text-white font-bold">
                  <span>[TRANG {pageIndex + 1}]</span>
                  <span>(Khung {pageIndex * 4 + 1} - {pageIndex * 4 + page.length})</span>
                </span>
                <span className="text-neutral-500">NarrAI 2D Manga Studio</span>
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
          <div className="my-8 flex flex-col items-center justify-center gap-3 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 text-center shadow-lg font-mono" role="status">
            <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">
              [ĐANG PHÂN TÍCH KỊCH BẢN VÀ VẼ TIẾP 4 KHUNG TRANH...]
            </span>
            <p className="text-xs text-neutral-500 max-w-md">
              {lang === "vi" 
                ? "Hệ thống đang bảo toàn Visual DNA nhân vật và bối cảnh lịch sử qua ComfyUI GPU..." 
                : "Rendering sequential manga panels with consistent Visual DNA..."}
            </p>
          </div>
        )}

        {/* Continuation Action Banner at bottom of pages */}
        {!loadingMore && (
          <div className="mx-auto my-8 max-w-2xl">
            {hasMore ? (
              <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-6 text-center shadow font-mono">
                {isFreeTier ? (
                  <>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                      [QUYỀN LỢI MIỄN PHÍ]
                    </div>
                    <h3 className="text-base font-bold text-black dark:text-white">
                      {lang === "vi" 
                        ? `Còn ${remainingFreeBatches} đợt tạo tranh MIỄN PHÍ!` 
                        : `You have ${remainingFreeBatches} FREE panel batches remaining!`}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {lang === "vi" 
                        ? `Đã tạo ${totalPanels}/12 khung miễn phí. Sau 12 khung, mỗi đợt 4 khung tiếp theo sẽ có phí 100 xu.` 
                        : `${totalPanels}/12 free panels generated. After 12 panels, each batch costs 100 coins.`}
                    </p>
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={handleContinueClick}
                        className="rounded px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow"
                      >
                        <span>{lang === "vi" ? `[TẠO TIẾP 4 KHUNG TRANH - ĐỢT ${currentBatchNumber}/3 FREE]` : `[GENERATE NEXT 4 PANELS - BATCH ${currentBatchNumber}/3 FREE]`}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                      [GIA HẠN MANGA]
                    </div>
                    <h3 className="text-base font-bold text-black dark:text-white">
                      {lang === "vi" ? "Tiếp tục sáng tác 4 khung tranh Manga" : "Continue Manga with 4 Next Panels"}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {lang === "vi" 
                        ? `Đã hoàn thành 12 khung miễn phí. Chi phí cho 4 khung tiếp theo: 100 xu (Số dư hiện tại: ${coinBalance} xu).` 
                        : `Free tier completed. Next 4 panels cost 100 coins (Your balance: ${coinBalance} coins).`}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      {coinBalance < 100 ? (
                        <button
                          type="button"
                          onClick={onOpenCoinModal}
                          className="rounded px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow"
                        >
                          <span>{lang === "vi" ? `[NẠP THÊM XU - HIỆN CÓ ${coinBalance}/100 XU]` : `[TOP UP COINS - HAVE ${coinBalance}/100 COINS]`}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleContinueClick}
                          className="rounded px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow"
                        >
                          <span>{lang === "vi" ? "[DÙNG 100 XU ĐỂ TẠO TIẾP 4 KHUNG TRANH]" : "[SPEND 100 COINS TO CREATE NEXT 4 PANELS]"}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-6 text-center shadow font-mono">
                <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  [HOÀN TẤT CHUYỂN THỂ]
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  {lang === "vi" ? "Đã chuyển thể toàn bộ nội dung bản thảo hiện tại!" : "All current manuscript text has been adapted!"}
                </h3>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {lang === "vi" 
                    ? "Hãy quay lại Bản thảo chữ để viết tiếp chương tiếp theo trước khi vẽ thêm tranh." 
                    : "Return to the text editor to draft the next chapter before rendering more panels."}
                </p>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={onBackToEditor}
                    className="rounded px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow"
                  >
                    <span>{lang === "vi" ? "[QUAY LẠI SÁNG TÁC BẢN THẢO]" : "[BACK TO MANUSCRIPT EDITOR]"}</span>
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
