/**
 * Fal.ai Client for ultra-fast Flux 1 [schnell] Image Generation
 */

export interface FalFluxImageParams {
  apiKey: string;
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  numInferenceSteps?: number;
}

export async function generateFluxImageFal(
  params: FalFluxImageParams
): Promise<string> {
  if (!params.apiKey) {
    throw new Error("Fal.ai API-Key fehlt. Bitte in den Einstellungen eintragen.");
  }

  const endpoint = "https://fal.run/fal-ai/flux/schnell";

  const imageSizeMap = {
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
    "1:1": "square_hd",
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: params.prompt,
      image_size: imageSizeMap[params.aspectRatio || "16:9"] || "landscape_16_9",
      num_inference_steps: params.numInferenceSteps || 4,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fal.ai Fehler (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.images && data.images.length > 0 && data.images[0].url) {
    return data.images[0].url;
  }

  throw new Error("Keine Bild-URL von Fal.ai erhalten.");
}
