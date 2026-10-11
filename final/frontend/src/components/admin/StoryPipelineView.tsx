"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Workflow,
  Plus,
  Upload,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  GitPullRequest,
  ExternalLink,
  Eye,
  Trash2,
  Edit3,
  BookOpen,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Layers,
  Terminal,
  RefreshCw,
  ChevronRight,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Language, translations } from "@/lib/i18n";
import {
  PipelineStoryItem,
  PipelineOverview,
  PipelineStoryDetail,
  PipelinePullRequest,
  PipelineLogEntry,
  PipelineValidationResult,
  PipelineStatus
} from "@/lib/types";

interface Props {
  lang: Language;
}

export function StoryPipelineView({ lang }: Props) {
  const { toast } = useToast();
  const t = translations[lang];

  // State
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"queue" | "prs" | "logs">("queue");
  
  const [overview, setOverview] = useState<PipelineOverview | null>(null);
  const [pullRequests, setPullRequests] = useState<PipelinePullRequest[]>([]);
  const [recentLogs, setRecentLogs] = useState<PipelineLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [previewStory, setPreviewStory] = useState<PipelineStoryDetail | null>(null);
  const [validationModalData, setValidationModalData] = useState<{ title: string; result: PipelineValidationResult } | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("Lịch sử & Văn hóa Việt Nam");
  const [newCategory, setNewCategory] = useState("Lịch sử Việt Nam");
  const [newGenre, setNewGenre] = useState("Lịch sử, Anh hùng dân tộc");
  const [newSourceLangs, setNewSourceLangs] = useState("vi, en");
  const [batchRawText, setBatchRawText] = useState("");

  // Fetch Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [queueRes, prRes, jobsRes] = await Promise.allSettled([
        api.getPipelineQueue(),
        api.getPipelinePullRequests(),
        api.getPipelineJobs()
      ]);

      if (queueRes.status === "fulfilled" && queueRes.value.data) {
        setOverview(queueRes.value.data);
      }
      if (prRes.status === "fulfilled" && prRes.value.data) {
        setPullRequests(prRes.value.data);
      }
      if (jobsRes.status === "fulfilled" && jobsRes.value.recentLogs) {
        setRecentLogs(jobsRes.value.recentLogs);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải dữ liệu pipeline");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning("Vui lòng nhập tên đề bài / nhân vật");
      return;
    }

    try {
      const genres = newGenre.split(",").map((s) => s.trim()).filter(Boolean);
      const sourceLanguages = newSourceLangs.split(",").map((s) => s.trim()).filter(Boolean);
      
      const res = await api.addPipelinePrompt({
        title: newTitle.trim(),
        topic: newTopic.trim(),
        category: newCategory.trim(),
        genre: genres.length ? genres : ["Lịch sử"],
        sourceLanguages: sourceLanguages.length ? sourceLanguages : ["vi", "en"]
      });

      toast.success(`Đã thêm '${res.data.title}' vào hàng đợi!`);
      setShowAddModal(false);
      setNewTitle("");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thêm đề bài");
    }
  };

  const handleBatchAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchRawText.trim()) return;

    try {
      let items: any[] = [];
      if (batchRawText.trim().startsWith("[") || batchRawText.trim().startsWith("{")) {
        const parsed = JSON.parse(batchRawText);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Multi-line list of titles
        items = batchRawText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 1)
          .map((title) => ({
            title,
            topic: "Lịch sử & Văn hóa Việt Nam",
            category: "Lịch sử Việt Nam",
            genre: ["Lịch sử"],
            sourceLanguages: ["vi", "en"]
          }));
      }

      if (items.length === 0) {
        toast.warning("Không có đề bài hợp lệ nào được tìm thấy.");
        return;
      }

      const res = await api.batchAddPipelinePrompts(items);
      toast.success(`Đã thêm thành công ${res.data.addedCount} đề bài vào hàng đợi!`);
      setShowBatchModal(false);
      setBatchRawText("");
      loadData();
    } catch (err: any) {
      toast.error(`Lỗi nhập hàng loạt: ${err?.message}`);
    }
  };

  const handleRunSingle = async (storyId: string) => {
    try {
      setExecutingId(storyId);
      toast.info(`Đang chạy pipeline cho đề bài '${storyId}'...`);
      const res = await api.runPipeline({ story_id: storyId });
      
      if (res.data?.success) {
        toast.success(`✅ Biên soạn & Tạo PR thành công: '${res.data.title}'`);
      } else {
        toast.error(`❌ Thất bại: ${res.data?.error || res.data?.errors?.join("; ") || "Lỗi không xác định"}`);
      }
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi thực thi pipeline");
    } finally {
      setExecutingId(null);
    }
  };

  const handleRunBatch = async () => {
    try {
      setIsBatchRunning(true);
      toast.info("Bắt đầu chạy pipeline hàng loạt cho các đề bài chờ xử lý...");
      const res = await api.runPipeline({ limit: 3 });
      toast.success(`Đã hoàn tất xử lý ${res.data.processedCount} đề bài.`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi chạy batch pipeline");
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề bài '${storyId}' khỏi hàng đợi?`)) return;
    try {
      await api.deletePipelinePrompt(storyId);
      toast.success("Đã xóa đề bài thành công.");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa đề bài");
    }
  };

  const handleOpenPreview = async (storyId: string) => {
    try {
      const res = await api.getPipelineStoryPreview(storyId);
      setPreviewStory(res.data);
    } catch (err: any) {
      toast.warning(err?.message || "Bản thảo chưa hoàn thành hoặc chưa có sẵn.");
    }
  };

  const handleRevalidate = async (storyId: string, title: string) => {
    try {
      const res = await api.revalidatePipelineStory(storyId);
      setValidationModalData({
        title,
        result: res.validation
      });
    } catch (err: any) {
      toast.error(err?.message || "Không thể kiểm định lại truyện này");
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: PipelineStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
            <Clock className="w-3 h-3" /> Chờ xử lý
          </span>
        );
      case "researching":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 animate-pulse">
            <Search className="w-3 h-3" /> Thu thập nguồn
          </span>
        );
      case "writing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 animate-pulse">
            <Sparkles className="w-3 h-3" /> AI đang viết
          </span>
        );
      case "validating":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 animate-pulse">
            <ShieldCheck className="w-3 h-3" /> Đang kiểm định
          </span>
        );
      case "pr_created":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
            <GitPullRequest className="w-3 h-3" /> Chờ duyệt PR
          </span>
        );
      case "merged":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60">
            <CheckCircle2 className="w-3 h-3" /> Đã Merge
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
            <XCircle className="w-3 h-3" /> Lỗi / Thất bại
          </span>
        );
      default:
        return null;
    }
  };

  // Filtered Stories
  const stories = overview?.stories || [];
  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 min-h-screen bg-[#fcfaf6] dark:bg-[#1f1b18] text-[#342722] dark:text-[#eee6d9] p-4 lg:p-8 transition-colors">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ddd4c8] dark:border-[#423730]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-serif font-bold tracking-tight">
                  {lang === "vi" ? "Trạm biên soạn truyện AI" : "AI Story Pipeline Station"}
                </h1>
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
                  {lang === "vi"
                    ? "Tự động hóa: Thu thập Wikipedia → Claude AI biên soạn → Kiểm định 5 lớp → Tạo GitHub PR"
                    : "Automated: Wikipedia Research → Claude AI Compilation → 5-Layer Quality Gate → GitHub PR"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === "vi" ? "Thêm đề bài" : "Add Prompt"}</span>
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#eae3d5] hover:bg-[#ded5c4] dark:bg-[#382f28] dark:hover:bg-[#473c33] text-xs font-semibold rounded-lg border border-[#d6c9b8] dark:border-[#52443a] transition-all"
            >
              <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{lang === "vi" ? "Nhập hàng loạt" : "Batch Import"}</span>
            </button>
            <button
              onClick={handleRunBatch}
              disabled={isBatchRunning || loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Play className={`w-4 h-4 ${isBatchRunning ? "animate-spin" : ""}`} />
              <span>{isBatchRunning ? (lang === "vi" ? "Đang chạy..." : "Running...") : (lang === "vi" ? "Chạy Pipeline (Auto)" : "Run Pipeline")}</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-[#eae3d5] hover:bg-[#ded5c4] dark:bg-[#382f28] dark:hover:bg-[#473c33] border border-[#d6c9b8] dark:border-[#52443a] transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#28221d] border border-[#e2d8cb] dark:border-[#423730] shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng số đề bài</span>
            <div className="text-xl font-bold font-mono mt-1 text-slate-900 dark:text-slate-100">
              {overview?.totalStories ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 shadow-sm">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Đang chờ xử lý</span>
            <div className="text-xl font-bold font-mono mt-1 text-amber-800 dark:text-amber-300">
              {overview?.pending ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 shadow-sm">
            <span className="text-[11px] font-medium text-purple-700 dark:text-purple-400">Đang biên soạn</span>
            <div className="text-xl font-bold font-mono mt-1 text-purple-800 dark:text-purple-300">
              {overview?.inProgress ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 shadow-sm">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">Lỗi kiểm định</span>
            <div className="text-xl font-bold font-mono mt-1 text-rose-800 dark:text-rose-300">
              {overview?.failed ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Chờ duyệt PR</span>
            <div className="text-xl font-bold font-mono mt-1 text-emerald-800 dark:text-emerald-300">
              {overview?.prCreated ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 shadow-sm">
            <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400">Đã Merge & Deploy</span>
            <div className="text-xl font-bold font-mono mt-1 text-teal-800 dark:text-teal-300">
              {overview?.merged ?? 0}
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center justify-between border-b border-[#ddd4c8] dark:border-[#423730] pt-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveSubTab("queue")}
              className={`pb-3 text-xs lg:text-sm font-semibold border-b-2 transition-all ${
                activeSubTab === "queue"
                  ? "border-amber-600 text-amber-700 dark:text-amber-400 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              📋 Danh sách hàng đợi ({stories.length})
            </button>
            <button
              onClick={() => setActiveSubTab("prs")}
              className={`pb-3 text-xs lg:text-sm font-semibold border-b-2 transition-all ${
                activeSubTab === "prs"
                  ? "border-amber-600 text-amber-700 dark:text-amber-400 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              🌿 Pull Requests & Duyệt bài ({pullRequests.length})
            </button>
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`pb-3 text-xs lg:text-sm font-semibold border-b-2 transition-all ${
                activeSubTab === "logs"
                  ? "border-amber-600 text-amber-700 dark:text-amber-400 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              💻 Nhật ký & Logs ({recentLogs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Queue Table */}
        {activeSubTab === "queue" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên truyện, ID, chủ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#28221d] border border-[#ddd4c8] dark:border-[#423730] focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] text-slate-500">Lọc:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#28221d] border border-[#ddd4c8] dark:border-[#423730] focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="researching">Thu thập nguồn</option>
                  <option value="writing">AI đang viết</option>
                  <option value="validating">Đang kiểm định</option>
                  <option value="pr_created">Chờ duyệt PR</option>
                  <option value="merged">Đã Merge</option>
                  <option value="failed">Lỗi</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#28221d] rounded-xl border border-[#e2d8cb] dark:border-[#423730] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f5efe4] dark:bg-[#332a24] border-b border-[#e2d8cb] dark:border-[#423730] text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-3 px-4">Tên truyện & ID</th>
                      <th className="py-3 px-4">Chủ đề / Danh mục</th>
                      <th className="py-3 px-4">Nguồn tham khảo</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Cập nhật</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee5d8] dark:divide-[#3c3028]">
                    {filteredStories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Không tìm thấy đề bài nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredStories.map((item) => (
                        <tr key={item.id} className="hover:bg-[#fbf9f4] dark:hover:bg-[#2f2722] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {item.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700 dark:text-slate-300">{item.topic || "Lịch sử Việt Nam"}</div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{item.category}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {(item.sourceLanguages || ["vi", "en"]).map((l) => (
                                <span key={l} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300">
                                  {l}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(item.status)}
                            {item.error && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 truncate max-w-xs" title={item.error}>
                                ⚠️ {item.error}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "---"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Run Single Button */}
                              <button
                                onClick={() => handleRunSingle(item.id)}
                                disabled={executingId === item.id || isBatchRunning}
                                className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 transition-colors"
                                title="Chạy pipeline cho riêng đề bài này"
                              >
                                <Play className={`w-3.5 h-3.5 ${executingId === item.id ? "animate-spin" : ""}`} />
                              </button>

                              {/* Preview Story Button */}
                              {(item.status === "pr_created" || item.status === "merged" || item.status === "validating") && (
                                <button
                                  onClick={() => handleOpenPreview(item.id)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                  title="Xem trước bản thảo JSON"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Re-validate Button */}
                              <button
                                onClick={() => handleRevalidate(item.id, item.title)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors"
                                title="Kiểm định lại 5 lớp"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Xóa khỏi hàng đợi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pull Requests & Human Review */}
        {activeSubTab === "prs" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#28221d] rounded-xl border border-[#e2d8cb] dark:border-[#423730] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e2d8cb] dark:border-[#423730] bg-[#fbf9f4] dark:bg-[#2f2722] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Danh sách Pull Request trên GitHub</h3>
                  <p className="text-[11px] text-slate-500">Mỗi tác phẩm vượt qua kiểm định được tự động mở PR để Người Quản Trị xem xét và duyệt Merge.</p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ trạng thái GitHub
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f5efe4] dark:bg-[#332a24] border-b border-[#e2d8cb] dark:border-[#423730] text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-3 px-4">Tên tác phẩm</th>
                      <th className="py-3 px-4">Nhánh & PR</th>
                      <th className="py-3 px-4">Trạng thái PR</th>
                      <th className="py-3 px-4">Thời gian tạo</th>
                      <th className="py-3 px-4 text-right">Hành động duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee5d8] dark:divide-[#3c3028]">
                    {pullRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có Pull Request nào được tạo. Hãy chạy pipeline cho các đề bài chờ xử lý.
                        </td>
                      </tr>
                    ) : (
                      pullRequests.map((pr) => (
                        <tr key={pr.id} className="hover:bg-[#fbf9f4] dark:hover:bg-[#2f2722] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{pr.title}</div>
                            <div className="text-[10px] text-slate-400">Slug: {pr.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                              {pr.branchName || `ai-stories/${pr.id}`}
                            </div>
                            {pr.prUrl && (
                              <a
                                href={pr.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                              >
                                <ExternalLink className="w-3 h-3" /> Mở trên GitHub PR
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {pr.isMerged ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300">
                                🟣 Đã Merge & Xuất bản
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300">
                                🟢 Đang mở (Open - Reviewing)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {pr.updatedAt ? new Date(pr.updatedAt).toLocaleString("vi-VN") : "---"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenPreview(pr.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Xem trước truyện
                              </button>
                              {pr.prUrl && (
                                <a
                                  href={pr.prUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-colors"
                                >
                                  <GitPullRequest className="w-3.5 h-3.5" /> Duyệt trên GitHub
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: System Logs */}
        {activeSubTab === "logs" && (
          <div className="bg-[#1e1b18] text-slate-200 rounded-xl p-4 font-mono text-xs shadow-inner space-y-2 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> Live Pipeline Execution Logs
              </span>
              <button
                onClick={loadData}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Làm mới
              </button>
            </div>
            {recentLogs.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">Chưa có nhật ký hoạt động gần đây.</div>
            ) : (
              recentLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1 border-b border-slate-800/60">
                  <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 ${
                      log.level === "error"
                        ? "bg-rose-900/80 text-rose-200"
                        : log.level === "success"
                        ? "bg-emerald-900/80 text-emerald-200"
                        : log.level === "warn"
                        ? "bg-amber-900/80 text-amber-200"
                        : "bg-blue-900/80 text-blue-200"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-amber-300 font-semibold shrink-0">[{log.storyId}]</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal: Thêm đề bài mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#28221d] rounded-2xl max-w-lg w-full p-6 border border-[#ddd4c8] dark:border-[#4a3d34] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8] dark:border-[#423730]">
              <h3 className="font-serif font-bold text-base">Thêm đề bài mới vào hàng đợi</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddStory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên truyện / Nhân vật *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lý Thường Kiệt, Bà Triệu, Thánh Gióng..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34] focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Chủ đề (Topic)</label>
                <input
                  type="text"
                  placeholder="VD: Anh hùng dân tộc, Kháng chiến Tống, v.v."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34]"
                  >
                    <option value="Lịch sử Việt Nam">Lịch sử Việt Nam</option>
                    <option value="Truyền thuyết & Thần thoại">Truyền thuyết & Thần thoại</option>
                    <option value="Văn hóa Dân gian">Văn hóa Dân gian</option>
                    <option value="Danh nhân & Danh tướng">Danh nhân & Danh tướng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Thể loại (Genres)</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ngôn ngữ nguồn Wikipedia</label>
                <input
                  type="text"
                  value={newSourceLangs}
                  onChange={(e) => setNewSourceLangs(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34]"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 'vi, en' (Ưu tiên tiếng Việt, bổ trợ tiếng Anh).</span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold shadow hover:bg-brand-700"
                >
                  Thêm vào hàng đợi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nhập hàng loạt */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#28221d] rounded-2xl max-w-lg w-full p-6 border border-[#ddd4c8] dark:border-[#4a3d34] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8] dark:border-[#423730]">
              <h3 className="font-serif font-bold text-base">Nhập đề bài hàng loạt (Batch Import)</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleBatchAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Danh sách đề bài (Mỗi dòng một tên truyện hoặc JSON Array)</label>
                <textarea
                  rows={8}
                  placeholder={`Quang Trung - Nguyễn Huệ\nNgô Quyền & Trận Bạch Đằng 938\nLê Lợi & Khởi nghĩa Lam Sơn\nThánh Gióng`}
                  value={batchRawText}
                  onChange={(e) => setBatchRawText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#fbf9f4] dark:bg-[#332a24] border border-[#ddd4c8] dark:border-[#4a3d34] font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold shadow hover:bg-amber-700"
                >
                  Nhập danh sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem trước bản thảo hoàn chỉnh */}
      {previewStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcfaf6] dark:bg-[#28221d] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#ddd4c8] dark:border-[#4a3d34] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#eee5d8] dark:border-[#423730] flex items-center justify-between bg-[#f5efe4] dark:bg-[#332a24]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">
                    {previewStory.category}
                  </span>
                  <h3 className="font-serif font-bold text-lg">{previewStory.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số từ: ~{previewStory.metadata?.wordCount || 0} từ • AI Model: {previewStory.metadata?.aiModel || "Claude 3.5 Sonnet"}
                </p>
              </div>
              <button onClick={() => setPreviewStory(null)} className="text-slate-400 hover:text-slate-600 text-lg p-1">✕</button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <h4 className="font-serif font-bold text-amber-900 dark:text-amber-300 text-xs mb-1 uppercase tracking-wider">
                  Tóm tắt tác phẩm
                </h4>
                <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-200">{previewStory.summary}</p>
              </div>

              {/* Prose Content */}
              <div>
                <h4 className="font-serif font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">Nội dung truyện hoàn chỉnh</h4>
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-line bg-white dark:bg-[#1f1b18] p-5 rounded-xl border border-[#e2d8cb] dark:border-[#423730]">
                  {previewStory.content}
                </div>
              </div>

              {/* Lesson */}
              {previewStory.lesson && (
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <h4 className="font-serif font-bold text-emerald-900 dark:text-emerald-300 text-xs mb-1 uppercase tracking-wider">
                    Bài học lịch sử / nhân văn
                  </h4>
                  <p className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">{previewStory.lesson}</p>
                </div>
              )}

              {/* Historical Notes & Fact/Folklore Classification */}
              {previewStory.historicalNotes && previewStory.historicalNotes.length > 0 && (
                <div>
                  <h4 className="font-serif font-bold text-slate-800 dark:text-slate-200 text-xs mb-2 uppercase tracking-wider">
                    Ghi chú dữ kiện & Phân loại
                  </h4>
                  <div className="space-y-2">
                    {previewStory.historicalNotes.map((note, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-[#1f1b18] border border-[#e2d8cb] dark:border-[#423730] flex items-start gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          note.type === "historical_fact"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }`}>
                          {note.type === "historical_fact" ? "Chính sử" : "Truyền thuyết / Thần thoại"}
                        </span>
                        <div className="text-xs text-slate-700 dark:text-slate-300">{note.claim}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              {previewStory.sources && previewStory.sources.length > 0 && (
                <div>
                  <h4 className="font-serif font-bold text-slate-800 dark:text-slate-200 text-xs mb-2 uppercase tracking-wider">
                    Nguồn tư liệu tham khảo xác thực
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewStory.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-lg bg-white dark:bg-[#1f1b18] border border-[#e2d8cb] dark:border-[#423730] hover:border-amber-500 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{src.title}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{src.url}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#eee5d8] dark:border-[#423730] bg-[#f5efe4] dark:bg-[#332a24] flex justify-end">
              <button
                onClick={() => setPreviewStory(null)}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-xs shadow hover:bg-brand-700"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kết quả kiểm định 5 lớp */}
      {validationModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#28221d] rounded-2xl max-w-lg w-full p-6 border border-[#ddd4c8] dark:border-[#4a3d34] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8] dark:border-[#423730]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif font-bold text-base">Kết quả kiểm định: {validationModalData.title}</h3>
              </div>
              <button onClick={() => setValidationModalData(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg flex items-center justify-between font-semibold bg-slate-50 dark:bg-slate-800/60">
                <span>Trạng thái tổng thể:</span>
                {validationModalData.result.passed ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">✅ ĐẠT YÊU CẦU</span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">❌ CHƯA ĐẠT</span>
                )}
              </div>

              <div className="p-3 rounded-lg flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                <span>Số từ thực tế:</span>
                <span className="font-mono font-bold">{validationModalData.result.wordCount} từ</span>
              </div>

              {validationModalData.result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
                  <span className="font-bold text-rose-700 block mb-1">Lỗi cần khắc phục:</span>
                  <ul className="list-disc pl-4 space-y-1 text-rose-600">
                    {validationModalData.result.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationModalData.result.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                  <span className="font-bold text-amber-700 block mb-1">Cảnh báo chất lượng:</span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-600">
                    {validationModalData.result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setValidationModalData(null)}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-xs shadow hover:bg-brand-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
