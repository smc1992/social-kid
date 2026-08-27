"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Zap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  ArrowRight,
  Music,
  Video,
  Image as ImageIcon,
  Subtitles,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { TargetAgeGroup, MusicGenre, VisualStyle } from "@/types";

interface AutoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoPilotModal: React.FC<AutoPilotModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    showToast,
    saveCurrentProjectToDb,
    createNewProject,
  } = useProjectStore();

  const [topic, setTopic] = useState(currentProject?.topic || "Der kleine Bagger auf der Baustelle");
  const [targetAge, setTargetAge] = useState<TargetAgeGroup>(currentProject?.targetAge || "4-6");
  const [genre, setGenre] = useState<MusicGenre>(currentProject?.genre || "catchy-pop");
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("pixar-3d");
  const [channelName, setChannelName] = useState(currentProject?.channelName || "Social Kid");

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleStartAutoPilot = async () => {
    if (!topic.trim()) {
      showToast("Bitte gib ein Thema für das Kinderlied ein.", "error");
      return;
    }

    setIsRunning(true);
    setIsFinished(false);
    setLogs([]);
    setCurrentStepIndex(1);

    try {
      // 0. Ensure project exists
      let project = currentProject;
      if (!project) {
        project = await createNewProject(topic);
      }

      addLog(`🚀 Starte Auto-Pilot für: "${topic}"...`);
      setStatusMessage("Phase 1/5: KI schreibt kindgerechten Liedtext mit Strophen & Refrain...");

      // 1. Generate Lyrics
      const lyricsRes = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          targetAge,
          genre,
          language: "de",
        }),
      });
      const lyricsData = await lyricsRes.json();
      if (!lyricsData.success) throw new Error(lyricsData.error || "Lyrics-Fehler");

      addLog(`✓ Liedtext erstellt: "${lyricsData.title}"`);
      updateCurrentProject({
        title: lyricsData.title,
        topic,
        targetAge,
        genre,
        lyrics: lyricsData.lyrics,
        channelName,
      });

      // 2. Generate Music (Kie.ai Suno V5)
      setCurrentStepIndex(2);
      setStatusMessage("Phase 2/5: Suno AI komponiert Melodie & Gesang...");
      addLog("🎵 Starte Musik-Generierung via Suno API...");

      const musicRes = await fetch("/api/generate/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: lyricsData.lyrics,
          genre,
          targetAge,
          instrumental: false,
          model: "suno-v5",
        }),
      });
      const musicData = await musicRes.json();
      if (!musicData.success) throw new Error(musicData.error || "Musik-Fehler");

      addLog(`✓ Musik & Gesang fertig generiert (${musicData.track.duration}s)!`);
      updateCurrentProject({
        audioUrl: musicData.track.audioUrl,
        audioDuration: musicData.track.duration,
        tracks: [musicData.track],
        selectedTrackId: musicData.track.id,
      });

      // 3. Generate Scenes & Flux Images
      setCurrentStepIndex(3);
      setStatusMessage("Phase 3/5: Storyboard ableiten & Flux 1 Szenen-Bilder zeichnen...");
      addLog("🎬 Erstelle Storyboard-Szenen aus Text...");

      const scenesRes = await fetch("/api/generate/scene-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: lyricsData.lyrics,
          style: visualStyle,
          duration: musicData.track.duration || 45,
        }),
      });
      const scenesData = await scenesRes.json();
      if (!scenesData.success) throw new Error(scenesData.error || "Szenen-Fehler");

      const generatedScenes = scenesData.scenes || [];
      addLog(`✓ ${generatedScenes.length} Szenen definiert. Zeichne Flux Bilder...`);

      for (let i = 0; i < generatedScenes.length; i++) {
        const sc = generatedScenes[i];
        setStatusMessage(`Phase 3/5: Zeichne Bild für Szene ${i + 1} von ${generatedScenes.length}...`);
        try {
          const imgRes = await fetch("/api/generate/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: sc.visualPrompt,
              aspectRatio: "16:9",
            }),
          });
          const imgData = await imgRes.json();
          if (imgData.success && imgData.imageUrl) {
            sc.imageUrl = imgData.imageUrl;
            sc.status = "ready";
            addLog(`  ✓ Szene ${i + 1} gezeichnet.`);
          }
        } catch (imgErr) {
          console.warn(`Fehler bei Szene ${i + 1}:`, imgErr);
        }
      }
      updateCurrentProject({ scenes: generatedScenes });

      // 4. Karaoke Whisper Alignment
      setCurrentStepIndex(4);
      setStatusMessage("Phase 4/5: Whisper KI synchronisiert Wörter auf den Takt...");
      addLog("🎤 Führe Wort-Level Karaoke Synchronisation durch...");

      const alignRes = await fetch("/api/generate/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: musicData.track.audioUrl,
          lyrics: lyricsData.lyrics,
          duration: musicData.track.duration || 45,
        }),
      });
      const alignData = await alignRes.json();
      if (!alignData.success) throw new Error(alignData.error || "Sync-Fehler");

      addLog(`✓ ${alignData.captions.length} Liedzeilen präzise synchronisiert!`);
      updateCurrentProject({ captions: alignData.captions });

      // 5. YouTube SEO & Thumbnail
      setCurrentStepIndex(5);
      setStatusMessage("Phase 5/5: Generiere YouTube SEO & Klick-Thumbnail...");
      addLog("📈 Erstelle YouTube Creator Kit & Thumbnail...");

      const [seoRes, thumbRes] = await Promise.all([
        fetch("/api/generate/youtube-seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lyricsData.title,
            topic,
            lyrics: lyricsData.lyrics,
            targetAge,
          }),
        }),
        fetch("/api/generate/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lyricsData.title,
            topic,
            visualStyle,
          }),
        }),
      ]);

      const seoData = await seoRes.json();
      const thumbData = await thumbRes.json();

      const finalSeo = seoData.success ? seoData.seo : undefined;
      const finalThumb = thumbData.success ? thumbData.thumbnailUrl : undefined;

      updateCurrentProject({
        youtubeSeo: finalSeo,
        thumbnailUrl: finalThumb,
      });

      await saveCurrentProjectToDb();

      addLog("🎉 Auto-Pilot erfolgreich abgeschlossen!");
      setStatusMessage("Komplettes Video erfolgreich erstellt!");
      setIsFinished(true);

      // Trigger confetti
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Fehler: ${err.message}`);
      setStatusMessage(`Fehler im Auto-Pilot: ${err.message}`);
      showToast(`Auto-Pilot Fehler: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleGoToStudio = () => {
    setCurrentStep(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900/95 border border-white/15 w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-500/25 font-bold animate-pulse">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-2xl font-black text-white">Express Auto-Pilot Studio</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  1-Klick Video
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Vollautomatische Produktion: Text ➡️ Suno Musik ➡️ Flux Bilder ➡️ Whisper Timing ➡️ YouTube Kit
              </p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {!isRunning && !isFinished ? (
          <div className="py-6 space-y-6">
            {/* Song Theme Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Thema oder Idee für das Kinderlied</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="z.B. Die kleine Biene Maja fliegt zur Blumenwiese"
                className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-white/10 text-white font-bold text-base focus:border-amber-400 focus:outline-none shadow-inner"
              />
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <label className="text-xs font-bold text-slate-300">Zielgruppe</label>
                <select
                  value={targetAge}
                  onChange={(e) => setTargetAge(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white"
                >
                  <option value="1-3">👶 1-3 Jahre (Kleinkind)</option>
                  <option value="4-6">🧒 4-6 Jahre (Kita/Vorschule)</option>
                  <option value="7-10">🎒 7-10 Jahre (Grundschule)</option>
                  <option value="all">🌟 Alle Altersgruppen</option>
                </select>
              </div>

              {/* Genre */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <label className="text-xs font-bold text-slate-300">Musikstil</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white"
                >
                  <option value="catchy-pop">🎉 Moderner Kinder-Pop</option>
                  <option value="nursery-rhyme">🧸 Klassisches Kinderlied</option>
                  <option value="dance-party">🪩 Kids Dance Party</option>
                  <option value="lullaby-gentle">🌙 Sanftes Schlaflied</option>
                  <option value="orchestral-fairytale">🏰 Märchen Orchester</option>
                </select>
              </div>

              {/* Visual Style */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <label className="text-xs font-bold text-slate-300">Illustrationsstil</label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white"
                >
                  <option value="pixar-3d">🌟 3D Disney/Pixar</option>
                  <option value="storybook-watercolor">🎨 Bilderbuch Aquarell</option>
                  <option value="vibrant-2d-cartoon">🖍️ Bunter 2D Cartoon</option>
                  <option value="cute-chibi-anime">🐱 Cute Chibi Kawaii</option>
                  <option value="claymation-craft">🧸 Claymation Knet-Stil</option>
                  <option value="magical-fantasy">✨ Magische Märchenwelt</option>
                </select>
              </div>
            </div>

            {/* Channel Branding */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block">Kanal-Wasserzeichen</label>
                <span className="text-[11px] text-slate-500">Eingeblendetes Logo oben links im Video</span>
              </div>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Dein Kanalname"
                className="w-48 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white"
              />
            </div>
          </div>
        ) : (
          /* Live Progress State */
          <div className="py-6 space-y-6">
            {/* Step Progress Pills */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { step: 1, label: "Liedtext", icon: "✍️" },
                { step: 2, label: "Suno Gesang", icon: "🎵" },
                { step: 3, label: "Flux Bilder", icon: "🎨" },
                { step: 4, label: "Wort-Sync", icon: "🎤" },
                { step: 5, label: "YouTube Kit", icon: "🚀" },
              ].map((s) => {
                const isDone = currentStepIndex > s.step || isFinished;
                const isCurrent = currentStepIndex === s.step && !isFinished;

                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isDone
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                        : isCurrent
                        ? "bg-amber-950/40 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                        : "bg-slate-950/40 border-white/5 text-slate-600"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{s.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider block">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status Headline */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 flex items-center gap-4">
              {isRunning && <RefreshCw className="w-6 h-6 text-amber-400 animate-spin shrink-0" />}
              {isFinished && <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />}
              <div>
                <h4 className="text-sm font-black text-white">{statusMessage}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRunning ? "Bitte kurz warten, die KI-Engines arbeiten..." : "Alles bereit zum Abspielen und Herunterladen!"}
                </p>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="p-4 rounded-2xl bg-black/90 border border-white/10 font-mono text-xs text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto">
              {logs.map((l, idx) => (
                <div key={idx} className="leading-relaxed">
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-white/10">
          {!isRunning && !isFinished ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleStartAutoPilot}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white text-sm font-black shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Vollautomatisches Video erstellen</span>
              </button>
            </>
          ) : isFinished ? (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                onClick={handleGoToStudio}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black shadow-xl shadow-emerald-500/25 hover:scale-105 transition cursor-pointer"
              >
                <span>Zum fertigen Video Studio wechseln</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-xs font-semibold text-slate-500 animate-pulse">
              ⚡ Bitte warten – Auto-Pilot generiert Musik, Bilder und Video...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
