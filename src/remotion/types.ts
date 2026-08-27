import { Scene, CaptionLine, AspectRatio, CaptionStyle, CaptionFont, VideoTransition } from "@/types";

export interface VideoCompositionProps {
  title: string;
  audioUrl?: string;
  audioDuration: number;
  scenes: Scene[];
  captions: CaptionLine[];
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  captionFont: CaptionFont;
  particleEffect: "stars" | "bubbles" | "notes" | "confetti" | "none";
  transitionEffect?: VideoTransition;
  channelName?: string;
  showWatermark?: boolean;
  showSubscribeOutro?: boolean;
}
