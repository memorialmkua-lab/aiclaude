---
name: remotion-best-practices
description: Core Remotion knowledge — project setup, animation primitives, component patterns, safe zones, audio, and common pitfalls. Use this as the foundational skill before building any Remotion video.
origin: ECC
---

# Remotion Best Practices

Build programmatic videos with React and TypeScript using Remotion's frame-based rendering model.

## When to Activate

- User says "Use the Remotion best practices skill"
- Creating any Remotion composition or video
- Adding animations, transitions, or audio to a Remotion project
- Debugging frame-rate issues, jank, or off-screen content
- Any of the 5 Remotion video templates reference this skill

## Project Setup

```bash
# Bootstrap a new project
npx create-video@latest

# Preview in browser (hot reload)
npx remotion studio

# Render to file
npx remotion render src/index.ts MyComposition out/video.mp4
```

Required packages for most video projects:

```bash
npm install remotion @remotion/player @remotion/transitions
# For talking-head videos with audio
npm install @remotion/media-utils
```

## Core Imports

```typescript
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
```

## Animation Primitives

### spring() — for entrances and interactions

Use `spring()` for all element entrances. Never use linear motion for UI elements.

```typescript
// ✅ GOOD — natural spring entrance
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  config: { damping: 200 },   // high damping = snappy, no bounce
  from: 0,
  to: 1,
});

// ✅ GOOD — delayed entrance (stagger by index)
const scale = spring({
  frame: frame - index * 8,   // 8-frame stagger between items
  fps,
  config: { damping: 200 },
  from: 0,
  to: 1,
});

// ❌ BAD — linear scale, robotic
const scale = frame / 30;
```

### interpolate() — for continuous value mapping

```typescript
// ✅ GOOD — clamp prevents values going outside [0,1]
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// ✅ GOOD — count-up number animation
const count = interpolate(frame, [30, 90], [0, 1000], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

// ✅ GOOD — SVG stroke-dashoffset draw animation
const progress = interpolate(frame, [0, 60], [1, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const strokeDashoffset = totalLength * progress;
```

### Combining spring + interpolate

```typescript
// Slide in from bottom
const translateY = spring({ frame, fps, config: { damping: 200 }, from: 60, to: 0 });
const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
```

## Component Patterns

### Composition registration

```typescript
// src/index.ts
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={900}   // 30s at 30fps
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
```

### Sequence — time-slice a scene

```typescript
// Show Scene2 starting at frame 90 (3s at 30fps)
<Sequence from={90} durationInFrames={120}>
  <Scene2 />
</Sequence>
```

### AbsoluteFill — full-frame layer

```typescript
// Layers stack; last child is on top
<AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
  <BackgroundLayer />
  <AbsoluteFill>
    <ContentLayer />
  </AbsoluteFill>
</AbsoluteFill>
```

### TransitionSeries — scenes with transitions

```typescript
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: 12 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene2 />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### Audio

```typescript
// Background music — loop for full duration
<Audio
  src={staticFile("music.mp3")}
  volume={0.3}
  loop
/>

// Audio with start/end trim
<Audio
  src={staticFile("music.mp3")}
  startFrom={0}
  endAt={450}   // frames, not seconds
  volume={0.3}
/>

// Video with its own audio track (e.g. talking-head)
<OffthreadVideo
  src={staticFile("avatar.mp4")}
  style={{ width: "100%", height: "100%", objectFit: "cover" }}
/>
```

### staticFile() — reference assets in public/

```typescript
// Always use staticFile() for assets, never raw string paths
<Img src={staticFile("logo.png")} />
<Audio src={staticFile("music.mp3")} volume={0.3} loop />
<OffthreadVideo src={staticFile("avatar.mp4")} />
```

## Safe Zone Rules (vertical 9:16 video)

All text and key visuals must stay inside the safe zone. Platform chrome eats the edges.

| Edge | Minimum inset |
|------|--------------|
| Top  | 150px (status bar + search UI) |
| Bottom | 170px (navigation buttons, swipe-up) |
| Left / Right | 60px |

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
// Available content area: 960px wide × 1600px tall (within 1080×1920)
```

