import { NextResponse } from "next/server";
import { generateSceneBreakdownFromLyrics } from "@/lib/services/aiSongwriter";
import { VisualStyle } from "@/types";

export async function POST(req: Request) {
  try {
    const { lyrics, style, duration } = await req.json();

    if (!lyrics) {
      return NextResponse.json({ success: false, error: "Lyrics fehlen." }, { status: 400 });
    }

    const scenes = generateSceneBreakdownFromLyrics(
      lyrics,
      (style as VisualStyle) || "pixar-3d",
      duration || 60
    );

    return NextResponse.json({ success: true, scenes });
  } catch (error: any) {
    console.error("Scene breakdown error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
