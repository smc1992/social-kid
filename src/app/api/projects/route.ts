import { NextResponse } from "next/server";
import { getAllProjects, saveProject } from "@/lib/db";
import { SAMPLE_PROJECTS } from "@/lib/services/mockData";
import { Project } from "@/types";

export async function GET() {
  try {
    let projects = getAllProjects();
    if (projects.length === 0) {
      // Seed initial demo project
      for (const sample of SAMPLE_PROJECTS) {
        saveProject(sample);
      }
      projects = getAllProjects();
    }
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data: Partial<Project> = await req.json();
    if (!data.id) {
      data.id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    if (!data.title) {
      data.title = "Neuer Kindersong";
    }

    const project: Project = {
      id: data.id,
      title: data.title,
      topic: data.topic || "",
      targetAge: data.targetAge || "4-6",
      language: data.language || "de",
      genre: data.genre || "catchy-pop",
      vocalStyle: data.vocalStyle || "female-sweet",
      mood: data.mood || "Fröhlich",
      lyrics: data.lyrics || "",
      audioUrl: data.audioUrl,
      audioDuration: data.audioDuration || 0,
      audioTrimStart: data.audioTrimStart,
      audioTrimEnd: data.audioTrimEnd,
      tracks: data.tracks || [],
      selectedTrackId: data.selectedTrackId,
      scenes: data.scenes || [],
      captions: data.captions || [],
      aspectRatio: data.aspectRatio || "16:9",
      captionStyle: data.captionStyle || "bouncing-ball",
      captionFont: data.captionFont || "Fredoka",
      particleEffect: data.particleEffect || "stars",
      transitionEffect: data.transitionEffect || "smooth-crossfade",
      channelName: data.channelName || "Social Kid",
      showWatermark: data.showWatermark ?? true,
      showSubscribeOutro: data.showSubscribeOutro ?? true,
      thumbnailUrl: data.thumbnailUrl,
      youtubeSeo: data.youtubeSeo,
      renderedVideoUrl: data.renderedVideoUrl,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveProject(project);
    return NextResponse.json({ success: true, project: saved });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
