import { Daydream } from "@daydreamlive/sdk";
import { NextResponse } from "next/server";

const daydream = new Daydream({
  bearer: process.env.DAYDREAM_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.DAYDREAM_API_KEY) {
    return NextResponse.json(
      { error: "DAYDREAM_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt =
      typeof body.prompt === "string" ? body.prompt : "anime character";
    const modelId =
      typeof body.modelId === "string"
        ? body.modelId
        : "stabilityai/sdxl-turbo";
    const negativePrompt =
      typeof body.negativePrompt === "string" ? body.negativePrompt : undefined;

    const stream = await daydream.streams.create({
      pipeline: "streamdiffusion",
      params: {
        modelId,
        prompt,
        ...(negativePrompt && { negativePrompt }),
      },
    });

    return NextResponse.json({
      id: stream.id,
      whipUrl: stream.whipUrl,
      playbackId: stream.outputPlaybackId,
      playbackUrl: `https://lvpr.tv/?v=${stream.outputPlaybackId}`,
    });
  } catch (err) {
    console.error("Create stream error:", err);
    const message = err instanceof Error ? err.message : "Failed to create stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
