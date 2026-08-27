import React from "react";
import { Composition } from "remotion";
import { KidsSongComposition } from "./KidsSongComposition";
import { SAMPLE_PROJECTS } from "@/lib/services/mockData";

export const RemotionRoot: React.FC = () => {
  const sample = SAMPLE_PROJECTS[0];

  return (
    <>
      <Composition<any, any>
        id="KidsSong16x9"
        component={KidsSongComposition as any}
        durationInFrames={Math.round((sample.audioDuration || 42) * 30)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: sample.title,
          audioUrl: sample.audioUrl,
          audioDuration: sample.audioDuration,
          scenes: sample.scenes,
          captions: sample.captions,
          aspectRatio: "16:9",
          captionStyle: sample.captionStyle,
          captionFont: sample.captionFont,
          particleEffect: sample.particleEffect,
        }}
      />
      <Composition<any, any>
        id="KidsSong9x16"
        component={KidsSongComposition as any}
        durationInFrames={Math.round((sample.audioDuration || 42) * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: sample.title,
          audioUrl: sample.audioUrl,
          audioDuration: sample.audioDuration,
          scenes: sample.scenes,
          captions: sample.captions,
          aspectRatio: "9:16",
          captionStyle: sample.captionStyle,
          captionFont: sample.captionFont,
          particleEffect: sample.particleEffect,
        }}
      />
    </>
  );
};
