---
name: remotion-education-explainer
description: Build a 30-second, 5-scene animated educational explainer video in Remotion (1080x1920, 30fps). Claude researches the topic, writes a script, designs SVG visuals, and animates everything. Use when the user wants to teach a concept as a short-form vertical video.
origin: ECC
---

# Remotion Education Explainer Video

Turn any topic into a 30-second animated explainer with 5 scenes, SVG diagrams, and background music. No external assets needed — everything is generated as React/SVG components.

## When to Activate

- User asks to create an educational video, explainer, or "teach X as a video"
- Prompt contains "Use the Remotion best practices skill" and a topic to explain
- User wants a Kurzgesagt-style or Fireship-style animated video

## Prerequisites

Apply the `remotion-best-practices` skill first. Then follow this workflow.

## Workflow

### Step 1 — Research & Script (before writing any code)

Research the topic thoroughly. Write a **5-scene script** and show it to the user for approval before coding.

Each scene entry must include:
1. **Headline** — one punchy line (fits in ~40 chars)
2. **Body** — 1–2 sentences of explanation
3. **Visual** — what to animate (diagram, flowchart, icon, step sequence)
4. **Duration** — in seconds (total must sum to ~30s)

Example scene structure:

```
Scene 1 (4s) — "What is an AI Agent?"
Body: An AI agent perceives its environment and takes actions to reach a goal.
Visual: A circular loop diagram — Perceive → Think → Act — drawing itself stroke by stroke.

Scene 2 (6s) — "The Brain: LLM"
Body: A large language model acts as the reasoning core, deciding what to do next.
Visual: Brain SVG with neural network lines animating in, text "GPT-4 / Claude" appearing below.
```

**Wait for user approval before writing code.**

### Step 2 — Build the Video

After approval, implement all 5 scenes. Requirements below.

## Composition Spec

```typescript
<Composition
  id="EducationExplainer"
  component={EducationExplainer}
  durationInFrames={900}   // 30s × 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

## Visual Style

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Primary text | `#ffffff` |
| Accent | `#6366f1` (indigo) |
| Success / emphasis | `#22c55e` (green) |
| Warning | `#f59e0b` (amber) |
| Font | Inter (weights 400, 600, 800) |

## Safe Zone

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
// Headlines: 56px+  Body: 36px+  Labels: 28px minimum
```

## Scene Structure

Use `TransitionSeries` with 12-frame fade transitions between scenes:

```typescript
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

export const EducationExplainer: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
    <Audio src={staticFile("music.mp3")} volume={0.3} loop />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 12 })}
      />
      {/* repeat for each scene */}
    </TransitionSeries>
  </AbsoluteFill>
);
```

## Animation Rules

### All entrances use spring with high damping

```typescript
const { fps } = useVideoConfig();
const frame = useCurrentFrame();

const scale = spring({ frame, fps, config: { damping: 200 }, from: 0, to: 1 });
const translateY = spring({ frame, fps, config: { damping: 200 }, from: 40, to: 0 });
```

### Stagger related items by 8–12 frames

```typescript
{steps.map((step, i) => {
  const translateX = spring({
    frame: frame - i * 10,
    fps,
    config: { damping: 200 },
    from: 60,
    to: 0,
  });
  return <div style={{ transform: `translateX(${translateX}px)` }}>{step}</div>;
})}
```

### SVG diagrams draw themselves

```typescript
// Measure path length once and store as a constant
const PATH_LENGTH = 420;

const DrawPath: React.FC<{ d: string }> = ({ d }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [10, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <path
      d={d}
      fill="none"
      stroke="#6366f1"
      strokeWidth={4}
      strokeDasharray={PATH_LENGTH}
      strokeDashoffset={PATH_LENGTH * (1 - progress)}
    />
  );
};
```

### Count-up numbers

```typescript
const value = interpolate(frame, [30, 80], [0, targetNumber], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
<span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(value).toLocaleString()}</span>
```

## Required Scene Components

### Scene template

```typescript
const SceneN: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineY = spring({ frame, fps, config: { damping: 200 }, from: 30, to: 0 });
  const headlineOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingLeft: 60, paddingRight: 60 }}>
      {/* Headline */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 800,
          fontFamily: "Inter",
          transform: `translateY(${headlineY}px)`,
          opacity: headlineOpacity,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        {headline}
      </div>

      {/* SVG diagram or icon */}
      <svg width={800} height={400} viewBox="0 0 800 400">
        {/* build all visuals as SVG — no external images */}
      </svg>

      {/* Body text */}
      <div style={{ color: "#94a3b8", fontSize: 36, fontFamily: "Inter", textAlign: "center", marginTop: 32 }}>
        {body}
      </div>
    </AbsoluteFill>
  );
};
```

### Scene 5 — Particle finale

The final scene must include a particle background (10–15 circles drifting upward):

```typescript
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const x = (Math.sin(i * 137.5) * 0.5 + 0.5) * 1080;
        const speed = 0.5 + (i % 4) * 0.2;
        const y = 1920 - ((frame * speed + i * 180) % 1920);
        const opacity = interpolate(y, [0, 300, 1600, 1920], [0, 0.7, 0.7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 10 + (i % 5) * 5,
              height: 10 + (i % 5) * 5,
              borderRadius: "50%",
              backgroundColor: i % 2 === 0 ? "#6366f1" : "#22c55e",
              opacity,
            }}
          />
        );
      })}
    </>
  );
};
```

## Background Music

```bash
# Try Pixabay first
curl "https://pixabay.com/music/search/lo-fi+beat/" | grep -oP 'https://[^"]+\.mp3' | head -1

# Save to public/
curl -L "<url>" -o public/music.mp3
```

If download fails, generate a beat with Node.js using `web-audio-api` npm package and save to `public/music.wav`.

```typescript
// In composition
<Audio src={staticFile("music.mp3")} volume={0.3} loop />
```

## Deliverable Checklist

- [ ] Script approved before coding started
- [ ] 5 scenes, total ~30 seconds
- [ ] All text inside safe zone (150px top, 170px bottom, 60px sides)
- [ ] All fonts ≥ 28px; headlines ≥ 56px
- [ ] All entrances use `spring({ damping: 200 })`
- [ ] SVG diagrams self-draw via `stroke-dashoffset`
- [ ] Final scene has particle effect
- [ ] Background music loops for full duration
- [ ] `npx remotion studio` launched for preview

## Related Skills

- `remotion-best-practices` — core API, animation primitives, safe zones
- `remotion-data-viz` — when the topic involves numbers or charts
