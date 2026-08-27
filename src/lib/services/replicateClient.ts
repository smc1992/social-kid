/**
 * Replicate Client for Flux 1 Image Generation, Whisper Transcription & MiniMax Music
 */

import { CaptionLine, CaptionWord } from "@/types";

export interface ReplicateFluxImageParams {
  apiToken: string;
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: "flux-schnell" | "flux-dev";
}

export async function generateFluxImageReplicate(
  params: ReplicateFluxImageParams
): Promise<string> {
  if (!params.apiToken) {
    throw new Error("Replicate API Token fehlt. Bitte in den Einstellungen hinterlegen.");
  }

  const modelVersion =
    params.model === "flux-dev"
      ? "black-forest-labs/flux-dev"
      : "black-forest-labs/flux-schnell";

  const res = await fetch("https://api.replicate.com/v1/models/" + modelVersion + "/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio || "16:9",
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Replicate Image Fehler (${res.status}): ${errorText}`);
  }

  const data = await res.json();

  if (data.status === "succeeded" && data.output) {
    return Array.isArray(data.output) ? data.output[0] : data.output;
  }

  // If still processing, poll prediction
  if (data.id) {
    return await pollReplicatePrediction(params.apiToken, data.id);
  }

  throw new Error("Fehler beim Erzeugen des Bildes über Replicate.");
}

async function pollReplicatePrediction(apiToken: string, predictionId: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === "succeeded" && data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }
    if (data.status === "failed") {
      throw new Error(`Bildgenerierung fehlgeschlagen: ${data.error}`);
    }
  }
  throw new Error("Zeitüberschreitung bei der Bildgenerierung auf Replicate.");
}

/**
 * Transcribe song with Whisper to obtain precise word-level start and end timestamps
 */
export async function transcribeWhisperWordTimestamps(
  apiToken: string,
  audioUrl: string
): Promise<CaptionLine[]> {
  if (!apiToken) {
    throw new Error("Replicate API Token für Whisper benötigt.");
  }

  const res = await fetch("https://api.replicate.com/v1/models/vaibhavs10/incredibly-fast-whisper/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        audio: audioUrl,
        task: "transcribe",
        timestamp: "word",
        batch_size: 24,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Whisper Alignment Fehler (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  let output = data.output;

  if (!output && data.id) {
    // Poll
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData.status === "succeeded") {
          output = pollData.output;
          break;
        }
      }
    }
  }

  if (!output) {
    throw new Error("Keine Whisper-Transkription erhalten.");
  }

  // Parse Whisper chunks into structured CaptionLines with CaptionWords
  const chunks = output.chunks || [];
  const lines: CaptionLine[] = [];
  let currentWords: CaptionWord[] = [];
  let lineStart = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const wordText = (chunk.text || "").trim();
    const timestamps = chunk.timestamp || [0, 0];
    const start = Number(timestamps[0]) || 0;
    const end = Number(timestamps[1]) || start + 0.4;

    if (currentWords.length === 0) {
      lineStart = start;
    }

    currentWords.push({
      id: `w_${i}_${Date.now()}`,
      word: wordText,
      start,
      end,
    });

    // Create line break after 4-6 words or long pause
    const isPunctuation = wordText.endsWith(".") || wordText.endsWith("!") || wordText.endsWith("?") || wordText.endsWith(",");
    if (currentWords.length >= 6 || (isPunctuation && currentWords.length >= 3) || i === chunks.length - 1) {
      const lineText = currentWords.map((w) => w.word).join(" ");
      lines.push({
        id: `line_${lines.length}_${Date.now()}`,
        text: lineText,
        start: lineStart,
        end: end,
        words: [...currentWords],
      });
      currentWords = [];
    }
  }

  return lines;
}
