import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Auth from "./pages/Auth";
import HospitalFinder from "./pages/HospitalFinder";
import History from "./pages/History";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/results" element={<Results />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/hospitals" element={<HospitalFinder />} />
      <Route path="/history" element={<History />} />
    </Routes>
    <Chatbot />
  </BrowserRouter>
);