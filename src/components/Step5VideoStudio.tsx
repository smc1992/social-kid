"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Player } from "@remotion/player";
import { KidsSongComposition } from "@/remotion/KidsSongComposition";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import {
  Video,
  Download,
  Share2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  Tv,
  Layers,
  Wand2,
  CheckCircle2,
  Flame,
  FileCheck,
  Image as ImageIcon,
  Sliders,
  Shield,
  Bell,
  Shuffle,
  Package,
  FileText,
} from "lucide-react";
import { VideoTransition } from "@/types";

const TRANSITIONS: { id: VideoTransition; name: string; icon: string; desc: string }[] = [
  { id: "smooth-crossfade", name: "Weiche Blende", icon: "✨", desc: "Sanfter cinematographischer Übergang" },
  { id: "circle-pop", name: "Bubble Circle Pop", icon: "🫧", desc: "Aufpoppender fröhlicher Kreisübergang" },
  { id: "slide-bounce", name: "Slide & Spring Bounce", icon: "🪀", desc: "Dynamisches Hineingleiten mit Federung" },
];

export const Step5VideoStudio: React.FC = () => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    isRenderingVideo,
    setRenderingVideo,
    showToast,
    saveCurrentProjectToDb,
  } = useProjectStore();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!currentProject) return null;

  const isShorts = currentProject.aspectRatio === "9:16";
  const durationInFrames = Math.max(
    30,
    Math.round((currentProject.audioDuration || 45) * 30)
  );

  const playerWidth = isShorts ? 360 : 640;

  // Handle Video Rendering
  const handleRenderVideo = async () => {
    setRenderingVideo(true);
    showToast("Video-Rendering gestartet! 1080p MP4 wird erzeugt...", "info");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          format: currentProject.aspectRatio === "9:16" ? "9x16" : "16x9",
        }),
      });

      const data = await res.json();
      if (data.success && data.videoUrl) {
        updateCurrentProject({ renderedVideoUrl: data.videoUrl });

        // Trigger celebratory confetti
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });

        showToast("Video erfolgreich gerendert!", "success");
      } else {
        throw new Error(data.error || "Rendering fehlgeschlagen");
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Render-Fehler: ${e.message}`, "error");
    } finally {
      setRenderingVideo(false);
    }
  };

  // Generate YouTube SEO Data
  const handleGenerateYouTubeSEO = async () => {
    setIsGeneratingSeo(true);
    try {
      const res = await fetch("/api/generate/youtube-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentProject.title,
          topic: currentProject.topic,
          lyrics: currentProject.lyrics,
          targetAge: currentProject.targetAge,
        }),
      });
      const data = await res.json();
      if (data.success && data.seo) {
        updateCurrentProject({ youtubeSeo: data.seo });
        showToast("YouTube SEO-Daten erfolgreich generiert!", "success");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Fehler bei der SEO-Erstellung", "error");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  // Generate 1-Click YouTube Thumbnail (Flux)
  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumb(true);
    showToast("Generiere YouTube-Thumbnail mit Flux...", "info");
    try {
      const res = await fetch("/api/generate/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentProject.title,
          topic: currentProject.topic,
          visualStyle: currentProject.scenes?.[0]?.style || "pixar-3d",
          customPrompt: currentProject.youtubeSeo?.thumbnailPrompt,
        }),
      });
      const data = await res.json();
      if (data.success && data.thumbnailUrl) {
        updateCurrentProject({ thumbnailUrl: data.thumbnailUrl });
        showToast("YouTube Thumbnail erfolgreich generiert!", "success");
      } else {
        throw new Error(data.error || "Thumbnail-Generierung fehlgeschlagen");
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Fehler beim Thumbnail: ${e.message}`, "error");
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  // 1-Click YouTube Creator ZIP Package Export (Option 2)
  const handleExportZipPackage = async () => {
    setIsExportingZip(true);
    showToast("Erstelle komplettes YouTube Creator ZIP-Paket...", "info");
    try {
      const zip = new JSZip();

      // 1. YouTube metadata text file
      const seo = currentProject.youtubeSeo;
      const metadataContent = `=====================================================
YOUTUBE CREATOR METADATEN - SOCIAL KID STUDIO
=====================================================

TITEL:
${seo?.title || currentProject.title}

BESCHREIBUNG:
${seo?.description || "Kinderlied zum Mitsingen"}

TAGS:
${(seo?.tags || []).join(", ")}

HASHTAGS:
${(seo?.hashtags || []).join(" ")}

ZIEL-ALTERSGRUPPE:
${currentProject.targetAge} Jahre

LIEDTEXT:
${currentProject.lyrics}

=====================================================
Generiert mit Social Kid Studio 🚀
=====================================================`;

      zip.file("youtube_upload_info.txt", metadataContent);
      zip.file("song_lyrics.txt", currentProject.lyrics || "");
      zip.file("project_backup.json", JSON.stringify(currentProject, null, 2));

      // 2. Fetch and add thumbnail image
      if (currentProject.thumbnailUrl) {
        try {
          const thumbBlob = await fetch(currentProject.thumbnailUrl).then((r) => r.blob());
          zip.file("youtube_thumbnail.webp", thumbBlob);
        } catch (e) {
          console.warn("Could not attach thumbnail to zip:", e);
        }
      }

      // 3. Trigger download
      const content = await zip.generateAsync({ type: "blob" });
      const safeTitle = currentProject.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle}_YouTube_Creator_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("YouTube Creator ZIP-Paket erfolgreich heruntergeladen!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(`Export-Fehler: ${e.message}`, "error");
    } finally {
      setIsExportingZip(false);
    }
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    showToast("In die Zwischenablage kopiert!", "info");
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400/20 to-indigo-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
                <Video className="w-3.5 h-3.5" /> Phase 5: Video Studio
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Remotion Engine & YouTube Creator Kit
              </span>
            </div>

            <h1 className="font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
              Remotion Video Studio & <span className="gradient-text-rainbow">YouTube Kit</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Erlebe dein fertiges Musikvideo mit Ken-Burns-Kamerafahrten, magischen Partikeln, Szenen-Transitions und Sing-Along Untertiteln in voller Bildrate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportZipPackage}
              disabled={isExportingZip}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 border border-white/10 hover:border-amber-400 text-white font-black text-xs shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Alle YouTube-Dateien in einem ZIP herunterladen"
            >
              {isExportingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Packe ZIP...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>📦 Creator ZIP-Paket</span>
                </>
              )}
            </button>

            <button
              onClick={handleRenderVideo}
              disabled={isRenderingVideo}
              className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isRenderingVideo ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Rendere 1080p MP4...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>1080p MP4 Video rendern</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Remotion Live Player (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 space-y-5 shadow-2xl">
            {/* Format & Particles Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/10">
                <button
                  onClick={() => updateCurrentProject({ aspectRatio: "16:9" })}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentProject.aspectRatio === "16:9"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>16:9 YouTube</span>
                </button>
                <button
                  onClick={() => updateCurrentProject({ aspectRatio: "9:16" })}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentProject.aspectRatio === "9:16"
                      ? "bg-pink-600 text-white shadow-md shadow-pink-500/30 scale-[1.02]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 Shorts</span>
                </button>
              </div>

              {/* Particle Effects */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Effekt:</span>
                <select
                  value={currentProject.particleEffect || "stars"}
                  onChange={(e) => updateCurrentProject({ particleEffect: e.target.value as any })}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-amber-300 font-bold focus:outline-none"
                >
                  <option value="stars">⭐ Sterne & Glitzer</option>
                  <option value="bubbles">🫧 Seifenblasen</option>
                  <option value="notes">🎵 Fliegende Noten</option>
                  <option value="confetti">🎉 Buntes Konfetti</option>
                  <option value="none">🚫 Keine</option>
                </select>
              </div>
            </div>

            {/* Remotion Player Container with Ambient Glow */}
            <div className="relative flex justify-center items-center rounded-3xl bg-black/90 p-3 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
              <div
                style={{
                  width: `${playerWidth}px`,
                  maxWidth: "100%",
                  aspectRatio: isShorts ? "9/16" : "16/9",
                  borderRadius: "20px",
                  overflow: "hidden",
                }}
                className="shadow-2xl"
              >
                <Player
                  component={KidsSongComposition}
                  inputProps={{
                    title: currentProject.title,
                    audioUrl: currentProject.audioUrl,
                    audioDuration: currentProject.audioDuration,
                    scenes: currentProject.scenes,
                    captions: currentProject.captions,
                    aspectRatio: currentProject.aspectRatio,
                    captionStyle: currentProject.captionStyle,
                    captionFont: currentProject.captionFont,
                    particleEffect: currentProject.particleEffect,
                    transitionEffect: currentProject.transitionEffect,
                    channelName: currentProject.channelName,
                    showWatermark: currentProject.showWatermark ?? true,
                    showSubscribeOutro: currentProject.showSubscribeOutro ?? true,
                  }}
                  durationInFrames={durationInFrames}
                  compositionWidth={isShorts ? 1080 : 1920}
                  compositionHeight={isShorts ? 1920 : 1080}
                  fps={30}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  controls
                  loop
                  autoPlay={false}
                />
              </div>
            </div>

            {/* Video Transitions & Watermark Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Transitions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <label className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" /> Szenen-Übergangseffekt
                </label>
                <select
                  value={currentProject.transitionEffect || "smooth-crossfade"}
                  onChange={(e) => updateCurrentProject({ transitionEffect: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none"
                >
                  {TRANSITIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branding & Outro */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <label className="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Kanal-Wasserzeichen & Outro
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentProject.showWatermark ?? true}
                      onChange={(e) => updateCurrentProject({ showWatermark: e.target.checked })}
                      className="rounded accent-pink-500"
                    />
                    <span>Logo</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentProject.showSubscribeOutro ?? true}
                      onChange={(e) => updateCurrentProject({ showSubscribeOutro: e.target.checked })}
                      className="rounded accent-pink-500"
                    />
                    <span>Abo-Endcard 🔔</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Render Ready Alert */}
            {currentProject.renderedVideoUrl && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Video bereit zum Download!</h4>
                    <p className="text-[11px] text-slate-400">1080p MP4 mit Suno Gesang & Untertiteln</p>
                  </div>
                </div>

                <a
                  href={currentProject.renderedVideoUrl}
                  download={`${currentProject.title.replace(/\s+/g, "_")}.mp4`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>MP4 Herunterladen</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: YouTube SEO Kit & Thumbnail Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* YouTube Thumbnail Studio Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-fredoka text-base font-bold text-white">YouTube Thumbnail Studio</h3>
                  <p className="text-[11px] text-slate-400">1-Klick Vorschaubild (1280x720) mit Flux</p>
                </div>
              </div>

              <button
                onClick={handleGenerateThumbnail}
                disabled={isGeneratingThumb}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 text-white text-xs font-extrabold shadow-md hover:scale-105 transition disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingThumb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Zeichne...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Thumbnail erstellen</span>
                  </>
                )}
              </button>
            </div>

            {currentProject.thumbnailUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-amber-400/30 group shadow-lg">
                  <img
                    src={currentProject.thumbnailUrl}
                    alt="YouTube Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                    1280 × 720 HD
                  </div>
                </div>

                <a
                  href={currentProject.thumbnailUrl}
                  download={`${currentProject.title.replace(/\s+/g, "_")}_Thumbnail.webp`}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thumbnail (HD) herunterladen</span>
                </a>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-dashed border-white/10 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Klicke oben auf &quot;Thumbnail erstellen&quot;, um ein klickstarkes Vorschaubild für deinen Kanal zu erzeugen.
                </p>
              </div>
            )}
          </div>

          {/* YouTube SEO Metadata Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-fredoka text-base font-bold text-white">YouTube Creator Kit</h3>
                  <p className="text-[11px] text-slate-400">SEO-Optimierung für deinen Kanal</p>
                </div>
              </div>

              <button
                onClick={handleGenerateYouTubeSEO}
                disabled={isGeneratingSeo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>SEO Generieren</span>
              </button>
            </div>

            {currentProject.youtubeSeo ? (
              <div className="space-y-4">
                {/* Video Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">YouTube Titel</label>
                    <button
                      onClick={() => copyToClipboard(currentProject.youtubeSeo!.title, "title")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedField === "title" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Kopieren</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 text-xs text-white font-semibold">
                    {currentProject.youtubeSeo.title}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Video Beschreibung</label>
                    <button
                      onClick={() => copyToClipboard(currentProject.youtubeSeo!.description, "desc")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedField === "desc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Kopieren</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    readOnly
                    value={currentProject.youtubeSeo.description}
                    className="w-full p-3 rounded-2xl bg-slate-950/90 border border-white/10 text-xs text-slate-300 resize-none font-mono"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">YouTube Tags</label>
                    <button
                      onClick={() => copyToClipboard(currentProject.youtubeSeo!.tags.join(", "), "tags")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedField === "tags" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Alle Tags kopieren</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-slate-950/90 border border-white/10">
                    {currentProject.youtubeSeo.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-300 font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-950/80 border border-dashed border-white/10 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Klicke auf &quot;SEO Generieren&quot;, um suchmaschinenoptimierte Titel, Tags und Beschreibungen für YouTube zu erstellen.
                </p>
                <button
                  onClick={handleGenerateYouTubeSEO}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Jetzt YouTube SEO erstellen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          onClick={() => setCurrentStep(4)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Karaoke & Timing</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportZipPackage}
            disabled={isExportingZip}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition cursor-pointer"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>YouTube ZIP-Paket</span>
          </button>

          <button
            onClick={() => {
              saveCurrentProjectToDb();
              showToast("Projekt erfolgreich fertiggestellt und gespeichert!", "success");
            }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.03] transition cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Projekt speichern & abschließen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
