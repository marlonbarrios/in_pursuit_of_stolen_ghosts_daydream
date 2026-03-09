"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBroadcast, usePlayer } from "@daydreamlive/react";
import DrawCanvas, { type DrawCanvasRef } from "./DrawCanvas";

const TRACK_URL = "/track.mp3";
// Sample the drawing canvas this often (fps) so the stream gets near real-time frames (~10ms between frames).
const CANVAS_CAPTURE_FPS = 100;

type StreamDemoProps = {
  whipUrl: string;
  streamId: string;
  prompt: string;
  negativePrompt: string;
};

export default function StreamDemo({ whipUrl, streamId, prompt, negativePrompt }: StreamDemoProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawCanvasRef = useRef<DrawCanvasRef | null>(null);

  const handleReapplyPrompt = useCallback(async () => {
    setAnchoring(true);
    try {
      const res = await fetch("/api/anchor-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId,
          prompt: prompt.trim(),
          negativePrompt: (negativePrompt ?? "").trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to re-apply prompt");
      }
    } finally {
      setAnchoring(false);
    }
  }, [streamId, prompt, negativePrompt]);

  const broadcast = useBroadcast({
    whipUrl,
    reconnect: { enabled: true },
  });

  const whepUrl =
    broadcast.status.state === "live" ? broadcast.status.whepUrl : null;
  const player = usePlayer({
    whepUrl,
    autoPlay: true,
    reconnect: { enabled: true },
  });

  // Start the playback client when we get the WHEP URL from the broadcast.
  // The hook does not auto-connect when whepUrl is set; we must call play().
  useEffect(() => {
    if (whepUrl) {
      player.play();
    }
  }, [whepUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- we only want to run when whepUrl is set

  const toggleTrack = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(TRACK_URL);
      audioRef.current = audio;
      audio.addEventListener("play", () => setIsTrackPlaying(true));
      audio.addEventListener("pause", () => setIsTrackPlaying(false));
      audio.addEventListener("ended", () => setIsTrackPlaying(false));
      audio.play();
    } else {
      if (isTrackPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  }, [isTrackPlaying]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        toggleTrack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleTrack]);

  const toggleFullscreen = useCallback(() => {
    const videoEl = player.videoRef.current;
    if (!videoEl) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoEl.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        const target = e.target as Node;
        if (target && "closest" in target && (target as Element).closest?.("input, textarea, select")) return;
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  const handleStart = useCallback(async () => {
    if (!drawCanvasRef.current) return;
    const stream = drawCanvasRef.current.captureStream(CANVAS_CAPTURE_FPS);
    setLocalStream(stream);
    await broadcast.start(stream);
  }, [broadcast]);

  const handleStop = useCallback(() => {
    broadcast.stop();
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
  }, [broadcast, localStream]);

  const toggleDrawStream = useCallback(() => {
    if (broadcast.status.state === "live") {
      handleStop();
    } else {
      handleStart();
    }
  }, [broadcast.status.state, handleStart, handleStop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") {
        const target = e.target as Node;
        if (target && "closest" in target && (target as Element).closest?.("input, textarea, select")) return;
        e.preventDefault();
        toggleDrawStream();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleDrawStream]);

  const isBroadcastLive = broadcast.status.state === "live";
  const isPlayerPlaying = player.status.state === "playing";
  const isStreaming = isBroadcastLive && isPlayerPlaying;

  const broadcastStatusLabel =
    broadcast.status.state === "connecting"
      ? "Sending drawing…"
      : broadcast.status.state === "live"
        ? "Drawing streaming"
        : broadcast.status.state === "reconnecting"
          ? "Reconnecting…"
          : broadcast.status.state === "error"
            ? "Error"
            : broadcast.status.state === "ended"
              ? "Ended"
              : "Not started";

  const playerStatusLabel =
    player.status.state === "connecting"
      ? "Connecting to AI…"
      : player.status.state === "playing"
        ? "AI output live"
        : player.status.state === "buffering"
          ? "Buffering…"
          : player.status.state === "error"
            ? "Error"
            : player.status.state === "ended"
              ? "Ended"
              : "Waiting for stream";

  return (
    <div className="stream-demo">
      {isStreaming && (
        <div className="stream-demo-live-badge stream-demo-live-badge-top" role="status" aria-live="polite">
          <span className="stream-demo-live-dot" />
          Streaming — AI is processing your video
        </div>
      )}
      <div className="stream-demo-videos">
        <div className="stream-demo-panel">
          <h3>Your drawing</h3>
          <DrawCanvas
            canvasRef={drawCanvasRef}
            className="stream-demo-draw-box"
            onFirstDraw={() => {
              if (broadcast.status.state !== "live") {
                handleStart();
              }
            }}
          />
        </div>
        <div className="stream-demo-panel">
          <h3>AI output (Stream Diffusion)</h3>
          <video
            ref={player.videoRef as React.RefObject<HTMLVideoElement>}
            autoPlay
            playsInline
            muted
            className="stream-demo-video-box"
          />
        </div>
      </div>

      <div className="stream-demo-below">
        <p className={`stream-demo-status ${isBroadcastLive ? "stream-demo-status-live" : ""}`}>
          Drawing: {broadcastStatusLabel}
        </p>
        <p className={`stream-demo-status ${isPlayerPlaying ? "stream-demo-status-live" : ""}`}>
          AI output: {playerStatusLabel}
        </p>
        <div className="stream-demo-controls">
          <button
            onClick={handleStart}
            disabled={broadcast.status.state === "live"}
            className="btn btn-start"
            type="button"
            title="Start drawing stream (W)"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={broadcast.status.state !== "live"}
            className="btn btn-stop"
            type="button"
            title="Stop drawing stream (W)"
          >
            Stop
          </button>
          <button
            onClick={toggleTrack}
            className="btn btn-track"
            type="button"
            title="Toggle track (or press P)"
          >
            {isTrackPlaying ? "Pause track" : "Play track"}
          </button>
          <button
            onClick={handleReapplyPrompt}
            disabled={anchoring}
            className="btn btn-anchor"
            type="button"
            title="Re-apply prompt when output drifts from your aesthetic"
          >
            {anchoring ? "Re-applying…" : "Re-apply prompt"}
          </button>
        </div>
        <p className="stream-demo-hint">
          W — start/stop drawing stream · P — play/pause track · F — fullscreen AI video
        </p>
        {(broadcast.status.state === "error" || player.status.state === "error") && (
          <div className="stream-demo-errors">
            {broadcast.status.state === "error" && (
              <p>Broadcast: {broadcast.status.error.message}</p>
            )}
            {player.status.state === "error" && (
              <p>Player: {player.status.error.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
