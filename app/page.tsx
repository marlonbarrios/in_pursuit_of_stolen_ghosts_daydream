"use client";

import { useState } from "react";
import StreamDemo from "./StreamDemo";

type StreamData = {
  id: string;
  whipUrl: string;
  playbackId: string;
  playbackUrl: string;
};

type PromptPreset = {
  name: string;
  prompt: string;
  negativePrompt?: string;
};

const PROMPT_PRESETS: PromptPreset[] = [
  {
    name: "Bauhaus time traveler",
    prompt:
      "A man of color from the future, Black or Brown or Indigenous, diverse, not white, arms close to the face, spectacular architectural goggles and hats, solid geometries, Mondrian colors only — red, yellow, blue, black, white — Bauhaus and Kandinsky style, Calder-inspired haute couture, Bauhaus-style geometric architectural goggles, very architectural fashion, rich luminous atmospheric background with depth, full environment, no subject extraction, no dark or flat background",
    negativePrompt:
      "dark background, black background, flat background, subject extraction, isolated subject on plain background, solid color background, empty background, low contrast background",
  },
  {
    name: "Oil painting portrait",
    prompt: "oil painting portrait, classical",
  },
  {
    name: "Cyberpunk",
    prompt: "cyberpunk portrait, neon lights",
  },
];

export default function Page() {
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [negativePrompt, setNegativePrompt] = useState<string>(
    PROMPT_PRESETS[0].negativePrompt ?? ""
  );

  const handleCreateStream = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          ...(negativePrompt && { negativePrompt }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create stream");
      setStreamData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (streamData) {
    return (
      <main className="page">
        <header className="page-header">
          <h1>Bauhaus Time Traveler</h1>
          <p className="subtitle">
            prompt: “{prompt}”
          </p>
        </header>
        <StreamDemo whipUrl={streamData.whipUrl} />
        <p className="playback-hint">
          You can also watch at:{" "}
          <a href={streamData.playbackUrl} target="_blank" rel="noopener noreferrer">
            {streamData.playbackUrl}
          </a>
        </p>
        <footer className="app-footer">
          <p>Concept, Programming, Music, and Performance by Marlon Barrios-Holano</p>
          <p className="powered">Powered by <a href="https://daydream.live" target="_blank" rel="noopener noreferrer">Daydream</a></p>
        </footer>
      </main>
    );
  }

  return (
    <main className="page page-start">
      <header className="page-header">
        <h1>Bauhaus Time Traveler</h1>
        <p className="subtitle">
          Real-time AI video. Transform your webcam with Stream Diffusion.
        </p>
      </header>
      <div className="start-form">
        <label className="start-label">
          <span>Style preset</span>
          <select
            className="start-select"
            value={
              PROMPT_PRESETS.find((p) => p.prompt === prompt)?.name ?? "Custom"
            }
            onChange={(e) => {
              const preset = PROMPT_PRESETS.find((p) => p.name === e.target.value);
              if (preset) {
                setPrompt(preset.prompt);
                setNegativePrompt(
                  "negativePrompt" in preset && typeof preset.negativePrompt === "string"
                    ? preset.negativePrompt
                    : ""
                );
              }
            }}
          >
            <option value="Custom">Custom</option>
            {PROMPT_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="start-label">
          <span>Prompt (edit if you like)</span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the transformation style…"
            className="start-input"
          />
        </label>
        <label className="start-label">
          <span>Negative prompt (optional — what to avoid)</span>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="e.g. dark background, blurry, flat"
            className="start-input"
          />
        </label>
        <button
          type="button"
          onClick={handleCreateStream}
          disabled={loading}
          className="btn-create"
        >
          {loading ? "Creating stream…" : "Start stream"}
        </button>
      </div>
      {error && <p className="page-error">{error}</p>}
      <footer className="app-footer">
        <p>Concept, Programming, Music, and Performance by Marlon Barrios-Holano</p>
        <p className="powered">Powered by <a href="https://daydream.live" target="_blank" rel="noopener noreferrer">Daydream</a></p>
      </footer>
    </main>
  );
}
