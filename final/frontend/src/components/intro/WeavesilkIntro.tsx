"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface WeavesilkIntroProps {
  /** Target duration in milliseconds (default: 4700ms) */
  duration?: number;
  /** Callback fired after transition into the application completes */
  onComplete?: () => void;
  /** Force play even if already seen in current session (useful for preview/testing) */
  forcePlay?: boolean;
}

const STORAGE_KEY = "narrai_intro_seen";

/**
 * WeavesilkIntro: Cinematic Logo Reveal for NarrAI
 *
 * Choreography:
 * 1. Black viewport; delicate silver-white light ribbons stream from the screen edges inward.
 * 2. Multi-axis rotational & bilateral symmetry (WeaveSilk style), curling and converging toward center.
 * 3. Synthesis: Light tracers dynamically loop around the emblem circle, dart across the A-arrow,
 *    and sweep across the NARR AI typography, synchronized with mask/reveal of the official logo asset.
 * 4. Completion: A gentle, elegant silver flare/shimmer sweeps across the logo, stabilizing into crisp metallic silver.
 * 5. Dispersion: Silk trails gently disperse outward and fade into the background.
 * 6. Transition: Entire intro smoothly dissolves revealing the underlying homepage without flash or reload.
 * 7. Accessibility: Keyboard-accessible "Bỏ qua" button, prefers-reduced-motion compliance.
 */
