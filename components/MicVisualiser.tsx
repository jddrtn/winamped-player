"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import VisualiserCanvas from "@/components/VisualiserCanvas";

type Status = "idle" | "starting" | "running" | "denied" | "error";

export default function MicVisualiser() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const freqRef = useRef<Uint8Array | null>(null);
  const timeRef = useRef<Uint8Array | null>(null);

  const getFrequencyData = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return null;

    if (!freqRef.current || freqRef.current.length !== analyser.frequencyBinCount) {
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(freqRef.current);
    return freqRef.current;
  }, []);

  const getTimeDomainData = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return null;

    if (!timeRef.current || timeRef.current.length !== analyser.fftSize) {
      timeRef.current = new Uint8Array(analyser.fftSize);
    }
    analyser.getByteTimeDomainData(timeRef.current);
    return timeRef.current;
  }, []);

  const startMic = useCallback(async () => {
    setErrorMsg(null);
    setStatus("starting");

    try {
      // Request mic (localhost is allowed; deployed app must be HTTPS)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // WMP-ish balance
      analyser.smoothingTimeConstant = 0.75; // smooth like WMP
      source.connect(analyser);
      analyserRef.current = analyser;

      setStatus("running");
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setStatus("denied");
        setErrorMsg("Microphone access was denied. Please allow mic permissions and try again.");
      } else {
        setStatus("error");
        setErrorMsg("Could not start microphone visualiser.");
      }
    }
  }, []);

  const stopMic = useCallback(async () => {
    try {
      analyserRef.current = null;

      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } finally {
      setStatus("idle");
    }
  }, []);

  const overlay = useMemo(() => {
    if (status === "running") return null;

    const title =
      status === "idle"
        ? "Enable Microphone"
        : status === "starting"
        ? "Starting…"
        : status === "denied"
        ? "Mic Permission Needed"
        : "Mic Error";

    const subtitle =
      status === "idle"
        ? "This makes the visualiser react like Windows Media Player."
        : status === "starting"
        ? "Waiting for browser permission…"
        : errorMsg ?? "Try again.";

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border border-pink-500/30 bg-black/60 backdrop-blur-sm px-5 py-4 text-center shadow-[0_0_30px_rgba(236,72,153,0.15)]">
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
          <div className="mt-1 text-xs text-zinc-300 max-w-[320px]">{subtitle}</div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={startMic}
              disabled={status === "starting"}
              className={[
                "px-3 py-2 rounded-lg border transition-all text-sm",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-10px_18px_rgba(0,0,0,0.7)]",
                status === "starting"
                  ? "border-white/10 bg-zinc-900 text-zinc-400 cursor-not-allowed"
                  : "border-pink-500/60 bg-gradient-to-b from-pink-400 to-pink-700 text-black shadow-[0_0_25px_rgba(236,72,153,0.45)]",
              ].join(" ")}
            >
              {status === "starting" ? "Starting…" : "Enable Mic"}
            </button>
          </div>

          <div className="mt-3 text-[11px] text-zinc-400">
            Tip: make some noise or play music near your mic.
          </div>
        </div>
      </div>
    );
  }, [status, startMic, errorMsg]);

  return (
    <div className="absolute inset-0">
      <VisualiserCanvas
        getFrequencyData={getFrequencyData}
        getTimeDomainData={getTimeDomainData}
        mirror
      />

      {overlay}

      {status === "running" && (
        <button
          type="button"
          onClick={stopMic}
          className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-md border border-white/10 bg-black/40 text-zinc-200 hover:border-pink-500/40"
        >
          Stop mic
        </button>
      )}
    </div>
  );
}
