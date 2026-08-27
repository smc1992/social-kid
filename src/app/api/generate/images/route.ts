import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { generateFluxImageFal } from "@/lib/services/falClient";
import { generateFluxImageReplicate } from "@/lib/services/replicateClient";
import { downloadAndSaveMedia } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio, provider } = await req.json();
    const settings = getSettings();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt fehlt." }, { status: 400 });
    }

    let remoteImageUrl = "";

    // Determine provider: Fal.ai or Replicate
    const chosenProvider = provider || settings.defaultImageProvider || (settings.falApiKey ? "fal-flux" : "replicate-flux");

    if (chosenProvider === "fal-flux" && settings.falApiKey) {
      remoteImageUrl = await generateFluxImageFal({
        apiKey: settings.falApiKey,
        prompt,
        aspectRatio: aspectRatio || "16:9",
      });
    } else if (settings.replicateApiToken) {
      remoteImageUrl = await generateFluxImageReplicate({
        apiToken: settings.replicateApiToken,
        prompt,
        aspectRatio: aspectRatio || "16:9",
      });
    } else if (settings.falApiKey) {
      remoteImageUrl = await generateFluxImageFal({
        apiKey: settings.falApiKey,
        prompt,
        aspectRatio: aspectRatio || "16:9",
      });
    } else {
      // Demo fallback high-quality imagery
      const fallbackImages = [
        "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80",
      ];
      remoteImageUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    }

    // Save image locally for reliable fast rendering
    let localImageUrl = remoteImageUrl;
    try {
      if (remoteImageUrl.startsWith("http")) {
        localImageUrl = await downloadAndSaveMedia(remoteImageUrl, "scene_flux", "webp");
      }
    } catch (e) {
      console.warn("Could not cache image locally, using remote:", e);
    }

    return NextResponse.json({ success: true, imageUrl: localImageUrl });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
