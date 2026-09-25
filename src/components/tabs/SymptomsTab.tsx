import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store";
import {
  Heart,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Send,
  Trash2,
  Edit2,
  Search,
  Lock,
  Download,
  Calendar,
  Tag,
  Smile,
  ShieldCheck,
} from "lucide-react";

interface JournalItem {
  id: number;
  entryDate: string;
  freeText: string;
  selectedSymptoms: string[];
  tags: string[];
  emotionalContext: string;
  extractedInsights?: {
    ai_label: string;
    detected_emotion: string;
    reported_symptoms: string[];
  };
  consentForAI: boolean;
  createdAt: string;
}

export default function SymptomsTab() {
  const { symptoms, setSymptoms, token } = useAppStore();

  // Free-text experience journal states
  const [freeText, setFreeText] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [consentForAI, setConsentForAI] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Journal history state
  const [journalEntries, setJournalEntries] = useState<JournalItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const availableTags = ["#Mood", "#Pain", "#Energy", "#Acne", "#Sleep", "#Cycle", "#Nutrition", "#Stress"];

  const handleToggleSymptom = (key: keyof typeof symptoms) => {
    setSymptoms({ [key]: !symptoms[key] });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Fetch journal entries from backend API
  const fetchJournalHistory = async () => {
    if (!token) {
      setJournalEntries([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const url = searchQuery ? `/api/journal?search=${encodeURIComponent(searchQuery)}` : "/api/journal";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJournalEntries(data);
      }
    } catch {
      // Handle offline or request error silently
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchJournalHistory();
  }, [token, searchQuery]);

  // Handle Save / Update Journal Entry
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeText.trim() && Object.values(symptoms).filter(Boolean).length === 0) {
      setErrorMsg("Please write a short description or select at least one symptom indicator.");
      return;
    }

    if (!token) {
      setErrorMsg("Please sign in to save your personal health journal securely across devices.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(null);

    // Map active checkboxes to human readable strings
    const activeSymptomsList = Object.entries(symptoms)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    try {
      if (editingId) {
        // Update existing entry
        const res = await fetch(`/api/journal/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            freeText,
            selectedSymptoms: activeSymptomsList,
            tags: selectedTags,
            consentForAI,
          }),
        });
        if (!res.ok) throw new Error("Failed to update journal entry");
        setSaveSuccess("Journal entry updated successfully! ✨");
        setEditingId(null);
      } else {
        // Create new entry
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entryDate,
            freeText,
            selectedSymptoms: activeSymptomsList,
            tags: selectedTags,
            consentForAI,
          }),
        });
        if (!res.ok) throw new Error("Failed to save journal entry");
        setSaveSuccess("Your personal experience journal entry has been saved securely! ❤️");
      }

      setFreeText("");
      setSelectedTags([]);
      fetchJournalHistory();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving your journal.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: JournalItem) => {
    setEditingId(entry.id);
    setFreeText(entry.freeText);
    setEntryDate(entry.entryDate);
    setSelectedTags(entry.tags || []);
    setConsentForAI(entry.consentForAI);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setJournalEntries(journalEntries.filter((j) => j.id !== id));
      }
    } catch {
      alert("Failed to delete journal entry.");
    }
  };

  const handleExport = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/journal/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pcos_journal_export_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
      }
    } catch {
      alert("Could not export journal data.");
    }
  };

  const symptomCategories = [
    {
      title: "Ovulatory & Menstrual Criteria",
      icon: "🌙",
      badge: "Rotterdam Criteria 1",
      items: [
        { key: "irregularPeriods", label: "Irregular or unpredictable period cycles (>35 days or <21 days)" },
        { key: "noPeriods", label: "Missed / absent periods for 3+ consecutive months (Amenorrhea)" },
        { key: "pelvicPain", label: "Chronic lower abdominal or pelvic discomfort during ovulation/cycle" },
        { key: "infertility", label: "Difficulty conceiving or past history of ovulation resistance" },
      ],
    },
    {
      title: "Androgen & Skin Criteria",
      icon: "⚡",
      badge: "Rotterdam Criteria 2",
      items: [
        { key: "excessHair", label: "Excess coarse facial or body hair growth (Hirsutism on chin, chest, stomach)" },
        { key: "acne", label: "Persistent hormonal acne along jawline, chin, or back" },
        { key: "hairLoss", label: "Thinning scalp hair or female-pattern hair shedding" },
        { key: "darkPatches", label: "Dark velvet skin patches on neck, armpits, or thighs (Acanthosis Nigricans)" },
      ],
    },
    {
      title: "Metabolic & Physical Symptoms",
      icon: "⚖️",
      badge: "Insulin Resistance Markers",
      items: [
        { key: "weightGain", label: "Sudden or unexplained abdominal weight gain" },
        { key: "difficultyLosingWeight", label: "Difficulty losing weight despite calorie deficit and exercise" },
        { key: "fatigue", label: "Chronic daytime fatigue, post-meal energy slumps, or brain fog" },
      ],
    },
    {
      title: "Emotional & Lifestyle Factors",
      icon: "🧠",
      badge: "Hormonal Balance",
      items: [
        { key: "moodSwings", label: "Frequent mood swings, heightened anxiety, or irritability" },
      ],
    },
  ];

  const totalActive = Object.values(symptoms).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-2xl shadow-sm border border-indigo-200/60">
              💫
            </div>
            <div>
              <h2 className="text-xl font-serif-title font-bold text-gray-800">
                Symptom & Experience Journal
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Record your symptoms, feelings, and personal health observations
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-pink-500">{totalActive} / 12</span>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Selected Indicators
            </div>
          </div>
        </div>
      </motion.div>

      {/* Free-Text Personal Feelings & Experience Journal Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8 space-y-4 border-2 border-pink-200/80 bg-gradient-to-b from-pink-50/40 to-white"
      >
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-500" />
            <h3 className="font-serif-title font-bold text-gray-800 text-lg">
              How have you been feeling?
            </h3>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
            Free-Text Personal Journal
          </span>
        </div>

        <form onSubmit={handleSaveJournal} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Entry Date Picker */}
            <div className="flex items-center gap-2 bg-white border border-pink-200 px-3 py-1.5 rounded-xl text-xs text-gray-600 shadow-xs shrink-0">
              <Calendar className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="font-medium text-[11px]">Date:</span>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            {/* AI Personalization Consent Switch */}
            <label className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50/70 border border-purple-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-purple-100/50 transition-colors">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-[11px]">Allow AI Companion to personalize chats with this journal memory</span>
              <input
                type="checkbox"
                checked={consentForAI}
                onChange={(e) => setConsentForAI(e.target.checked)}
                className="rounded text-pink-500 focus:ring-pink-400 cursor-pointer ml-auto"
              />
            </label>
          </div>

          {/* Large Comfortable Multiline Textarea */}
          <div className="relative">
            <textarea
              rows={4}
              maxLength={1000}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder={`Tell us how you've been feeling lately...

For example:
• I've been feeling anxious about my irregular periods.
• I've been experiencing severe bloating and chronic exhaustion.
• My acne has been affecting my self-confidence.
• I've been feeling much better since starting seed cycling.

You can write anything you'd like us to know.`}
              className="w-full border border-pink-200/80 rounded-2xl p-4 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/90 shadow-inner leading-relaxed resize-none"
            />
            <span className="absolute bottom-3 right-4 text-[10px] font-semibold text-gray-400">
              {freeText.length} / 1000
            </span>
          </div>

          {/* Optional Tag Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-pink-400" /> Optional Tags:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-pink-500 text-white border-pink-500 shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation & Feedback Alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFreeText("");
                  setSelectedTags([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {saving ? "Saving..." : editingId ? "Update Journal Entry" : "Save Journal Entry"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Structured Checkbox Category Groups */}
      {symptomCategories.map((group, groupIdx) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * (groupIdx + 1) }}
          className="card-3d p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-pink-100/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{group.icon}</span>
              <h3 className="font-serif-title font-bold text-gray-800 text-lg">
                {group.title}
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-100">
              {group.badge}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {group.items.map((item) => {
              const active = symptoms[item.key as keyof typeof symptoms];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleSymptom(item.key as keyof typeof symptoms)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? "bg-pink-50/90 border-pink-300 shadow-sm"
                      : "bg-white/60 border-gray-100/80 hover:bg-white hover:border-pink-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      active ? "bg-pink-500 text-white" : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    {active && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium leading-relaxed ${active ? "text-gray-900" : "text-gray-600"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Journal History & AI Personalization Context Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-serif-title font-bold text-gray-800 text-lg">
                Your Health Journal History
              </h3>
              <p className="text-[11px] text-gray-400">
                View, edit, or search your personal experience entries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && journalEntries.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search entries by keyword (e.g. 'anxious', 'acne', 'bloating')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
          />
        </div>

        {/* Entries List */}
        {!token ? (
          <div className="text-center py-8 text-xs text-gray-400 italic">
            Please sign in to view and save persistent health journal entries across devices.
          </div>
        ) : loadingHistory ? (
          <div className="text-center py-8 text-xs text-gray-400 italic">Loading journal entries...</div>
        ) : journalEntries.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 italic">
            No journal entries recorded yet. Write how you're feeling above to start your personal health journal! 🌸
          </div>
        ) : (
          <div className="space-y-3">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-2xl border border-pink-100 bg-white/80 hover:bg-white shadow-xs space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-pink-500" /> {entry.entryDate}
                    </span>
                    {entry.emotionalContext && entry.emotionalContext !== "neutral" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {entry.emotionalContext}
                      </span>
                    )}
                    {entry.consentForAI && (
                      <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                        ✨ Shared with AI Companion
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-gray-400 hover:text-pink-500 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Edit entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Original User Free Text */}
                {entry.freeText && (
                  <p className="text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                    "{entry.freeText}"
                  </p>
                )}

                {/* Selected Symptoms Badges */}
                {entry.selectedSymptoms && entry.selectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.selectedSymptoms.map((sym, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-100"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-gray-500 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI-Generated Interpretation Label */}
                {entry.extractedInsights && (
                  <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 text-[11px] text-purple-900 space-y-1">
                    <span className="font-semibold text-[10px] text-purple-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" /> AI-Generated Summary Interpretation:
                    </span>
                    <p className="text-[11px] text-purple-800">
                      Detected Tone: <span className="font-bold capitalize">{entry.extractedInsights.detected_emotion}</span> | 
                      Extracted Focus: {entry.extractedInsights.reported_symptoms.join(", ") || "General Wellness"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
