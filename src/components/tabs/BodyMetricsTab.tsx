import { motion } from "motion/react";
import { useAppStore } from "../../store";
import { Scale, Ruler, Thermometer, FlaskConical } from "lucide-react";

export default function BodyMetricsTab() {
  const { bodyMetrics, clinicalInputs, setBodyMetrics, setClinicalInputs } = useAppStore();

  const handleMetricChange = (key: string, value: string) => {
    setBodyMetrics({ [key]: value });
  };

  const handleClinicalChange = (key: string, value: string) => {
    setClinicalInputs({ [key]: value });
  };

  // Live BMI calculation
  const weightNum = parseFloat(bodyMetrics.weight || clinicalInputs.weight);
  const heightNum = parseFloat(bodyMetrics.height || clinicalInputs.height);
  let bmiVal: number | null = null;
  let bmiCategory = "";

  if (weightNum && heightNum && heightNum > 0) {
    bmiVal = parseFloat((weightNum / ((heightNum / 100) ** 2)).toFixed(1));
    if (bmiVal < 18.5) bmiCategory = "Underweight";
    else if (bmiVal < 24.9) bmiCategory = "Normal Weight";
    else if (bmiVal < 29.9) bmiCategory = "Overweight";
    else bmiCategory = "Obese (PCOS Risk Factor)";
  }

  // Live Waist to Hip Ratio calculation
  const waistNum = parseFloat(bodyMetrics.waist);
  const hipNum = parseFloat(bodyMetrics.hip);
  let whrVal: number | null = null;
  let whrCategory = "";

  if (waistNum && hipNum && hipNum > 0) {
    whrVal = parseFloat((waistNum / hipNum).toFixed(2));
    if (whrVal > 0.85) whrCategory = "Elevated (> 0.85) — High Android Fat Risk";
    else whrCategory = "Normal WHR (≤ 0.85)";
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Body Measurements Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-2xl shadow-sm border border-amber-200/60">
              ⚖️
            </div>
            <div>
              <h2 className="text-xl font-serif-title font-bold text-gray-800">
                Body Measurements
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                BMI calculation for metabolic assessment
              </p>
            </div>
          </div>

          {bmiVal !== null && (
            <div className="text-right">
              <span className="text-2xl font-black text-pink-600">{bmiVal}</span>
              <div className="text-[10px] font-semibold text-gray-500">{bmiCategory}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              WEIGHT (KG)
            </label>
            <input
              type="number"
              placeholder="e.g., 65"
              value={bodyMetrics.weight || clinicalInputs.weight}
              onChange={(e) => handleMetricChange("weight", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              HEIGHT (CM)
            </label>
            <input
              type="number"
              placeholder="e.g., 165"
              value={bodyMetrics.height || clinicalInputs.height}
              onChange={(e) => handleMetricChange("height", e.target.value)}
              className="input-blush w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Waist & Hip Ratio Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-100/80 flex items-center justify-center text-2xl shadow-sm border border-yellow-200/60">
              📏
            </div>
            <div>
              <h2 className="text-xl font-serif-title font-bold text-gray-800">
                Waist & Hip Ratio
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Metabolic risk indicator
              </p>
            </div>
          </div>

          {whrVal !== null && (
            <div className="text-right">
              <span className="text-2xl font-black text-purple-600">{whrVal}</span>
              <div className="text-[10px] font-semibold text-gray-500">{whrCategory}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              WAIST CIRCUMFERENCE (CM)
            </label>
            <input
              type="number"
              placeholder="e.g., 75"
              value={bodyMetrics.waist}
              onChange={(e) => handleMetricChange("waist", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              HIP CIRCUMFERENCE (CM)
            </label>
            <input
              type="number"
              placeholder="e.g., 95"
              value={bodyMetrics.hip}
              onChange={(e) => handleMetricChange("hip", e.target.value)}
              className="input-blush w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 3. Basal Body Temperature Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100/80 flex items-center justify-center text-2xl shadow-sm border border-rose-200/60">
            🌡️
          </div>
          <div>
            <h2 className="text-xl font-serif-title font-bold text-gray-800">
              Basal Body Temperature
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Ovulation & hormonal tracking
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              MORNING TEMPERATURE (°C)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 36.5"
              value={bodyMetrics.basalTemp}
              onChange={(e) => handleMetricChange("basalTemp", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              DATE RECORDED
            </label>
            <input
              type="date"
              value={bodyMetrics.tempDate}
              onChange={(e) => handleMetricChange("tempDate", e.target.value)}
              className="input-blush w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 4. Optional Biomarkers & Hormones */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100/80 flex items-center justify-center text-2xl shadow-sm border border-purple-200/60">
            🧪
          </div>
          <div>
            <h2 className="text-xl font-serif-title font-bold text-gray-800">
              Hormonal & Lab Biomarkers (Optional)
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Fill if you have blood test panel results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              FASTING BLOOD GLUCOSE (MG/DL)
            </label>
            <input
              type="number"
              placeholder="e.g., 90"
              value={clinicalInputs.bloodGlucose}
              onChange={(e) => handleClinicalChange("bloodGlucose", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              FASTING INSULIN (µIU/ML)
            </label>
            <input
              type="number"
              placeholder="e.g., 8.5"
              value={clinicalInputs.fastingInsulin}
              onChange={(e) => handleClinicalChange("fastingInsulin", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              LH - LUTEINIZING HORMONE (MIU/ML)
            </label>
            <input
              type="number"
              placeholder="e.g., 12.0"
              value={clinicalInputs.lh}
              onChange={(e) => handleClinicalChange("lh", e.target.value)}
              className="input-blush w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              FSH - FOLLICLE STIMULATING (MIU/ML)
            </label>
            <input
              type="number"
              placeholder="e.g., 5.5"
              value={clinicalInputs.fsh}
              onChange={(e) => handleClinicalChange("fsh", e.target.value)}
              className="input-blush w-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
