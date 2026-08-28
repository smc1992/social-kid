import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { Project, AppSettings } from "@/types";

const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
const DATA_DIR = isServerless ? path.join("/tmp", "social_kid_data") : path.join(process.cwd(), "data");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create data directory:", e);
}

const DB_PATH = path.join(DATA_DIR, "social_kid.db");
let db: any;
try {
  db = new Database(DB_PATH);
  // Initialize Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT,
      target_age TEXT,
      language TEXT,
      genre TEXT,
      mood TEXT,
      lyrics TEXT,
      audio_url TEXT,
      audio_duration REAL,
      aspect_ratio TEXT,
      caption_style TEXT,
      caption_font TEXT,
      particle_effect TEXT,
      raw_data TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
} catch (e) {
  console.warn("Database initialization fallback active:", e);
}

export function getAllProjects(): Project[] {
  try {
    const rows = db.prepare("SELECT raw_data FROM projects ORDER BY updated_at DESC").all() as { raw_data: string }[];
    return rows.map((row) => JSON.parse(row.raw_data));
  } catch (err) {
    console.error("Failed to read projects:", err);
    return [];
  }
}

export function getProjectById(id: string): Project | null {
  try {
    const row = db.prepare("SELECT raw_data FROM projects WHERE id = ?").get(id) as { raw_data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.raw_data);
  } catch (err) {
    console.error(`Failed to read project ${id}:`, err);
    return null;
  }
}

export function saveProject(project: Project): Project {
  try {
    const now = new Date().toISOString();
    const updatedProject = {
      ...project,
      updatedAt: now,
      createdAt: project.createdAt || now,
    };

    const stmt = db.prepare(`
      INSERT INTO projects (
        id, title, topic, target_age, language, genre, mood, lyrics, 
        audio_url, audio_duration, aspect_ratio, caption_style, caption_font, 
        particle_effect, raw_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        topic = excluded.topic,
        target_age = excluded.target_age,
        language = excluded.language,
        genre = excluded.genre,
        mood = excluded.mood,
        lyrics = excluded.lyrics,
        audio_url = excluded.audio_url,
        audio_duration = excluded.audio_duration,
        aspect_ratio = excluded.aspect_ratio,
        caption_style = excluded.caption_style,
        caption_font = excluded.caption_font,
        particle_effect = excluded.particle_effect,
        raw_data = excluded.raw_data,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      updatedProject.id,
      updatedProject.title,
      updatedProject.topic,
      updatedProject.targetAge,
      updatedProject.language,
      updatedProject.genre,
      updatedProject.mood,
      updatedProject.lyrics,
      updatedProject.audioUrl || null,
      updatedProject.audioDuration || 0,
      updatedProject.aspectRatio || "16:9",
      updatedProject.captionStyle || "bouncing-ball",
      updatedProject.captionFont || "Fredoka",
      updatedProject.particleEffect || "stars",
      JSON.stringify(updatedProject),
      updatedProject.createdAt,
      updatedProject.updatedAt
    );

    return updatedProject;
  } catch (err) {
    console.error("Failed to save project:", err);
    throw err;
  }
}

export function deleteProject(id: string): boolean {
  try {
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return result.changes > 0;
  } catch (err) {
    console.error(`Failed to delete project ${id}:`, err);
    return false;
  }
}

export function getSettings(): AppSettings {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get() as { value: string } | undefined;
    if (!row) {
      return {
        kieApiKey: process.env.KIE_API_KEY || "",
        replicateApiToken: process.env.REPLICATE_API_TOKEN || "",
        falApiKey: process.env.FAL_KEY || "",
        geminiApiKey: process.env.GEMINI_API_KEY || "",
        openaiApiKey: process.env.OPENAI_API_KEY || "",
        defaultMusicProvider: "kie-suno",
        defaultImageProvider: "fal-flux",
        defaultVideoQuality: "1080p",
        preferredLanguage: "de",
      };
    }
    return JSON.parse(row.value);
  } catch (err) {
    console.error("Failed to read settings:", err);
    return {
      kieApiKey: "",
      replicateApiToken: "",
      falApiKey: "",
      geminiApiKey: "",
      openaiApiKey: "",
      defaultMusicProvider: "kie-suno",
      defaultImageProvider: "fal-flux",
      defaultVideoQuality: "1080p",
      preferredLanguage: "de",
    };
  }
}

export function saveSettings(settings: AppSettings): AppSettings {
  try {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES ('app_config', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(JSON.stringify(settings));
    return settings;
  } catch (err) {
    console.error("Failed to save settings:", err);
    throw err;
  }
}
