import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Shield, Sparkles } from "lucide-react";
import { useAppStore } from "../store";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, email, logout } = useAppStore();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-pink-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => navigate("/")}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-100 to-pink-200 flex items-center justify-center text-lg shadow-xs border border-white group-hover:scale-105 transition-transform">
          🌸
        </div>
        <div>
          <span className="font-serif-title font-bold text-gray-800 text-base sm:text-lg tracking-tight block leading-tight">
            PCOS · PCOD
          </span>
          <span className="text-[10px] text-pink-600 font-semibold tracking-wider uppercase block">
            Health Assistant
          </span>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {token && (
          <button
            onClick={() => navigate("/history")}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-pink-600 bg-pink-50/70 hover:bg-pink-100 border border-pink-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-pink-500" /> Saved Trends
          </button>
        )}

        {token ? (
          <div className="flex items-center gap-3 border-l border-pink-100 pl-3">
            <div className="flex items-center gap-1.5 bg-white border border-pink-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-xs text-gray-700 font-semibold max-w-[110px] truncate">
                {email?.split("@")[0] || "Patient"}
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" /> Sign In
          </button>
        )}
      </div>
    </nav>
  );
}