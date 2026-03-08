"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBroadcast, usePlayer } from "@daydreamlive/react";

const TRACK_URL = "/track.mp3";

export default function StreamDemo({ whipUrl }: { whipUrl: string }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 512, height: 512 },
      audio: false,
    });
    setLocalStream(stream);
    await broadcast.start(stream);
  }, [broadcast]);

  const handleStop = useCallback(() => {
    broadcast.stop();
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
  }, [broadcast, localStream]);

  const toggleWebcam = useCallback(() => {
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
        toggleWebcam();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleWebcam]);

  const isBroadcastLive = broadcast.status.state === "live";
  const isPlayerPlaying = player.status.state === "playing";
  const isStreaming = isBroadcastLive && isPlayerPlaying;

  const broadcastStatusLabel =
    broadcast.status.state === "connecting"
      ? "Sending webcam…"
      : broadcast.status.state === "live"
        ? "Webcam streaming"
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
      <div className="stream-demo-videos">
        <div className="stream-demo-panel">
          <h3>Your webcam</h3>
          <video
            autoPlay
            playsInline
            muted
            ref={(el) => {
              if (el && localStream) el.srcObject = localStream;
            }}
            className="stream-demo-video-box stream-demo-video-mirror"
          />
        </div>
        <div className="stream-demo-panel">
          <h3>AI output (Stream Diffusion)</h3>
          <video
            ref={player.videoRef as React.RefObject<HTMLVideoElement>}
            autoPlay
            playsInline
            muted
            className="stream-demo-video-box stream-demo-video-mirror"
          />
        </div>
      </div>

      <div className="stream-demo-below">
        {isStreaming && (
          <div className="stream-demo-live-badge" role="status" aria-live="polite">
            <span className="stream-demo-live-dot" />
            Streaming — AI is processing your video
          </div>
        )}
        <p className={`stream-demo-status ${isBroadcastLive ? "stream-demo-status-live" : ""}`}>
          Webcam: {broadcastStatusLabel}
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
            title="Start webcam (W)"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={broadcast.status.state !== "live"}
            className="btn btn-stop"
            type="button"
            title="Stop webcam (W)"
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
        </div>
        <p className="stream-demo-hint">
          W — start/stop webcam · P — play/pause track · F — fullscreen AI video
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
