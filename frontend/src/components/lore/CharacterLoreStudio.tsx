"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Users,
  BookMarked,
  Search,
  Plus,
  Shield,
  MapPin,
  Sparkles,
  Sword,
  Scroll,
  Tag,
  Check,
  Edit2,
  Copy,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";
import { Language, translations } from "@/lib/i18n";

export interface CharacterItem {
  id: string;
  name: string;
  role: string;
  image: string;
  appearance: string;
  personality: string;
  goals: string;
  relationships: string;
  status: "active" | "draft";
}

export interface LoreItem {
  id: string;
  title: string;
  category: "locations" | "factions" | "events" | "items" | "rules";
  description: string;
  details: string;
  tags: string[];
}

interface Props {
  lang: Language;
  onSelectCharacterForPrompt?: (charDesc: string) => void;
  onBackToEditor?: () => void;
}

export function CharacterLoreStudio({
  lang,
  onSelectCharacterForPrompt,
  onBackToEditor,
}: Props) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<"characters" | "lore">("characters");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChar, setSelectedChar] = useState<CharacterItem | null>(null);
  const [selectedLore, setSelectedLore] = useState<LoreItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real characters based on project assets
  const [characters, setCharacters] = useState<CharacterItem[]>([
    {
      id: "char-1",
      name: "Nàng Thiềm",
      role: lang === "vi" ? "Nữ quý tộc · Linh sư phong ấn" : "Noble Maiden · Sealmaster",
      image: "/assets/landing/hero_character_aodai.png",
      appearance:
        lang === "vi"
          ? "Áo dài truyền thống thêu chỉ vàng sắc sảo, búi tóc cài trâm ngọc cổ, thần thái đoan trang trầm tĩnh."
          : "Traditional silk attire with golden embroidery, jade hairpin, calm and noble demeanor.",
      personality:
        lang === "vi"
          ? "Kiên định, thông tuệ, gánh vác sứ mệnh gia tộc bảo vệ phong ấn linh thú."
          : "Determined, intelligent, carrying the burden of protecting her ancestral seal.",
      goals:
        lang === "vi"
          ? "Bảo vệ bí mật gia tộc và giải cứu vùng đất khỏi hiểm họa hỗn mang."
          : "Safeguard clan secrets and protect the realm from emerging chaos.",
      relationships:
        lang === "vi"
          ? "Tri kỷ của kiếm khách Trần Khắc Liêm; truyền nhân gia tộc phong ấn."
          : "Allied with swordsman Tran Khac Liem; heir to the sealing lineage.",
      status: "active",
    },
    {
      id: "char-2",
      name: "Trần Khắc Liêm",
      role: lang === "vi" ? "Kiếm khách bến sông · Nghĩa sĩ" : "River Swordsman · Patriot",
      image: "/assets/landing/world_warrior_rain.png",
      appearance:
        lang === "vi"
          ? "Khoác áo tơi nón lá, thanh kiếm thép sắc lạnh đeo bên hông, bóng đen cô độc đứng trong mưa bão."
          : "Straw rain cloak, conical hat, cold steel blade at his side, solitary silhouette in the storm.",
      personality:
        lang === "vi"
          ? "Trầm mặc, quyết đoán, trọng nghĩa khinh tài, lấy giang sơn làm trọng."
          : "Taciturn, decisive, honoring righteous duty above personal gain.",
      goals:
        lang === "vi"
          ? "Chặn đứng mũi tấn công thủy chiến của quân thù tại cửa sông Bạch Đằng."
          : "Halt the enemy naval vanguard along the Bach Dang River.",
      relationships:
        lang === "vi"
          ? "Đồng minh thân cận của Nàng Thiềm; huynh đệ cùng nghĩa quân sông nước."
          : "Trusted companion to Lady Thiem; brother-in-arms to the river militia.",
      status: "active",
    },
    {
      id: "char-3",
      name: "Hạ Vân",
      role: lang === "vi" ? "Nữ kiếm sĩ dã sử · Tông sư đao pháp" : "Swordswoman · Blade Master",
      image: "/assets/landing/manga_heroine_portrait.png",
      appearance:
        lang === "vi"
          ? "Y phục giao lĩnh gọn gàng, tóc búi cao năng động, ánh mắt sắc bén kiên cường chuẩn phong cách manga mực đen."
          : "Crisp training robes, high topknot, sharp and resolute manga-styled gaze.",
      personality:
        lang === "vi"
          ? "Thẳng thắn, can trường, không ngại đương đầu với các thế lực áp bức."
          : "Straightforward, fearless, standing firm against oppressive tyranny.",
      goals:
        lang === "vi"
          ? "Kế thừa võ phái tuyệt đao và rèn luyện đến cảnh giới tối cao."
          : "Master the ancient blade lineage to its absolute pinnacle.",
      relationships:
        lang === "vi"
          ? "Đồng môn cùng thế hệ nghĩa sĩ trẻ tuổi thời tao loạn."
          : "Peer to the rising generation of wartime martial artists.",
      status: "active",
    },
    {
      id: "char-4",
      name: "Thạch Sanh",
      role: lang === "vi" ? "Dũng sĩ thiếu niên rừng sâu" : "Young Forest Champion",
      image: "/assets/landing/folktale_child_roots.png",
      appearance:
        lang === "vi"
          ? "Thiếu niên mộc mạc ngồi dưới rễ cây cổ thụ nghìn năm, y phục tiều phu đơn sơ, ánh mắt tinh nghịch ấm áp."
          : "Humble young boy beneath giant banyan roots, rustic attire, warm eyes.",
      personality:
        lang === "vi"
          ? "Hiền lành, thật thà, yêu thiên nhiên và sở hữu sức mạnh phi thường tiềm ẩn."
          : "Kind-hearted, sincere, bonded with nature, harboring hidden divine strength.",
      goals:
        lang === "vi"
          ? "Bảo vệ muông thú rừng thiêng và xóm làng khỏi chằn tinh tà ác."
          : "Protect forest creatures and villagers from looming monstrous threats.",
      relationships:
        lang === "vi"
          ? "Bầu bạn cùng muôn loài; người bảo vệ rừng cổ thụ thiêng liêng."
          : "Friend to forest spirits; guardian of the ancient sacred tree.",
      status: "active",
    },
  ]);

  // Real world-building lore facts
  const [loreItems, setLoreItems] = useState<LoreItem[]>([
    {
      id: "lore-1",
      title: lang === "vi" ? "Cửa Sông Bạch Đằng" : "Bach Dang River Estuary",
      category: "locations",
      description:
        lang === "vi"
          ? "Bến sông lịch sử với thủy triều lên xuống dữ dội, nơi diễn ra các trận địa cọc ngầm bẫy chiến thuyền giặc."
          : "Historic tidal river famous for sunken stake barricades trapping enemy fleets.",
      details:
        lang === "vi"
          ? "Dòng nước chảy xiết theo chu kỳ nhật triều. Khi triều lên ngập các đầu cọc, khi triều rút để lộ hàng nghìn cọc gỗ lim vạt nhọn."
          : "Tidal river with fast currents. Submerged stakes trap invading warships during ebb tide.",
      tags: ["Lịch sử", "Thủy chiến", "Chiến địa"],
    },
    {
      id: "lore-2",
      title: lang === "vi" ? "Nghĩa Quân Bến Sông" : "Riverfront Resistance Militia",
      category: "factions",
      description:
        lang === "vi"
          ? "Lực lượng hiệp sĩ và ngư dân mặc áo tơi nón lá, giỏi bơi lặn và đục thuyền đối phương trong đêm."
          : "Guerrilla river warriors and fishermen skilled in nocturnal underwater sabotage.",
      details:
        lang === "vi"
          ? "Kỷ luật nghiêm minh, thông thạo luồng lạch, sử dụng thuyền nan nhẹ nhàng lướt trên sóng cả."
          : "Strict discipline, intimate knowledge of local waterways and swift bamboo skiffs.",
      tags: ["Nghĩa quân", "Dã sử", "Tổ chức"],
    },
    {
      id: "lore-3",
      title: lang === "vi" ? "Trận Địa Cọc Ngầm" : "Sunken Stake Array Strategy",
      category: "rules",
      description:
        lang === "vi"
          ? "Quy tắc chiến thuật: dụ địch khi nước lớn, tổng phản công và dồn đối phương vào bãi cọc khi nước ròng."
          : "Tactical doctrine: lure enemies during high tide, counterattack as waters recede.",
      details:
        lang === "vi"
          ? "Cọc gỗ lim được vạt nhọn bịt sắt, đóng nghiêng 45 độ ngược dòng nước để đâm thủng lườn thuyền nặng."
          : "Iron-tipped hardwood stakes driven at 45-degree angles against the current to pierce heavy hulls.",
      tags: ["Chiến thuật", "Binh chế", "Chính sử"],
    },
    {
      id: "lore-4",
      title: lang === "vi" ? "Định Sơn Cổ Kiếm" : "Dinh Son Ancient Blade",
      category: "items",
      description:
        lang === "vi"
          ? "Bảo kiếm lưu truyền từ các triều đại trước, lưỡi kiếm sáng ánh bạc lạnh, khắc chữ Hán cổ 'Bình Nam Sơn'."
          : "Ancestral steel sword passed down through generations, inscribed with ancient sigils.",
      details:
        lang === "vi"
          ? "Được rèn từ thép thiên thạch kết hợp quặng sắt núi Vạn Kiếp, không rỉ sét dù ngâm nước biển hàng chục năm."
          : "Forged from meteoric iron; impervious to seawater corrosion across decades.",
      tags: ["Bảo vật", "Vũ khí", "Cổ phong"],
    },
  ]);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.appearance.toLowerCase().includes(q)
    );
  }, [characters, searchQuery]);

  const filteredLore = useMemo(() => {
    if (!searchQuery.trim()) return loreItems;
    const q = searchQuery.toLowerCase();
    return loreItems.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [loreItems, searchQuery]);

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-neutral-100 dark:bg-[#080808] text-black dark:text-[#F5F5F5] font-sans transition-colors">
      
      {/* Header */}
      <header className="h-14 border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          {onBackToEditor && (
            <button
              type="button"
              onClick={onBackToEditor}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white transition-colors"
            >
              Story Lab
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500">
            <span>Dự án</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="font-bold text-black dark:text-white uppercase tracking-wider">
              Character & Lore
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-300 dark:border-white/10 mx-1" />

          {/* Tab Selector */}
          <div className="flex rounded-lg border border-neutral-300 dark:border-white/10 p-0.5 bg-neutral-100 dark:bg-neutral-900 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("characters")}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === "characters"
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-xs"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân Vật ({characters.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lore")}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === "lore"
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-xs"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Lorebook ({loreItems.length})</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "characters" ? "Tìm nhân vật..." : "Tìm điển tích..."}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-[#080808] text-xs outline-none focus:border-black dark:focus:border-white font-sans"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {activeTab === "characters" ? (
            /* Characters Gallery Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedChar(char)}
                  className="group rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm hover:shadow-xl hover:border-black dark:hover:border-white transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Character Visual */}
                    <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
                      <Image
                        src={char.image}
                        alt={char.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white border border-white/20">
                        [HỒ SƠ]
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-base font-bold text-black dark:text-white group-hover:underline">
                          {char.name}
                        </h3>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] text-neutral-500">
                          {char.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 block">
                        {char.role}
                      </span>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {char.appearance}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Xem hồ sơ</span>
                    <span className="font-bold text-black dark:text-white group-hover:translate-x-1 transition-transform">
                      ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Lorebook Grid */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredLore.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLore(item)}
                  className="group rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm hover:shadow-xl hover:border-black dark:hover:border-white transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        {item.category.toUpperCase()}
                      </span>
                      <Compass className="w-3.5 h-3.5 text-neutral-400" />
                    </div>

                    <h3 className="font-serif text-lg font-bold text-black dark:text-white group-hover:underline">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tg, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] text-[9px] font-mono text-neutral-500"
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-black dark:text-white font-bold">
                      <span>Chi tiết bối cảnh</span>
                      <span>➔</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* CHARACTER DETAIL MODAL / DRAWER */}
      {/* ========================================================= */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-300 dark:border-white/20 bg-white dark:bg-[#111111] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedChar(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-black shrink-0 border border-neutral-700">
                <Image src={selectedChar.image} alt={selectedChar.name} fill className="object-cover" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold uppercase text-neutral-500">
                  {selectedChar.status.toUpperCase()}
                </span>
                <h2 className="font-serif text-2xl font-bold text-black dark:text-white">
                  {selectedChar.name}
                </h2>
                <p className="text-xs font-mono text-neutral-500 font-bold">
                  {selectedChar.role}
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3.5 text-xs font-sans">
              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">
                  Diện mạo & Phục trang:
                </span>
                <p className="leading-relaxed text-black dark:text-[#F5F5F5]">
                  {selectedChar.appearance}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">
                  Tính cách & Chiều sâu:
                </span>
                <p className="leading-relaxed text-black dark:text-[#F5F5F5]">
                  {selectedChar.personality}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">
                  Mục tiêu & Xung đột:
                </span>
                <p className="leading-relaxed text-black dark:text-[#F5F5F5]">
                  {selectedChar.goals}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">
                  Mối quan hệ:
                </span>
                <p className="leading-relaxed text-black dark:text-[#F5F5F5]">
                  {selectedChar.relationships}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() =>
                  handleCopyPrompt(
                    `Nhân vật: ${selectedChar.name}. Vai trò: ${selectedChar.role}. Diện mạo: ${selectedChar.appearance}`,
                    selectedChar.id
                  )
                }
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white transition-colors flex items-center justify-center gap-2 font-bold"
              >
                {copiedId === selectedChar.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === selectedChar.id ? "Đã sao chép prompt" : "Sao chép mô tả nhân vật"}</span>
              </button>
              {onSelectCharacterForPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCharacterForPrompt(
                      `Nhân vật chính: ${selectedChar.name} (${selectedChar.role}), ${selectedChar.appearance}`
                    );
                    setSelectedChar(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Đưa vào Story Lab</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LORE DETAIL MODAL */}
      {/* ========================================================= */}
      {selectedLore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-neutral-300 dark:border-white/20 bg-white dark:bg-[#111111] p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setSelectedLore(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold uppercase text-neutral-500">
              {selectedLore.category.toUpperCase()}
            </span>
            <h2 className="font-serif text-2xl font-bold text-black dark:text-white">
              {selectedLore.title}
            </h2>
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans">
              {selectedLore.description}
            </p>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#171717] border border-neutral-200 dark:border-white/10 space-y-1 text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">
                Tài liệu nghiên cứu & Điển tích:
              </span>
              <p className="leading-relaxed text-black dark:text-[#F5F5F5] font-sans">
                {selectedLore.details}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {selectedLore.tags.map((tg, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#171717] text-[10px] font-mono text-neutral-600 dark:text-neutral-400"
                >
                  #{tg}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CharacterLoreStudio;
