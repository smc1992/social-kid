"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { X, FolderOpen, Plus, Trash2, Calendar, Music, Sparkles, Check, CheckCircle2 } from "lucide-react";

export const ProjectManagerModal: React.FC = () => {
  const {
    isProjectDrawerOpen,
    setProjectDrawerOpen,
    projects,
    currentProject,
    setCurrentProject,
    createNewProject,
    fetchProjects,
    showToast,
  } = useProjectStore();

  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isProjectDrawerOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const proj = await createNewProject(newTitle.trim());
      setNewTitle("");
      setProjectDrawerOpen(false);
      showToast(`Projekt "${proj.title}" erstellt!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Fehler beim Erstellen des Projekts", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Möchtest du dieses Projekt wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchProjects();
        showToast("Projekt gelöscht", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Fehler beim Löschen", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900/95 border border-white/15 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20 font-bold">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-fredoka text-2xl font-black text-white">Projekt-Verwaltung</h2>
              <p className="text-xs text-slate-400 font-medium">Verwalte deine Kindermusik- und Videoprojekte</p>
            </div>
          </div>
          <button
            onClick={() => setProjectDrawerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick New Project Input */}
        <form onSubmit={handleCreate} className="my-6 flex gap-3">
          <input
            type="text"
            placeholder="Neuer Projekttitel (z.B. 'Der kleine Traktor')"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 text-sm font-semibold"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isCreating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-black shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Erstellen</span>
          </button>
        </form>

        {/* Project List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {projects.map((proj) => {
            const isSelected = currentProject?.id === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  setCurrentProject(proj);
                  setProjectDrawerOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-indigo-950/70 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-[1.01]"
                    : "bg-slate-950/60 border-white/5 hover:border-white/20 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${
                      isSelected
                        ? "bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 text-white font-bold"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    🎵
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      {proj.title}
                      {isSelected && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Aktiv
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-semibold">
                      <span>Alter: {proj.targetAge} J.</span>
                      <span>•</span>
                      <span>{proj.scenes?.length || 0} Szenen</span>
                      <span>•</span>
                      <span>{proj.aspectRatio || "16:9"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(proj.id, e)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Projekt löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
