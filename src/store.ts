import { create } from "zustand";

export interface PeriodEntry {
  id: string;
  startDate: string;
  endDate: string;
  notes?: string;
  durationDays: number;
}

export interface BodyMetrics {
  weight: string; // kg
  height: string; // cm
  waist: string; // cm
  hip: string; // cm
  basalTemp: string; // °C
  tempDate: string; // date
}

export interface ClinicalInputs {
  age: string;
  weight: string;
  height: string;
  cycleLength: string;
  cyclePeriod: string;
  bloodGlucose: string;
  sleepDuration: string;
  familyHistory: boolean;
  physicalActivity: string; // "1" | "2" | "3"
  stressLevel: string; // "1" to "10"
  fsh: string;
  lh: string;
  amh: string;
  testosterone: string;
  fastingInsulin: string;
}

export interface Symptoms {
  irregularPeriods: boolean;
  noPeriods: boolean;
  excessHair: boolean;
  acne: boolean;
  hairLoss: boolean;
  darkPatches: boolean;
  weightGain: boolean;
  difficultyLosingWeight: boolean;
  fatigue: boolean;
  moodSwings: boolean;
  pelvicPain: boolean;
  infertility: boolean;
}

export interface MLResult {
  assessment_id: number;
  risk_score: number;
  risk_level: "Low" | "Moderate" | "High";
  confidence: number;
  top_features: Array<{ feature: string; contribution: number; value: number }>;
  recommendations: string[];
  clinical_details: {
    bmi: number;
    lh_fsh_ratio: number | null;
  };
}

export interface CriteriaBreakdown {
  ovulationScore: number; // 0 to 100
  androgenScore: number; // 0 to 100
  metabolicScore: number; // 0 to 100
  emotionalScore: number; // 0 to 100
  totalRiskScore: number; // 0 to 100
  riskLevel: "Low" | "Moderate" | "High";
}

interface AppState {
  token: string | null;
  email: string | null;
  activeTab: string;
  periodEntries: PeriodEntry[];
  bodyMetrics: BodyMetrics;
  clinicalInputs: ClinicalInputs;
  symptoms: Symptoms;
  result: MLResult | null;
  
  // Actions
  setActiveTab: (tab: string) => void;
  setToken: (token: string | null, email?: string | null) => void;
  addPeriodEntry: (entry: Omit<PeriodEntry, "id" | "durationDays">) => void;
  deletePeriodEntry: (id: string) => void;
  setBodyMetrics: (metrics: Partial<BodyMetrics>) => void;
  setClinicalInputs: (inputs: Partial<ClinicalInputs>) => void;
  setSymptoms: (symptoms: Partial<Symptoms>) => void;
  setResult: (result: MLResult | null) => void;
  computeCriteriaBreakdown: () => CriteriaBreakdown;
  logout: () => void;
  resetAssessment: () => void;
}

const initialClinicalInputs: ClinicalInputs = {
  age: "26",
  weight: "",
  height: "",
  cycleLength: "28",
  cyclePeriod: "5",
  bloodGlucose: "",
  sleepDuration: "7",
  familyHistory: false,
  physicalActivity: "2",
  stressLevel: "5",
  fsh: "",
  lh: "",
  amh: "",
  testosterone: "",
  fastingInsulin: "",
};

const initialBodyMetrics: BodyMetrics = {
  weight: "",
  height: "",
  waist: "",
  hip: "",
  basalTemp: "",
  tempDate: new Date().toISOString().split("T")[0],
};

const initialSymptoms: Symptoms = {
  irregularPeriods: false,
  noPeriods: false,
  excessHair: false,
  acne: false,
  hairLoss: false,
  darkPatches: false,
  weightGain: false,
  difficultyLosingWeight: false,
  fatigue: false,
  moodSwings: false,
  pelvicPain: false,
  infertility: false,
};

