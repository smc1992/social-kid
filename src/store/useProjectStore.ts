import { create } from "zustand";
import { Project, AppSettings, Scene, CaptionLine, SongTrack } from "@/types";

interface ProjectStore {
  currentProject: Project | null;
  projects: Project[];
  settings: AppSettings | null;
  currentStep: number; // 1 to 5
  theme: "dark" | "light";
  isLoading: boolean;
  isGeneratingLyrics: boolean;
  isGeneratingMusic: boolean;
  isGeneratingScenes: boolean;
  isGeneratingCaptions: boolean;
  isRenderingVideo: boolean;
  musicTaskId: string | null;
  musicTaskStatus: string;
  renderProgress: number;
  activeSceneId: string | null;
  isSettingsOpen: boolean;
  isProjectDrawerOpen: boolean;
  isAutoPilotOpen: boolean;
  toastMessage: { text: string; type: "success" | "error" | "info" } | null;

  // Actions
  setCurrentProject: (project: Project) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  setProjects: (projects: Project[]) => void;
  setSettings: (settings: AppSettings) => void;
  setCurrentStep: (step: number) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  setGeneratingLyrics: (val: boolean) => void;
  setGeneratingMusic: (val: boolean) => void;
  setGeneratingScenes: (val: boolean) => void;
  setGeneratingCaptions: (val: boolean) => void;
  setRenderingVideo: (val: boolean) => void;
  setMusicTask: (taskId: string | null, status: string) => void;
  setRenderProgress: (progress: number) => void;
  setActiveSceneId: (id: string | null) => void;
  setSettingsOpen: (open: boolean) => void;
  setProjectDrawerOpen: (open: boolean) => void;
  setAutoPilotOpen: (open: boolean) => void;
  showToast: (text: string, type?: "success" | "error" | "info") => void;

  // Async helpers
  fetchProjects: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  saveCurrentProjectToDb: () => Promise<void>;
  createNewProject: (title?: string) => Promise<Project>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: null,
  projects: [],
  settings: null,
  currentStep: 1,
  theme: "dark",
  isLoading: false,
  isGeneratingLyrics: false,
  isGeneratingMusic: false,
  isGeneratingScenes: false,
  isGeneratingCaptions: false,
  isRenderingVideo: false,
  musicTaskId: null,
  musicTaskStatus: "idle",
  renderProgress: 0,
  activeSceneId: null,
  isSettingsOpen: false,
  isProjectDrawerOpen: false,
  isAutoPilotOpen: false,
  toastMessage: null,

  setCurrentProject: (project) => set({ currentProject: project }),

  updateCurrentProject: (updates) => {
    const current = get().currentProject;
    if (!current) return;
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });

    // Also update in projects list
    const projects = get().projects.map((p) => (p.id === updated.id ? updated : p));
    set({ projects });
  },

  setProjects: (projects) => set({ projects }),
  setSettings: (settings) => set({ settings }),
  setCurrentStep: (step) => set({ currentStep: Math.min(5, Math.max(1, step)) }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setLoading: (loading) => set({ isLoading: loading }),
  setGeneratingLyrics: (val) => set({ isGeneratingLyrics: val }),
  setGeneratingMusic: (val) => set({ isGeneratingMusic: val }),
  setGeneratingScenes: (val) => set({ isGeneratingScenes: val }),
  setGeneratingCaptions: (val) => set({ isGeneratingCaptions: val }),
  setRenderingVideo: (val) => set({ isRenderingVideo: val }),
  setMusicTask: (taskId, status) => set({ musicTaskId: taskId, musicTaskStatus: status }),
  setRenderProgress: (progress) => set({ renderProgress: progress }),
  setActiveSceneId: (id) => set({ activeSceneId: id }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setProjectDrawerOpen: (open) => set({ isProjectDrawerOpen: open }),
  setAutoPilotOpen: (open) => set({ isAutoPilotOpen: open }),

  showToast: (text, type = "info") => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 4000);
  },

  fetchProjects: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success && data.projects) {
        set({ projects: data.projects });
        if (!get().currentProject && data.projects.length > 0) {
          set({ currentProject: data.projects[0] });
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        set({ settings: data.settings });
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  },

  saveCurrentProjectToDb: async () => {
    const project = get().currentProject;
    if (!project) return;

    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
    } catch (e) {
      console.error("Failed to save project to DB:", e);
    }
  },

  createNewProject: async (title = "Neuer Kindersong") => {
    try {
      const newProjData: Partial<Project> = {
        title,
        topic: "Lustige Tiere im Wald",
        targetAge: "4-6",
        language: "de",
        genre: "catchy-pop",
        mood: "fröhlich, verspielt, eingängig",
        lyrics: "",
        audioDuration: 45,
        tracks: [],
        scenes: [],
        captions: [],
        aspectRatio: "16:9",
        captionStyle: "bouncing-ball",
        captionFont: "Fredoka",
        particleEffect: "stars",
        transitionEffect: "smooth-crossfade",
        channelName: "Social Kid",
        showWatermark: true,
        showSubscribeOutro: true,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjData),
      });

      const data = await res.json();
      if (data.success && data.project) {
        const p = data.project;
        set((state) => ({
          projects: [p, ...state.projects],
          currentProject: p,
          currentStep: 1,
        }));
        return p;
      }
      throw new Error(data.error || "Failed to create project");
    } catch (e) {
      console.error("Create project error:", e);
      throw e;
    }
  },
}));
