"use client";

import React from "react";
import { Sequence, Audio, useVideoConfig, useCurrentFrame, interpolate, spring } from "remotion";
import { VideoCompositionProps } from "./types";
import { KenBurnsScene } from "./KenBurnsScene";
import { KaraokeOverlay } from "./KaraokeOverlay";
import { MagicParticles } from "./MagicParticles";

export const KidsSongComposition: React.FC<VideoCompositionProps> = ({
  title,
  audioUrl,
  audioDuration,
  scenes,
  captions,
  aspectRatio,
  captionStyle,
  captionFont,
  particleEffect,
  transitionEffect,
  channelName = "Social Kid",
  showWatermark = true,
  showSubscribeOutro = true,
}) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // If no scenes, provide default placeholder scene
  const safeScenes =
    scenes && scenes.length > 0
      ? scenes
      : [
          {
            id: "default_sc",
            index: 0,
            startTime: 0,
            endTime: Math.max(10, audioDuration || 30),
            textSnippet: title || "Fröhliches Kinderlied",
            visualPrompt: "Vibrant 3D colorful kids cartoon background with smiling sun and rainbow",
            style: "pixar-3d" as const,
            status: "ready" as const,
            motionType: "zoom-in" as const,
          },
        ];

  // End screen timing: last 4 seconds
  const outroDurationFrames = 4 * fps;
  const isOutroActive = frame >= durationInFrames - outroDurationFrames;

  const outroSpring = spring({
    frame: Math.max(0, frame - (durationInFrames - outroDurationFrames)),
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 120 },
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#070a13",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* 1. Background Music / Song Audio */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* 2. Visual Scenes (with calculated framerate offsets) */}
      {safeScenes.map((scene, idx) => {
        const fromFrame = Math.round(scene.startTime * fps);
        const durationForScene = Math.max(15, Math.round((scene.endTime - scene.startTime) * fps));

        return (
          <Sequence
            key={scene.id || `scene_${idx}`}
            from={fromFrame}
            durationInFrames={durationForScene}
            name={`Scene ${idx + 1}`}
          >
            <KenBurnsScene
              scene={scene}
              durationInFrames={durationForScene}
              fps={fps}
              transitionEffect={scene.transition || transitionEffect || "smooth-crossfade"}
            />
          </Sequence>
        );
      })}

      {/* 3. Magical Floating Particles Layer */}
      <MagicParticles effect={particleEffect} width={width} height={height} />

      {/* 4. Synchronized Sing-Along Karaoke Captions */}
      {captions && captions.length > 0 && (
        <KaraokeOverlay
          captions={captions}
          fps={fps}
          captionStyle={captionStyle}
          captionFont={captionFont}
          aspectRatio={aspectRatio}
        />
      )}

      {/* 5. Custom Channel Watermark / Logo Badge */}
      {showWatermark && (
        <div
          style={{
            position: "absolute",
            top: aspectRatio === "9:16" ? "40px" : "32px",
            left: aspectRatio === "9:16" ? "30px" : "36px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(10, 15, 30, 0.65)",
            backdropFilter: "blur(12px)",
            padding: "8px 18px",
            borderRadius: "24px",
            border: "1.5px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            color: "white",
            fontFamily: "'Fredoka', sans-serif",
            fontSize: aspectRatio === "9:16" ? "20px" : "22px",
            fontWeight: 800,
            pointerEvents: "none",
            zIndex: 40,
          }}
        >
          <span style={{ filter: "drop-shadow(0 2px 4px rgba(250, 204, 21, 0.8))" }}>🌟</span>
          <span style={{ letterSpacing: "0.5px" }}>{channelName || "Social Kid"}</span>
        </div>
      )}

      {/* 6. Animated YouTube Subscribe & Like End-Screen Card */}
      {showSubscribeOutro && isOutroActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            zIndex: 60,
            opacity: interpolate(frame, [durationInFrames - outroDurationFrames, durationInFrames - outroDurationFrames + 15], [0, 1]),
            transform: `scale(${outroSpring})`,
          }}
        >
          <div
            style={{
              padding: "24px 48px",
              borderRadius: "36px",
              background: "linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)",
              border: "3px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(236, 72, 153, 0.6)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "52px" }}>🎉</div>
            <h2
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: aspectRatio === "9:16" ? "36px" : "44px",
                fontWeight: 900,
                color: "white",
                textShadow: "0 4px 12px rgba(0,0,0,0.5)",
                margin: 0,
              }}
            >
              Hat dir das Lied gefallen?
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  padding: "12px 28px",
                  borderRadius: "24px",
                  fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 20px rgba(239, 68, 68, 0.5)",
                }}
              >
                <span>🔔</span>
                <span>ABONNIEREN</span>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "24px",
                  fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>👍</span>
                <span>LIKE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
