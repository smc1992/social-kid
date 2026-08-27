import { NextResponse } from "next/server";
import { startKieSunoMusicGeneration, pollKieSunoTask } from "@/lib/services/kieClient";
import { getSettings } from "@/lib/db";
import { downloadAndSaveMedia } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { action, taskId, prompt, lyrics, title, instrumental, model, provider } = await req.json();
    const settings = getSettings();

    // 1. Polling existing task
    if (action === "poll") {
      if (!taskId) {
        return NextResponse.json({ success: false, error: "Task ID fehlt." }, { status: 400 });
      }

      const result = await pollKieSunoTask(settings.kieApiKey, taskId);

      // If finished, cache audio locally to avoid remote link expiration
      if (result.status === "SUCCESS" && result.audioUrl) {
        try {
          const localAudioUrl = await downloadAndSaveMedia(result.audioUrl, "suno_song", "mp3");
          return NextResponse.json({
            success: true,
            result: {
              ...result,
              audioUrl: localAudioUrl,
            },
          });
        } catch (e) {
          console.warn("Could not cache audio locally, using remote URL:", e);
        }
      }

      return NextResponse.json({ success: true, result });
    }

    // 2. Starting new music generation
    if (action === "start" || !action) {
      if (!settings.kieApiKey) {
        return NextResponse.json(
          {
            success: false,
            error: "Kie.ai API-Key nicht hinterlegt. Bitte in den Einstellungen eintragen.",
          },
          { status: 400 }
        );
      }

      const cleanPrompt = prompt || "cheerful upbeat children song, happy catchy melody, playful kids vocals, nursery rhythm, joyful acoustic instruments";
      const startResult = await startKieSunoMusicGeneration({
        apiKey: settings.kieApiKey,
        prompt: cleanPrompt,
        lyrics: lyrics || "",
        title: title || "Kindersong",
        instrumental: !!instrumental,
        model: model || "v5",
      });

      return NextResponse.json({ success: true, ...startResult });
    }

    return NextResponse.json({ success: false, error: "Ungültige Aktion" }, { status: 400 });
  } catch (error: any) {
    console.error("Music generation API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
