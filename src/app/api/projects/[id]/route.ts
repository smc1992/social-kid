import { NextResponse } from "next/server";
import { getProjectById, saveProject, deleteProject } from "@/lib/db";
import { Project } from "@/types";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const project = getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Projekt nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const existing = getProjectById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Projekt nicht gefunden" }, { status: 404 });
    }

    const updates: Partial<Project> = await req.json();
    const updatedProject: Project = {
      ...existing,
      ...updates,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = saveProject(updatedProject);
    return NextResponse.json({ success: true, project: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const success = deleteProject(params.id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
