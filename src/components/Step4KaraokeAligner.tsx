"use client";

import React, { useState, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Subtitles,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Type,
  Clock,
  Palette,
  Check,
  Music,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  SlidersHorizontal,
} from "lucide-react";
import { CaptionStyle, CaptionFont, CaptionLine, CaptionWord } from "@/types";

const CAPTION_STYLES: { id: CaptionStyle; name: string; icon: string; desc: string; sample: string }[] = [
  { id: "bouncing-ball", name: "Bouncing Ball", icon: "🟡", desc: "Ein bunter Ball springt im Takt von Wort zu Wort", sample: "🟡 Der kleine Astronaut" },
  { id: "glowing-highlight", name: "Goldener Glow", icon: "✨", desc: "Das aktive Wort leuchtet magisch auf", sample: "✨ Gold leuchtend" },
  { id: "bubble-pop", name: "Bubble Pop", icon: "🫧", desc: "Farbige Pastell-Pille hebt aktive Worte hervor", sample: "🫧 Bubble Style" },
  { id: "karaoke-fill", name: "Sky Blue Sing-Along", icon: "🎤", desc: "Klassisches leuchtend blaues Karaoke-Highlight", sample: "🎤 Sing along" },
];

const FONTS: { id: CaptionFont; name: string; sample: string }[] = [
  { id: "Fredoka", name: "Fredoka (Bubble Look)", sample: "Kinderlieder zum Mitsingen" },
  { id: "Baloo 2", name: "Baloo 2 (Comic Soft)", sample: "Kinderlieder zum Mitsingen" },
  { id: "Outfit", name: "Outfit (Modern & Clean)", sample: "Kinderlieder zum Mitsingen" },
  { id: "Comic Neue", name: "Comic Neue (Klassik)", sample: "Kinderlieder zum Mitsingen" },
];

