"use client";

import React, { useState, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Lock, Unlock, Key, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const { settings, theme } = useProjectStore();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const isLight = theme === "light";
  const requiredPassword = settings?.appPassword || process.env.NEXT_PUBLIC_APP_PASSWORD;

  useEffect(() => {
    // If no password is set anywhere, allow direct access
    if (!requiredPassword) {
      setIsUnlocked(true);
      setIsChecking(false);
      return;
    }

    // Check localStorage / sessionStorage for existing session
    const savedAuth = localStorage.getItem("social_kid_unlocked");
    if (savedAuth === "true" || savedAuth === requiredPassword) {
      setIsUnlocked(true);
    }
    setIsChecking(false);
  }, [requiredPassword]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setErrorMsg("Bitte gib das Passwort ein");
      return;
    }

    if (passwordInput === requiredPassword) {
      localStorage.setItem("social_kid_unlocked", "true");
      setIsUnlocked(true);
      setErrorMsg(null);
    } else {
      setErrorMsg("Falsches Passwort. Bitte erneut versuchen.");
    }
  };

  if (isChecking) {
    return null;
  }

  // If unlocked or no password required, render children
  if (isUnlocked || !requiredPassword) {
    return <>{children}</>;
  }

  // Locked Gate Screen
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isLight ? "bg-slate-50 text-slate-900" : "bg-[#070a13] text-white"
    }`}>
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className={`relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl border shadow-2xl backdrop-blur-2xl text-center space-y-6 ${
        isLight ? "bg-white/90 border-slate-200" : "bg-slate-900/90 border-white/10"
      }`}>
        {/* Animated Lock Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 p-0.5 shadow-xl shadow-pink-500/25 flex items-center justify-center">
          <div className={`w-full h-full rounded-[22px] flex items-center justify-center ${
            isLight ? "bg-white" : "bg-slate-950"
          }`}>
            <Lock className="w-8 h-8 text-amber-500 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-fredoka text-2xl sm:text-3xl font-black gradient-text-rainbow">
            Social Kid Studio
          </h1>
          <p className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Diese Plattform ist passwortgeschützt. Bitte gib das Zugangspasswort ein.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <div className="relative">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Passwort eingeben..."
                autoFocus
                className={`w-full px-4 py-3.5 pl-11 rounded-2xl border text-sm font-semibold transition focus:outline-none ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                    : "bg-slate-950 border-white/10 text-white focus:border-amber-400"
                }`}
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-semibold pt-1 pl-1">
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Studio freischalten</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
          🔒 Sicher verschlüsselte YouTube Creator Production Suite
        </p>
      </div>
    </div>
  );
};
