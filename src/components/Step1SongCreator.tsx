"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Sparkles,
  Wand2,
  ArrowRight,
  Music,
  RefreshCw,
  Layers,
  Check,
  RotateCcw,
  Copy,
  Lightbulb,
  FileText,
  Sliders,
  Baby,
  Smile,
  Zap,
  Globe2,
} from "lucide-react";
import { TargetAgeGroup, MusicGenre } from "@/types";

const THEME_PRESETS = [
  { icon: "🚀", title: "Der kleine Astronaut", topic: "Reise zu den Sternen und Planeten im Weltall", age: "4-6", genre: "catchy-pop" },
  { icon: "🦕", title: "Dino-Tanz im Urwald", topic: "Lustige Dinosaurier tanzen, stampfen und springen", age: "4-6", genre: "dance-party" },
  { icon: "🪥", title: "Zähneputz-Zauberlied", topic: "Zähneputzen macht Spaß, kitzelt und hält sauber", age: "1-3", genre: "nursery-rhyme" },
  { icon: "🚜", title: "Der rote kleine Traktor", topic: "Tiere, Scheune und Ernte auf dem bunten Bauernhof", age: "1-3", genre: "nursery-rhyme" },
  { icon: "🦁", title: "Die bunte Tierparade", topic: "Löwe, Affe, Elefant und Giraffe machen Musik", age: "4-6", genre: "catchy-pop" },
  { icon: "😴", title: "Schlaf gut, kleiner Stern", topic: "Sanftes Gute-Nacht-Lied zum ruhigen Einschlafen", age: "1-3", genre: "lullaby-gentle" },
  { icon: "🔤", title: "Das fröhliche ABC", topic: "Buchstaben, Wörter und Reime spielerisch lernen", age: "4-6", genre: "educational-acoustic" },
  { icon: "🎂", title: "Alles Gute zum Geburtstag", topic: "Kuchen, bunte Kerzen, Geschenke und Freunde feiern", age: "all", genre: "catchy-pop" },
];

const AGE_GROUPS: { id: TargetAgeGroup; label: string; desc: string; icon: string }[] = [
  { id: "1-3", label: "Kleinkinder (1–3 Jahre)", desc: "Sehr einfache Wörter, viele Wiederholungen, lautmalerisch", icon: "🍼" },
  { id: "4-6", label: "Kita & Vorschule (4–6 Jahre)", desc: "Geschichten, Reime, lustige Mitmach-Aktionen & Tanzen", icon: "🎈" },
  { id: "7-10", label: "Grundschule (7–10 Jahre)", desc: "Reim-Wortspiele, Abenteuer, lehrreiche Themen & Rhythmus", icon: "🎒" },
  { id: "all", label: "Für die ganze Familie", desc: "Universell eingängig, Gute-Laune-Hits für Groß & Klein", icon: "🌟" },
];

const GENRES: { id: MusicGenre; label: string; icon: string }[] = [
  { id: "catchy-pop", label: "Catchy Pop (Ohrwurm)", icon: "🍭" },
  { id: "nursery-rhyme", label: "Kindergarten-Klassiker", icon: "🧸" },
  { id: "dance-party", label: "Tanz- & Bewegungslied", icon: "🕺" },
  { id: "lullaby-gentle", label: "Sanftes Schlaflied", icon: "🌙" },
  { id: "educational-acoustic", label: "Lernlied (Akustik)", icon: "🎸" },
  { id: "orchestral-fairytale", label: "Märchen-Orchester", icon: "🏰" },
];

const LANGUAGES = [
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
];

