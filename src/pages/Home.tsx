import { motion } from "motion/react";
import { useAppStore } from "../store";
import CycleTrackerTab from "../components/tabs/CycleTrackerTab";
import BodyMetricsTab from "../components/tabs/BodyMetricsTab";
import SymptomsTab from "../components/tabs/SymptomsTab";
import AnalysisTab from "../components/tabs/AnalysisTab";
import LearnTab from "../components/tabs/LearnTab";
import HospitalsTab from "../components/tabs/HospitalsTab";
import AIAssistantTab from "../components/tabs/AIAssistantTab";

export default function Home() {
  const { activeTab, setActiveTab } = useAppStore();

  const tabs = [
    { id: "cycle", label: "Cycle Tracker", icon: "🌙" },
    { id: "body", label: "Body Metrics", icon: "📊" },
    { id: "symptoms", label: "Symptoms", icon: "💫" },
    { id: "analysis", label: "Analysis", icon: "🔮" },
    { id: "learn", label: "Learn", icon: "📖" },
    { id: "hospitals", label: "Hospitals", icon: "🏥" },
    { id: "chat", label: "AI Assistant", icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-[#FDEBF2] to-[#FAF0F5] px-4 py-8 relative overflow-hidden">
      {/* Background Ambient Particles */}
      <div className="absolute top-12 left-10 w-96 h-96 bg-pink-200/35 rounded-full blur-3xl animate-float-particle pointer-events-none" />
      <div
        className="absolute bottom-20 right-10 w-[450px] h-[450px] bg-purple-200/35 rounded-full blur-3xl animate-float-particle pointer-events-none"
        style={{ animationDelay: "3s" }}
      />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* 1. Header Hero Card matching Screenshots */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center pt-4 pb-2"
        >
          {/* Flower Icon Badge */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-white shadow-md flex items-center justify-center text-3xl mb-3 animate-float-card">
            🌸
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif-title font-bold text-[#A34878] tracking-tight">
            PCOS · PCOD
          </h1>
          <h2 className="text-3xl sm:text-4xl font-serif-title italic text-[#D86B9E] mt-1">
            Early Detection
          </h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            EVIDENCE-BASED HORMONAL HEALTH ASSISTANT
          </p>
        </motion.div>

        {/* 2. Privacy Banner Card matching Screenshot #4 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card-3d-static p-4 max-w-3xl mx-auto flex items-center justify-center gap-2 text-xs text-gray-600 shadow-2xs border border-white/90"
        >
          <span className="text-base">🔒</span>
          <span>
            <strong className="text-pink-600 font-semibold">Privacy First:</strong> All your data stays in your browser. Nothing is stored or transmitted externally.
          </span>
        </motion.div>

        {/* 3. Horizontal Pill Tab Navigation Bar matching Screenshots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-3d-static p-2 max-w-3xl mx-auto flex items-center justify-center overflow-x-auto no-scrollbar gap-1.5 shadow-sm border border-white"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "tab-active"
                    : "text-gray-600 hover:text-gray-900 hover:bg-pink-50/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* 4. Active Tab Renderer */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-2"
        >
          {activeTab === "cycle" && <CycleTrackerTab />}
          {activeTab === "body" && <BodyMetricsTab />}
          {activeTab === "symptoms" && <SymptomsTab />}
          {activeTab === "analysis" && <AnalysisTab />}
          {activeTab === "learn" && <LearnTab />}
          {activeTab === "hospitals" && <HospitalsTab />}
          {activeTab === "chat" && <AIAssistantTab />}
        </motion.div>

        {/* Footer Disclaimer */}
        <div className="text-center pt-8 pb-6">
          <p className="text-[11px] text-gray-400 max-w-lg mx-auto leading-relaxed">
            This evidence-based hormonal health assistant is designed for educational screening and menstrual tracking. It does not provide medical diagnosis. Always consult a qualified physician or gynecologist for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}