"use client";

import { useEffect, useRef, useState } from "react";
import { LivynHeadphones, LivynSermon, LivynFileText } from "@/components/icons/livyn-icons";
import { cn } from "@/lib/utils";

export function SermonPlayer({
  sermonId,
  videoUrl,
  startPosition,
  transcript,
}: {
  sermonId: string;
  videoUrl: string;
  startPosition: number;
  transcript: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const lastSaved = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (video && startPosition > 0) {
      const onLoaded = () => {
        video.currentTime = startPosition;
      };
      video.addEventListener("loadedmetadata", onLoaded);
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [startPosition]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const now = video.currentTime;
    if (now - lastSaved.current < 5) return;
    lastSaved.current = now;
    fetch(`/api/khotbah/${sermonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionSec: Math.floor(now), durationSec: Math.floor(video.duration || 0) }),
    }).catch(() => {});
  }

  function handleEnded() {
    const video = videoRef.current;
    if (!video) return;
    fetch(`/api/khotbah/${sermonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionSec: Math.floor(video.duration || 0), durationSec: Math.floor(video.duration || 0) }),
    }).catch(() => {});
  }

  return (
    <div>
      <div className={cn("relative overflow-hidden bg-black", audioOnly ? "aspect-[3/1]" : "aspect-video")}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className={cn("h-full w-full", audioOnly && "invisible absolute")}
        />
        {audioOnly && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/80">
            <LivynHeadphones className="h-8 w-8" />
            <span className="text-sm">Mode audio saja aktif</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-5 py-3">
        <button
          onClick={() => setAudioOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
            audioOnly ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
          )}
        >
          {audioOnly ? <LivynHeadphones className="h-3.5 w-3.5" /> : <LivynSermon className="h-3.5 w-3.5" />}
          {audioOnly ? "Audio Saja" : "Mode Video"}
        </button>
        {transcript && (
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
              showTranscript ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
            )}
          >
            <LivynFileText className="h-3.5 w-3.5" /> Transkrip
          </button>
        )}
      </div>

      {showTranscript && transcript && (
        <div className="mx-5 mb-4 rounded-lg border border-border bg-surface-muted p-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
          {transcript}
        </div>
      )}
    </div>
  );
}
