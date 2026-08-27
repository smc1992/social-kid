import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { AppSettings } from "@/types";

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data: Partial<AppSettings> = await req.json();
    const current = getSettings();
    const updated: AppSettings = {
      ...current,
      ...data,
    };
    const saved = saveSettings(updated);
    return NextResponse.json({ success: true, settings: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
