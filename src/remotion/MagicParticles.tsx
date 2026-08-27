"use client";

import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface MagicParticlesProps {
  effect: "stars" | "bubbles" | "notes" | "confetti" | "none";
  width: number;
  height: number;
}

export const MagicParticles: React.FC<MagicParticlesProps> = ({ effect, width, height }) => {
  const frame = useCurrentFrame();

  if (effect === "none") return null;

  // Generate deterministic particles
  const particles = useMemo(() => {
    const items = [];
    const count = effect === "confetti" ? 35 : 20;

    const symbols = {
      stars: ["⭐", "✨", "🌟", "💫", "✨"],
      bubbles: ["🫧", "🫧", "🔵", "🟣", "🫧"],
      notes: ["🎵", "🎶", "🎼", "🎹", "✨"],
      confetti: ["🎉", "🎊", "✨", "🎈", "🍬"],
    };

    const icons = symbols[effect] || symbols.stars;

    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        x: (i * 137.5) % 100, // percentage across width
        speed: 0.6 + ((i * 37) % 10) / 10,
        size: 24 + ((i * 47) % 28),
        icon: icons[i % icons.length],
        delay: (i * 15) % 90,
        wobbleFreq: 0.05 + ((i * 13) % 10) / 100,
        opacity: 0.6 + ((i * 29) % 4) / 10,
      });
    }
    return items;
  }, [effect]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => {
        const adjustedFrame = Math.max(0, frame - p.delay);
        const yOffset = (adjustedFrame * p.speed * 2) % (height + 150);
        const currentY = height + 50 - yOffset;
        const wobbleX = Math.sin(frame * p.wobbleFreq) * 20;

        const currentOpacity = interpolate(
          currentY,
          [0, 150, Math.max(151, height - 100), height],
          [0, p.opacity, p.opacity, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${currentY}px`,
              transform: `translateX(${wobbleX}px) rotate(${frame * (p.id % 2 === 0 ? 1 : -1) * 0.8}deg)`,
              fontSize: `${p.size}px`,
              opacity: currentOpacity,
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              userSelect: "none",
            }}
          >
            {p.icon}
          </div>
        );
      })}
    </div>
  );
};
