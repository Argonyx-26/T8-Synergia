import { useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../store";
import { Calendar, Trash2, Sparkles, Clock, Activity } from "lucide-react";

export default function CycleTrackerTab() {
  const { periodEntries, addPeriodEntry, deletePeriodEntry } = useAppStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setFeedback("Please select both start date and end date.");
      return;
    }

    addPeriodEntry({
      startDate,
      endDate,
      notes,
    });

    setStartDate("");
    setEndDate("");
    setNotes("");
    setFeedback("Period entry added successfully! ✨");
    setTimeout(() => setFeedback(""), 3000);
  };

  // Helper to determine cycle phase based on most recent period
  const getCyclePhase = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 5) return { name: "Menstrual Phase", badge: "bg-pink-100 text-pink-700 border-pink-200" };
    if (diffDays > 5 && diffDays <= 13) return { name: "Follicular Phase", badge: "bg-purple-100 text-purple-700 border-purple-200" };
    if (diffDays === 14 || diffDays === 15) return { name: "Ovulation Phase", badge: "bg-amber-100 text-amber-700 border-amber-200" };
    if (diffDays > 15 && diffDays <= 28) return { name: "Luteal Phase", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" };
    return { name: "Cycle Completed", badge: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Period Tracker Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-pink-100/90 flex items-center justify-center text-2xl shadow-sm border border-pink-200/60">
            📅
          </div>
          <div>
            <h2 className="text-2xl font-serif-title font-bold text-gray-800">
              Period Tracker
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Log your menstrual cycle dates
            </p>
          </div>
        </div>

        {feedback && (
          <div className="bg-pink-50 border border-pink-200 text-pink-700 text-xs p-3 rounded-xl mb-4 text-center font-medium">
            {feedback}
          </div>
        )}

        <form onSubmit={handleAddEntry} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                PERIOD START DATE
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-blush w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                PERIOD END DATE
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-blush w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              NOTES / FLOW (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Medium flow, mild cramping..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#E2C8E4] hover:bg-[#D8BBE1] text-[#4A2E4B] py-3.5 rounded-2xl font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4 text-[#7A427C]" /> Add Period Entry
          </button>
        </form>
      </motion.div>

      {/* Recent Cycle History Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-3d p-6 sm:p-8"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
          RECENT CYCLE HISTORY
        </h3>

        {periodEntries.length > 0 ? (
          <div className="space-y-3">
            {periodEntries.map((entry, idx) => {
              const phase = getCyclePhase(entry.startDate);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/80 border border-pink-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      <span className="font-semibold text-gray-800 text-sm">
                        {entry.startDate} → {entry.endDate}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${phase.badge}`}>
                        {phase.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 pl-6">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {entry.durationDays} Days Flow
                      </span>
                      {entry.notes && (
                        <span className="italic text-gray-400">"{entry.notes}"</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deletePeriodEntry(entry.id)}
                    className="self-end sm:self-center text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">
              No entries yet — add your first period above ✨
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