export const Step4KaraokeAligner: React.FC = () => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    isGeneratingCaptions,
    setGeneratingCaptions,
    showToast,
    saveCurrentProjectToDb,
    theme,
  } = useProjectStore();

  const isLight = theme === "light";
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!currentProject) return null;

  const captions = currentProject.captions || [];

  // Automatically align lyrics using Whisper / Smart Aligner
  const handleAutoAlign = async () => {
    if (!currentProject.lyrics?.trim()) {
      showToast("Kein Liedtext vorhanden. Bitte in Schritt 1 anlegen.", "error");
      return;
    }

    setGeneratingCaptions(true);
    try {
      const res = await fetch("/api/generate/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: currentProject.audioUrl,
          lyrics: currentProject.lyrics,
          duration: currentProject.audioDuration || 45,
        }),
      });

      const data = await res.json();
      if (data.success && data.captions) {
        updateCurrentProject({ captions: data.captions });
        showToast(
          data.source === "whisper"
            ? "Wortgenaue Whisper-Synchronisation erfolgreich!"
            : "Smarte Takt-Synchronisation erfolgreich!",
          "success"
        );
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Fehler beim Alignment: ${e.message}`, "error");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Word-level fine-tuning offset
  const handleAdjustWordTiming = (
    lineId: string,
    wordId: string,
    delta: number,
    field: "start" | "end"
  ) => {
    const updatedCaptions = captions.map((line) => {
      if (line.id !== lineId) return line;
      const updatedWords = line.words.map((w) => {
        if (w.id !== wordId) return w;
        const newTime = Math.max(0, parseFloat((w[field] + delta).toFixed(2)));
        return { ...w, [field]: newTime };
      });
      return { ...line, words: updatedWords };
    });
    updateCurrentProject({ captions: updatedCaptions });
  };

  // Word text edit
  const handleUpdateWordText = (lineId: string, wordId: string, newText: string) => {
    const updatedCaptions = captions.map((line) => {
      if (line.id !== lineId) return line;
      const updatedWords = line.words.map((w) => (w.id === wordId ? { ...w, word: newText } : w));
      const fullText = updatedWords.map((w) => w.word).join(" ");
      return { ...line, words: updatedWords, text: fullText };
    });
    updateCurrentProject({ captions: updatedCaptions });
  };

  const handleNextStep = async () => {
    await saveCurrentProjectToDb();
    setCurrentStep(5);
  };

  const activeLine = captions.find(
    (line) => currentTime >= line.start - 0.2 && currentTime <= line.end + 0.4
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Audio Element */}
      {currentProject.audioUrl && (
        <audio
          ref={audioRef}
          src={currentProject.audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl ${
        isLight
          ? "bg-gradient-to-r from-white via-amber-50/40 to-pink-50/50 border-slate-200/80 shadow-slate-200/50"
          : "bg-gradient-to-r from-amber-950/80 via-pink-950/60 to-slate-950 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isLight
                  ? "bg-amber-100 border border-amber-300 text-amber-800"
                  : "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/40 text-amber-300"
              }`}>
                <Subtitles className="w-3.5 h-3.5" /> Phase 4: Karaoke & Timing
              </span>
              <span className={`text-xs font-semibold ${isLight ? "text-slate-600 font-bold" : "text-slate-400"}`}>
                Whisper AI Wort-Synchronisation + Fine-Tuner
              </span>
            </div>

            <h1 className={`font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              Karaoke & <span className="gradient-text-gold">Sing-Along Sync</span>
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isLight ? "text-slate-700 font-medium" : "text-slate-300"
            }`}>
              Jedes gesungene Wort wird exakt auf die Sekunde abgestimmt. Nutze den automatischen Whisper-Sync oder passe einzelne Wörter mit dem Feinjustier-Tool an.
            </p>
          </div>

          <button
            onClick={handleAutoAlign}
            disabled={isGeneratingCaptions}
            className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingCaptions ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Synchronisiere Wörter...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Wortgenau synchronisieren</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Karaoke Monitor Screen */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
        isLight
          ? "bg-white border-slate-200/80 shadow-slate-200/50"
          : "bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-xl"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              🎤
            </div>
            <div>
              <h3 className={`font-fredoka text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Live Karaoke Monitor ({currentTime.toFixed(1)}s)
              </h3>
              <p className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-400"}`}>Echtzeit-Vorschau der Sing-Along Untertitel</p>
            </div>
          </div>

          <button
            onClick={handleTogglePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-white text-xs font-bold shadow-md hover:scale-105 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? "Pausieren" : "Live Testen"}</span>
          </button>
        </div>

        {/* Large CRT Screen Style Preview */}
        <div className={`relative min-h-[160px] rounded-3xl border flex items-center justify-center p-8 text-center shadow-inner overflow-hidden ${
          isLight
            ? "bg-gradient-to-b from-slate-100 to-slate-50 border-slate-200"
            : "bg-gradient-to-b from-slate-950 to-slate-900 border-amber-400/20 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]"
        }`}>
          {activeLine ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeLine.words.map((w) => {
                  const isActive = currentTime >= w.start && currentTime <= w.end;
                  const isPassed = currentTime > w.end;

                  return (
                    <div key={w.id} className="relative inline-block">
                      {isActive && currentProject.captionStyle === "bouncing-ball" && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                          🟡
                        </div>
                      )}
                      <span
                        className={`text-2xl sm:text-4xl font-extrabold px-3 py-1.5 rounded-2xl transition-all duration-150 ${
                          isActive
                            ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white scale-110 shadow-lg shadow-pink-500/50"
                            : isPassed
                            ? isLight ? "text-amber-600" : "text-yellow-400"
                            : isLight ? "text-slate-400" : "text-slate-500"
                        }`}
                        style={{ fontFamily: currentProject.captionFont }}
                      >
                        {w.word}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`text-sm italic ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              Klicke &quot;Live Testen&quot; oder wähle unten eine Strophe aus.
            </div>
          )}
        </div>
      </div>

      {/* Style & Font Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caption Style */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          isLight
            ? "bg-white border-slate-200/80 shadow-slate-200/50"
            : "bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-xl"
        }`}>
          <h3 className={`font-fredoka text-base font-bold flex items-center gap-2 ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Karaoke-Effekt</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAPTION_STYLES.map((st) => {
              const isSelected = currentProject.captionStyle === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => updateCurrentProject({ captionStyle: st.id })}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-amber-50/80 border-amber-400 shadow-md scale-[1.02] ring-2 ring-amber-400/40 text-slate-900"
                        : "bg-slate-900 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)] scale-[1.02] text-white"
                      : isLight
                      ? "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50 text-slate-900 shadow-sm"
                      : "bg-slate-950/60 border-white/5 hover:border-white/15 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{st.icon}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-500 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>{st.name}</h4>
                    <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-600 font-medium" : "text-slate-400"}`}>{st.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Selection */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          isLight
            ? "bg-white border-slate-200/80 shadow-slate-200/50"
            : "bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-xl"
        }`}>
          <h3 className={`font-fredoka text-base font-bold flex items-center gap-2 ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            <Type className="w-4 h-4 text-pink-500" />
            <span>Kinder-Schriftart</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONTS.map((font) => {
              const isSelected = currentProject.captionFont === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => updateCurrentProject({ captionFont: font.id })}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-pink-50/80 border-pink-400 shadow-md scale-[1.02] ring-2 ring-pink-400/40 text-slate-900"
                        : "bg-slate-900 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)] scale-[1.02] text-white"
                      : isLight
                      ? "bg-white border-slate-200 hover:border-pink-300 hover:bg-slate-50 text-slate-900 shadow-sm"
                      : "bg-slate-950/60 border-white/5 hover:border-white/15 text-white"
                  }`}
                >
                  <div>
                    <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>{font.name}</h4>
                    <span className={`text-xs font-black block mt-1 ${isLight ? "text-pink-600" : "text-pink-300"}`} style={{ fontFamily: font.id }}>
                      {font.sample}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-pink-500 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Captions List with Word-Level Fine-Tuning Drawer */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        isLight
          ? "bg-white border-slate-200/80 shadow-slate-200/50"
          : "bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-xl"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-fredoka text-lg font-bold flex items-center gap-2 ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            <span>⏱️</span> Synchronisierte Liedtext-Zeilen & Feinjustierung ({captions.length})
          </h3>
          <span className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-400"}`}>Klicke eine Zeile an, um einzelne Wörter im Detail zu justieren</span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {captions.map((line, idx) => {
            const isExpanded = expandedLineId === line.id;
            const isCurrentPlaying = currentTime >= line.start && currentTime <= line.end;

            return (
              <div
                key={line.id}
                className={`rounded-2xl border transition-all ${
                  isCurrentPlaying
                    ? isLight
                      ? "bg-indigo-50/80 border-indigo-400 shadow-md ring-2 ring-indigo-400/40 text-slate-900"
                      : "bg-indigo-950/70 border-indigo-400 shadow-lg shadow-indigo-500/20 text-white"
                    : isLight
                    ? "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900"
                    : "bg-slate-950/60 border-white/5 hover:border-white/15 text-white"
                }`}
              >
                {/* Main Line Card Header */}
                <div
                  onClick={() => handleSeek(line.start)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center ${
                      isLight ? "bg-slate-200 text-slate-800" : "bg-slate-800 text-slate-300"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`} style={{ fontFamily: currentProject.captionFont }}>
                        {line.text}
                      </p>
                      <div className={`flex items-center gap-2 mt-1 text-[11px] font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        <span className="text-amber-600 dark:text-amber-300 font-bold">{line.start}s – {line.end}s</span>
                        <span>•</span>
                        <span>{line.words?.length || 0} Wörter</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeek(line.start);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                        isLight
                          ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                          : "bg-slate-800 border-transparent hover:bg-slate-700 text-white"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Anhören</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLineId(isExpanded ? null : line.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isExpanded
                          ? isLight
                            ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                            : "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                          : isLight
                          ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                          : "bg-slate-800/80 border-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{isExpanded ? "Schließen" : "Wort-Feinjustierer"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Word-Level Fine-Tuning Drawer */}
                {isExpanded && (
                  <div className={`p-4 border-t space-y-3 animate-fadeIn ${
                    isLight ? "bg-white/80 border-slate-200" : "bg-slate-900/90 border-white/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? "text-indigo-600" : "text-indigo-300"
                      }`}>
                        Wort-Timings manuell anpassen (+/- 0.1s)
                      </span>
                      <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Klicke auf [+] / [-] für pixelgenauen Mitsing-Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {line.words?.map((word) => (
                        <div
                          key={word.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                            isLight ? "bg-slate-50 border-slate-200 shadow-sm" : "bg-slate-950/80 border-white/5"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className={`font-bold text-xs block truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                              {word.word}
                            </span>
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-300 font-bold">
                              {word.start.toFixed(1)}s - {word.end.toFixed(1)}s
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Start Time Controls */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, 0.1, "start")}
                                className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer text-[10px] ${
                                  isLight ? "bg-slate-200 hover:bg-slate-300 text-slate-800" : "bg-slate-800 hover:bg-slate-700 text-white"
                                }`}
                                title="Start +0.1s"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, -0.1, "start")}
                                className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer text-[10px] ${
                                  isLight ? "bg-slate-200 hover:bg-slate-300 text-slate-800" : "bg-slate-800 hover:bg-slate-700 text-white"
                                }`}
                                title="Start -0.1s"
                              >
                                -
                              </button>
                            </div>

                            {/* End Time Controls */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, 0.1, "end")}
                                className="w-5 h-5 rounded bg-pink-500/20 hover:bg-pink-500/40 text-pink-600 dark:text-pink-300 flex items-center justify-center text-[10px] transition cursor-pointer"
                                title="Ende +0.1s"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, -0.1, "end")}
                                className="w-5 h-5 rounded bg-pink-500/20 hover:bg-pink-500/40 text-pink-600 dark:text-pink-300 flex items-center justify-center text-[10px] transition cursor-pointer"
                                title="Ende -0.1s"
                              >
                                -
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className={`flex items-center justify-between pt-6 border-t ${
        isLight ? "border-slate-200" : "border-white/10"
      }`}>
        <button
          onClick={() => setCurrentStep(3)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
            isLight
              ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
              : "bg-slate-800 border-transparent hover:bg-slate-700 text-slate-200"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Storyboard</span>
        </button>

        <button
          onClick={handleNextStep}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition cursor-pointer"
        >
          <span>Weiter zu Schritt 5 (Video Studio)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
