import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { generateFluxImageFal } from "@/lib/services/falClient";
import { generateFluxImageReplicate } from "@/lib/services/replicateClient";
import { downloadAndSaveMedia } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { title, topic, visualStyle, customPrompt } = await req.json();
    const settings = getSettings();

    const safeTitle = title || "Fröhliches Kinderlied";
    const safeTopic = topic || "Abenteuer für Kinder";

    const prompt =
      customPrompt ||
      `Eye-catching YouTube video thumbnail for kids song "${safeTitle}". Vibrant 3D Pixar character smiling happily, holding colorful music notes, sparkling rainbow in background, ultra sharp focus, cinematic lighting, 8k resolution, bold colorful joyful atmosphere, 16:9 widescreen format.`;

    let remoteImageUrl = "";

    if (settings.falApiKey) {
      remoteImageUrl = await generateFluxImageFal({
        apiKey: settings.falApiKey,
        prompt,
        aspectRatio: "16:9",
      });
    } else if (settings.replicateApiToken) {
      remoteImageUrl = await generateFluxImageReplicate({
        apiToken: settings.replicateApiToken,
        prompt,
        aspectRatio: "16:9",
      });
    } else {
      // High-res demo thumbnail
      remoteImageUrl = "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1280&auto=format&fit=crop&q=80";
    }

    let localUrl = remoteImageUrl;
    try {
      if (remoteImageUrl.startsWith("http")) {
        localUrl = await downloadAndSaveMedia(remoteImageUrl, "youtube_thumbnail", "webp");
      }
    } catch (e) {
      console.warn("Could not cache thumbnail locally:", e);
    }

    return NextResponse.json({ success: true, thumbnailUrl: localUrl });
  } catch (error: any) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
