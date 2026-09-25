import { useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../store";
import { Download, Sparkles, AlertCircle, CheckCircle2, RotateCcw, Activity } from "lucide-react";

export default function AnalysisTab() {
  const { computeCriteriaBreakdown, result, clinicalInputs, symptoms, bodyMetrics, token, setResult } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const breakdown = computeCriteriaBreakdown();

  // If user completed ML inference via API, use ML score; otherwise use live dynamic 4-criteria engine score
  const displayScore = result ? result.risk_score : breakdown.totalRiskScore;
  const displayLevel = result ? result.risk_level : breakdown.riskLevel;

  const handleRunFullML = async () => {
    setLoading(true);
    setApiError("");

    try {
      const heightVal = parseFloat(clinicalInputs.height || bodyMetrics.height) || 162;
      const weightVal = parseFloat(clinicalInputs.weight || bodyMetrics.weight) || 60;

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clinicalInputs: {
            age: parseFloat(clinicalInputs.age) || 26,
            height: heightVal,
            weight: weightVal,
            cycleLength: parseFloat(clinicalInputs.cycleLength) || 28,
            cyclePeriod: parseFloat(clinicalInputs.cyclePeriod) || 5,
            bloodGlucose: clinicalInputs.bloodGlucose ? parseFloat(clinicalInputs.bloodGlucose) : null,
            sleepDuration: parseFloat(clinicalInputs.sleepDuration) || 7,
            familyHistory: clinicalInputs.familyHistory,
            physicalActivity: parseInt(clinicalInputs.physicalActivity) || 2,
            stressLevel: parseInt(clinicalInputs.stressLevel) || 5,
            fsh: clinicalInputs.fsh ? parseFloat(clinicalInputs.fsh) : null,
            lh: clinicalInputs.lh ? parseFloat(clinicalInputs.lh) : null,
            amh: clinicalInputs.amh ? parseFloat(clinicalInputs.amh) : null,
            testosterone: clinicalInputs.testosterone ? parseFloat(clinicalInputs.testosterone) : null,
            fastingInsulin: clinicalInputs.fastingInsulin ? parseFloat(clinicalInputs.fastingInsulin) : null,
          },
          symptoms,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setApiError("Using local evidence-based screening algorithm.");
      }
    } catch {
      setApiError("Using local evidence-based screening algorithm.");
    } finally {
      setLoading(false);
    }
  };

  // Status configuration based on risk level
  const statusConfig = {
    Low: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Low Risk Detected",
      desc: "Your reported symptoms and metrics suggest a low likelihood of PCOS/PCOD. Continue healthy lifestyle habits and regular cycle tracking.",
    },
    Moderate: {
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      title: "Moderate Risk Detected",
      desc: "Some metrics indicate elevated risk factors. Lifestyle modification, low-GI nutrition, and routine gynecologist consultation are advised.",
    },
    High: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      title: "High Risk Detected",
      desc: "Significant clinical markers detected. We strongly recommend scheduling a gynecological evaluation and pelvic ultrasound confirmation.",
    },
  };

  const currentStatus = statusConfig[displayLevel];

  // Dynamic progress bar position
  const progressPercent = Math.min(100, Math.max(0, displayScore));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Risk Assessment Main Card matching Screenshot #1 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-10 text-center relative overflow-hidden"
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-100/80 flex items-center justify-center text-3xl shadow-sm border border-purple-200/60 mb-3">
            🔮
          </div>
          <h2 className="text-3xl font-serif-title font-bold text-gray-800">
            Risk Assessment
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Powered by evidence-based screening
          </p>
        </div>

        {/* 3D Radial Score Circle Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative w-44 h-44 rounded-full flex items-center justify-center p-3 bg-gradient-to-tr from-pink-100 via-purple-50 to-pink-50 shadow-xl border-4 border-white animate-pulse-glow">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#FCE7F3"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#pinkGradient)"
                strokeWidth="6"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-serif-title font-bold text-gray-800">
                {displayScore}%
              </span>
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-0.5">
                RISK SCORE
              </span>
            </div>
          </div>
        </div>

        {/* PCOS Risk Score Slider Bar */}
        <div className="max-w-xl mx-auto space-y-2 mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>PCOS Risk Score</span>
            <span className="font-serif-title font-bold text-gray-800 text-sm">
              {displayScore}/100
            </span>
          </div>

          <div className="relative w-full h-3 bg-pink-100/70 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        {/* Dynamic Status Badge & Description */}
        <div className="max-w-xl mx-auto bg-white/90 border border-pink-100 rounded-2xl p-5 shadow-xs mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {currentStatus.icon}
            <span className="font-bold text-gray-800 text-sm">
              {currentStatus.title}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {currentStatus.desc}
          </p>
        </div>

        {/* 4 Sub-criteria Cards Grid (2x2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* 1. Ovulation Criteria */}
          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                🌙 Ovulation Criteria
              </span>
              <span>{breakdown.ovulationScore}%</span>
            </div>
            <div className="w-full h-2 bg-pink-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.ovulationScore}%` }}
              />
            </div>
          </div>

          {/* 2. Androgen Criteria */}
          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                ⚡ Androgen Criteria
              </span>
              <span>{breakdown.androgenScore}%</span>
            </div>
            <div className="w-full h-2 bg-pink-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.androgenScore}%` }}
              />
            </div>
          </div>

          {/* 3. Metabolic Criteria */}
          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                ⚖️ Metabolic Criteria
              </span>
              <span>{breakdown.metabolicScore}%</span>
            </div>
            <div className="w-full h-2 bg-pink-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.metabolicScore}%` }}
              />
            </div>
          </div>

          {/* 4. Emotional Risk */}
          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                🧠 Emotional Risk
              </span>
              <span>{breakdown.emotionalScore}%</span>
            </div>
            <div className="w-full h-2 bg-pink-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.emotionalScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRunFullML}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4" /> {loading ? "Evaluating..." : "Run Advanced ML Analysis"}
          </button>

          {result?.assessment_id && (
            <a
              href={`/api/report/${result.assessment_id}`}
              className="flex-1 flex items-center justify-center gap-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer text-xs"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
