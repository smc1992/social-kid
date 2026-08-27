/**
 * Kie.ai Client for Suno AI Music Generation
 * Official API Base: https://api.kie.ai
 */

export interface KieGenerateMusicParams {
  apiKey: string;
  prompt: string; // Style, mood, instruments, e.g. "cheerful upbeat kids pop, playful melody, children vocals"
  lyrics: string; // Full structured lyrics with [Verse], [Chorus]
  title: string;
  instrumental?: boolean;
  model?: "v4" | "v4.5" | "v5" | "v5.5";
  callBackUrl?: string;
}

export interface KieMusicTaskResult {
  taskId: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  audioUrl?: string;
  duration?: number;
  title?: string;
  imageUrl?: string;
  error?: string;
}

export async function startKieSunoMusicGeneration(
  params: KieGenerateMusicParams
): Promise<{ taskId: string; message?: string }> {
  if (!params.apiKey) {
    throw new Error("Kie.ai API-Key fehlt. Bitte in den Einstellungen eintragen.");
  }

  const endpoint = "https://api.kie.ai/api/v1/generate";

  const payload = {
    prompt: params.lyrics || params.prompt,
    tags: params.prompt,
    title: params.title,
    make_instrumental: !!params.instrumental,
    mv: params.model || "v5",
    callBackUrl: params.callBackUrl,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kie.ai API Fehler (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  // Kie.ai typically returns { code: 200, data: { taskId: "..." } } or direct { taskId: "..." }
  const taskId = data.data?.taskId || data.taskId || data.id;

  if (!taskId) {
    throw new Error("Keine Task-ID von Kie.ai erhalten.");
  }

  return { taskId, message: "Musik-Generierung gestartet" };
}

export async function pollKieSunoTask(
  apiKey: string,
  taskId: string
): Promise<KieMusicTaskResult> {
  if (!apiKey) {
    throw new Error("Kie.ai API-Key erforderlich.");
  }

  const endpoint = `https://api.kie.ai/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kie.ai Status-Fehler (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const taskData = data.data || data;

  const rawStatus = (taskData.status || taskData.state || "").toUpperCase();

  let status: KieMusicTaskResult["status"] = "PENDING";
  if (rawStatus.includes("SUCCESS") || rawStatus.includes("COMPLETE") || taskData.audio_url) {
    status = "SUCCESS";
  } else if (rawStatus.includes("FAIL") || rawStatus.includes("ERROR")) {
    status = "FAILED";
  } else if (rawStatus.includes("PROCESS") || rawStatus.includes("RUN")) {
    status = "PROCESSING";
  }

  return {
    taskId,
    status,
    audioUrl: taskData.audio_url || taskData.audioUrl || taskData.clip_url || (taskData.clips && taskData.clips[0]?.audio_url),
    duration: taskData.duration || 60,
    title: taskData.title,
    imageUrl: taskData.image_url || taskData.imageUrl,
    error: taskData.error_message || taskData.errorMessage,
  };
}
