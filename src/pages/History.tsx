import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAppStore } from "../store";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, Calendar, History as HistoryIcon, TrendingUp, ChevronRight, Lock } from "lucide-react";

interface AssessmentHistoryItem {
  id: number;
  risk_score: number;
  risk_level: "Low" | "Moderate" | "High";
  created_at: string;
  bmi: number;
}

interface TrendItem {
  date: string;
  score: number;
}

export default function History() {
  const navigate = useNavigate();
  const token = useAppStore((state) => state.token);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    // Fetch user history
    Promise.all([
      fetch(`/api/history?token=${token}`).then((res) => res.json()),
      fetch(`/api/trends?token=${token}`).then((res) => res.json()),
    ])
      .then(([historyData, trendsData]) => {
        setHistory(Array.isArray(historyData) ? historyData : []);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
      })
      .catch((err) => console.error("Error fetching user history:", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 max-w-sm w-full text-center space-y-4">
          <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-pink-500">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Login Required</h3>
          <p className="text-sm text-gray-400">
            You must be logged in to view your PCOD indicator history and check risk trends.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 rounded-xl transition-all shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const riskColors = {
    Low: "text-green-500 bg-green-50 border-green-200",
    Moderate: "text-yellow-500 bg-yellow-50 border-yellow-200",
    High: "text-red-500 bg-red-50 border-red-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <HistoryIcon className="w-7 h-7 text-pink-500" /> Patient Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Check your PCOD screening progress and track metric trends over time.
            </p>
          </div>
          <button
            onClick={() => navigate("/assessment")}
            className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            New Screening <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
            <p className="text-gray-500 text-sm">Loading historical data...</p>
          </div>
        ) : history.length > 0 ? (
          <>
            {/* Trends Chart */}
            {trends.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" /> Risk Trend Timeline
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#f472b6"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Assessment History List */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 pl-1">Past Screening Reports</h3>
              <div className="grid grid-cols-1 gap-4">
                {history.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-700">{item.risk_score}%</span>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                            riskColors[item.risk_level]
                          }`}
                        >
                          {item.risk_level} Risk
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.created_at}</span>
                        </div>
                        <div>
                          <span>BMI: {item.bmi}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`/api/report/${item.id}`}
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-pink-500 hover:text-pink-600 border border-pink-200 hover:border-pink-300 bg-pink-50/50 hover:bg-pink-50 px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Download className="w-4 h-4" /> Download PDF Report
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 space-y-4">
            <div className="bg-pink-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-pink-400">
              <HistoryIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">No Assessments Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              You haven't completed any PCOD screening assessments yet. Start one now to view your dashboard!
            </p>
            <button
              onClick={() => navigate("/assessment")}
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md"
            >
              Start First Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
