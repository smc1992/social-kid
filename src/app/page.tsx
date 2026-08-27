"use client";

import React, { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Navbar } from "@/components/Navbar";
import { SettingsModal } from "@/components/SettingsModal";
import { ProjectManagerModal } from "@/components/ProjectManagerModal";
import { AutoPilotModal } from "@/components/AutoPilotModal";
import { Step1SongCreator } from "@/components/Step1SongCreator";
import { Step2MusicStudio } from "@/components/Step2MusicStudio";
import { Step3Storyboard } from "@/components/Step3Storyboard";
import { Step4KaraokeAligner } from "@/components/Step4KaraokeAligner";
import { Step5VideoStudio } from "@/components/Step5VideoStudio";
import { PasswordGate } from "@/components/PasswordGate";
import { CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";

export default function HomePage() {
  const {
    currentProject,
    currentStep,
    fetchProjects,
    fetchSettings,
    toastMessage,
    isLoading,
    isAutoPilotOpen,
    setAutoPilotOpen,
    theme,
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
  }, [theme]);

  return (
    <PasswordGate>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === "light" ? "bg-slate-50 text-slate-900 selection:bg-pink-400 selection:text-white" : "bg-[#0b0f19] text-slate-100 selection:bg-pink-500 selection:text-white"
      }`}>
        {/* 1. Header Navigation */}
        <Navbar />

      {/* 2. Main Studio Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-pink-500/25 animate-bounce font-bold">
              🌟
            </div>
            <p className="font-fredoka text-xl font-bold text-white">Social Kid Studio lädt...</p>
          </div>
        ) : (
          <div>
            {currentStep === 1 && <Step1SongCreator />}
            {currentStep === 2 && <Step2MusicStudio />}
            {currentStep === 3 && <Step3Storyboard />}
            {currentStep === 4 && <Step4KaraokeAligner />}
            {currentStep === 5 && <Step5VideoStudio />}
          </div>
        )}
      </main>

      {/* 3. Global Modals */}
      <SettingsModal />
      <ProjectManagerModal />
      <AutoPilotModal isOpen={isAutoPilotOpen} onClose={() => setAutoPilotOpen(false)} />

      {/* 4. Global Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20"
                : toastMessage.type === "error"
                ? "bg-red-950/90 border-red-500/50 text-red-300 shadow-red-500/20"
                : "bg-indigo-950/90 border-indigo-500/50 text-indigo-300 shadow-indigo-500/20"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toastMessage.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toastMessage.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 5. Subtle Kids Studio Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-sm font-bold text-amber-400">Social Kid Studio</span>
            <span>•</span>
            <span>AI Music (Kie.ai Suno) & Video Production</span>
          </div>
        </div>
      </footer>
    </div>
  </PasswordGate>
  );
}
