import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export interface AISummaryResult {
  title: string;
  summary: string;
  components: string[];
  insights: string[];
  rawMarkdown: string;
}

const SYSTEM_PROMPT = `You are a Principal Software Architect and Visual Analyst specializing in collaborative whiteboards and system design diagrams.
You will be given an image of a whiteboard or canvas that may contain shapes, arrows, text labels, flowcharts, architecture diagrams, wireframes, or freehand drawings.

Analyze the image and respond with ONLY valid JSON matching this exact schema (no extra prose, no markdown fences):
{
  "title": "A concise descriptive title for what this board depicts",
  "summary": "A 2-3 sentence executive overview of the board's purpose and content",
  "components": ["List of identified nodes, services, actors, or components visible"],
  "insights": ["Observation 1 about the diagram structure or flow", "Observation 2 about missing connections or improvements"]
}

Rules:
- If the board is blank or has no meaningful content, set title to "Empty Board" and summary to "No elements detected."
- components and insights must be arrays of plain strings — no nested objects.
- Keep insights practical and specific to what you observe.
- Do not mention you are an AI or refer to the image format.`;

/**
 * Sends an offscreen board PNG (as base64 data URL) to Gemini 2.0 Flash
 * vision model and returns a structured summary.
 */
export async function summarizeBoardVision(
  base64DataUrl: string,
  boardTitle?: string,
): Promise<AISummaryResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  // Strip the data URL prefix ("data:image/png;base64,") — Gemini wants raw base64
  const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");

  const userText = boardTitle
    ? `Analyze this collaborative whiteboard titled "${boardTitle}".`
    : "Analyze this collaborative whiteboard.";

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          { text: userText },
        ],
      },
    ],
  });

  const rawText = response.text?.trim() ?? "";

  // Parse the JSON response — strip any accidental markdown fences
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Omit<AISummaryResult, "rawMarkdown">;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: if model didn't return clean JSON, wrap the raw text
    parsed = {
      title: boardTitle ?? "Board Analysis",
      summary: rawText,
      components: [],
      insights: [],
    };
  }

  // Build a human-readable markdown version for the frontend drawer
  const rawMarkdown = [
    `## ${parsed.title}`,
    "",
    parsed.summary,
    "",
    "### Identified Components",
    ...(parsed.components?.length
      ? parsed.components.map((c) => `- ${c}`)
      : ["- None identified"]),
    "",
    "### Insights & Observations",
    ...(parsed.insights?.length
      ? parsed.insights.map((i) => `- ${i}`)
      : ["- No specific observations"]),
  ].join("\n");

  return {
    title: parsed.title ?? "Board Analysis",
    summary: parsed.summary ?? "",
    components: parsed.components ?? [],
    insights: parsed.insights ?? [],
    rawMarkdown,
  };
}
