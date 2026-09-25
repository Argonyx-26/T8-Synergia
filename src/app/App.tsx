import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Weight, AlertCircle, Download, Info, TrendingUp, Activity } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card } from './components/ui/card';
import { Checkbox } from './components/ui/checkbox';

interface PeriodEntry {
  startDate: string;
  endDate: string;
  cycleLength?: number;
}

interface Symptoms {
  irregularPeriods: boolean;
  noPeriods: boolean;
  excessHair: boolean;
  acne: boolean;
  hairLoss: boolean;
  darkPatches: boolean;
  weightGain: boolean;
  difficultyLosingWeight: boolean;
  fatigue: boolean;
}

interface ScoreBreakdown {
  ovulationScore: number;
  androgenScore: number;
  metabolicScore: number;
}

export default function App() {
  const [currentPeriodStart, setCurrentPeriodStart] = useState('');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [periodHistory, setPeriodHistory] = useState<PeriodEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<Symptoms>({
    irregularPeriods: false,
    noPeriods: false,
    excessHair: false,
    acne: false,
    hairLoss: false,
    darkPatches: false,
    weightGain: false,
    difficultyLosingWeight: false,
    fatigue: false,
  });

  // Load period history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('periodHistory');
    if (saved) {
      setPeriodHistory(JSON.parse(saved));
    }
  }, []);

  // Save period history to localStorage
  const savePeriodHistory = (history: PeriodEntry[]) => {
    localStorage.setItem('periodHistory', JSON.stringify(history));
    setPeriodHistory(history);
  };

  const handleSymptomChange = (symptom: keyof Symptoms) => {
    setSymptoms(prev => ({ ...prev, [symptom]: !prev[symptom] }));
  };

  const addPeriodEntry = () => {
    if (!currentPeriodStart || !currentPeriodEnd) return;

    const start = new Date(currentPeriodStart);
    const end = new Date(currentPeriodEnd);

    let cycleLength = 0;
    if (periodHistory.length > 0) {
      const lastEntry = periodHistory[periodHistory.length - 1];
      const lastStart = new Date(lastEntry.startDate);
      cycleLength = Math.floor((start.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    const newEntry: PeriodEntry = {
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
      cycleLength: cycleLength > 0 ? cycleLength : undefined,
    };

    const updated = [...periodHistory, newEntry].slice(-6);
    savePeriodHistory(updated);
    setCurrentPeriodStart('');
    setCurrentPeriodEnd('');
  };

  const calculateBMI = () => {
    if (!weight || !height) return 0;
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    return w / (h * h);
  };

  const calculateScore = (): { total: number; breakdown: ScoreBreakdown } => {
    let ovulationScore = 0;
    let androgenScore = 0;
    let metabolicScore = 0;

    // Ovulation criteria (0-30 points)
    if (symptoms.irregularPeriods) ovulationScore += 15;
    if (symptoms.noPeriods) ovulationScore += 15;

    // Androgen criteria (0-40 points)
    if (symptoms.excessHair) androgenScore += 15;
    if (symptoms.acne) androgenScore += 10;
    if (symptoms.hairLoss) androgenScore += 10;
    if (symptoms.darkPatches) androgenScore += 5;

    // Metabolic criteria (0-30 points)
    const bmi = calculateBMI();
    if (bmi > 25) metabolicScore += 10;
    if (bmi > 30) metabolicScore += 5;
    if (symptoms.weightGain) metabolicScore += 7;
    if (symptoms.difficultyLosingWeight) metabolicScore += 5;
    if (symptoms.fatigue) metabolicScore += 3;

    return {
      total: ovulationScore + androgenScore + metabolicScore,
      breakdown: { ovulationScore, androgenScore, metabolicScore },
    };
  };

  const getRiskLevel = (score: number): { level: string; color: string; description: string } => {
    if (score < 25) return {
      level: 'Low Risk',
      color: 'bg-green-500',
      description: 'Your symptoms suggest a low likelihood of PCOS. Continue monitoring your cycle.'
    };
    if (score < 50) return {
      level: 'Moderate Risk',
      color: 'bg-yellow-500',
      description: 'Some indicators suggest possible hormonal imbalance. Consider consulting a healthcare provider.'
    };
    return {
      level: 'High Risk',
      color: 'bg-red-500',
      description: 'Multiple indicators suggest a strong likelihood of PCOS. Please consult a gynecologist for proper diagnosis.'
    };
  };

  const analyzeCycles = () => {
    if (periodHistory.length < 2) return null;

    const cycleLengths = periodHistory.filter(p => p.cycleLength).map(p => p.cycleLength!);
    if (cycleLengths.length === 0) return null;

    const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const min = Math.min(...cycleLengths);
    const max = Math.max(...cycleLengths);

    const isIrregular = (max - min) > 7 || avg < 21 || avg > 35;

    return { avg: Math.round(avg), min, max, isIrregular };
  };

  const getPersonalizedAdvice = (breakdown: ScoreBreakdown) => {
    const advice = [];
    const bmi = calculateBMI();

    if (breakdown.metabolicScore >= 15 || bmi > 25) {
      advice.push({
        title: 'Weight & Lifestyle',
        tips: [
          'Focus on balanced nutrition with low glycemic index foods',
          'Aim for 150 minutes of moderate exercise per week',
          'Consider strength training to improve insulin sensitivity',
          'Prioritize sleep (7-9 hours) to regulate hormones',
        ],
      });
    }

    if (breakdown.androgenScore >= 15) {
      advice.push({
        title: 'Skincare & Hair Care',
        tips: [
          'Use gentle, non-comedogenic skincare products',
          'Consider anti-androgen treatments (consult dermatologist)',
          'Explore hair removal options if excess hair bothers you',
          'Look into supplements like spearmint tea for androgen reduction',
        ],
      });
    }

    if (breakdown.ovulationScore >= 15) {
      advice.push({
        title: 'Cycle Tracking',
        tips: [
          'Continue tracking periods to identify patterns',
          'Monitor basal body temperature to detect ovulation',
          'Consider ovulation predictor kits',
          'Discuss fertility concerns with your gynecologist',
        ],
      });
    }

    return advice;
  };

  const checkDoctorWarnings = () => {
    const warnings = [];

    if (symptoms.noPeriods) {
      warnings.push('No periods for extended time - immediate medical consultation recommended');
    }

    if (symptoms.excessHair && symptoms.acne && symptoms.hairLoss) {
      warnings.push('Multiple androgen signs detected - hormonal evaluation needed');
    }

    if (symptoms.weightGain && symptoms.difficultyLosingWeight && calculateBMI() > 30) {
      warnings.push('Significant metabolic concerns - comprehensive health screening advised');
    }

    return warnings;
  };

  const generatePDFReport = () => {
    const score = calculateScore();
    const risk = getRiskLevel(score.total);
    const bmi = calculateBMI();
    const cycles = analyzeCycles();
    const advice = getPersonalizedAdvice(score.breakdown);
    const warnings = checkDoctorWarnings();

    const reportContent = `
PCOS/PCOD SCREENING REPORT
Generated: ${new Date().toLocaleDateString()}

PATIENT INFORMATION
Weight: ${weight} kg
Height: ${height} cm
BMI: ${bmi.toFixed(1)}

SYMPTOM ANALYSIS
Total Score: ${score.total}/100
Ovulation Score: ${score.breakdown.ovulationScore}/30
Androgen Score: ${score.breakdown.androgenScore}/40
Metabolic Score: ${score.breakdown.metabolicScore}/30

RISK ASSESSMENT
Risk Level: ${risk.level}
${risk.description}

${cycles ? `CYCLE ANALYSIS
Average Cycle: ${cycles.avg} days
Range: ${cycles.min}-${cycles.max} days
Pattern: ${cycles.isIrregular ? 'Irregular' : 'Regular'}
` : ''}

SYMPTOMS REPORTED
${Object.entries(symptoms).filter(([_, v]) => v).map(([k]) => `• ${k.replace(/([A-Z])/g, ' $1').toLowerCase()}`).join('\n')}

PERSONALIZED RECOMMENDATIONS
${advice.map(a => `\n${a.title.toUpperCase()}\n${a.tips.map(t => `• ${t}`).join('\n')}`).join('\n')}

${warnings.length > 0 ? `IMPORTANT WARNINGS
${warnings.map(w => `⚠ ${w}`).join('\n')}
` : ''}

DISCLAIMER
This is a screening tool only, not a medical diagnosis.
Please consult a qualified healthcare provider for proper evaluation.

PRIVACY NOTE
All data is processed locally in your browser and is not stored on any server.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCOS-Report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, weight, height })
      });
      const data = await response.json();
      setAssessment(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing data:', error);
      alert('Failed to connect to backend server. Make sure it is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const cycles = analyzeCycles();
  const warnings = checkDoctorWarnings();
  const bmi = calculateBMI();
  
  const score = assessment?.score || { total: 0, breakdown: { ovulationScore: 0, androgenScore: 0, metabolicScore: 0 } };
  const risk = assessment?.risk || { level: '', color: '', description: '' };
  const advice = assessment?.advice || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Activity className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PCOS Health Assistant</h1>
              <p className="text-sm text-gray-600">Evidence-based screening tool</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
        >
          <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Privacy First:</strong> All your data stays in your browser. We do not store or transmit any personal health information.
          </div>
        </motion.div>

        {/* Period Tracking Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Calendar className="size-6 text-pink-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Period Tracker</h2>
                <p className="text-sm text-gray-600">Log your menstrual cycle dates</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Period Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={currentPeriodStart}
                  onChange={(e) => setCurrentPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Period End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={currentPeriodEnd}
                  onChange={(e) => setCurrentPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={addPeriodEntry}
              disabled={!currentPeriodStart || !currentPeriodEnd}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
            >
              Add Period Entry
            </Button>

            {/* Period History Table */}
            {periodHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Recent Cycle History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-700">Start Date</th>
                        <th className="text-left p-3 font-medium text-gray-700">End Date</th>
                        <th className="text-left p-3 font-medium text-gray-700">Cycle Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodHistory.map((entry, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{new Date(entry.startDate).toLocaleDateString()}</td>
                          <td className="p-3">{new Date(entry.endDate).toLocaleDateString()}</td>
                          <td className="p-3">
                            {entry.cycleLength ? `${entry.cycleLength} days` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {cycles && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <TrendingUp className="size-5 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Cycle Pattern Analysis</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Your cycle varies between <strong>{cycles.min}–{cycles.max} days</strong> with an average of <strong>{cycles.avg} days</strong>.
                          {cycles.isIrregular ? (
                            <span className="text-orange-700"> → Irregular pattern detected</span>
                          ) : (
                            <span className="text-green-700"> → Regular pattern</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* Body Measurements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Weight className="size-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Body Measurements</h2>
                <p className="text-sm text-gray-600">BMI calculation for metabolic assessment</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            {weight && height && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-purple-50 rounded-lg"
              >
                <p className="text-sm text-gray-700">
                  Your BMI: <strong className="text-lg text-purple-900">{bmi.toFixed(1)}</strong>
                  <span className="ml-2">
                    {bmi < 18.5 && '(Underweight)'}
                    {bmi >= 18.5 && bmi < 25 && '(Normal)'}
                    {bmi >= 25 && bmi < 30 && '(Overweight)'}
                    {bmi >= 30 && '(Obese)'}
                  </span>
                </p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Symptoms Checklist */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <div className="pb-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Current Symptoms</h2>
              <p className="text-sm text-gray-600">Select all symptoms you're experiencing</p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-3">Menstrual Symptoms</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.irregularPeriods}
                      onCheckedChange={() => handleSymptomChange('irregularPeriods')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Irregular periods (cycles vary by more than 7 days)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.noPeriods}
                      onCheckedChange={() => handleSymptomChange('noPeriods')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Absent periods (no period for 3+ months)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="font-medium text-gray-900 mb-3">Androgen-Related Symptoms</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.excessHair}
                      onCheckedChange={() => handleSymptomChange('excessHair')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Excess facial or body hair (hirsutism)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.acne}
                      onCheckedChange={() => handleSymptomChange('acne')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Persistent acne or oily skin</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.hairLoss}
                      onCheckedChange={() => handleSymptomChange('hairLoss')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Hair thinning or male-pattern baldness</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.darkPatches}
                      onCheckedChange={() => handleSymptomChange('darkPatches')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Dark skin patches (acanthosis nigricans)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="font-medium text-gray-900 mb-3">Metabolic Symptoms</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.weightGain}
                      onCheckedChange={() => handleSymptomChange('weightGain')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Sudden or unexplained weight gain</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.difficultyLosingWeight}
                      onCheckedChange={() => handleSymptomChange('difficultyLosingWeight')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Difficulty losing weight despite efforts</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={symptoms.fatigue}
                      onCheckedChange={() => handleSymptomChange('fatigue')}
                    />
                    <span className="text-sm group-hover:text-gray-900">Chronic fatigue or low energy</span>
                  </label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-lg py-6"
            >
              Analyze My Risk
            </Button>
          </div>
        </motion.section>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Warning Messages */}
              {warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 text-lg mb-2">Medical Attention Recommended</h3>
                      <ul className="space-y-2">
                        {warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Risk Assessment */}
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Risk Assessment</h2>

                {/* Visual Risk Meter */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">PCOS Risk Score</span>
                    <span className="text-2xl font-bold text-gray-900">{score.total}/100</span>
                  </div>

                  <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score.total}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${risk.color} flex items-center justify-end px-3`}
                    >
                      <span className="text-xs font-medium text-white">{risk.level}</span>
                    </motion.div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Smart Assistant Output */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100"
                >
                  <p className="text-gray-900 leading-relaxed">{risk.description}</p>
                </motion.div>

                {/* Criteria Breakdown */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">Detailed Breakdown</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Ovulation Criteria</p>
                        <p className="text-xs text-gray-600">Irregular or absent periods indicate ovulation issues</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{score.breakdown.ovulationScore}/30</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Androgen Criteria</p>
                        <p className="text-xs text-gray-600">High male hormone levels cause excess hair, acne, hair loss</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{score.breakdown.androgenScore}/40</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Metabolic Criteria</p>
                        <p className="text-xs text-gray-600">Insulin resistance affects weight and energy levels</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{score.breakdown.metabolicScore}/30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Advice */}
              {advice.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Personalized Recommendations</h2>

                  <div className="space-y-6">
                    {advice.map((category, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-3"
                      >
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="size-2 rounded-full bg-purple-600"></span>
                          {category.title}
                        </h3>
                        <ul className="space-y-2 pl-4">
                          {category.tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-purple-600 mt-0.5">→</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Report */}
              <Button
                onClick={generatePDFReport}
                className="w-full bg-gray-900 hover:bg-gray-800 py-6 text-lg"
              >
                <Download className="size-5 mr-2" />
                Download Full Report
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PCOS vs PCOD Info Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Understanding PCOS vs PCOD</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium text-purple-900">PCOS (Polycystic Ovary Syndrome)</h3>
                <p className="text-sm text-gray-700">
                  A metabolic and hormonal disorder where the ovaries produce excess androgens.
                  It's a syndrome affecting multiple body systems including metabolism, fertility, and cardiovascular health.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-pink-900">PCOD (Polycystic Ovarian Disease)</h3>
                <p className="text-sm text-gray-700">
                  A condition where the ovaries release immature eggs that develop into cysts.
                  It's primarily a ovarian disorder with less severe metabolic implications than PCOS.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 pt-4 border-t border-purple-200">
              <strong>Note:</strong> Both conditions share similar symptoms but differ in severity and systemic impact.
              Only a healthcare provider can provide an accurate diagnosis through ultrasound and blood tests.
            </p>
          </div>
        </motion.section>

        {/* Footer Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 py-8 border-t"
        >
          <p className="mb-2">
            <strong>Medical Disclaimer:</strong> This tool provides screening information only and is not a substitute for professional medical advice.
          </p>
          <p>Based on Rotterdam criteria · For educational purposes · Always consult a qualified healthcare provider</p>
        </motion.div>
      </div>
    </div>
  );
}
