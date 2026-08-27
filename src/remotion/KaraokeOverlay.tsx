"use client";

import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { CaptionLine, CaptionStyle, CaptionFont } from "@/types";

interface KaraokeOverlayProps {
  captions: CaptionLine[];
  fps: number;
  captionStyle: CaptionStyle;
  captionFont: CaptionFont;
  aspectRatio: "16:9" | "9:16";
}

export const KaraokeOverlay: React.FC<KaraokeOverlayProps> = ({
  captions,
  fps,
  captionStyle,
  captionFont,
  aspectRatio,
}) => {
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // Find active line
  const activeLine = captions.find(
    (line) => currentTime >= line.start - 0.2 && currentTime <= line.end + 0.4
  );

  if (!activeLine) return null;

  const isShorts = aspectRatio === "9:16";
  const baseFontSize = isShorts ? 38 : 46;

  const fontFamilies: Record<CaptionFont, string> = {
    Fredoka: "'Fredoka', 'Bubblegum Sans', cursive, sans-serif",
    "Baloo 2": "'Baloo 2', cursive, sans-serif",
    Outfit: "'Outfit', sans-serif",
    "Comic Neue": "'Comic Neue', cursive, sans-serif",
    "Bubblegum Sans": "'Bubblegum Sans', cursive, sans-serif",
  };

  const fontFamily = fontFamilies[captionFont] || fontFamilies["Fredoka"];

  return (
    <div
      style={{
        position: "absolute",
        bottom: isShorts ? "18%" : "12%",
        left: "5%",
        right: "5%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {/* Glow Backdrop Pill */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(12px)",
          padding: isShorts ? "16px 24px" : "18px 36px",
          borderRadius: "32px",
          border: "3px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(250, 204, 21, 0.25)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: isShorts ? "8px" : "14px",
          maxWidth: isShorts ? "90%" : "85%",
          textAlign: "center",
        }}
      >
        {activeLine.words && activeLine.words.length > 0 ? (
          activeLine.words.map((wordObj) => {
            const isWordActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
            const isWordPassed = currentTime > wordObj.end;

            // Bouncing spring effect
            let wordScale = 1.0;
            let bounceY = 0;

            if (isWordActive) {
              const wordFrame = (currentTime - wordObj.start) * fps;
              const bounce = spring({
                frame: wordFrame,
                fps,
                config: { damping: 10, mass: 0.5, stiffness: 120 },
              });
              wordScale = 1.0 + bounce * 0.25;
              bounceY = -Math.sin((currentTime - wordObj.start) * Math.PI * 4) * 8;
            }

            // Styling based on captionStyle
            let color = "rgba(255, 255, 255, 0.9)";
            let textShadow = "0 2px 8px rgba(0,0,0,0.8)";
            let background = "transparent";

            if (isWordActive) {
              if (captionStyle === "glowing-highlight") {
                color = "#fef08a"; // Bright yellow glow
                textShadow = "0 0 20px #facc15, 0 0 35px #eab308, 0 2px 4px rgba(0,0,0,0.8)";
              } else if (captionStyle === "bubble-pop") {
                color = "#ffffff";
                background = "linear-gradient(135deg, #ec4899, #8b5cf6)";
                textShadow = "0 2px 6px rgba(0,0,0,0.5)";
              } else {
                // Bouncing ball / Karaoke
                color = "#38bdf8"; // Sky blue active
                textShadow = "0 0 15px #38bdf8, 0 2px 6px rgba(0,0,0,0.9)";
              }
            } else if (isWordPassed) {
              color = "#facc15"; // Gold passed
            }

            return (
              <div
                key={wordObj.id}
                style={{
                  position: "relative",
                  display: "inline-block",
                  transform: `scale(${wordScale}) translateY(${bounceY}px)`,
                  transition: "color 0.1s ease",
                }}
              >
                {/* Bouncing ball icon on top of active word */}
                {isWordActive && captionStyle === "bouncing-ball" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-22px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "18px",
                      filter: "drop-shadow(0 2px 6px rgba(250, 204, 21, 0.9))",
                    }}
                  >
                    🟡
                  </div>
                )}

                <span
                  style={{
                    fontFamily,
                    fontSize: `${baseFontSize}px`,
                    fontWeight: 800,
                    color,
                    textShadow,
                    background,
                    padding: background !== "transparent" ? "4px 12px" : "0",
                    borderRadius: "16px",
                    display: "inline-block",
                    letterSpacing: "0.5px",
                  }}
                >
                  {wordObj.word}
                </span>
              </div>
            );
          })
        ) : (
          <span
            style={{
              fontFamily,
              fontSize: `${baseFontSize}px`,
              fontWeight: 800,
              color: "#fef08a",
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {activeLine.text}
          </span>
        )}
      </div>
    </div>
  );
};
