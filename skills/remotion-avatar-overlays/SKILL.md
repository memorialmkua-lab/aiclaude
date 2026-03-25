---
name: remotion-avatar-overlays
description: Overlay animated titles, badges, captions, and progress indicators on top of a 9:16 talking-head video (public/avatar.mp4). Claude transcribes speech with Whisper, syncs overlays to timestamps, and preserves the original video full-frame. Use when the user has a selfie-style video and wants motion graphics added on top.
origin: ECC
---

# Remotion Avatar Video with Animated Overlays

Layer animated graphics on a full-frame talking-head video — synced to what the speaker is saying. The original video is never cropped or resized. Everything lives in the open space above the speaker's head.

## When to Activate

- User places a talking-head video at `public/avatar.mp4`
- Prompt contains "Use the Remotion best practices skill" and a request for overlays
- User wants animated titles, captions, step numbers, or badges on a selfie video

## Prerequisites

Apply the `remotion-best-practices` skill first. Then follow this two-step workflow.

## Workflow

### Step 1 — Transcribe & Plan

Transcribe `public/avatar.mp4` using Whisper:

```bash
# Install whisper if needed
pip install openai-whisper

# Transcribe with word-level timestamps
whisper public/avatar.mp4 --model base --output_format json --output_dir public/
# Output: public/avatar.json
```

Analyze the transcript:
1. **Total duration** — set composition `durationInFrames = Math.round(duration * 30)`
2. **3–5 key topic segments** with start timestamps (seconds)
3. For each segment, propose an overlay graphic for the top 35% of the frame:
   - Topic title + large faded step number
   - Keyword badge / pill
   - Simple animated icon or diagram
   - Progress bar showing position in video

**Show transcript segments and proposed overlays. Wait for approval before coding.**

### Step 2 — Build the Composition

## Composition Spec

```typescript
// Duration matches the video exactly
const VIDEO_DURATION_FRAMES = Math.round(videoDurationSeconds * 30);

<Composition
  id="AvatarOverlay"
  component={AvatarOverlay}
  durationInFrames={VIDEO_DURATION_FRAMES}
  fps={30}
  width={1080}
  height={1920}
/>
```

## Safe Zone

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
// All overlay content stays in top 35-40% of frame (y: 150px–700px)
// Headlines: 56px+  Body: 36px+  Labels: 28px minimum
```

## Base Layer — Full-Frame Avatar Video

The video IS the composition. It fills edge-to-edge and is never touched.

```typescript
export const AvatarOverlay: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Base layer: full-frame video */}
      <OffthreadVideo
        src={staticFile("avatar.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Overlay layer: graphics positioned in top ~35% */}
      <AbsoluteFill>
        <TopGradient />
        <OverlayLayer />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

## Dark Gradient (top 40% only)

Ensures white text is readable against any background without covering the speaker:

```typescript
const TopGradient: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "40%",
      background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
      pointerEvents: "none",
    }}
  />
);
```

## Overlay Layer — Timed Segments

Use `Sequence` components with `from` set to the transcript timestamp:

```typescript
const OverlayLayer: React.FC<{ segments: Segment[] }> = ({ segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {segments.map((seg, i) => {
        const fromFrame = Math.round(seg.startSeconds * fps);
        const toFrame = i + 1 < segments.length
          ? Math.round(segments[i + 1].startSeconds * fps)
          : Infinity;
        const duration = Math.min(toFrame - fromFrame, 9999);

        return (
          <Sequence key={i} from={fromFrame} durationInFrames={duration}>
            <TopicOverlay
              stepNumber={i + 1}
              headline={seg.headline}
              badge={seg.badge}
              totalSegments={segments.length}
              segmentIndex={i}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

## Topic Overlay Component

Positioned in the top 35% of the frame, above the speaker's head:

```typescript
const TopicOverlay: React.FC<{
  stepNumber: number;
  headline: string;
  badge: string;
  totalSegments: number;
  segmentIndex: number;
}> = ({ stepNumber, headline, badge, totalSegments, segmentIndex }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entrance: spring in
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const headlineY = spring({ frame, fps, config: { damping: 200 }, from: 20, to: 0 });

  // Exit: fade out over last 10 frames of this segment
  // (handled automatically by Sequence durationInFrames)

  // Progress bar: fills from 0 to 100% over this segment's duration
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 960], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", top: 150, left: 60, right: 60, opacity }}>
      {/* Large faded step number — background */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: -10,
          fontSize: 200,
          fontWeight: 800,
          fontFamily: "Inter",
          color: "rgba(255,255,255,0.06)",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {String(stepNumber).padStart(2, "0")}
      </div>

      {/* Topic headline */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
          fontFamily: "Inter",
          lineHeight: 1.2,
          transform: `translateY(${headlineY}px)`,
          position: "relative",
          zIndex: 1,
          marginBottom: 16,
        }}
      >
        {headline}
      </div>

      {/* Keyword badge */}
      <div
        style={{
          display: "inline-block",
          backgroundColor: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 100,
          padding: "8px 24px",
          color: "#ffffff",
          fontSize: 32,
          fontFamily: "Inter",
          marginBottom: 20,
        }}
      >
        {badge}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, width: 960 }}>
        <div
          style={{
            height: "100%",
            backgroundColor: "#22c55e",
            borderRadius: 2,
            width: progressWidth,
          }}
        />
      </div>
    </div>
  );
};
```

## Optional — Word-Level Captions

If Whisper returns word-level timestamps (`--output_format json` with `word_timestamps: true`):

```typescript
// Load whisper word timestamps
const words: Array<{ word: string; start: number; end: number }> = whisperData.segments
  .flatMap((seg: any) => seg.words || []);

const CaptionLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current word
  const currentWord = words.find((w) => currentTime >= w.start && currentTime <= w.end);

  // Find surrounding context (current sentence)
  const sentenceWords = words.filter((w) => {
    const seg = whisperData.segments.find((s: any) => w.start >= s.start && w.end <= s.end);
    return seg && currentTime >= seg.start && currentTime <= seg.end;
  });

  const caption = sentenceWords.map((w) => w.word).join(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: 60,
        right: 60,
        textAlign: "center",
        color: "#ffffff",
        fontSize: 36,
        fontWeight: 700,
        fontFamily: "Inter",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        lineHeight: 1.4,
      }}
    >
      {sentenceWords.map((w, i) => (
        <span
          key={i}
          style={{ color: currentWord?.word === w.word ? "#6366f1" : "#ffffff" }}
        >
          {w.word}{" "}
        </span>
      ))}
    </div>
  );
};
```

## Parsing Whisper JSON Output

```typescript
import transcriptData from "./public/avatar.json";

// Whisper JSON structure
interface WhisperOutput {
  text: string;
  segments: Array<{
    id: number;
    start: number;   // seconds
    end: number;     // seconds
    text: string;
    words?: Array<{ word: string; start: number; end: number; probability: number }>;
  }>;
}

// Map to segments for overlays
const segments = transcriptData.segments.map((seg, i) => ({
  startSeconds: seg.start,
  endSeconds: seg.end,
  text: seg.text,
  headline: extractHeadline(seg.text),  // your logic to pick a headline
  badge: extractKeyword(seg.text),       // your logic to pick a keyword badge
}));
```

## Colors

| Token | Value |
|-------|-------|
| Accent | `#6366f1` (indigo) |
| Success / progress bar | `#22c55e` (green) |
| Text | `#ffffff` |
| Badge background | `rgba(255,255,255,0.12)` |

## Overlay Positioning Rules

```
Frame height:  1920px
Speaker face:  typically y 700–1920 (bottom 60%)
Open space:    y 0–700 (top ~35%)

Safe zone top: 150px
Overlay zone:  y 150–700 (550px of available space)

  ┌─────────────────────────┐  y=0
  │  status bar / search    │  150px safe zone
  ├─────────────────────────┤  y=150   ← overlays start here
  │                         │
  │   ANIMATED OVERLAYS     │  ~550px overlay zone
  │   (above speaker head)  │
  │                         │
  ├─────────────────────────┤  y=700   ← speaker's head starts
  │                         │
  │   AVATAR VIDEO          │
  │   (full frame, untouched)│
  │                         │
  ├─────────────────────────┤  y=1750  ← bottom safe zone
  │  navigation / swipe     │  170px safe zone
  └─────────────────────────┘  y=1920
```

## Anti-Patterns

- **Cropping the video** — `OffthreadVideo` must fill the full 1080×1920 frame
- **Overlaying text below y=700** — that area belongs to the speaker's face
- **Using `<Video>` instead of `<OffthreadVideo>`** — causes frame sync issues during rendering
- **Hardcoding duration** — always derive from the actual video file duration
- **Skipping Whisper** — timestamps must come from the transcript, not guesses

## Deliverable Checklist

- [ ] `public/avatar.mp4` found and duration measured
- [ ] Whisper transcription complete with timestamps
- [ ] Segment plan shown before coding
- [ ] Video plays full-frame edge-to-edge (never cropped)
- [ ] All overlays in top 35% of frame (y: 150–700)
- [ ] Dark gradient covers only top 40% of frame
- [ ] Step number, headline, badge, and progress bar per segment
- [ ] Captions added if word timestamps available
- [ ] All fonts ≥ 28px; headlines ≥ 56px
- [ ] `npx remotion studio` launched

## Related Skills

- `remotion-best-practices` — core API, animation primitives, safe zones
- `remotion-education-explainer` — for a fully animated video without a camera recording