// Load saved period entries from localStorage
const loadSavedEntries = (): PeriodEntry[] => {
  try {
    const raw = localStorage.getItem("pcos_period_entries");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  token: localStorage.getItem("pcos_token"),
  email: localStorage.getItem("pcos_email"),
  activeTab: "cycle",
  periodEntries: loadSavedEntries(),
  bodyMetrics: initialBodyMetrics,
  clinicalInputs: initialClinicalInputs,
  symptoms: initialSymptoms,
  result: null,

  setActiveTab: (activeTab) => set({ activeTab }),

  setToken: (token, email = null) => {
    if (token) {
      localStorage.setItem("pcos_token", token);
      if (email) localStorage.setItem("pcos_email", email);
    } else {
      localStorage.removeItem("pcos_token");
      localStorage.removeItem("pcos_email");
    }
    set({ token, email });
  },

  addPeriodEntry: (entry) => {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newEntry: PeriodEntry = {
      ...entry,
      id: "entry_" + Date.now(),
      durationDays: isNaN(durationDays) ? 1 : durationDays,
    };

    const updated = [newEntry, ...get().periodEntries];
    localStorage.setItem("pcos_period_entries", JSON.stringify(updated));
    set({ periodEntries: updated });
  },

  deletePeriodEntry: (id) => {
    const updated = get().periodEntries.filter((e) => e.id !== id);
    localStorage.setItem("pcos_period_entries", JSON.stringify(updated));
    set({ periodEntries: updated });
  },

  setBodyMetrics: (metrics) =>
    set((state) => ({
      bodyMetrics: { ...state.bodyMetrics, ...metrics },
      clinicalInputs: {
        ...state.clinicalInputs,
        ...(metrics.weight !== undefined ? { weight: metrics.weight } : {}),
        ...(metrics.height !== undefined ? { height: metrics.height } : {}),
      },
    })),

  setClinicalInputs: (inputs) =>
    set((state) => ({
      clinicalInputs: { ...state.clinicalInputs, ...inputs },
      bodyMetrics: {
        ...state.bodyMetrics,
        ...(inputs.weight !== undefined ? { weight: inputs.weight } : {}),
        ...(inputs.height !== undefined ? { height: inputs.height } : {}),
      },
    })),

  setSymptoms: (symptoms) =>
    set((state) => ({
      symptoms: { ...state.symptoms, ...symptoms },
    })),

  setResult: (result) => set({ result }),

  computeCriteriaBreakdown: () => {
    const { symptoms, bodyMetrics, clinicalInputs } = get();

    // 1. Ovulation Criteria (0 to 100)
    let ovulationPoints = 0;
    if (symptoms.irregularPeriods) ovulationPoints += 40;
    if (symptoms.noPeriods) ovulationPoints += 50;
    if (parseFloat(clinicalInputs.cycleLength) > 35 || parseFloat(clinicalInputs.cycleLength) < 21) ovulationPoints += 25;
    const ovulationScore = Math.min(100, ovulationPoints);

    // 2. Androgen Criteria (0 to 100)
    let androgenPoints = 0;
    if (symptoms.excessHair) androgenPoints += 45;
    if (symptoms.acne) androgenPoints += 30;
    if (symptoms.hairLoss) androgenPoints += 25;
    if (symptoms.darkPatches) androgenPoints += 20;
    if (parseFloat(clinicalInputs.testosterone) > 45) androgenPoints += 35;
    const androgenScore = Math.min(100, androgenPoints);

    // 3. Metabolic Criteria (0 to 100)
    let metabolicPoints = 0;
    const weight = parseFloat(bodyMetrics.weight || clinicalInputs.weight);
    const height = parseFloat(bodyMetrics.height || clinicalInputs.height);
    if (weight && height) {
      const bmi = weight / ((height / 100) ** 2);
      if (bmi >= 25 && bmi < 30) metabolicPoints += 30;
      if (bmi >= 30) metabolicPoints += 55;
    }
    const waist = parseFloat(bodyMetrics.waist);
    const hip = parseFloat(bodyMetrics.hip);
    if (waist && hip && hip > 0) {
      const whr = waist / hip;
      if (whr > 0.85) metabolicPoints += 35;
    }
    if (symptoms.weightGain) metabolicPoints += 20;
    if (symptoms.difficultyLosingWeight) metabolicPoints += 25;
    const metabolicScore = Math.min(100, metabolicPoints);

    // 4. Emotional & Lifestyle Risk (0 to 100)
    let emotionalPoints = 0;
    if (symptoms.moodSwings) emotionalPoints += 40;
    if (symptoms.fatigue) emotionalPoints += 30;
    const stress = parseInt(clinicalInputs.stressLevel || "5");
    emotionalPoints += Math.round((stress / 10) * 30);
    const emotionalScore = Math.min(100, emotionalPoints);

    // Total weighted risk score
    const totalRiskScore = Math.round(
      ovulationScore * 0.35 + androgenScore * 0.35 + metabolicScore * 0.2 + emotionalScore * 0.1
    );

    let riskLevel: "Low" | "Moderate" | "High" = "Low";
    if (totalRiskScore > 65) riskLevel = "High";
    else if (totalRiskScore > 30) riskLevel = "Moderate";

    return {
      ovulationScore,
      androgenScore,
      metabolicScore,
      emotionalScore,
      totalRiskScore,
      riskLevel,
    };
  },

  logout: () => {
    localStorage.removeItem("pcos_token");
    localStorage.removeItem("pcos_email");
    set({ token: null, email: null, result: null });
  },

  resetAssessment: () =>
    set({
      clinicalInputs: initialClinicalInputs,
      bodyMetrics: initialBodyMetrics,
      symptoms: initialSymptoms,
      result: null,
    }),
}));
