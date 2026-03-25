---
name: remotion-product-demo
description: Build a 25-second product demo and launch video (1080x1920, 30fps) from a product URL. Claude scrapes real branding, downloads product images, animates a simulated demo with a cursor, and closes with a screenshot showcase and CTA. Use when the user wants a polished product ad from a URL.
origin: ECC
---

# Remotion Product Demo + Launch Video

Create a complete product ad — hook, simulated demo, image showcase, feature callouts, social proof, and CTA — all scraped from a real product URL.

## When to Activate

- User provides a product/website URL and asks for a demo or launch video
- Prompt contains "Use the Remotion best practices skill" and a product URL
- User wants an automated product ad video

## Prerequisites

Apply the `remotion-best-practices` skill first. Then follow this two-step workflow.

## Workflow

### Step 1 — Research & Asset Download

Visit the URL. Extract and show to the user before coding:

1. **Product name + logo** — download logo/favicon to `public/logo.png`
2. **Brand colors** — pull from CSS variables or computed styles
3. **Tagline / hero headline** — exact copy from the page
4. **Core user flow** — what is the ONE primary action?
5. **3 key features or value propositions**
6. **Social proof** — user count, testimonials, trust badges
7. **Product images** — use Claude in Chrome MCP to navigate the page and find:
   - `<img>` tags in hero/features sections
   - `og:image` meta tag
   - Background images that are product mockups
   - Download 2–3 best images to `public/product-1.png`, `product-2.png`, etc.
   - **Prefer company-designed marketing images over browser screenshots**
   - Only take browser screenshots as a last resort if no images exist

Show findings + proposed 6-scene outline. **Wait for approval before coding.**

### Step 2 — Build 6 Scenes

Total duration: 25 seconds (750 frames at 30fps).

## Composition Spec

```typescript
<Composition
  id="ProductDemo"
  component={ProductDemo}
  durationInFrames={750}   // 25s × 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

## Safe Zone

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
// Headlines: 56px+  Body: 36px+  Labels: 28px minimum
```

## Scene Breakdown

### Scene 1 — Hook (3s, frames 0–90)

Pain-point question relevant to the product.

```typescript
const HookScene: React.FC<{ question: string; brandColor: string }> = ({ question, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text slams in from 2× scale
  const scale = spring({ frame, fps, config: { damping: 200 }, from: 2, to: 1 });
  const opacity = interpolate(frame, [0, 10, 70, 90], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        // Radial glow in brand color
        background: `radial-gradient(ellipse at center, ${brandColor}22 0%, #0a0a0a 70%)`,
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 800,
          fontFamily: "Inter",
          textAlign: "center",
          paddingLeft: 60,
          paddingRight: 60,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {question}
      </div>
    </AbsoluteFill>
  );
};
```

### Scene 2 — Product Intro (3s, frames 90–180)

Logo/name scales in, tagline slides up, particle burst.

```typescript
// Logo: spring from scale 3 → 1
const logoScale = spring({ frame, fps, config: { damping: 200 }, from: 3, to: 1 });

// Tagline: slides up after logo
const taglineY = spring({ frame: frame - 15, fps, config: { damping: 200 }, from: 30, to: 0 });
const taglineOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

// Particle burst: 20 circles expanding outward
const ParticleBurst: React.FC<{ color: string }> = ({ color }) => (
  <>
    {Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2;
      const distance = interpolate(frame, [0, 20], [0, 300], { extrapolateRight: "clamp" });
      const particleOpacity = interpolate(frame, [0, 5, 20], [0, 0.8, 0], { extrapolateRight: "clamp" });
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + Math.cos(angle) * distance - 6,
            top: 800 + Math.sin(angle) * distance - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: particleOpacity,
          }}
        />
      );
    })}
  </>
);
```

### Scene 3 — Simulated Demo (8s, frames 180–420)

Recreate the product's core interaction as React components. No device frame — build UI directly on dark background at full width.

```typescript
// Cursor: white circle with subtle trail
const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <>
    {/* trail */}
    <div style={{ position: "absolute", left: x - 12, top: y - 12, width: 24, height: 24, borderRadius: "50%", backgroundColor: "white", opacity: 0.15 }} />
    {/* main cursor */}
    <div style={{ position: "absolute", left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: "50%", backgroundColor: "white", opacity: 0.5 }} />
  </>
);

// Animate cursor along waypoints using spring interpolation
// Waypoints: input field → button → result area
const WAYPOINTS = [
  { x: 540, y: 900, frame: 0 },    // start center
  { x: 540, y: 980, frame: 20 },   // move to input
  { x: 540, y: 980, frame: 60 },   // hold while typing
  { x: 540, y: 1100, frame: 80 },  // move to button
  { x: 540, y: 1100, frame: 120 }, // hold (button click)
];

