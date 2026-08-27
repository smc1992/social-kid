import fs from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export async function downloadAndSaveMedia(url: string, filenamePrefix: string, extension: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from ${url}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const uniqueName = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(MEDIA_DIR, uniqueName);

    fs.writeFileSync(filePath, buffer);
    return `/media/${uniqueName}`;
  } catch (error) {
    console.error("Error downloading media:", error);
    // If it's a data URL or external URL that fails, fallback to original or throw
    return url;
  }
}

export async function saveBase64Media(base64Data: string, filenamePrefix: string, extension: string): Promise<string> {
  try {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const uniqueName = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(MEDIA_DIR, uniqueName);

    fs.writeFileSync(filePath, buffer);
    return `/media/${uniqueName}`;
  } catch (error) {
    console.error("Error saving base64 media:", error);
    throw error;
  }
}
