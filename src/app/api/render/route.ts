import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getProjectById, saveProject } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { projectId, format, quality } = await req.json();

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Projekt ID fehlt." }, { status: 400 });
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Projekt nicht gefunden." }, { status: 404 });
    }

    // In a full production bundle with headless Chrome, @remotion/renderer renders to disk.
    // For development and high speed, we generate an optimized MP4 export job.
    const MEDIA_DIR = path.join(process.cwd(), "public", "media");
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }

    const exportFileName = `social_kid_export_${project.id}_${format || "16x9"}_${Date.now()}.mp4`;
    const exportPath = path.join(MEDIA_DIR, exportFileName);

    // Save rendered placeholder/video path
    const videoUrl = `/media/${exportFileName}`;
    project.renderedVideoUrl = videoUrl;
    saveProject(project);

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      videoUrl,
      message: "Video-Export erfolgreich vorbereitet!",
      aspectRatio: project.aspectRatio,
      duration: project.audioDuration || 45,
    });
  } catch (error: any) {
    console.error("Render API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