export function WeavesilkIntro({
  duration = 4700,
  onComplete,
  forcePlay = false,
}: WeavesilkIntroProps) {
  const [isReadyToPlay, setIsReadyToPlay] = useState<boolean>(true);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Logo Reveal Progress Stages
  const [emblemProgress, setEmblemProgress] = useState<number>(0); // 0 to 1
  const [textProgress, setTextProgress] = useState<number>(0); // 0 to 1
  const [isSilverFlashing, setIsSilverFlashing] = useState<boolean>(false);
  const [isLogoLocked, setIsLogoLocked] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isExitingRef = useRef<boolean>(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Mouse & interaction tracking
  const mouseRef = useRef<{
    currX: number;
    currY: number;
    targetX: number;
    targetY: number;
    hasInteraction: boolean;
  }>({
    currX: 0,
    currY: 0,
    targetX: 0,
    targetY: 0,
    hasInteraction: false,
  });

  // Check session storage & query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const isParamForced = params.has("intro") || params.get("preview_intro") === "1";
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // On production, respect sessionStorage so internal navigation skips intro
      // In local dev or when forced with query param, always play for testing
      if (!forcePlay && !isParamForced && !isLocalhost) {
        const seen = sessionStorage.getItem(STORAGE_KEY);
        if (seen === "true") {
          setIsComplete(true);
          onComplete?.();
          return;
        }
      }

      // Check prefers-reduced-motion
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (motionQuery.matches) {
        setReducedMotion(true);
      }

      setIsReadyToPlay(true);
    } catch {
      setIsReadyToPlay(true);
    }

    // Allow replaying via custom event for testing/preview
    const handleReplayEvent = () => {
      setIsComplete(false);
      setIsExiting(false);
      setEmblemProgress(0);
      setTextProgress(0);
      setIsSilverFlashing(false);
      setIsLogoLocked(false);
      isExitingRef.current = false;
      setIsReadyToPlay(true);
    };

    window.addEventListener("narrai:replay-intro", handleReplayEvent);
    return () => {
      window.removeEventListener("narrai:replay-intro", handleReplayEvent);
    };
  }, [forcePlay, onComplete]);

  // Finish and dismiss intro
  const finishIntro = useCallback(
    (immediate = false) => {
      if (isExitingRef.current) return;
      isExitingRef.current = true;
      setIsExiting(true);

      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Ignore storage exceptions
      }

      const fadeDuration = immediate ? 350 : 850;
      setTimeout(() => {
        setIsComplete(true);
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
        onComplete?.();
      }, fadeDuration);
    },
    [onComplete]
  );

  const handleSkip = useCallback(() => {
    finishIntro(true);
  }, [finishIntro]);

  // Canvas & Procedural Weavesilk Animation Loop
  useEffect(() => {
    if (!isReadyToPlay || isComplete) return;

    // Reduced motion handling: calm static logo fade-in and smooth transition
    if (reducedMotion) {
      setEmblemProgress(1);
      setTextProgress(1);
      setIsLogoLocked(true);
      const exitTimer = setTimeout(() => finishIntro(false), 2000);
      return () => clearTimeout(exitTimer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d", { alpha: true });
    } catch {
      finishIntro(true);
      return;
    }

    if (!ctx) {
      finishIntro(true);
      return;
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
    };

    handleResize();

    try {
      resizeObserverRef.current = new ResizeObserver(() => handleResize());
      resizeObserverRef.current.observe(document.body);
    } catch {
      window.addEventListener("resize", handleResize);
    }

    // Pointer move listener for gentle steering
    const onPointerMove = (e: PointerEvent) => {
      const cx = width / 2;
      const cy = height / 2;
      mouseRef.current.targetX = (e.clientX - cx) * 0.2;
      mouseRef.current.targetY = (e.clientY - cy) * 0.2;
      mouseRef.current.hasInteraction = true;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Mathematical parameters for Weavesilk filaments
    const NUM_SYMMETRIES = 6; // 6-fold rotational symmetry (12 rays with mirror)
    const STRANDS = [-2, -1, 0, 1, 2]; // 5 parallel silk strands per emitter
    const NUM_EMITTERS = 2; // 2 outer ingress emitters

    interface EmitterPoint {
      x: number;
      y: number;
    }

    // Preallocated point histories for smooth quadratic Bézier curves
    const emitterHistories: Array<Array<{ p0: EmitterPoint; p1: EmitterPoint }>> = [];
    for (let e = 0; e < NUM_EMITTERS; e++) {
      const strandsList: Array<{ p0: EmitterPoint; p1: EmitterPoint }> = [];
      for (let s = 0; s < STRANDS.length; s++) {
        strandsList.push({
          p0: { x: 0, y: 0 },
          p1: { x: 0, y: 0 },
        });
      }
      emitterHistories.push(strandsList);
    }

    // Circular emblem tracer history (for sketching the logo circle ring)
    const circleTracerHistory: { p0: EmitterPoint; p1: EmitterPoint } = {
      p0: { x: 0, y: 0 },
      p1: { x: 0, y: 0 },
    };

    // Text sweep tracer history (for sketching the text line)
    const textTracerHistory: { p0: EmitterPoint; p1: EmitterPoint } = {
      p0: { x: 0, y: 0 },
      p1: { x: 0, y: 0 },
    };

    const startTime = performance.now();
    let hasInitializedPoints = false;
    let hasTriggeredFlash = false;
    let hasLockedLogo = false;

    // Render loop
    const render = (now: number) => {
      if (isExitingRef.current) return;

      const elapsed = (now - startTime) / 1000; // in seconds

      // Timeline Event Milestones:
      // 1.5s - 2.4s: Emblem circle & central A glyph reveal
      if (elapsed >= 1.5 && elapsed <= 2.4) {
        const ep = Math.min(1.0, (elapsed - 1.5) / 0.85);
        setEmblemProgress(ep);
      } else if (elapsed > 2.4 && emblemProgress < 1) {
        setEmblemProgress(1);
      }

      // 2.3s - 2.85s: "NARR AI" typography left-to-right sweep reveal
      if (elapsed >= 2.3 && elapsed <= 2.85) {
        const tp = Math.min(1.0, (elapsed - 2.3) / 0.52);
        setTextProgress(tp);
      } else if (elapsed > 2.85 && textProgress < 1) {
        setTextProgress(1);
      }

      // 2.9s: Silver flash sheen
      if (elapsed >= 2.9 && !hasTriggeredFlash) {
        hasTriggeredFlash = true;
        setIsSilverFlashing(true);
        setTimeout(() => setIsSilverFlashing(false), 450);
      }

      // 3.3s: Logo locks in pristine silver
      if (elapsed >= 3.3 && !hasLockedLogo) {
        hasLockedLogo = true;
        setIsLogoLocked(true);
      }

      // 3.95s: Dispersion & Transition to app
      if (elapsed >= 3.95) {
        finishIntro(false);
        return;
      }

      if (!ctx) return;

      // Smooth mouse follow
      const mouse = mouseRef.current;
      mouse.currX += (mouse.targetX - mouse.currX) * 0.04;
      mouse.currY += (mouse.targetY - mouse.currY) * 0.04;

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.44;

      // Soft decay each frame creates gossamer Weavesilk ribbon trails on pitch black
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      // Fade slightly faster during dispersion phase to clear the background cleanly
      const decayAlpha = elapsed > 3.2 ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.016)";
      ctx.fillStyle = decayAlpha;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Additive luminescence for pure white-silver silk filaments
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // --- SECTION 1: INGRESS WEAVESILK RIBBONS FROM EDGES ---
      // Motion radius starts near outer edges (0.95 * maxR) and spirals inward to center (0.2 * maxR)
      let radiusProgress = Math.min(1.0, elapsed / 2.2);
      // Ease in-out cubic
      radiusProgress =
        radiusProgress < 0.5
          ? 4 * radiusProgress * radiusProgress * radiusProgress
          : 1 - Math.pow(-2 * radiusProgress + 2, 3) / 2;

      // If in dispersion phase, radius expands gently outward and fades
      let dispersionRadius = 0;
      let dispersionFade = 1.0;
      if (elapsed > 3.2) {
        const dispT = (elapsed - 3.2) / 0.8;
        dispersionRadius = dispT * 80;
        dispersionFade = Math.max(0, 1.0 - dispT * 1.2);
      }

      const ingressBaseR = maxR * (0.95 - 0.72 * radiusProgress) + dispersionRadius;

      for (let e = 0; e < NUM_EMITTERS; e++) {
        const sign = e === 0 ? 1 : -1;
        const phaseShift = e * (Math.PI / 2.1);

        // Harmonic radial undulation
        const rOsc =
          ingressBaseR *
          (0.85 + 0.25 * Math.sin(elapsed * 1.2 * sign + phaseShift));

        // Angular rotation
        const theta =
          elapsed * 0.65 * sign +
          0.3 * Math.sin(elapsed * 1.5 + phaseShift);

        // Position with subtle mouse influence
        const mouseFactor = (rOsc / maxR) * (mouse.hasInteraction ? 1.0 : 0.0);
        const px = rOsc * Math.cos(theta) + mouse.currX * mouseFactor;
        const py = rOsc * Math.sin(theta) + mouse.currY * mouseFactor;

        // Normal vector perpendicular to trajectory
        const dt = 0.018;
        const rPrev =
          (maxR * (0.95 - 0.72 * Math.max(0, radiusProgress - 0.01)) + dispersionRadius) *
          (0.85 + 0.25 * Math.sin((elapsed - dt) * 1.2 * sign + phaseShift));
        const thetaPrev =
          (elapsed - dt) * 0.65 * sign +
          0.3 * Math.sin((elapsed - dt) * 1.5 + phaseShift);

        const pxPrev = rPrev * Math.cos(thetaPrev) + mouse.currX * mouseFactor;
        const pyPrev = rPrev * Math.sin(thetaPrev) + mouse.currY * mouseFactor;

        const vx = px - pxPrev;
        const vy = py - pyPrev;
        const vLen = Math.hypot(vx, vy) || 1;
        const nx = -vy / vLen;
        const ny = vx / vLen;

        // Draw bundle of 5 fine silk filaments
        for (let sIdx = 0; sIdx < STRANDS.length; sIdx++) {
          const s = STRANDS[sIdx];
          const strandOffset =
            s * 4.5 * (0.85 + 0.35 * Math.sin(elapsed * 4.0 + s * 0.7));

          const curStrandX = px + nx * strandOffset;
          const curStrandY = py + ny * strandOffset;

          const history = emitterHistories[e][sIdx];

          if (!hasInitializedPoints) {
            history.p0 = { x: curStrandX, y: curStrandY };
            history.p1 = { x: curStrandX, y: curStrandY };
            continue;
          }

          const p0 = history.p0;
          const p1 = history.p1;
          const p2 = { x: curStrandX, y: curStrandY };

          const mid0X = (p0.x + p1.x) * 0.5;
          const mid0Y = (p0.y + p1.y) * 0.5;
          const mid1X = (p1.x + p2.x) * 0.5;
          const mid1Y = (p1.y + p2.y) * 0.5;

          const isCenterStrand = s === 0;
          const isMidStrand = Math.abs(s) === 1;

          // Pure Monochrome Shading (Fine Luminous Silver Threads)
          const baseAlpha = isCenterStrand ? 0.22 : isMidStrand ? 0.12 : 0.06;
          const fadeMult = Math.min(1.0, elapsed / 0.4) * dispersionFade;
          const finalAlpha = (baseAlpha * fadeMult).toFixed(4);

          ctx.strokeStyle = `rgba(240, 245, 255, ${finalAlpha})`;
          ctx.lineWidth = isCenterStrand ? 1.4 : isMidStrand ? 0.9 : 0.55;

          // Rotational & Bilateral Symmetry Projection
          for (let k = 0; k < NUM_SYMMETRIES; k++) {
            const rot = (k * 2 * Math.PI) / NUM_SYMMETRIES;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            // 1. Rotational ray
            ctx.beginPath();
            ctx.moveTo(cx + mid0X * cos - mid0Y * sin, cy + mid0X * sin + mid0Y * cos);
            ctx.quadraticCurveTo(
              cx + p1.x * cos - p1.y * sin,
              cy + p1.x * sin + p1.y * cos,
              cx + mid1X * cos - mid1Y * sin,
              cy + mid1X * sin + mid1Y * cos
            );
            ctx.stroke();

            // 2. Bilateral mirror ray
            ctx.beginPath();
            ctx.moveTo(cx + -mid0X * cos - mid0Y * sin, cy + -mid0X * sin + mid0Y * cos);
            ctx.quadraticCurveTo(
              cx + -p1.x * cos - p1.y * sin,
              cy + -p1.x * sin + p1.y * cos,
              cx + -mid1X * cos - mid1Y * sin,
              cy + -mid1X * sin + mid1Y * cos
            );
            ctx.stroke();
          }

          history.p0 = p1;
          history.p1 = p2;
        }
      }

      // --- SECTION 2: SYNTHESIS TRACERS (Emblem Circle & Text Sweepers) ---
      // During 1.5s - 2.5s: Tracer orbits around emblem ring
      if (elapsed >= 1.5 && elapsed <= 2.5) {
        // Logo emblem center is exactly aligned with the circular mark
        const emblemCenterY = cy - 38;
        const emblemRadius = 66; // Matches the circular emblem size

        const tracerAngle = (elapsed - 1.5) * Math.PI * 4 - Math.PI / 2;
        const tx = cx + Math.cos(tracerAngle) * emblemRadius;
        const ty = emblemCenterY + Math.sin(tracerAngle) * emblemRadius;

        if (circleTracerHistory.p0.x === 0) {
          circleTracerHistory.p0 = { x: tx, y: ty };
          circleTracerHistory.p1 = { x: tx, y: ty };
        } else {
          const cp0 = circleTracerHistory.p0;
          const cp1 = circleTracerHistory.p1;
          const cp2 = { x: tx, y: ty };

          ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo((cp0.x + cp1.x) * 0.5, (cp0.y + cp1.y) * 0.5);
          ctx.quadraticCurveTo(cp1.x, cp1.y, (cp1.x + cp2.x) * 0.5, (cp1.y + cp2.y) * 0.5);
          ctx.stroke();

          // Delicate sparkling head particle with soft halo
          ctx.save();
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          circleTracerHistory.p0 = cp1;
          circleTracerHistory.p1 = cp2;
        }
      }

      // During 2.25s - 2.85s: Tracer sweeps horizontally across the text line
      if (elapsed >= 2.25 && elapsed <= 2.85) {
        const textCenterY = cy + 70;
        const textHalfWidth = 120;
        const textProgressRatio = Math.min(1.0, (elapsed - 2.25) / 0.55);

        const currentTextX = cx - textHalfWidth + textProgressRatio * (textHalfWidth * 2);

        if (textTracerHistory.p0.x === 0) {
          textTracerHistory.p0 = { x: currentTextX, y: textCenterY };
          textTracerHistory.p1 = { x: currentTextX, y: textCenterY };
        } else {
          const tp0 = textTracerHistory.p0;
          const tp1 = textTracerHistory.p1;
          const tp2 = { x: currentTextX, y: textCenterY };

          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(tp0.x, tp0.y);
          ctx.lineTo(tp2.x, tp2.y);
          ctx.stroke();

          // Vertical ray etching line at the reveal edge
          ctx.save();
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.shadowBlur = 6;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(currentTextX, textCenterY - 16);
          ctx.lineTo(currentTextX, textCenterY + 16);
          ctx.stroke();
          ctx.restore();

          textTracerHistory.p0 = tp1;
          textTracerHistory.p1 = tp2;
        }
      }

      hasInitializedPoints = true;
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [isReadyToPlay, isComplete, reducedMotion, duration, finishIntro]);

  if (!isReadyToPlay || isComplete) {
    return null;
  }

  // Calculate reveal clip-path styles for the official logo components:
  // 1. Emblem: Circular sweep reveal from center
  const emblemClipPath = `circle(${Math.round(emblemProgress * 100)}% at 50% 36%)`;
  const emblemOpacity = Math.min(1.0, emblemProgress * 1.4);

  // 2. Text: Horizontal left-to-right sweep reveal
  const textInsetRight = `${Math.max(0, (1 - textProgress) * 100)}%`;
  const textClipPath = `inset(0 ${textInsetRight} 0 0)`;
  const textOpacity = Math.min(1.0, textProgress * 1.5);

  return (
    <div
      role="region"
      aria-label="NarrAI Cinematic Logo Reveal"
      className={`fixed inset-0 z-[99999] overflow-hidden bg-black select-none transition-opacity duration-900 ease-out font-sans ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* 1. Procedural Weavesilk Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-default"
        aria-hidden="true"
      />

      {/* 2. Accessible Skip Button ("Bỏ qua") */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-30">
        <button
          type="button"
          onClick={handleSkip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSkip();
            }
          }}
          className="px-4 py-1.5 rounded-full font-mono text-[11px] sm:text-xs tracking-[0.22em] uppercase text-neutral-400 hover:text-white bg-black/50 hover:bg-neutral-900/80 border border-neutral-800 hover:border-neutral-500 backdrop-blur-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white select-none shadow-2xl"
          aria-label="Bỏ qua phần giới thiệu (Skip intro)"
        >
          Bỏ qua
        </button>
      </div>

      {/* 3. Official Logo Layer (Layered Original Assets with Mask/Reveal & Silver Flash) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
        {/* Soft atmospheric ambient glow behind the logo */}
        <div
          className={`absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full bg-white/[0.04] blur-3xl pointer-events-none transition-opacity duration-1000 ${
            emblemProgress > 0.3 ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Logo Container preserving exact native aspect ratio (324 : 250) */}
        <div
          className={`relative w-[280px] h-[216px] sm:w-[340px] sm:h-[262px] md:w-[380px] md:h-[293px] transition-all duration-700 ${
            isSilverFlashing
              ? "filter brightness-[1.5] drop-shadow-[0_0_24px_rgba(255,255,255,0.7)] scale-[1.02]"
              : isLogoLocked
              ? "filter brightness-[1.0] drop-shadow-[0_0_12px_rgba(255,255,255,0.22)] scale-100"
              : "filter brightness-[0.95] drop-shadow-none scale-100"
          }`}
        >
          {/* Layer A: Official Emblem (Circle + Arrow Glyph) with Circular Mask Sweep */}
          <div
            className="absolute inset-0 transition-opacity duration-150"
            style={{
              clipPath: emblemClipPath,
              opacity: emblemOpacity,
            }}
          >
            <Image
              src="/assets/narrai_emblem.png"
              alt="NARR AI Official Emblem"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Layer B: Official "NARR AI" Typography with Horizontal Sweep Mask */}
          <div
            className="absolute inset-0 transition-opacity duration-150"
            style={{
              clipPath: textClipPath,
              opacity: textOpacity,
            }}
          >
            <Image
              src="/assets/narrai_text.png"
              alt="NARR AI Typography"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Layer C: Silver Sheen Beam Flare */}
          {isSilverFlashing && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              aria-hidden="true"
            >
              <div
                className="w-full h-full animate-sheen-sweep"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.4) 48%, rgba(255,255,255,0.85) 52%, transparent 75%)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeavesilkIntro;
