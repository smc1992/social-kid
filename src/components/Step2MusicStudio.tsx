"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Music,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Volume2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Radio,
  Sliders,
  Download,
  Disc,
  Headphones,
  Zap,
  Scissors,
  Check,
  UserCheck,
} from "lucide-react";
import { SongTrack, VocalStyle } from "@/types";

const VOCAL_STYLES: { id: VocalStyle; name: string; icon: string; desc: string }[] = [
  { id: "female-sweet", name: "Helle Frauenstimme", icon: "👩", desc: "Klar, herzlich und kindgerecht" },
  { id: "children-choir", name: "Fröhlicher Kinderchor", icon: "🧒", desc: "Gruppe singender Kinder mit Klatschen" },
  { id: "male-storyteller", name: "Geschichtenerzähler", icon: "👨", desc: "Warme, sympathische Männerstimme" },
  { id: "acoustic-duo", name: "Akustik Sing-Along", icon: "🎸", desc: "Gitarren-Duo mit Mitklatsch-Rhythmus" },
];

export const Step2MusicStudio: React.FC = () => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    isGeneratingMusic,
    setGeneratingMusic,
    musicTaskId,
    musicTaskStatus,
    setMusicTask,
    settings,
    setSettingsOpen,
    showToast,
    saveCurrentProjectToDb,
    theme,
  } = useProjectStore();

  const isLight = theme === "light";

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(42);
  const [instrumentalOnly, setInstrumentalOnly] = useState(false);
  const [modelChoice, setModelChoice] = useState<"v4" | "v4.5" | "v5" | "v5.5">("v5");
  const [selectedVocal, setSelectedVocal] = useState<VocalStyle>(currentProject?.vocalStyle || "female-sweet");

  // Audio Trimming state
  const [trimStart, setTrimStart] = useState<number>(currentProject?.audioTrimStart || 0);
  const [trimEnd, setTrimEnd] = useState<number>(currentProject?.audioTrimEnd || (currentProject?.audioDuration || 45));
  const [isTrimmingActive, setIsTrimmingActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudioUrl = currentProject?.audioUrl;

  // Poll task if active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (musicTaskId && musicTaskStatus !== "SUCCESS" && musicTaskStatus !== "FAILED") {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/generate/music", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "poll", taskId: musicTaskId }),
          });
          const data = await res.json();
          if (data.success && data.result) {
            const status = data.result.status;
            setMusicTask(musicTaskId, status);

            if (status === "SUCCESS" && data.result.audioUrl) {
              const newTrack: SongTrack = {
                id: `track_${Date.now()}`,
                title: `${currentProject?.title || "Song"} (Suno ${modelChoice.toUpperCase()})`,
                audioUrl: data.result.audioUrl,
                duration: data.result.duration || 45,
                provider: "kie-suno",
                modelUsed: modelChoice,
                createdAt: new Date().toISOString(),
              };

              const existingTracks = currentProject?.tracks || [];
              updateCurrentProject({
                audioUrl: data.result.audioUrl,
                audioDuration: data.result.duration || 45,
                tracks: [newTrack, ...existingTracks],
                selectedTrackId: newTrack.id,
                vocalStyle: selectedVocal,
              });

              setGeneratingMusic(false);
              setMusicTask(null, "idle");
              showToast("Musik erfolgreich von Kie.ai generiert!", "success");
            } else if (status === "FAILED") {
              setGeneratingMusic(false);
              setMusicTask(null, "idle");
              showToast(`Musik-Generierung fehlgeschlagen: ${data.result.error || "Fehler"}`, "error");
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [musicTaskId, musicTaskStatus]);

  if (!currentProject) return null;

  const handleStartMusicGeneration = async () => {
    if (!settings?.kieApiKey) {
      showToast("Bitte trage deinen Kie.ai API-Key in den Einstellungen ein.", "error");
      setSettingsOpen(true);
      return;
    }

    if (!currentProject.lyrics?.trim()) {
      showToast("Kein Liedtext vorhanden. Bitte in Schritt 1 Text anlegen.", "error");
      return;
    }

    setGeneratingMusic(true);
    setMusicTask("starting", "PENDING");

    try {
      const res = await fetch("/api/generate/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: currentProject.lyrics,
          genre: currentProject.genre,
          targetAge: currentProject.targetAge,
          instrumental: instrumentalOnly,
          model: `suno-${modelChoice}`,
          vocalStyle: selectedVocal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.taskId) {
          setMusicTask(data.taskId, "RUNNING");
          showToast("Suno V5 Musik-Generierung gestartet! Polling aktiv...", "info");
        } else if (data.track) {
          // Synchronous mock/demo track
          const newTrack: SongTrack = data.track;
          const existingTracks = currentProject?.tracks || [];
          updateCurrentProject({
            audioUrl: newTrack.audioUrl,
            audioDuration: newTrack.duration,
            tracks: [newTrack, ...existingTracks],
            selectedTrackId: newTrack.id,
            vocalStyle: selectedVocal,
          });
          setGeneratingMusic(false);
          setMusicTask(null, "idle");
          showToast("Musik erfolgreich generiert!", "success");
        }
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
      setGeneratingMusic(false);
      setMusicTask(null, "idle");
      showToast(`Fehler: ${e.message}`, "error");
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

  const handleApplyTrim = () => {
    const trimmedDuration = Math.max(5, trimEnd - trimStart);
    updateCurrentProject({
      audioTrimStart: trimStart,
      audioTrimEnd: trimEnd,
      audioDuration: trimmedDuration,
    });
    showToast(`Audio zugeschnitten auf ${trimmedDuration.toFixed(1)}s!`, "success");
  };

  const handleSelectTrack = (track: SongTrack) => {
    updateCurrentProject({
      audioUrl: track.audioUrl,
      audioDuration: track.duration,
      selectedTrackId: track.id,
    });
    setTrimStart(0);
    setTrimEnd(track.duration);
    showToast(`Take "${track.title}" als Hauptspur ausgewählt!`, "info");
  };

  const handleNextStep = async () => {
    if (!currentProject.audioUrl) {
      showToast("Bitte generiere zuerst Musik oder wähle einen Track aus.", "error");
      return;
    }
    await saveCurrentProjectToDb();
    setCurrentStep(3);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Audio Element */}
      {activeAudioUrl && (
        <audio
          ref={audioRef}
          src={activeAudioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              if (trimEnd === 45) setTrimEnd(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl ${
        isLight
          ? "bg-gradient-to-r from-white via-purple-50/40 to-pink-50/50 border-slate-200/80 shadow-slate-200/50"
          : "bg-gradient-to-r from-pink-950/80 via-purple-950/60 to-slate-950 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isLight
                  ? "bg-pink-500/10 border border-pink-500/30 text-pink-700"
                  : "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300"
              }`}>
                <Music className="w-3.5 h-3.5" /> Phase 2: Musik & Gesang
              </span>
              <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Kie.ai Suno V5 AI Engine
              </span>
            </div>

            <h1 className={`font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              Suno V5 <span className="gradient-text-rainbow">Musik Studio</span>
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isLight ? "text-slate-600 font-medium" : "text-slate-300"
            }`}>
              Verwandle den Liedtext in ein mitreißendes Kinderlied mit echtem Gesang, Kinderchören und lebendigen Instrumenten über die Kie.ai Suno V5 API.
            </p>
          </div>

          <button
            onClick={handleStartMusicGeneration}
            disabled={isGeneratingMusic}
            className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingMusic ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Suno V5 komponiert...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Song jetzt mit Suno V5 generieren</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vocal Style Selector (Option 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}>
            <UserCheck className="w-4 h-4 text-pink-500" />
            <span>Sänger-Stimme / Gesangs-Charakter wählen</span>
          </h3>
          <span className="text-xs text-pink-500 font-bold">
            Gewählt: {VOCAL_STYLES.find((v) => v.id === selectedVocal)?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {VOCAL_STYLES.map((voc) => {
            const isSelected = selectedVocal === voc.id;
            return (
              <button
                key={voc.id}
                onClick={() => {
                  setSelectedVocal(voc.id);
                  updateCurrentProject({ vocalStyle: voc.id });
                }}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? "bg-pink-50/80 border-pink-400 shadow-md scale-[1.02] ring-2 ring-pink-400/40 text-slate-900"
                      : "bg-slate-900 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-[1.02] text-white"
                    : isLight
                    ? "bg-white border-slate-200 hover:border-pink-300 hover:bg-slate-50 text-slate-900 shadow-sm"
                    : "bg-slate-950/60 border-white/5 hover:border-white/15 text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{voc.icon}</span>
                  {isSelected && <Check className="w-4 h-4 text-pink-500 stroke-[3]" />}
                </div>
                <div>
                  <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>{voc.name}</h4>
                  <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-600 font-medium" : "text-slate-400"}`}>{voc.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Player & Equalizer Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Spinning Vinyl */}
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-950 p-1 border-2 border-white/20 shadow-xl flex items-center justify-center ${
                isPlaying ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "3s" }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                🎵
              </div>
            </div>

            <div>
              <h3 className="font-fredoka text-xl font-bold text-white">
                {currentProject.title}
              </h3>
              <p className="text-xs text-slate-400">
                {currentProject.genre} • {currentProject.targetAge} Jahre • {currentProject.audioDuration || 42}s Dauer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTrimmingActive(!isTrimmingActive)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                isTrimmingActive
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-slate-950 border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Audio schneiden</span>
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!activeAudioUrl}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition cursor-pointer disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? "Pausieren" : "Song Abspielen"}</span>
            </button>
          </div>
        </div>

        {/* Animated Equalizer Waveform */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center gap-1.5 h-20 shadow-inner overflow-hidden">
          {Array.from({ length: 48 }).map((_, i) => {
            const barHeight = isPlaying
              ? Math.max(12, Math.sin(i * 0.4 + currentTime * 5) * 45 + 50)
              : (i % 6) * 7 + 10;

            return (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-pink-500 to-amber-400 transition-all duration-75"
                style={{ height: `${barHeight}%` }}
              />
            );
          })}
        </div>

        {/* Audio-Trimmer & Schnitt-Tool Drawer (Option 3) */}
        {isTrimmingActive && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Audio-Trimmer & Schnitt (Start- & Endzeit)</span>
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Gesamtdauer: {(trimEnd - trimStart).toFixed(1)}s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Startzeit: <span className="text-amber-300">{trimStart.toFixed(1)}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, duration - 5)}
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Endzeit: <span className="text-pink-300">{trimEnd.toFixed(1)}s</span>
                </label>
                <input
                  type="range"
                  min={trimStart + 5}
                  max={duration}
                  step="0.5"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            <button
              onClick={handleApplyTrim}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Schnitt anwenden</span>
            </button>
          </div>
        )}
      </div>

      {/* Takes & Version History */}
      <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <h3 className="font-fredoka text-lg font-bold text-white flex items-center gap-2">
          <span>📼</span> Aufgenommene Musik-Takes ({currentProject.tracks?.length || 0})
        </h3>

        <div className="space-y-2.5">
          {(currentProject.tracks || []).map((t, idx) => {
            const isSelected = currentProject.selectedTrackId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTrack(t)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-950/70 border-indigo-400 shadow-md shadow-indigo-500/20"
                    : "bg-slate-950/60 border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.duration}s • {t.provider}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Aktiv
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Text</span>
        </button>

        <button
          onClick={handleNextStep}
          className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.03] transition cursor-pointer"
        >
          <span>Weiter zu Schritt 3: Storyboard & Szenen</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
