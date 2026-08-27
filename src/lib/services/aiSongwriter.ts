import { MusicGenre, TargetAgeGroup, VisualStyle, YouTubeSEOData, Scene, VocalStyle } from "@/types";

export interface LyricsGeneratorOptions {
  topic: string;
  targetAge: TargetAgeGroup;
  genre: MusicGenre;
  mood: string;
  language: "de" | "en" | "es" | "fr";
  vocalStyle?: VocalStyle;
  customInstructions?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
}

export async function generateKidsLyrics(options: LyricsGeneratorOptions): Promise<{ title: string; lyrics: string }> {
  // If OpenAI key available, call OpenAI
  if (options.openaiApiKey) {
    try {
      return await callOpenAILyrics(options);
    } catch (e) {
      console.warn("OpenAI lyrics failed, falling back:", e);
    }
  }

  // If Gemini key available, call Gemini
  if (options.geminiApiKey) {
    try {
      return await callGeminiLyrics(options);
    } catch (e) {
      console.warn("Gemini lyrics failed, falling back:", e);
    }
  }

  // High quality procedural generator based on theme and language
  return generateProceduralLyrics(options);
}

async function callOpenAILyrics(options: LyricsGeneratorOptions): Promise<{ title: string; lyrics: string }> {
  const languageNames: Record<string, string> = {
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
  };

  const lang = languageNames[options.language] || "Deutsch";

  const prompt = `You are an award-winning children's songwriter.
Write a cheerful, catchy, and rhyming kids song in ${lang}.
Topic: ${options.topic}
Target age group: ${options.targetAge} years old
Music Genre: ${options.genre}
Mood: ${options.mood}
Vocal Style: ${options.vocalStyle || "sweet playful vocals"}
${options.customInstructions ? `Special Instructions: ${options.customInstructions}` : ""}

CRITICAL STRUCTURE REQUIREMENTS:
1. Use simple, joyful rhymes and an easy sing-along chorus.
2. Structure clearly with tags: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
3. Output on line 1: "TITEL: <Song Title>", then an empty line followed by the lyrics.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
    }),
  });

  if (!res.ok) throw new Error("OpenAI call failed");
  const data = await res.json();
  const text = data.choices[0]?.message?.content || "";

  const lines = text.split("\n");
  const titleLine = lines.find((l: string) => l.startsWith("TITEL:")) || "TITEL: " + options.topic;
  const title = titleLine.replace(/^TITEL:\s*/i, "").trim();
  const lyrics = lines.filter((l: string) => !l.startsWith("TITEL:")).join("\n").trim();

  return { title, lyrics };
}

async function callGeminiLyrics(options: LyricsGeneratorOptions): Promise<{ title: string; lyrics: string }> {
  const lang = options.language === "de" ? "Deutsch" : options.language === "en" ? "English" : options.language === "es" ? "Español" : "Français";
  const prompt = `Write a cheerful kids song in ${lang} about: ${options.topic}. Target age: ${options.targetAge}. Format: Line 1 "TITEL: <Title>", then [Verse 1], [Chorus], [Verse 2], [Chorus], [Outro].`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${options.geminiApiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!res.ok) throw new Error("Gemini call failed");
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const lines = text.split("\n");
  const titleLine = lines.find((l: string) => l.startsWith("TITEL:")) || "TITEL: " + options.topic;
  const title = titleLine.replace(/^TITEL:\s*/i, "").trim();
  const lyrics = lines.filter((l: string) => !l.startsWith("TITEL:")).join("\n").trim();

  return { title, lyrics };
}

function generateProceduralLyrics(options: LyricsGeneratorOptions): { title: string; lyrics: string } {
  const safeTopic = options.topic || "Fröhliche Kinder";

  if (options.language === "en") {
    return {
      title: `${safeTopic} - Fun Kids Song 🎵`,
      lyrics: `[Verse 1]
The morning sun is shining bright and clear,
We clap our hands and sing together here!
Jump on one foot and spin around with glee,
Come along and sing this song with me!

[Chorus]
${safeTopic}, having so much fun,
Dancing in the meadow underneath the sun!
One, two, three and four, sing it loud and clear,
Spreading joy and happiness to everyone right here!

[Verse 2]
Little birds are singing high up in the tree,
Making music happily for you and me!
Splashing through the puddles on a sunny day,
Laughing with our friends as we run and play!

[Chorus]
${safeTopic}, having so much fun,
Dancing in the meadow underneath the sun!
One, two, three and four, sing it loud and clear,
Spreading joy and happiness to everyone right here!

[Outro]
La la la la la, what a wonderful song,
Singing and smiling all day long!`,
    };
  }

  if (options.language === "es") {
    return {
      title: `${safeTopic} - Canción Infantil 🎵`,
      lyrics: `[Verse 1]
Sale el sol y el día va a empezar,
damos palmas todos juntos al cantar!
Salta en un pie y gira sin parar,
vamos todos juntos a bailar!

[Chorus]
${safeTopic}, qué felicidad,
cantando y jugando en la ciudad!
Uno, dos, tres, cuatro, ríe con amor,
esta es la canción con más color!

[Verse 2]
Los pajaritos cantan en la rama allá,
vamos a bailar al ritmo del compás!
Corre por el parque, salta con pasión,
todos juntos con el corazón!

[Chorus]
${safeTopic}, qué felicidad,
cantando y jugando en la ciudad!
Uno, dos, tres, cuatro, ríe con amor,
esta es la canción con más color!

[Outro]
La la la la la, qué día tan genial,
una linda fiesta sin igual!`,
    };
  }

  if (options.language === "fr") {
    return {
      title: `${safeTopic} - Chanson Pour Enfants 🎵`,
      lyrics: `[Verse 1]
Le soleil se lève, quelle belle journée,
frappons dans les mains pour tous chanter!
Saute sur un pied, tourne en rond joyeux,
viens avec nous pour être heureux!

[Chorus]
${safeTopic}, c'est si amusant,
on chante et on danse en rigolant!
Un, deux, trois et quatre, tous en harmonie,
c'est la plus jolie des mélodies!

[Verse 2]
Les petits oiseaux chantent dans les bois,
viens avec tes amis faire comme moi!
Saute dans les flaques, ris aux éclats,
tous ensemble au son de la musique là!

[Chorus]
${safeTopic}, c'est si amusant,
on chante et on danse en rigolant!
Un, deux, trois et quatre, tous en harmonie,
c'est la plus jolie des mélodies!

[Outro]
La la la la la, quelle belle chanson,
chantons tous ensemble à l'unisson!`,
    };
  }

  // Default German
  return {
    title: `${safeTopic} - Das Kinderlied 🎵`,
    lyrics: `[Verse 1]
Die Sonne geht auf und der Tag fängt an,
wir klatschen in die Hände, weil jeder mitmachen kann!
Hüpf auf einem Bein, dreh dich einmal um,
wir tanzen heut im Kreis herum!

[Chorus]
${safeTopic}, das macht riesen Spaß,
wir singen und wir springen über grünes Gras!
Lache laut, sing mit, eins zwei drei und vier,
die allerschönste Melodie spielen wir hier!

[Verse 2]
Vögel zwitschern laut in den Bäumen hoch,
hast du Lust zu tanzen? Komm, wir schaffen's noch!
Pitsche-patsche nass, durch die Pfützen springen,
lasst uns laut das Lieblingslied erklingen!

[Chorus]
${safeTopic}, das macht riesen Spaß,
wir singen und wir springen über grünes Gras!
Lache laut, sing mit, eins zwei drei und vier,
die allerschönste Melodie spielen wir hier!

[Outro]
La la la la la, der Tag war wunderschön,
wir freuen uns schon darauf, uns bald wiederzusehen!`,
  };
}

