"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Sparkles,
  Settings,
  FolderOpen,
  Plus,
  Save,
  Check,
  ChevronDown,
  Music,
  Video,
  Image as ImageIcon,
  Subtitles,
  FileText,
  Zap,
  Layers,
  Sun,
  Moon,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const {
    currentProject,
    currentStep,
    setCurrentStep,
    setSettingsOpen,
    setProjectDrawerOpen,
    setAutoPilotOpen,
    createNewProject,
    saveCurrentProjectToDb,
    showToast,
    settings,
    theme,
    toggleTheme,
  } = useProjectStore();

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const steps = [
    { num: 1, label: "Song & Text", icon: FileText, desc: "Thema & KI-Text" },
    { num: 2, label: "Musik & Gesang", icon: Music, desc: "Suno V5 Studio" },
    { num: 3, label: "Storyboard", icon: ImageIcon, desc: "Flux 1 Szenen" },
    { num: 4, label: "Karaoke", icon: Subtitles, desc: "Wort-Sync & Fonts" },
    { num: 5, label: "Video Studio", icon: Video, desc: "Remotion & SEO" },
  ];

  const hasKieKey = Boolean(settings?.kieApiKey);
  const hasReplicateKey = Boolean(settings?.replicateApiToken);
  const hasFalKey = Boolean(settings?.falApiKey);

  const handleManualSave = async () => {
    setIsSaving(true);
    await saveCurrentProjectToDb();
    setIsSaving(false);
    setJustSaved(true);
    showToast("Projekt erfolgreich gespeichert!", "success");
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 pb-2">
      <div className="max-w-7xl mx-auto rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="relative group cursor-pointer" onClick={() => setProjectDrawerOpen(true)}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 p-[2px] shadow-lg shadow-pink-500/25 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-xl">
                <span className="animate-float">🌟</span>
              </div>
            </div>
            {/* Pulsing indicator */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div className="cursor-pointer" onClick={() => setProjectDrawerOpen(true)}>
            <div className="flex items-center gap-2">
              <span className="font-fredoka text-xl font-extrabold tracking-wide gradient-text-rainbow">
                Social Kid
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-pink-300 border border-pink-500/30">
                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                AI Studio
              </span>
            </div>
            
            {/* Active Project Selector Pill */}
            <div className="flex items-center gap-1 text-xs text-slate-300 font-semibold hover:text-white transition group">
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentProject ? currentProject.title : "Kein Projekt"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform group-hover:translate-y-0.5" />
            </div>
          </div>
        </div>

        {/* Center: 5-Step Process Stepper */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-300 group cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white shadow-lg shadow-pink-500/25 scale-[1.03]"
                    : isCompleted
                    ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${
                    isActive
                      ? "bg-white text-slate-950 shadow font-extrabold"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/40"
                      : "bg-slate-200 text-slate-700 font-bold"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>{s.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Express Auto-Pilot Button */}
          <button
            onClick={() => setAutoPilotOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="1-Klick Video Vollautomatisierung"
          >
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span className="hidden sm:inline">Auto-Pilot</span>
          </button>

          {/* New Project CTA */}
          <button
            onClick={async () => {
              const p = await createNewProject();
              showToast(`Neues Projekt "${p.title}" erstellt!`, "success");
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              theme === "light"
                ? "bg-white border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-300 shadow-sm"
                : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
            }`}
            title="Neues Projekt anlegen"
          >
            <Plus className="w-3.5 h-3.5 text-pink-500" />
            <span className="hidden xl:inline">Neuer Song</span>
          </button>

          {/* Manual Save Trigger */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              justSaved
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600"
                : theme === "light"
                ? "bg-white border-slate-200 text-indigo-600 hover:border-indigo-300 shadow-sm hover:scale-105 active:scale-95"
                : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:scale-105 active:scale-95"
            }`}
            title="Projekt speichern"
          >
            {justSaved ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <Save className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
              theme === "light"
                ? "bg-white border-slate-200 text-indigo-600 hover:border-indigo-400 hover:scale-105 active:scale-95"
                : "bg-slate-900/90 border-slate-800 text-amber-400 hover:border-amber-400/50 hover:scale-105 active:scale-95"
            }`}
            title={theme === "light" ? "Zu Dark Mode wechseln" : "Zu Light / White Mode wechseln"}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/30 animate-pulse" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              hasKieKey || hasReplicateKey || hasFalKey
                ? theme === "light"
                  ? "bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                : theme === "light"
                ? "bg-amber-50 border-amber-300 text-amber-900 shadow-sm"
                : "bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-md shadow-amber-500/10 animate-pulse"
            }`}
            title="API Keys & Einstellungen"
          >
            <Settings className={`w-3.5 h-3.5 ${theme === "light" ? "text-amber-700" : "text-amber-400"}`} />
            <span className="hidden md:inline">API Keys</span>

            {/* Provider Status Dot */}
            <div className="flex items-center gap-1 pl-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasKieKey
                    ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    : "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                }`}
                title={hasKieKey ? "Kie.ai Suno verbunden" : "Kie.ai Key fehlt"}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Step Navigator Bar (shown only on small screens) */}
      <div className="lg:hidden mt-2 max-w-7xl mx-auto flex items-center justify-between gap-1 bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{s.num}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