## Minimum Font Sizes (mobile)

| Role | Minimum |
|------|---------|
| Headlines | 56px |
| Body / subtitles | 36px |
| Labels / small text | 28px |
| **Absolute minimum** | **28px — nothing smaller** |

```typescript
// ✅ GOOD
<div style={{ fontSize: 64, fontWeight: 800, fontFamily: "Inter" }}>Big Headline</div>

// ❌ BAD — unreadable on mobile
<div style={{ fontSize: 18 }}>Caption text</div>
```

## Font Loading

```typescript
// Use @remotion/google-fonts for reliable font loading
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"] });

// Or load via <style> in the component
<style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}</style>
```

## Background Music — Required Pattern

Every video must have background music. Try in order:

1. **Download from Pixabay** — `curl "https://pixabay.com/music/search/lo-fi+beat/"` and extract an `.mp3` URL
2. **Any free .mp3 online** — save to `public/music.mp3`
3. **Generate programmatically** — Node.js script using the `web-audio-api` npm package to produce a `public/music.wav`

```typescript
// Always add as a looping layer
<Audio src={staticFile("music.mp3")} volume={0.3} loop />
```

## Common Patterns

### Count-up number

```typescript
const CountUp: React.FC<{ from: number; to: number; startFrame: number; endFrame: number; suffix?: string }> = ({
  from, to, startFrame, endFrame, suffix = "",
}) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {Math.round(value).toLocaleString()}{suffix}
    </span>
  );
};
```

### SVG self-drawing line

```typescript
const DrawingLine: React.FC<{ d: string; length: number }> = ({ d, length }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  return (
    <path
      d={d}
      fill="none"
      stroke="#6366f1"
      strokeWidth={3}
      strokeDasharray={length}
      strokeDashoffset={length * (1 - progress)}
    />
  );
};
```

### Staggered list entrance

```typescript
{items.map((item, i) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const translateX = spring({
    frame: frame - i * 10,
    fps,
    config: { damping: 200 },
    from: 80,
    to: 0,
  });
  return (
    <div key={i} style={{ transform: `translateX(${translateX}px)` }}>
      {item}
    </div>
  );
})}
```

### Particle background

```typescript
const Particles: React.FC<{ count?: number; color?: string }> = ({ count = 12, color = "#6366f1" }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const seed = i * 137.5;
        const x = (Math.sin(seed) * 0.5 + 0.5) * 1080;
        const speed = 0.4 + (i % 5) * 0.15;
        const y = 1920 - ((frame * speed + seed * 10) % 1920);
        const opacity = interpolate(y, [0, 200, 1720, 1920], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 8 + (i % 4) * 6,
              height: 8 + (i % 4) * 6,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </>
  );
};
```

## Anti-Patterns

- **Linear motion** — always use `spring()` for entrances; `interpolate()` with easing for continuous values
- **No clamping** — always add `extrapolateLeft: "clamp", extrapolateRight: "clamp"` to `interpolate()` calls
- **Text below 28px** — unreadable on mobile; enforce size minimums
- **Content outside safe zone** — platform UI will cover it
- **Teleporting elements** — always animate position/opacity transitions; never snap instantly
- **`setTimeout` or `setInterval`** — use frame math instead; Remotion is deterministic per frame
- **Direct DOM manipulation** — this is React; use state and props
- **Missing `loop` on background music** — audio will stop before the video ends
- **`<Video>` instead of `<OffthreadVideo>`** — use `OffthreadVideo` for file-based videos to avoid frame sync issues during rendering

## Launching Remotion Studio

```bash
npx remotion studio
# Opens http://localhost:3000 — preview, scrub timeline, check frame-accuracy
```

## Related Skills

- `remotion-education-explainer` — 5-scene animated explainer video template
- `remotion-product-demo` — product demo + launch video from a URL
- `remotion-google-reviews` — testimonial video from Google Business Profile
- `remotion-avatar-overlays` — animated overlays on a talking-head video
- `remotion-data-viz` — animated data dashboard from a CSV file
