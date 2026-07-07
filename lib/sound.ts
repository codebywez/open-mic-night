const MUTE_KEY = "omn:muted";

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
}

type AudioContextCtor = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

/** Plays a soft two-tone bell. Respects the mute preference. */
export function playChime(): void {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const tones = [
    { freq: 880, start: 0, dur: 0.35 },
    { freq: 1174.66, start: 0.16, dur: 0.5 },
  ];

  for (const { freq, start, dur } of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + start;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  master.gain.setValueAtTime(1, now);
  // Close the context shortly after playback to free resources.
  setTimeout(() => ctx.close().catch(() => {}), 1200);
}

/** Vibrates the device where supported. */
export function vibrate(pattern: number | number[] = [120, 60, 120]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}
