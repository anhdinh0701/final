"use client";

import Image from "next/image";
import { translations, Language } from "@/lib/i18n";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onExploreCommunity?: () => void;
}

export function LandingView({ lang, onLanguageChange, onOpenAuth, onExploreCommunity }: Props) {
  const t = translations[lang];

  return (
    <main className="landing-backdrop min-h-screen px-3 py-3 text-black transition-colors sm:px-6 sm:py-6 dark:text-white bg-neutral-100 dark:bg-black font-sans">
      <div className="landing-shell mx-auto max-w-[1440px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        {/* Navigation Bar */}
        <nav
          aria-label={lang === "vi" ? "Điều hướng chính" : "Main navigation"}
          className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-8 lg:px-10 border-b border-neutral-200 dark:border-neutral-800"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-3 rounded-lg text-left"
            aria-label="NarrAI"
          >
            <Image
              src="/assets/logo.png"
              alt="NARR AI Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain rounded-md bg-black"
              priority
            />
            <span className="font-mono text-xl font-bold tracking-wider uppercase">NarrAI</span>
            <span className="hidden rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-black dark:text-white sm:inline">
              {t.pro_badge}
            </span>
          </button>

          <div className="landing-header-controls flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={lang} onLanguageChange={onLanguageChange} />
            <ThemeToggle lang={lang} />
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label={t.login}
              className="rounded px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
            >
              {t.login}
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-9 sm:px-8 sm:pb-20 sm:pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-12 lg:pb-24 lg:pt-14">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
              <span>[NARRATIVE PLATFORM]</span>
              <span>—</span>
              <span>{t.hero_badge}</span>
            </p>
            <h1 className="mx-auto max-w-2xl font-serif text-4xl font-bold leading-[1.15] tracking-tight text-black dark:text-white sm:text-5xl lg:mx-0 lg:text-6xl">
              {t.hero_title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg sm:leading-8 lg:mx-0">
              {t.hero_sub}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex min-h-12 items-center justify-center rounded px-6 py-3.5 text-sm font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-md sm:text-base"
              >
                {t.hero_cta}
              </button>
              <button
                type="button"
                onClick={onExploreCommunity ?? onOpenAuth}
                className="inline-flex min-h-12 items-center justify-center rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-5 py-3.5 text-sm font-mono font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors sm:text-base"
              >
                {lang === "vi" ? "Khám phá cộng đồng" : "Explore community"}
              </button>
            </div>

            <p className="mt-6 text-xs font-mono text-neutral-500">
              {lang === "vi"
                ? "Phát triển ý tưởng · Viết và biên tập · Chuyển thể thành truyện tranh"
                : "Develop ideas · Write and edit · Adapt into comics"}
            </p>
          </div>

          {/* Book / Comic Illustration (Monochrome) */}
          <div
            className="relative mx-auto w-full max-w-[590px] px-2 pb-6 pt-2 sm:px-6"
            aria-label={lang === "vi" ? "Minh họa bản thảo và truyện tranh" : "Manuscript and comic illustration"}
          >
            <div className="landing-book-scene border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50 dark:bg-neutral-900">
              <div className="landing-book border border-neutral-300 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-black">
                <div className="landing-book-page landing-book-page-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">{lang === "vi" ? "BẢN THẢO" : "MANUSCRIPT"}</span>
                  <h2 className="text-base font-serif font-bold mt-2 text-black dark:text-white">{lang === "vi" ? "Chương mở đầu" : "The first chapter"}</h2>
                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
                  <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-serif">
                    {lang === "vi"
                      ? "Mưa đổ xuống mái ngói cũ. Trong căn phòng nhỏ, một câu chuyện đang chờ được viết tiếp."
                      : "Rain fell on the old roof. In a quiet room, a story waited to be continued."}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
                <span>[MANGA ADAPTATION]</span>
                <span>{lang === "vi" ? "Từ trang viết đến khung truyện" : "From prose to sequential panels"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 border-t border-neutral-200 dark:border-neutral-800 pt-10">
          <div className="mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
              {t.features_section_title}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-black dark:text-white sm:text-3xl">
              {lang === "vi" ? "Mọi chặng đường của câu chuyện" : "Every stage of your story"}
            </h2>
          </div>

          <div className="grid divide-y divide-neutral-200 dark:divide-neutral-800 md:grid-cols-3 md:divide-x md:divide-y-0">
            <article className="py-6 md:py-2 md:pr-8">
              <div className="mb-3 text-xs font-mono font-bold tracking-widest text-neutral-500">
                [BƯỚC 01]
              </div>
              <h3 className="font-serif text-lg font-bold text-black dark:text-white">{t.feat1_title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{t.feat1_desc}</p>
            </article>

            <article className="py-6 md:px-8 md:py-2">
              <div className="mb-3 text-xs font-mono font-bold tracking-widest text-neutral-500">
                [BƯỚC 02]
              </div>
              <h3 className="font-serif text-lg font-bold text-black dark:text-white">{t.feat2_title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{t.feat2_desc}</p>
            </article>

            <article className="py-6 md:py-2 md:pl-8">
              <div className="mb-3 text-xs font-mono font-bold tracking-widest text-neutral-500">
                [BƯỚC 03]
              </div>
              <h3 className="font-serif text-lg font-bold text-black dark:text-white">{t.feat3_title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{t.feat3_desc}</p>
            </article>
          </div>

          {/* Heritage Section */}
          <section
            aria-labelledby="heritage-heading"
            className="mt-12 border-y border-neutral-200 dark:border-neutral-800 py-8 sm:mt-16 sm:py-10"
          >
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="max-w-xl">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
                  {t.heritage_eyebrow}
                </p>
                <h2
                  id="heritage-heading"
                  className="mt-3 font-serif text-2xl font-bold leading-tight tracking-tight text-black dark:text-white sm:text-3xl"
                >
                  {t.heritage_title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                  {t.heritage_desc}
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="mt-5 inline-flex items-center text-sm font-mono font-bold uppercase tracking-wider text-black dark:text-white underline hover:opacity-80 transition-opacity"
                >
                  {t.heritage_cta}
                </button>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {[
                  { number: "[01]", title: t.heritage_history_title, description: t.heritage_history_desc },
                  { number: "[02]", title: t.heritage_culture_title, description: t.heritage_culture_desc },
                  { number: "[03]", title: t.heritage_community_title, description: t.heritage_community_desc },
                ].map((item) => (
                  <article key={item.number} className="grid grid-cols-[3rem_1fr] gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="pt-0.5 text-xs font-mono font-bold text-neutral-500">
                      {item.number}
                    </span>
                    <div>
                      <h3 className="font-serif text-base font-bold text-black dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Safety & Community Footer Banner */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-y border-neutral-200 dark:border-neutral-800 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white rounded">
                [BẢO ĐẢM]
              </span>
              <div>
                <h3 className="font-serif text-base font-bold text-black dark:text-white">
                  {lang === "vi" ? "Sáng tác với sự an tâm" : "Create with confidence"}
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {lang === "vi"
                    ? "Có thêm lớp kiểm tra nội dung lịch sử và hỗ trợ lưu bản nháp khi quá trình sinh truyện bị gián đoạn."
                    : "Historical-content checks and draft recovery help protect your work when generation is interrupted."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExploreCommunity ?? onOpenAuth}
              className="inline-flex shrink-0 items-center rounded border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              {lang === "vi" ? "Gặp gỡ cộng đồng" : "Meet the community"}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-200 dark:border-neutral-800 px-5 py-6 text-center text-xs font-mono text-neutral-500">
          {t.footer_copyright}
        </footer>
      </div>
    </main>
  );
}
