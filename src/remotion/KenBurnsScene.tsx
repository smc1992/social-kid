"use client";

import React from "react";
import { interpolate, useCurrentFrame, Img, spring } from "remotion";
import { Scene, VideoTransition } from "@/types";

interface KenBurnsSceneProps {
  scene: Scene;
  durationInFrames: number;
  fps: number;
  transitionEffect?: VideoTransition;
}

export const KenBurnsScene: React.FC<KenBurnsSceneProps> = ({
  scene,
  durationInFrames,
  fps,
  transitionEffect = "smooth-crossfade",
}) => {
  const frame = useCurrentFrame();

  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

  // Calculate motion
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;

  switch (scene.motionType) {
    case "zoom-in":
      scale = interpolate(progress, [0, 1], [1.0, 1.18]);
      break;
    case "zoom-out":
      scale = interpolate(progress, [0, 1], [1.18, 1.0]);
      break;
    case "pan-left":
      scale = 1.12;
      translateX = interpolate(progress, [0, 1], [3, -3]);
      break;
    case "pan-right":
      scale = 1.12;
      translateX = interpolate(progress, [0, 1], [-3, 3]);
      break;
    case "gentle-drift":
    default:
      scale = interpolate(progress, [0, 1], [1.02, 1.1]);
      translateY = interpolate(progress, [0, 1], [-1.5, 1.5]);
      break;
  }

  // Crossfade / Transition at beginning and end
  const fadeIn = Math.max(1, Math.min(12, Math.floor(durationInFrames / 4)));
  const fadeOut = Math.max(fadeIn + 2, durationInFrames - fadeIn);
  const endFrame = Math.max(fadeOut + 1, durationInFrames);

  let opacity = 1;
  let clipPath = "none";
  let transitionTransform = "";

  if (transitionEffect === "circle-pop") {
    // Expanding circle mask at start
    const circleProgress = Math.min(1, frame / fadeIn);
    clipPath = `circle(${circleProgress * 150}% at 50% 50%)`;
  } else if (transitionEffect === "slide-bounce") {
    // Slide from right with spring
    const slideProgress = spring({
      frame,
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 100 },
    });
    const slideOffset = (1 - Math.min(1, slideProgress)) * 100;
    transitionTransform = `translateX(${slideOffset}px)`;
  } else {
    // Default smooth-crossfade
    opacity = durationInFrames > 10
      ? interpolate(
          frame,
          [0, fadeIn, fadeOut, endFrame],
          [0, 1, 1, 0.8],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 1;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#070a13",
        clipPath,
        transform: transitionTransform,
      }}
    >
      {scene.imageUrl ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            transformOrigin: "center center",
            opacity,
            transition: "opacity 0.2s ease-out",
          }}
        >
          <Img
            src={scene.imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
            color: "white",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "72px", marginBottom: "20px" }}>🎨</div>
          <h2 style={{ fontSize: "36px", fontWeight: "bold", textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
            Szene {scene.index + 1}
          </h2>
          <p style={{ fontSize: "20px", maxWidth: "600px", opacity: 0.9, marginTop: "10px" }}>
            {scene.visualPrompt.slice(0, 120)}...
          </p>
        </div>
      )}

      {/* Subtle vignette gradient for high-contrast kids text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.1) 35%, rgba(0, 0, 0, 0.2) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
