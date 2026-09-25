import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAppStore } from "../store";
import { ChevronRight, ChevronLeft, User, Activity, Heart, Brain, Loader2 } from "lucide-react";

const steps = ["Basic Info", "Hormones & History", "Symptoms"];

export default function Assessment() {
  const navigate = useNavigate();
  const { clinicalInputs, symptoms, setClinicalInputs, setSymptoms, setResult, token } = useAppStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (key: string, value: any) => {
    setClinicalInputs({ [key]: value });
  };

  const handleSymptomChange = (key: string, value: boolean) => {
    setSymptoms({ [key]: value });
  };

  async function calculateRisk() {
    setLoading(true);
    setError("");

    // Validate essential inputs
    if (
      !clinicalInputs.age ||
      !clinicalInputs.weight ||
      !clinicalInputs.height ||
      !clinicalInputs.cycleLength ||
      !clinicalInputs.cyclePeriod
    ) {
      setError("Please fill in all basic medical info.");
      setStep(0);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clinicalInputs: {
            age: parseFloat(clinicalInputs.age),
            height: parseFloat(clinicalInputs.height),
            weight: parseFloat(clinicalInputs.weight),
            cycleLength: parseFloat(clinicalInputs.cycleLength),
            cyclePeriod: parseFloat(clinicalInputs.cyclePeriod),
            bloodGlucose: clinicalInputs.bloodGlucose ? parseFloat(clinicalInputs.bloodGlucose) : null,
            sleepDuration: parseFloat(clinicalInputs.sleepDuration),
            familyHistory: clinicalInputs.familyHistory,
            physicalActivity: parseInt(clinicalInputs.physicalActivity),
            stressLevel: parseInt(clinicalInputs.stressLevel),
            fsh: clinicalInputs.fsh ? parseFloat(clinicalInputs.fsh) : null,
            lh: clinicalInputs.lh ? parseFloat(clinicalInputs.lh) : null,
            amh: clinicalInputs.amh ? parseFloat(clinicalInputs.amh) : null,
            testosterone: clinicalInputs.testosterone ? parseFloat(clinicalInputs.testosterone) : null,
            fastingInsulin: clinicalInputs.fastingInsulin ? parseFloat(clinicalInputs.fastingInsulin) : null,
          },
          symptoms: symptoms,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Prediction engine error.");
      }

      setResult(data);
      navigate("/results");
    } catch (err: any) {
      setError(err.message || "Unable to reach the PCOD prediction engine. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i <= step ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? "text-pink-500 font-medium" : "text-gray-400"}`}>
                {s}
              </span>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-16 ${i < step ? "bg-pink-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
              <div className="text-center">
                <h4 className="font-bold text-gray-800 text-lg">AI Risk Evaluation In Progress</h4>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  Running machine learning algorithms and explainability maps over your clinical parameters...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1 — Basic Info */}
              {step === 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-pink-100 p-2 rounded-xl">
                      <User className="w-5 h-5 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Age (years)", key: "age", placeholder: "e.g. 24" },
                      { label: "Weight (kg)", key: "weight", placeholder: "e.g. 65" },
                      { label: "Height (cm)", key: "height", placeholder: "e.g. 162" },
                      { label: "Cycle Length (days)", key: "cycleLength", placeholder: "e.g. 28" },
                      { label: "Period Duration (days)", key: "cyclePeriod", placeholder: "e.g. 5" },
                      { label: "Fasting Blood Glucose (mg/dL)", key: "bloodGlucose", placeholder: "e.g. 90 (optional)" },
                      { label: "Average Sleep Duration (hours)", key: "sleepDuration", placeholder: "e.g. 7" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className={labelClass}>{label}</label>
                        <input
                          type="number"
                          placeholder={placeholder}
                          value={clinicalInputs[key as keyof typeof clinicalInputs] as string}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Lifestyle & Hormones */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-xl">
                      <Activity className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Lifestyle, History & Hormones</h2>
                  </div>
                  <p className="text-xs text-gray-400 mb-6">
                    Hormonal biomarkers are optional. Leave them blank if you don't have blood test results.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className={labelClass}>Family History of PCOS/PCOD</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleInputChange("familyHistory", true)}
                          className={`flex-1 py-3 border rounded-xl text-sm font-medium transition-all ${
                            clinicalInputs.familyHistory
                              ? "bg-purple-50 border-purple-300 text-purple-600"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange("familyHistory", false)}
                          className={`flex-1 py-3 border rounded-xl text-sm font-medium transition-all ${
                            !clinicalInputs.familyHistory
                              ? "bg-purple-50 border-purple-300 text-purple-600"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Physical Activity Level</label>
                      <select
                        value={clinicalInputs.physicalActivity}
                        onChange={(e) => handleInputChange("physicalActivity", e.target.value)}
                        className={inputClass}
                      >
                        <option value="1">Low (Sedentary / Light walks)</option>
                        <option value="2">Moderate (Active 2-3 times/week)</option>
                        <option value="3">High (Heavy training / Athlete)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass}>Stress Level: {clinicalInputs.stressLevel} / 10</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={clinicalInputs.stressLevel}
                        onChange={(e) => handleInputChange("stressLevel", e.target.value)}
                        className="w-full accent-purple-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100 my-4" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "FSH (mIU/mL)", key: "fsh", placeholder: "e.g. 6.5" },
                      { label: "LH (mIU/mL)", key: "lh", placeholder: "e.g. 12" },
                      { label: "AMH (ng/mL)", key: "amh", placeholder: "e.g. 3.2" },
                      { label: "Testosterone (ng/dL)", key: "testosterone", placeholder: "e.g. 55" },
                      { label: "Fasting Insulin (µIU/mL)", key: "fastingInsulin", placeholder: "e.g. 10" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className={labelClass}>{label}</label>
                        <input
                          type="number"
                          placeholder={placeholder}
                          value={clinicalInputs[key as keyof typeof clinicalInputs] as string}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Symptoms */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      <Heart className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Symptoms</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "irregularPeriods", label: "Irregular periods" },
                      { key: "noPeriods", label: "Missed / absent periods" },
                      { key: "excessHair", label: "Excess facial/body hair" },
                      { key: "acne", label: "Acne or oily skin" },
                      { key: "hairLoss", label: "Hair thinning / loss" },
                      { key: "darkPatches", label: "Dark skin patches" },
                      { key: "weightGain", label: "Unexplained weight gain" },
                      { key: "difficultyLosingWeight", label: "Difficulty losing weight" },
                      { key: "fatigue", label: "Chronic fatigue" },
                      { key: "moodSwings", label: "Mood swings / anxiety" },
                      { key: "pelvicPain", label: "Pelvic pain" },
                      { key: "infertility", label: "Difficulty conceiving" },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          symptoms[key as keyof typeof symptoms]
                            ? "border-pink-300 bg-pink-50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={symptoms[key as keyof typeof symptoms]}
                          onChange={(e) => handleSymptomChange(key, e.target.checked)}
                          className="accent-pink-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => (step < 2 ? setStep(step + 1) : calculateRisk())}
                  className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all text-sm shadow-md cursor-pointer"
                >
                  {step < 2 ? "Next" : "Predict My PCOD Risk"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}