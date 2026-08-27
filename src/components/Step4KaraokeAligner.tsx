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
  } = useProjectStore();

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
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/80 via-pink-950/60 to-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Subtitles className="w-3.5 h-3.5" /> Phase 4: Karaoke & Timing
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Whisper AI Wort-Synchronisation + Fine-Tuner
              </span>
            </div>

            <h1 className="font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
              Karaoke & <span className="gradient-text-gold">Sing-Along Sync</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
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
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              🎤
            </div>
            <div>
              <h3 className="font-fredoka text-lg font-bold text-white">
                Live Karaoke Monitor ({currentTime.toFixed(1)}s)
              </h3>
              <p className="text-xs text-slate-400">Echtzeit-Vorschau der Sing-Along Untertitel</p>
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
        <div className="relative min-h-[160px] rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-400/20 flex items-center justify-center p-8 text-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] overflow-hidden">
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
                            ? "text-yellow-400"
                            : "text-slate-500"
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
            <div className="text-slate-500 text-sm italic">
              Klicke &quot;Live Testen&quot; oder wähle unten eine Strophe aus.
            </div>
          )}
        </div>
      </div>

      {/* Style & Font Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caption Style */}
        <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <h3 className="font-fredoka text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
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
                      ? "bg-slate-900 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)] scale-[1.02]"
                      : "bg-slate-950/60 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{st.icon}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{st.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{st.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Selection */}
        <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <h3 className="font-fredoka text-base font-bold text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-pink-400" />
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
                      ? "bg-slate-900 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)] scale-[1.02]"
                      : "bg-slate-950/60 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-white">{font.name}</h4>
                    <span className="text-xs text-pink-300 font-black block mt-1" style={{ fontFamily: font.id }}>
                      {font.sample}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Captions List with Word-Level Fine-Tuning Drawer */}
      <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-fredoka text-lg font-bold text-white flex items-center gap-2">
            <span>⏱️</span> Synchronisierte Liedtext-Zeilen & Feinjustierung ({captions.length})
          </h3>
          <span className="text-xs text-slate-400">Klicke eine Zeile an, um einzelne Wörter im Detail zu justieren</span>
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
                    ? "bg-indigo-950/70 border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "bg-slate-950/60 border-white/5 hover:border-white/15"
                }`}
              >
                {/* Main Line Card Header */}
                <div
                  onClick={() => handleSeek(line.start)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: currentProject.captionFont }}>
                        {line.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span className="text-amber-300 font-bold">{line.start}s – {line.end}s</span>
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
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{isExpanded ? "Schließen" : "Wörter justieren"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Word-Level Timing Editor */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-slate-900/90 rounded-b-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Wort-Timing millimetergenau anpassen (+/- 0.1s):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {line.words.map((word) => (
                        <div
                          key={word.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex flex-col justify-between gap-2"
                        >
                          <input
                            type="text"
                            value={word.word}
                            onChange={(e) => handleUpdateWordText(line.id, word.id, e.target.value)}
                            className="bg-transparent text-xs font-bold text-white border-b border-white/10 pb-0.5 focus:outline-none focus:border-amber-400 font-mono"
                          />

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            {/* Start Time Adjust */}
                            <div className="flex items-center gap-1">
                              <span>Start:</span>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, -0.1, "start")}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                                title="-0.1s"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-bold text-amber-300">{word.start.toFixed(1)}s</span>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, +0.1, "start")}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                                title="+0.1s"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* End Time Adjust */}
                            <div className="flex items-center gap-1">
                              <span>Ende:</span>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, -0.1, "end")}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                                title="-0.1s"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-bold text-pink-300">{word.end.toFixed(1)}s</span>
                              <button
                                type="button"
                                onClick={() => handleAdjustWordTiming(line.id, word.id, +0.1, "end")}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                                title="+0.1s"
                              >
                                <Plus className="w-2.5 h-2.5" />
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
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          onClick={() => setCurrentStep(3)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Szenen</span>
        </button>

        <button
          onClick={handleNextStep}
          className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.03] transition cursor-pointer"
        >
          <span>Weiter zu Schritt 5: Video Studio & YouTube</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
