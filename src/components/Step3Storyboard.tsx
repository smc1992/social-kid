"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Image as ImageIcon,
  Wand2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Move,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
  Compass,
} from "lucide-react";
import { VisualStyle, Scene } from "@/types";

const VISUAL_STYLES: { id: VisualStyle; name: string; icon: string; desc: string; badge: string }[] = [
  { id: "pixar-3d", name: "3D Disney/Pixar", icon: "🌟", desc: "Plastische, bunte 3D-Charaktere & Beleuchtung", badge: "Kino-Look" },
  { id: "storybook-watercolor", name: "Bilderbuch Aquarell", icon: "🎨", desc: "Zarte handgemalte Texturen & Märchenlook", badge: "Künstlerisch" },
  { id: "vibrant-2d-cartoon", name: "Bunter 2D Cartoon", icon: "🖍️", desc: "Klare Linien & knallige Farben wie im Kinder-TV", badge: "Sehr Beliebt" },
  { id: "cute-chibi-anime", name: "Cute Chibi Kawaii", icon: "🐱", desc: "Große Kulleraugen & niedliche Pastelltöne", badge: "Kawaii" },
  { id: "claymation-craft", name: "Claymation Knet-Stil", icon: "🧸", desc: "Stop-Motion Plastilin & Bastel-Ästhetik", badge: "Handmade" },
  { id: "magical-fantasy", name: "Magische Märchenwelt", icon: "✨", desc: "Leuchtende Glitzer-Effekte & Traumwelten", badge: "Magisch" },
];

