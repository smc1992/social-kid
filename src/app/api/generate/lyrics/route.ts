import { NextResponse } from "next/server";
import { generateKidsLyrics } from "@/lib/services/aiSongwriter";
import { getSettings } from "@/lib/db";
import { MusicGenre, TargetAgeGroup } from "@/types";

export async function POST(req: Request) {
  try {
    const { topic, targetAge, genre, mood, language, customInstructions } = await req.json();
    const settings = getSettings();

    const result = await generateKidsLyrics({
      topic: topic || "Tiere auf dem Bauernhof",
      targetAge: (targetAge as TargetAgeGroup) || "4-6",
      genre: (genre as MusicGenre) || "catchy-pop",
      mood: mood || "Fröhlich",
      language: language || settings.preferredLanguage || "de",
      customInstructions,
      geminiApiKey: settings.geminiApiKey,
      openaiApiKey: settings.openaiApiKey,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Lyrics generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
