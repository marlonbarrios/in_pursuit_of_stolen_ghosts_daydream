import { NextResponse } from "next/server";

const DAYDREAM_API_BASE = "https://api.daydream.live/v1";

/**
 * Re-apply prompt and negative prompt to an existing stream (PATCH).
 * Use when the stream has drifted so the aesthetic stays anchored without creating a new stream.
 */
export async function POST(request: Request) {
  const apiKey = process.env.DAYDREAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DAYDREAM_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const streamId = typeof body.streamId === "string" ? body.streamId.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const negativePrompt =
      typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";

    if (!streamId || !prompt) {
      return NextResponse.json(
        { error: "streamId and prompt are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${DAYDREAM_API_BASE}/streams/${streamId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        params: {
          prompt,
          negative_prompt: negativePrompt,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Daydream PATCH error:", res.status, data);
      return NextResponse.json(
        { error: data?.error ?? "Failed to update stream" },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Anchor stream error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to re-apply prompt" },
      { status: 500 }
    );
  }
}
