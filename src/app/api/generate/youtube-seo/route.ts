import { NextResponse } from "next/server";
import { generateYouTubeSEO } from "@/lib/services/aiSongwriter";
import { TargetAgeGroup } from "@/types";

export async function POST(req: Request) {
  try {
    const { title, topic, lyrics, targetAge } = await req.json();

    const seoData = generateYouTubeSEO(
      title || "Fröhliches Kinderlied",
      topic || "Spaß und Abenteuer",
      lyrics || "",
      (targetAge as TargetAgeGroup) || "4-6"
    );

    return NextResponse.json({ success: true, seo: seoData });
  } catch (error: any) {
    console.error("YouTube SEO error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
