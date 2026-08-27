"use client";

import React, { useState, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { AppSettings } from "@/types";
import { X, Key, Sparkles, Music, Image as ImageIcon, ShieldCheck, Check, Lock, Globe, Video } from "lucide-react";

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, settings, setSettings, showToast } = useProjectStore();

  const [formData, setFormData] = useState<AppSettings>({
    kieApiKey: "",
    replicateApiToken: "",
    falApiKey: "",
    geminiApiKey: "",
    openaiApiKey: "",
    defaultMusicProvider: "kie-suno",
    defaultImageProvider: "fal-flux",
    defaultVideoQuality: "1080p",
    preferredLanguage: "de",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast("Einstellungen erfolgreich gespeichert!", "success");
        setSettingsOpen(false);
      }
    } catch (e) {
      console.error(e);
      showToast("Fehler beim Speichern der Einstellungen", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900/95 border border-white/15 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-pink-500/20 font-bold">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-fredoka text-2xl font-black text-white">KI-Provider & API-Keys</h2>
              <p className="text-xs text-slate-400 font-medium">Verwalte deine Schlüssel für Kie.ai (Suno), Flux & Whisper</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-6 space-y-6">
          {/* Section 1: Music Engine (Kie.ai) */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <span>Kie.ai API Key (Suno AI Gesang)</span>
              </label>
              <a
                href="https://kie.ai"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                Key erstellen (kie.ai) ↗
              </a>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ermöglicht die Generierung von echten Kinderliedern mit Gesang (Suno V4/V5) über die Kie.ai API.
            </p>
            <input
              type="password"
              placeholder="z.B. kie_live_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.kieApiKey}
              onChange={(e) => setFormData({ ...formData, kieApiKey: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm font-mono"
            />
          </div>

          {/* Section 2: Replicate / Fal.ai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-pink-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Replicate Token
                </label>
                <a
                  href="https://replicate.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-pink-400 hover:underline"
                >
                  replicate.com ↗
                </a>
              </div>
              <input
                type="password"
                placeholder="r8_xxxxxxxxxxxxxxxx"
                value={formData.replicateApiToken}
                onChange={(e) => setFormData({ ...formData, replicateApiToken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-pink-400 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 block">Flux 1 Bilder & Whisper Word-Timing.</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Fal.ai API Key
                </label>
                <a
                  href="https://fal.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  fal.ai ↗
                </a>
              </div>
              <input
                type="password"
                placeholder="fal_key_xxxxxxxx"
                value={formData.falApiKey}
                onChange={(e) => setFormData({ ...formData, falApiKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 block">Für ultra-schnelle Flux 1 Schnell Bilder.</span>
            </div>
          </div>

          {/* Section 3: AI Songwriter */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-3">
            <label className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> OpenAI oder Google Gemini API Key (Songwriting)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="OpenAI API Key (sk-...)"
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 text-xs font-mono"
              />
              <input
                type="password"
                placeholder="Gemini API Key (AIza...)"
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Wenn kein Key eingegeben ist, nutzt Social Kid einen hochqualitativen integrierten Reim-Generator für Kinderthemen.
            </p>
          </div>

          {/* Section 4: Passwortschutz & Zugriff */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Studio Passwortschutz (Netlify / Web)
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
            </div>
            <input
              type="password"
              placeholder="z.B. MeinSicheresPasswort2026"
              value={formData.appPassword || ""}
              onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">
              Sperrt die gesamte Studio-App mit einem Sperrbildschirm. Kann auch als Netlify-Umgebungsvariable (NEXT_PUBLIC_APP_PASSWORD) hinterlegt werden.
            </span>
          </div>

          {/* Preferences */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Standard Bild-Engine</label>
              <select
                value={formData.defaultImageProvider}
                onChange={(e) => setFormData({ ...formData, defaultImageProvider: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold"
              >
                <option value="fal-flux">Fal.ai (Flux 1 Schnell - Ultra Fast)</option>
                <option value="replicate-flux">Replicate (Flux 1 Dev / Schnell)</option>
                <option value="demo">Demo / High-Res Stock Preset</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Standardsprache</label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold"
              >
                <option value="de">🇩🇪 Deutsch (DE)</option>
                <option value="en">🇬🇧 Englisch (EN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white text-xs font-black shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Speichern...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Einstellungen speichern</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
