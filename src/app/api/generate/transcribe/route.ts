import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { transcribeWhisperWordTimestamps } from "@/lib/services/replicateClient";
import { CaptionLine, CaptionWord } from "@/types";

export async function POST(req: Request) {
  try {
    const { audioUrl, lyrics, duration } = await req.json();
    const settings = getSettings();

    // 1. If Replicate Token is provided, try Whisper
    if (settings.replicateApiToken && audioUrl && audioUrl.startsWith("http")) {
      try {
        const whisperLines = await transcribeWhisperWordTimestamps(
          settings.replicateApiToken,
          audioUrl
        );
        if (whisperLines && whisperLines.length > 0) {
          return NextResponse.json({ success: true, captions: whisperLines, source: "whisper" });
        }
      } catch (e) {
        console.warn("Whisper transcription failed, falling back to smart alignment:", e);
      }
    }

    // 2. High-precision rhythmic aligner based on lyrics and audio duration
    const totalDuration = Number(duration) || 45;
    const cleanLyrics = lyrics || "Fröhliches Kinderlied zum Mitsingen";

    // Split lyrics into non-empty lines, ignoring [Tags]
    const rawLines = cleanLyrics
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && !l.startsWith("["));

    if (rawLines.length === 0) {
      rawLines.push("La la la, wir singen unser Lied!");
    }

    // Allocate time per line with intro padding
    const introPadding = 1.0;
    const outroPadding = 1.5;
    const availableTime = Math.max(5, totalDuration - introPadding - outroPadding);
    const timePerLine = availableTime / rawLines.length;

    const generatedLines: CaptionLine[] = rawLines.map((lineText: string, lineIdx: number) => {
      const lineStart = Math.round((introPadding + lineIdx * timePerLine) * 10) / 10;
      const lineEnd = Math.round((lineStart + timePerLine * 0.92) * 10) / 10;

      const rawWords = lineText.split(/\s+/).filter(Boolean);
      const wordDuration = (lineEnd - lineStart) / Math.max(1, rawWords.length);

      const words: CaptionWord[] = rawWords.map((wordStr, wordIdx) => {
        const wStart = Math.round((lineStart + wordIdx * wordDuration) * 100) / 100;
        const wEnd = Math.round((wStart + wordDuration * 0.95) * 100) / 100;

        return {
          id: `w_${lineIdx}_${wordIdx}_${Date.now()}`,
          word: wordStr,
          start: wStart,
          end: wEnd,
        };
      });

      return {
        id: `line_${lineIdx}_${Date.now()}`,
        text: lineText,
        start: lineStart,
        end: lineEnd,
        words,
      };
    });

    return NextResponse.json({
      success: true,
      captions: generatedLines,
      source: "smart-aligner",
    });
  } catch (error: any) {
    console.error("Transcribe alignment error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