export const Step3Storyboard: React.FC = () => {
  const {
    currentProject,
    updateCurrentProject,
    setCurrentStep,
    isGeneratingScenes,
    setGeneratingScenes,
    showToast,
    saveCurrentProjectToDb,
    theme,
  } = useProjectStore();

  const isLight = theme === "light";
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>("pixar-3d");
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);

  if (!currentProject) return null;

  const scenes = currentProject.scenes || [];

  // Automatically break down lyrics into scenes
  const handleAutoBreakdown = async () => {
    if (!currentProject.lyrics?.trim()) {
      showToast("Bitte erstelle zuerst einen Liedtext in Schritt 1.", "error");
      return;
    }

    setGeneratingScenes(true);
    try {
      const res = await fetch("/api/generate/scene-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: currentProject.lyrics,
          style: selectedStyle,
          duration: currentProject.audioDuration || 45,
        }),
      });

      const data = await res.json();
      if (data.success && data.scenes) {
        updateCurrentProject({ scenes: data.scenes });
        showToast(`${data.scenes.length} Szenen erfolgreich erstellt!`, "success");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Fehler bei der Szenenerstellung", "error");
    } finally {
      setGeneratingScenes(false);
    }
  };

  // Generate image for single scene
  const handleGenerateSingleImage = async (sceneId: string, prompt: string) => {
    setGeneratingSceneId(sceneId);
    try {
      const res = await fetch("/api/generate/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: currentProject.aspectRatio || "16:9",
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const updatedScenes = scenes.map((sc) =>
          sc.id === sceneId ? { ...sc, imageUrl: data.imageUrl, status: "ready" as const } : sc
        );
        updateCurrentProject({ scenes: updatedScenes });
        showToast("Szene erfolgreich mit Flux generiert!", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Batch generate all images
  const handleBatchGenerateImages = async () => {
    if (scenes.length === 0) {
      showToast("Bitte erstelle zuerst Szenen mit 'Szenen aus Text ableiten'.", "error");
      return;
    }

    setGeneratingScenes(true);
    showToast("Starte Batch-Generierung aller Bilder mit Flux...", "info");

    try {
      for (const scene of scenes) {
        if (!scene.imageUrl || scene.status !== "ready") {
          setGeneratingSceneId(scene.id);
          const res = await fetch("/api/generate/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: scene.visualPrompt,
              aspectRatio: currentProject.aspectRatio || "16:9",
            }),
          });
          const data = await res.json();
          if (data.success && data.imageUrl) {
            scene.imageUrl = data.imageUrl;
            scene.status = "ready";
            updateCurrentProject({ scenes: [...scenes] });
          }
        }
      }
      showToast("Alle Szenen-Bilder erfolgreich generiert!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(`Fehler im Batch-Lauf: ${e.message}`, "error");
    } finally {
      setGeneratingScenes(false);
      setGeneratingSceneId(null);
    }
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    const updated = scenes.map((sc) => (sc.id === sceneId ? { ...sc, ...updates } : sc));
    updateCurrentProject({ scenes: updated });
  };

  const handleDeleteScene = (sceneId: string) => {
    const updated = scenes.filter((sc) => sc.id !== sceneId);
    updateCurrentProject({ scenes: updated });
  };

  const handleAddScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newStart = lastScene ? lastScene.endTime : 0;
    const newEnd = newStart + 8;
    const newScene: Scene = {
      id: `sc_${Date.now()}`,
      index: scenes.length,
      startTime: newStart,
      endTime: newEnd,
      textSnippet: "Neue Szene",
      visualPrompt: "Cute colorful 3D kids cartoon illustration of happy children singing, Pixar style",
      style: selectedStyle,
      status: "idle",
      motionType: "zoom-in",
    };
    updateCurrentProject({ scenes: [...scenes, newScene] });
  };

  const handleNextStep = async () => {
    await saveCurrentProjectToDb();
    setCurrentStep(4);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Premium Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl ${
        isLight
          ? "bg-gradient-to-r from-white via-purple-50/40 to-pink-50/50 border-slate-200/80 shadow-slate-200/50"
          : "bg-gradient-to-r from-purple-950/80 via-pink-950/60 to-slate-950 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isLight
                  ? "bg-purple-100 border border-purple-300 text-purple-700"
                  : "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300"
              }`}>
                <ImageIcon className="w-3.5 h-3.5" /> Phase 3: Storyboard & Bilder
              </span>
              <span className={`text-xs font-semibold ${isLight ? "text-slate-600 font-bold" : "text-slate-400"}`}>
                Flux 1 Schnell / Dev Pipeline
              </span>
            </div>

            <h1 className={`font-fredoka text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              Storyboard & <span className="gradient-text-rainbow">Bildsequenzen</span>
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isLight ? "text-slate-700 font-medium" : "text-slate-300"
            }`}>
              Jede Strophe wird in eine kindgerechte Bildszene übersetzt. Wähle deinen bevorzugten Kinder-Illustrationsstil und generiere hochauflösende Bilder mit animierten Ken-Burns-Kamerafahrten.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAutoBreakdown}
              disabled={isGeneratingScenes}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-purple-300"
                  : "bg-slate-900/90 border-white/10 hover:border-purple-400 text-white"
              }`}
            >
              <Wand2 className="w-4 h-4 text-purple-500" />
              <span>Szenen aus Text ableiten</span>
            </button>

            <button
              onClick={handleBatchGenerateImages}
              disabled={isGeneratingScenes || scenes.length === 0}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-extrabold text-xs shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingScenes ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Flux generiert Bilder...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Alle Bilder generieren (Flux)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Style Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-xs font-extrabold uppercase tracking-widest ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}>
            Grafikstil für das Kinderlied wählen
          </h2>
          <span className="text-xs text-purple-500 font-bold">Aktiver Stil: {VISUAL_STYLES.find(s => s.id === selectedStyle)?.name}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {VISUAL_STYLES.map((st) => {
            const isSelected = selectedStyle === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStyle(st.id)}
                className={`p-4 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? "bg-purple-50/80 border-purple-400 shadow-md scale-[1.03] ring-2 ring-purple-400/40 text-slate-900"
                      : "bg-slate-900 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.3)] scale-[1.03] text-white"
                    : isLight
                    ? "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-900 shadow-sm"
                    : "bg-slate-900/70 border-white/10 hover:border-white/20 hover:bg-slate-900 text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{st.icon}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? isLight ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-400"
                  }`}>
                    {st.badge}
                  </span>
                </div>
                <div>
                  <h3 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>{st.name}</h3>
                  <p className={`text-[10px] leading-tight mt-1 ${isLight ? "text-slate-600 font-medium" : "text-slate-400"}`}>{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storyboard Scenes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-fredoka text-lg font-bold flex items-center gap-2 ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            <span>🎬</span> Storyboard-Szenen ({scenes.length})
          </h3>

          <button
            onClick={handleAddScene}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                : "bg-slate-900 border-white/10 hover:border-white/25 text-slate-300 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
            <span>Szene hinzufügen</span>
          </button>
        </div>

        {scenes.length === 0 ? (
          <div className={`p-12 rounded-3xl border border-dashed text-center space-y-4 ${
            isLight ? "bg-white border-slate-300" : "bg-slate-950/80 border-white/10"
          }`}>
            <div className="text-5xl">🎨</div>
            <h4 className={`font-bold text-base ${isLight ? "text-slate-900" : "text-white"}`}>Noch keine Szenen im Storyboard</h4>
            <p className={`text-xs max-w-md mx-auto ${isLight ? "text-slate-600 font-medium" : "text-slate-400"}`}>
              Klicke oben auf &quot;Szenen aus Text ableiten&quot;, um den Liedtext automatisch in aufeinander abgestimmte Bild-Szenen zu zerlegen.
            </p>
            <button
              onClick={handleAutoBreakdown}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold shadow-lg cursor-pointer"
            >
              Jetzt Szenen automatisch erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenes.map((scene, idx) => {
              const isThisGenerating = generatingSceneId === scene.id;

              return (
                <div
                  key={scene.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl ${
                    isLight
                      ? "bg-white border-slate-200/80 shadow-slate-200/50 hover:border-purple-300"
                      : "bg-slate-900/80 backdrop-blur-xl border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 text-white text-xs font-black flex items-center justify-center shadow">
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold font-mono ${isLight ? "text-slate-700" : "text-white"}`}>
                        {scene.startTime}s – {scene.endTime}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* SFX Selector (Option 4) */}
                      <select
                        value={scene.sfx || "none"}
                        onChange={(e) => handleUpdateScene(scene.id, { sfx: e.target.value as any })}
                        className={`px-2 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                          isLight ? "bg-slate-50 border-slate-200 text-pink-700" : "bg-slate-950 border-white/10 text-pink-300"
                        }`}
                        title="Cartoon Soundeffekt"
                      >
                        <option value="none">🚫 Kein SFX</option>
                        <option value="sparkle">✨ Glitzer</option>
                        <option value="boing">🪀 Boing</option>
                        <option value="applause">👏 Applaus</option>
                        <option value="giggle">👶 Kichern</option>
                        <option value="drumroll">🥁 Trommel</option>
                      </select>

                      {/* Motion Selector */}
                      <select
                        value={scene.motionType}
                        onChange={(e) => handleUpdateScene(scene.id, { motionType: e.target.value as any })}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                          isLight ? "bg-slate-50 border-slate-200 text-amber-800" : "bg-slate-950 border-white/10 text-amber-300"
                        }`}
                        title="Kamerafahrt / Ken Burns Effekt"
                      >
                        <option value="zoom-in">🔍 Zoom In</option>
                        <option value="zoom-out">🔎 Zoom Out</option>
                        <option value="pan-left">⬅️ Pan Links</option>
                        <option value="pan-right">➡️ Pan Rechts</option>
                        <option value="gentle-drift">🌊 Sanfter Drift</option>
                      </select>

                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                        title="Szene löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Display */}
                  <div className={`relative aspect-video rounded-2xl overflow-hidden border group shadow-inner ${
                    isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-white/10"
                  }`}>
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={`Szene ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <ImageIcon className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-slate-600"}`} />
                        <span className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-500"}`}>Kein Bild generiert</span>
                      </div>
                    )}

                    {isThisGenerating && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center flex-col gap-2">
                        <RefreshCw className="w-7 h-7 text-pink-400 animate-spin" />
                        <span className="text-xs text-white font-extrabold">Flux generiert Szene...</span>
                      </div>
                    )}
                  </div>

                  {/* Lyrics text snippet & Prompt */}
                  <div className="space-y-2">
                    <p className={`text-xs font-bold line-clamp-2 italic p-2 rounded-xl border ${
                      isLight ? "bg-amber-50/80 text-amber-900 border-amber-200" : "bg-slate-950/60 text-amber-300 border-white/5"
                    }`}>
                      &quot;{scene.textSnippet}&quot;
                    </p>
                    <textarea
                      rows={2}
                      value={scene.visualPrompt}
                      onChange={(e) => handleUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:border-purple-400 focus:outline-none resize-none font-mono ${
                        isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-950/90 border-white/10 text-slate-300"
                      }`}
                      placeholder="Flux Bild-Prompt..."
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={() => handleGenerateSingleImage(scene.id, scene.visualPrompt)}
                    disabled={isThisGenerating}
                    className={`w-full py-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                        : "bg-slate-800/90 hover:bg-slate-700 border-transparent text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>{scene.imageUrl ? "Bild neu generieren (Flux)" : "Bild generieren (Flux)"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Musik</span>
        </button>

        <button
          onClick={handleNextStep}
          className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.03] transition cursor-pointer"
        >
          <span>Weiter zu Schritt 4: Karaoke & Timing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
