import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAppStore } from "../store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, CheckCircle, AlertCircle, RotateCcw, ArrowRight, Download, BrainCircuit } from "lucide-react";

export default function Results() {
  const navigate = useNavigate();
  const { result, clinicalInputs, symptoms } = useAppStore();

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-pink-100 max-w-sm">
          <p className="text-gray-500 mb-4 font-medium">No results yet. Please complete the assessment first.</p>
          <button
            onClick={() => navigate("/assessment")}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
          >
            Go to Assessment
          </button>
        </div>
      </div>
    );
  }

  const riskConfig = {
    Low: {
      color: "text-green-500",
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      message: "Your machine learning risk classification is low. Keep maintaining a healthy lifestyle!",
    },
    Moderate: {
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertCircle className="w-8 h-8 text-yellow-500" />,
      message: "Some metrics indicate elevated risk. Lifestyle modification and physician consultation advised.",
    },
    High: {
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      message: "Significant clinical markers detected. We strongly recommend scheduling a gynecologist evaluation.",
    },
  };

  const config = riskConfig[result.risk_level];

  // Map top contributing factors for Recharts
  const xaiData = result.top_features.map((f) => {
    // Format feature names to be more readable
    const readableNames: Record<string, string> = {
      Age: "Age",
      BMI: "Body Mass Index (BMI)",
      CycleLength: "Cycle Length",
      CycleRegularity: "Cycle Irregularity",
      Hirsutism: "Facial Hair (Hirsutism)",
      Acne: "Severe Acne",
      HairLoss: "Hair Loss",
      DarkPatches: "Skin Darkening",
      WeightGain: "Weight Gain",
      DifficultyLosingWeight: "Weight Loss Difficulty",
      Fatigue: "Chronic Fatigue",
      MoodSwings: "Mood Swings",
      PelvicPain: "Pelvic Pain",
      Infertility: "Infertility History",
      FamilyHistory: "PCOS Family History",
      StressLevel: "Stress Level",
      SleepDuration: "Sleep Duration",
      LH: "LH Levels",
      FSH: "FSH Levels",
      AMH: "AMH Levels",
      Testosterone: "Testosterone Levels",
      FastingInsulin: "Fasting Insulin",
      BloodGlucose: "Blood Sugar",
    };

    return {
      feature: readableNames[f.feature] || f.feature,
      impact: Math.round(f.contribution * 100),
      value: f.value,
      fill: f.contribution > 0 ? "#f472b6" : "#34d399",
    };
  });

  const bmi = result.clinical_details.bmi;
  const activeSymptoms = Object.entries(symptoms).filter(([, v]) => v).length;
  const lhFshRatio = result.clinical_details.lh_fsh_ratio;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Risk Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${config.bg} border ${config.border} rounded-3xl p-8 text-center shadow-sm relative overflow-hidden`}
        >
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            <BrainCircuit className="w-3.5 h-3.5" /> ML Inference
          </div>

          <div className="flex justify-center mb-4">{config.icon}</div>
          <div className={`text-7xl font-black ${config.color} mb-2`}>{result.risk_score}%</div>
          <div className="text-gray-500 text-sm mb-3">Predicted Probability of PCOD</div>
          <div
            className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${config.color} ${config.bg} border ${config.border} mb-4`}
          >
            {result.risk_level} Risk Category
          </div>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-2">{config.message}</p>
          <div className="text-xs text-gray-400">
            Algorithm Confidence: <span className="font-semibold">{Math.round(result.confidence * 100)}%</span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            {
              label: "BMI",
              value: bmi ?? "—",
              sub: bmi ? (bmi > 25 ? "Above normal" : "Normal range") : "Not entered",
            },
            {
              label: "Symptoms",
              value: `${activeSymptoms}/12`,
              sub: activeSymptoms > 6 ? "Many present" : "Few present",
            },
            {
              label: "LH/FSH Ratio",
              value: lhFshRatio ? lhFshRatio.toFixed(1) : "—",
              sub: lhFshRatio && lhFshRatio > 2.0 ? "Elevated (>2.0)" : "Normal range",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">{stat.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* SHAP Explanations Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
            Explainable AI (XAI) Assessment
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Relative contribution of top 5 medical metrics to your risk score. Bars pointing right increase risk; bars pointing left decrease risk.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={xaiData} layout="vertical" margin={{ left: 30, right: 30 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 10, fill: "#4b5563" }} />
                <Tooltip
                  formatter={(value: any) => [`${value > 0 ? "+" : ""}${value}% Impact`, "Risk Weight"]}
                  contentStyle={{ fontSize: 12, borderRadius: 12 }}
                />
                <ReferenceLine x={0} stroke="#d1d5db" />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {xaiData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-bold text-gray-800 mb-4">Personalized Recommendations</h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <ArrowRight className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 pb-10"
        >
          <button
            onClick={() => navigate("/assessment")}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3.5 rounded-2xl hover:bg-white transition-all text-sm cursor-pointer font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Retake Assessment
          </button>
          
          <a
            href={`/api/report/${result.assessment_id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3.5 rounded-2xl transition-all text-sm cursor-pointer font-medium shadow-md"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </a>

          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-2xl font-medium transition-all text-sm shadow-md cursor-pointer"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}