export function generateSceneBreakdownFromLyrics(
  lyrics: string,
  style: VisualStyle,
  duration: number = 60
): Partial<Scene>[] {
  const sections = lyrics.split(/\[(.*?)\]/).filter((s) => s.trim().length > 0);
  const rawScenes: { tag: string; content: string }[] = [];

  for (let i = 0; i < sections.length; i += 2) {
    const tag = sections[i] || `Scene ${Math.floor(i / 2) + 1}`;
    const content = (sections[i + 1] || "").trim();
    if (content) {
      rawScenes.push({ tag, content });
    }
  }

  if (rawScenes.length === 0) {
    rawScenes.push(
      { tag: "Verse 1", content: lyrics.slice(0, 100) },
      { tag: "Chorus", content: lyrics.slice(100, 200) },
      { tag: "Verse 2", content: lyrics.slice(200, 300) },
      { tag: "Outro", content: lyrics.slice(300) }
    );
  }

  const sceneDuration = duration / Math.max(1, rawScenes.length);
  const motions: Scene["motionType"][] = ["zoom-in", "pan-left", "zoom-out", "pan-right", "gentle-drift"];

  const stylePrompts: Record<VisualStyle, string> = {
    "pixar-3d": "3D Pixar Disney style render, ultra colorful, volumetric lighting, cute friendly cartoon characters, joyful vibrant atmosphere, 8k resolution, Unreal Engine 5 render style",
    "storybook-watercolor": "Charming children book watercolor illustration, soft pastel textures, warm fairytale ambiance, hand-painted details, whimsical storybook aesthetic",
    "cute-chibi-anime": "Cute chibi anime style, big expressive sparkling eyes, kawaii aesthetic, pastel rainbow colors, cheerful cartoon look",
    "vibrant-2d-cartoon": "Modern vibrant 2D vector cartoon, bold clean outlines, saturated cheerful colors, playful shapes, YouTube Kids show style",
    "claymation-craft": "Cute claymation stop-motion style, soft handmade plasticine textures, playful handcrafted look, warm soft lighting",
    "magical-fantasy": "Magical fantasy fairytale wonderland, glowing sparkles, whimsical dreamlike lighting, radiant pastel colors, enchanting scenery",
  };

  return rawScenes.map((item, idx) => {
    const startTime = Math.round(idx * sceneDuration * 10) / 10;
    const endTime = Math.round((idx + 1) * sceneDuration * 10) / 10;
    const firstLine = item.content.split("\n")[0] || item.content;

    const basePrompt = `Vibrant cute kids illustration of ${firstLine.slice(0, 80)}. ${stylePrompts[style] || stylePrompts["pixar-3d"]}`;

    return {
      id: `scene_${idx}_${Date.now()}`,
      index: idx,
      startTime,
      endTime,
      textSnippet: item.content,
      visualPrompt: basePrompt,
      style,
      status: "idle",
      motionType: motions[idx % motions.length],
      sfx: idx === 0 ? "sparkle" : idx === 2 ? "boing" : "none",
    };
  });
}