export const Step1SongCreator: React.FC = () => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    isGeneratingLyrics,
    setGeneratingLyrics,
    showToast,
    saveCurrentProjectToDb,
    theme,
  } = useProjectStore();

  const [activePreset, setActivePreset] = useState<string | null>(null);

  if (!currentProject) return null;

  const isLight = theme === "light";

  const handleApplyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setActivePreset(preset.title);
    updateCurrentProject({
      title: preset.title,
      topic: preset.topic,
      targetAge: preset.age as TargetAgeGroup,
      genre: preset.genre as MusicGenre,
    });
    showToast(`Vorlage "${preset.title}" geladen!`, "info");
  };

  const handleGenerateLyrics = async () => {
    if (!currentProject.topic) {
      showToast("Bitte gib zuerst ein Song-Thema ein!", "error");
      return;
    }

    setGeneratingLyrics(true);
    showToast("KI komponiert kindgerechten Liedtext...", "info");

    try {
      const res = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentProject.topic,
          targetAge: currentProject.targetAge,
          genre: currentProject.genre,
          mood: currentProject.mood,
          language: currentProject.language || "de",
        }),
      });

      const data = await res.json();
      if (data.success && data.lyrics) {
        updateCurrentProject({
          title: data.title || currentProject.title,
          lyrics: data.lyrics,
          mood: data.mood || currentProject.mood,
        });
        showToast("Liedtext erfolgreich generiert! 🎶", "success");
      } else {
        throw new Error(data.error || "Fehler beim Generieren");
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setGeneratingLyrics(false);
    }
  };

  const handleProceedToStep2 = async () => {
    if (!currentProject.lyrics.trim()) {
      showToast("Bitte generiere oder schreibe zuerst einen Liedtext!", "error");
      return;
    }
    await saveCurrentProjectToDb();
    setCurrentStep(2);
  };

  const linesCount = currentProject.lyrics?.split("\n").filter(Boolean).length || 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Premium Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl ${
        isLight
          ? "bg-gradient-to-r from-white via-pink-50/40 to-indigo-50/50 border-slate-200/80 shadow-slate-200/50"
          : "bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isLight
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-800"
                  : "bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/40 text-amber-300"
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Phase 1: Songwriting
              </span>
              <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Altersgerechte Reime & Melodiekonzepte
              </span>
            </div>

            <h1 className={`font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              Song-Idee & <span className="gradient-text-rainbow">Lyrics Studio</span>
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isLight ? "text-slate-600 font-medium" : "text-slate-300"
            }`}>
              Wähle ein beliebtes Kinder-Thema oder tippe deine eigene Song-Idee ein. Unsere KI komponiert kindgerechte Reime mit eingängigen Strophen und Mitsing-Refrains.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => useProjectStore.getState().setAutoPilotOpen(true)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-white font-black text-xs shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span>⚡ Express Auto-Pilot</span>
            </button>

            <button
              onClick={handleGenerateLyrics}
              disabled={isGeneratingLyrics}
              className={`flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border font-extrabold text-xs shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800 hover:border-purple-300 hover:text-purple-700"
                  : "bg-slate-900/90 border-white/10 hover:border-purple-400 text-white"
              }`}
            >
              {isGeneratingLyrics ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
                  <span>KI schreibt Reime...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <span>KI-Liedtext generieren</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Topics Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}>
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Beliebte Kinder-Themen (1-Klick Vorlagen)</span>
          </h2>
          <span className="text-xs text-indigo-500 font-bold">Klicke ein Thema zum Laden</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {THEME_PRESETS.map((preset, idx) => {
            const isSelected = activePreset === preset.title || currentProject.title === preset.title;

            return (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left flex items-start gap-3.5 cursor-pointer overflow-hidden ${
                  isSelected
                    ? isLight
                      ? "bg-amber-50/70 border-amber-400 shadow-md scale-[1.02] ring-2 ring-amber-400/40 text-slate-900"
                      : "bg-slate-900 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)] scale-[1.02] ring-2 ring-amber-400/40 text-white"
                    : isLight
                    ? "bg-white border-slate-200 hover:border-amber-400/40 hover:bg-slate-50 text-slate-900 shadow-sm"
                    : "bg-slate-900/80 border-white/10 hover:border-amber-400/40 hover:scale-[1.01] text-white"
                }`}
              >
                {/* 3D Emoji Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner shrink-0 border ${
                  isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950/80 border-white/5"
                }`}>
                  {preset.icon}
                </div>

                <div className="overflow-hidden flex-1">
                  <h3 className={`font-bold text-xs truncate transition-colors ${
                    isSelected ? "text-amber-600 dark:text-amber-300 font-black" : isLight ? "text-slate-900 group-hover:text-amber-600" : "text-white group-hover:text-amber-400"
                  }`}>
                    {preset.title}
                  </h3>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                    isLight ? "text-slate-600 font-medium" : "text-slate-400"
                  }`}>{preset.topic}</p>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      isLight ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-slate-800 text-slate-300"
                    }`}>
                      {preset.age} J.
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Song Configuration (5 cols) */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border shadow-xl space-y-5 ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/80 backdrop-blur-xl border-white/10"
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isLight ? "border-slate-100" : "border-white/10"}`}>
            <h3 className={`font-fredoka text-lg font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Song-Parameter</span>
            </h3>
            <span className={`text-xs font-bold ${isLight ? "text-slate-500" : "text-slate-400"}`}>Schritt 1</span>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-300"}`}>Song-Titel</label>
            <input
              type="text"
              value={currentProject.title}
              onChange={(e) => updateCurrentProject({ title: e.target.value })}
              placeholder="z.B. Der kleine Astronaut"
              className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition focus:outline-none ${
                isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/80 border-white/10 text-white"
              }`}
            />
          </div>

          {/* Language Selector (Option 6) */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              <Globe2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Song-Sprache</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => {
                const isActive = (currentProject.language || "de") === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => updateCurrentProject({ language: lang.id as any })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                        : isLight
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-950/80 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic / Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-300"}`}>Song-Thema & Idee</label>
              <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Was passiert im Song?</span>
            </div>
            <textarea
              rows={3}
              value={currentProject.topic}
              onChange={(e) => updateCurrentProject({ topic: e.target.value })}
              placeholder="z.B. Ein kleiner Astronaut fliegt mit seiner Rakete zum Mond und tanzt mit den Sternen..."
              className={`w-full p-3.5 rounded-2xl border text-xs font-medium transition focus:outline-none resize-none ${
                isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/80 border-white/10 text-white"
              }`}
            />
          </div>

          {/* Target Age Group */}
          <div className="space-y-2">
            <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              <Baby className="w-3.5 h-3.5 text-pink-500" />
              <span>Ziel-Altersgruppe</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AGE_GROUPS.map((ag) => {
                const isSelected = currentProject.targetAge === ag.id;
                return (
                  <button
                    key={ag.id}
                    onClick={() => updateCurrentProject({ targetAge: ag.id })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-300 ring-2 ring-pink-500/30"
                        : isLight
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ag.icon}</span>
                      <span className="text-xs font-bold truncate">{ag.label.split(" ")[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Music Genre Selection */}
          <div className="space-y-2">
            <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              <Music className="w-3.5 h-3.5 text-cyan-500" />
              <span>Musikrichtung & Vibe</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => {
                const isSelected = currentProject.genre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => updateCurrentProject({ genre: g.id })}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-300 ring-2 ring-cyan-500/30 font-bold"
                        : isLight
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span className="text-xs truncate">{g.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Lyrics Editor & AI Composer (7 cols) */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/80 backdrop-blur-xl border-white/10"
        }`}>
          <div className="space-y-4">
            {/* Header with Line Count and Tags Helper */}
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? "border-slate-100" : "border-white/10"}`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-500" />
                <h3 className={`font-fredoka text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Liedtext & Strophen-Struktur
                </h3>
              </div>

              {/* Suno Structure Tags Pills */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-500">
                  [Verse]
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-500">
                  [Chorus]
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-[10px] font-bold text-pink-500">
                  [Outro]
                </span>
              </div>
            </div>

            {/* Lyrics Text Area */}
            <div className="relative">
              <textarea
                rows={14}
                value={currentProject.lyrics}
                onChange={(e) => updateCurrentProject({ lyrics: e.target.value })}
                placeholder={`[Verse 1]\nZieh den Raumanzug geschwind jetzt an,\nweil die Reise zu den Sternen starten kann!...\n\n[Chorus]\nFlieg, kleiner Astronaut, weit ins All hinaus,\nsieh die leuchtend bunten Sterne, siehst du unser Haus?...`}
                className={`w-full p-4 rounded-2xl border font-mono text-xs leading-relaxed focus:outline-none transition resize-none ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" : "bg-slate-950/90 border-white/10 text-slate-200"
                }`}
              />

              {/* Word / Line Counter Badge */}
              <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                isLight ? "bg-white border-slate-200 text-slate-600" : "bg-slate-900/90 border-white/10 text-slate-400"
              }`}>
                {linesCount} Zeilen • ca. {Math.round(linesCount * 2.8)}s Dauer
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className={`flex items-center justify-between pt-4 border-t ${isLight ? "border-slate-100" : "border-white/10"}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentProject.lyrics);
                  showToast("Text in Zwischenablage kopiert!", "info");
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isLight ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title="Text kopieren"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kopieren</span>
              </button>
            </div>

            <button
              onClick={handleProceedToStep2}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 hover:scale-[1.03] active:scale-[0.98] transition cursor-pointer"
            >
              <span>Weiter zu Schritt 2: Musik & Gesang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