// Click ripple effect
const ClickRipple: React.FC<{ x: number; y: number; triggerFrame: number }> = ({ x, y, triggerFrame }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - triggerFrame;
  if (localFrame < 0 || localFrame > 20) return null;
  const scale = interpolate(localFrame, [0, 20], [0, 3], { extrapolateRight: "clamp" });
  const opacity = interpolate(localFrame, [0, 20], [0.6, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2px solid white",
        transform: `scale(${scale})`,
        opacity,
      }}
    />
  );
};
```

UI sizing rules for the simulated demo:
- Input fields: full safe-zone width (960px), height 72px, font 36px
- Buttons: full width, height 64px, font 36px in brand color
- Result cards: body text 36px+
- Everything must be readable on a phone screen

### Scene 4 — Product Image Showcase (5s, frames 420–570)

Display downloaded product images large — crossfade sequence.

```typescript
const ImageShowcase: React.FC<{ images: string[]; captions: string[] }> = ({ images, captions }) => {
  const frame = useCurrentFrame();
  const HOLD = 45; // 1.5s per image at 30fps

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
      {images.map((src, i) => {
        const start = i * HOLD;
        const end = start + HOLD;
        const opacity = interpolate(
          frame,
          [start, start + 8, end - 8, end],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const scale = interpolate(frame, [start, end], [0.97, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div key={i} style={{ position: "absolute", opacity, transform: `scale(${scale})`, width: 960, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
            <div style={{ position: "absolute", bottom: 20, left: 20, color: "white", fontSize: 56, fontWeight: 700, fontFamily: "Inter" }}>
              {captions[i]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

### Scene 5 — Feature Callouts (3s, frames 570–660)

Product image shrinks to 40% top, 3 feature lines stagger in below.

```typescript
// Product image scales to top
const imageScale = interpolate(frame, [0, 20], [1, 0.4], { extrapolateRight: "clamp" });
const imageY = interpolate(frame, [0, 20], [760, 200], { extrapolateRight: "clamp" });

// Feature lines: icon + text, staggered 10 frames
{features.map((feature, i) => {
  const translateX = spring({ frame: frame - i * 10, fps, config: { damping: 200 }, from: 80, to: 0 });
  const opacity = interpolate(frame, [i * 10, i * 10 + 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, transform: `translateX(${translateX}px)`, opacity, marginBottom: 24 }}>
      <span style={{ fontSize: 48 }}>{feature.icon}</span>
      <span style={{ color: "#ffffff", fontSize: 36, fontFamily: "Inter" }}>{feature.text}</span>
    </div>
  );
})}
```

### Scene 6 — Social Proof + CTA (3s, frames 660–750)

Count-up social proof number, product URL pulse, fade to black.

```typescript
// Count-up number
const count = interpolate(frame, [0, 60], [0, socialProofNumber], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

// URL pulse
const urlScale = 1 + Math.sin(frame * 0.15) * 0.015;

// Fade to black
const fadeOut = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
```

## Position Sliders (Remotion Studio controls)

Add `inputProps` so layout can be tweaked without code changes:

```typescript
// In Composition
<Composition
  id="ProductDemo"
  component={ProductDemo}
  defaultProps={{
    logoY: 400,
    demoY: 900,
    ctaY: 1700,
  }}
  // ...
/>

// In component, read via props
const ProductDemo: React.FC<{ logoY: number; demoY: number; ctaY: number }> = (props) => { ... };
```

## Background Music

```bash
# Search for upbeat EDM/techno to match product launch energy
curl "https://pixabay.com/music/search/techno+edm+upbeat/" | grep -oP 'https://[^"]+\.mp3' | head -1
curl -L "<url>" -o public/music.mp3
```

```typescript
<Audio src={staticFile("music.mp3")} volume={0.3} loop />
```

## Cursor Animation Helper

```typescript
// Interpolate cursor between waypoints
const getCursorPos = (frame: number, waypoints: Array<{ x: number; y: number; frame: number }>) => {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    if (frame >= from.frame && frame <= to.frame) {
      const t = interpolate(frame, [from.frame, to.frame], [0, 1], { extrapolateRight: "clamp" });
      const eased = Easing.inOut(Easing.cubic)(t);
      return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
    }
  }
  return waypoints[waypoints.length - 1];
};
```

## Deliverable Checklist

- [ ] Research findings shown before coding
- [ ] 6 scenes totalling ~25 seconds
- [ ] Real product images downloaded to `public/`
- [ ] Simulated demo uses React components, not screenshots
- [ ] Cursor never teleports — always animated
- [ ] All text inside safe zone
- [ ] All fonts ≥ 28px; headlines ≥ 56px
- [ ] Background music loops
- [ ] `npx remotion studio` launched

## Related Skills

- `remotion-best-practices` — core API, animation primitives, safe zones
- `remotion-education-explainer` — for topic-based explainer format instead of product format