export function generateYouTubeSEO(
  title: string,
  topic: string,
  lyrics: string,
  targetAge: TargetAgeGroup
): YouTubeSEOData {
  return {
    title: `🎵 ${title} | Fröhliches Kinderlied zum Mitsingen & Tanzen (${targetAge} Jahre)`,
    description: `🎶 Sing mit uns! Ein wunderschönes und lehrreiches Kinderlied über "${topic}". 
Perfekt für Kindergarten, Vorschule und gemütliche Sing-Stunden zu Hause.

✨ Highlights:
- Bunte animierte Szenen
- Mit Karaoke-Untertiteln zum leichten Mitsingen
- Liebevoll gestaltet für Kinder von ${targetAge} Jahren

📝 Liedtext:
${lyrics}

🔔 Abonniere unseren Kanal für wöchentlich neue Kinderlieder & Abenteuer!
#Kinderlieder #Kindersongs #LiederZumMitsingen #KidsMusic #Kinderkanal`,
    tags: [
      "kinderlieder",
      "kindersongs",
      "lieder zum mitsingen",
      "kindergarten lieder",
      "schlaflieder",
      "nursery rhymes",
      "kids music video",
      "karaoke für kinder",
      topic.toLowerCase(),
    ],
    hashtags: ["#Kinderlieder", "#Kindersongs", "#LiederZumMitsingen", "#KidsAnimation"],
    thumbnailPrompt: `Eye-catching vibrant YouTube video thumbnail for kids song "${title}". High contrast colorful 3D Pixar character smiling excitedly, holding music notes, sparkling rainbow background, bright big playful text, 16:9 cinematic shot.`,
    targetKeywords: ["Kinderlieder 2026", "Lieder zum Mitsingen", "Kindermusik YouTube", topic],
  };
}
