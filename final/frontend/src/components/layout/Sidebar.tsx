"use client";

import Image from "next/image";
import { translations, Language } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  username: string;
  fullName?: string;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onNewStory: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  coinBalance?: number;
  onOpenCoinTopup?: () => void;
  onOpenMessenger?: () => void;
  unreadCount?: number;
  activeTab?: "setup" | "editor" | "comic" | "posts" | "pipeline";
  onTabChange?: (tab: "setup" | "editor" | "comic" | "posts" | "pipeline") => void;
  hasActiveStory?: boolean;
  hasActiveComic?: boolean;
}

export function Sidebar({
  username,
  fullName,
  lang,
  onLanguageChange,
  onNewStory,
  onOpenHistory,
  onLogout,
  coinBalance = 100,
  onOpenCoinTopup,
  onOpenMessenger,
  unreadCount = 0,
  activeTab = "setup",
  onTabChange,
  hasActiveStory = false,
  hasActiveComic = false,
}: Props) {
  const t = translations[lang];
  const displayName = fullName || username;

  return (
    <aside className="hidden lg:flex w-64 h-screen border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black text-black dark:text-white flex-col justify-between p-4 select-none shrink-0 transition-colors z-10 font-sans">
      <div>
        {/* Logo (Official Brand Logo) */}
        <div className="px-2 py-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/logo.png"
              alt="NARR AI Logo"
              width={30}
              height={30}
              className="w-7 h-7 object-contain rounded bg-black"
              priority
            />
            <h1 className="font-bold text-base tracking-widest uppercase text-black dark:text-white font-mono">NarrAI</h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mt-1.5 font-mono">
            {lang === "vi" ? "Không gian sáng tác" : "Writing workspace"}
          </p>
        </div>

        {/* User Card (Pure Monochrome) */}
        <div className="p-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 mb-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-black dark:text-white truncate font-mono">
                {displayName || t.not_logged_in}
              </span>
              {fullName && username && (
                <span className="text-[10px] text-neutral-500 truncate font-mono">
                  @{username}
                </span>
              )}
            </div>
            {username && (
              <button
                type="button"
                onClick={onLogout}
                className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white uppercase px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600 transition-colors"
                title={t.logout}
              >
                Thoát
              </button>
            )}
          </div>

          {/* Coin Badge (Typography Badge) */}
          <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenCoinTopup}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono transition-colors"
            >
              <span className="text-neutral-500 uppercase tracking-wider">Số dư xu</span>
              <span className="font-bold text-black dark:text-white font-mono">{coinBalance} XU</span>
            </button>
          </div>
        </div>

        {/* Menu Navigation (Zero Icons, Pure Typography) */}
        <div className="space-y-1.5">
          {/* Sáng tác mới */}
          <button
            type="button"
            onClick={() => {
              onNewStory();
              onTabChange?.("setup");
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors ${
              activeTab === "setup"
                ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900"
            }`}
          >
            <span>{t.tab_create || t.new_story}</span>
            {activeTab === "setup" && <span className="text-[10px] font-mono">[•]</span>}
          </button>

          {/* Bản thảo (Editor) */}
          {hasActiveStory && (
            <button
              type="button"
              onClick={() => onTabChange?.("editor")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors ${
                activeTab === "editor"
                  ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900"
              }`}
            >
              <span>{t.tab_editor}</span>
              {activeTab === "editor" && <span className="text-[10px] font-mono">[•]</span>}
            </button>
          )}

          {/* Truyện tranh (Comic) */}
          {hasActiveComic && (
            <button
              type="button"
              onClick={() => onTabChange?.("comic")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors ${
                activeTab === "comic"
                  ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900"
              }`}
            >
              <span>{t.tab_comic}</span>
              {activeTab === "comic" && <span className="text-[10px] font-mono">[•]</span>}
            </button>
          )}

          {/* Mạng xã hội / Cộng đồng tác giả */}
          <button
            type="button"
            onClick={() => onTabChange?.("posts")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors ${
              activeTab === "posts"
                ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900"
            }`}
          >
            <span>{lang === "vi" ? "Mạng xã hội" : "Community"}</span>
            {activeTab === "posts" && <span className="text-[10px] font-mono">[•]</span>}
          </button>

          {/* Câu chuyện */}
          <button
            type="button"
            onClick={() => onTabChange?.("pipeline")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors ${
              activeTab === "pipeline"
                ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900"
            }`}
          >
            <span>{lang === "vi" ? "Câu chuyện" : "Stories"}</span>
            {activeTab === "pipeline" && <span className="text-[10px] font-mono">[•]</span>}
          </button>

          {/* Lịch sử */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors"
          >
            <span>{t.story_history}</span>
          </button>

          {/* Open Messenger */}
          <button
            type="button"
            onClick={onOpenMessenger}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wider uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors"
          >
            <span>{lang === "vi" ? "Hộp thư Messenger" : "Messenger"}</span>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-black text-white dark:bg-white dark:text-black rounded">
                {unreadCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-neutral-500">[ON]</span>
            )}
          </button>
        </div>
      </div>

      {/* Footer controls (Black & White) */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-1">
        <LanguageSwitcher currentLang={lang} onLanguageChange={onLanguageChange} />
        <ThemeToggle lang={lang} />
      </div>
    </aside>
  );
}
