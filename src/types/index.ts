export type TargetAgeGroup = "1-3" | "4-6" | "7-10" | "all";

export type MusicGenre =
  | "catchy-pop"
  | "nursery-rhyme"
  | "lullaby-gentle"
  | "dance-party"
  | "educational-acoustic"
  | "orchestral-fairytale";

export type VocalStyle =
  | "female-sweet"
  | "children-choir"
  | "male-storyteller"
  | "acoustic-duo";

export type VisualStyle =
  | "pixar-3d"
  | "storybook-watercolor"
  | "cute-chibi-anime"
  | "vibrant-2d-cartoon"
  | "claymation-craft"
  | "magical-fantasy";

export type AspectRatio = "16:9" | "9:16";

export type CaptionStyle =
  | "bouncing-ball"
  | "glowing-highlight"
  | "bubble-pop"
  | "karaoke-fill";

export type CaptionFont =
  | "Fredoka"
  | "Baloo 2"
  | "Outfit"
  | "Comic Neue"
  | "Bubblegum Sans";

export type VideoTransition =
  | "smooth-crossfade"
  | "circle-pop"
  | "star-wipe"
  | "slide-bounce";

export type SceneSfx =
  | "boing"
  | "sparkle"
  | "applause"
  | "giggle"
  | "drumroll"
  | "none";

export interface CaptionWord {
  id: string;
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface CaptionLine {
  id: string;
  text: string;
  start: number;
  end: number;
  words: CaptionWord[];
}

export interface Scene {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  textSnippet: string;
  visualPrompt: string;
  style: VisualStyle;
  imageUrl?: string;
  status: "idle" | "generating" | "ready" | "error";
  error?: string;
  motionType: "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "gentle-drift";
  transition?: VideoTransition;
  sfx?: SceneSfx;
}

export interface SongTrack {
  id: string;
  audioUrl: string;
  title: string;
  duration: number;
  provider: "kie-suno" | "replicate-minimax" | "custom" | "demo";
  modelUsed?: string;
  createdAt: string;
}

export interface YouTubeSEOData {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailPrompt: string;
  thumbnailUrl?: string;
  targetKeywords: string[];
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  targetAge: TargetAgeGroup;
  language: "de" | "en" | "es" | "fr";
  genre: MusicGenre;
  vocalStyle?: VocalStyle;
  mood: string;
  lyrics: string;
  audioUrl?: string;
  audioDuration: number;
  audioTrimStart?: number;
  audioTrimEnd?: number;
  tracks: SongTrack[];
  selectedTrackId?: string;
  scenes: Scene[];
  captions: CaptionLine[];
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  captionFont: CaptionFont;
  particleEffect: "stars" | "bubbles" | "notes" | "confetti" | "none";
  transitionEffect: VideoTransition;
  channelName?: string;
  showWatermark?: boolean;
  showSubscribeOutro?: boolean;
  thumbnailUrl?: string;
  youtubeSeo?: YouTubeSEOData;
  renderedVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  kieApiKey: string;
  replicateApiToken: string;
  falApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  defaultMusicProvider: "kie-suno" | "replicate-minimax" | "demo";
  defaultImageProvider: "fal-flux" | "replicate-flux" | "kie-image" | "demo";
  defaultVideoQuality: "1080p" | "720p";
  preferredLanguage: "de" | "en";
  defaultChannelName?: string;
  appPassword?: string;
}

export interface AutoPilotProgress {
  step: "idle" | "lyrics" | "music" | "scenes" | "transcribe" | "seo" | "thumbnail" | "completed" | "error";
  currentTask: string;
  percent: number;
  logs: string[];
  error?: string;
}
