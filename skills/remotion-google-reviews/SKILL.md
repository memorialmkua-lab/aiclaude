---
name: remotion-google-reviews
description: Build a 20-second testimonial video (1080x1920, 30fps) from a Google Business Profile URL. Claude scrapes real star rating, review count, and customer reviews, then creates an animated testimonial with star-fill animations, a review carousel, and a CTA. Use when the user wants a review/social-proof video for a local business.
origin: ECC
---

# Remotion Google Reviews Testimonial Video

Generate a polished testimonial ad using real customer reviews scraped from a Google Business Profile. Features star animations, a sliding review carousel, social proof counters, and a CTA — all on a clean light theme.

## When to Activate

- User provides a Google Maps or Google Business Profile URL
- Prompt contains "Use the Remotion best practices skill" and a Google Business link
- User wants a testimonial, review, or social-proof video for a business

## Prerequisites

Apply the `remotion-best-practices` skill first. Then follow this two-step workflow.

## Workflow

### Step 1 — Scrape Reviews

Visit the Google Business Profile URL using Playwright (or browser automation). Extract:

1. **Business name + category**
2. **Overall star rating** (e.g., 4.8)
3. **Total review count** (e.g., "2,340 reviews")
4. **3 best reviews** — 5-star, compelling text, with reviewer first name
5. **Business photo or logo** — screenshot to `public/business.png` if available

If Playwright can't load Google reviews directly, try:
- Search `"[business name]" site:google.com/maps reviews`
- Scrape the Google search results card
- Use the Google Maps embed page

**Show business info and 3 selected reviews. Wait for approval before coding.**

### Step 2 — Build 5 Scenes

Total duration: 20 seconds (600 frames at 30fps).

## Composition Spec

```typescript
<Composition
  id="GoogleReviews"
  component={GoogleReviews}
  durationInFrames={600}   // 20s × 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

## Color Theme (Light)

| Token | Value |
|-------|-------|
| Background | `#f8f9fa` |
| Card background | `#ffffff` |
| Primary text | `#1a1a1a` |
| Secondary text | `#64748b` |
| Card border | `#e2e8f0` |
| Accent / stars / CTA | `#f59e0b` (gold) |
| Font | Inter (weights 400, 600, 700, 800) |

## Safe Zone

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
// Headlines: 56px+  Body: 36px+  Labels: 28px minimum
```

## Scene Breakdown

### Scene 1 — Hook (3s, frames 0–90)

Business introduction on warm gradient background.

```typescript
const HookScene: React.FC<{ businessName: string; rating: number }> = ({ businessName, rating }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textY = spring({ frame, fps, config: { damping: 200 }, from: 40, to: 0 });
  const textOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Stars fade in after text
  const starsOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fff7ed 0%, #f8f9fa 60%)",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      {/* Decorative background stars */}
      <div style={{ position: "absolute", top: 160, right: 80, opacity: 0.12 }}>
        <StarCluster size={200} color="#f59e0b" />
      </div>

      <div style={{ transform: `translateY(${textY}px)`, opacity: textOpacity, textAlign: "center" }}>
        <div style={{ color: "#1a1a1a", fontSize: 44, fontWeight: 700, fontFamily: "Inter", marginBottom: 12 }}>
          What people are saying about
        </div>
        <div style={{ color: "#f59e0b", fontSize: 56, fontWeight: 800, fontFamily: "Inter" }}>
          {businessName}
        </div>
      </div>

      <div style={{ opacity: starsOpacity, marginTop: 40, display: "flex", alignItems: "center", gap: 8 }}>
        <StarRow count={5} filled={rating} size={40} color="#f59e0b" />
        <span style={{ color: "#1a1a1a", fontSize: 40, fontWeight: 700, fontFamily: "Inter" }}>{rating}</span>
      </div>
    </AbsoluteFill>
  );
};
```

### Scene 2 — Star Rating Reveal (3s, frames 90–180)

Five stars fill in one by one, rating counts up.

```typescript
const StarRatingScene: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stars fill left to right, 8-frame stagger
  const stars = [1, 2, 3, 4, 5].map((star) => {
    const startFrame = (star - 1) * 8;
    const progress = interpolate(frame, [startFrame, startFrame + 12], [0, 1], { extrapolateRight: "clamp" });
    // For partial stars (e.g., 4.8 → 5th star = 80%)
    const fill = star < Math.floor(rating) + 1 ? progress : progress * (rating % 1 || 1);
    return fill;
  });

  // Rating number counts up
  const countedRating = interpolate(frame, [10, 50], [0, rating], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Review count counts up
  const countedReviews = interpolate(frame, [15, 60], [0, reviewCount], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: "#f8f9fa", justifyContent: "center", alignItems: "center" }}>
      {/* Shimmer behind stars */}
      <GoldShimmer frame={frame} />

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {stars.map((fill, i) => (
          <AnimatedStar key={i} fill={fill} size={60} color="#f59e0b" />
        ))}
      </div>

      <div style={{ color: "#1a1a1a", fontSize: 72, fontWeight: 800, fontFamily: "Inter", fontVariantNumeric: "tabular-nums" }}>
        {countedRating.toFixed(1)}
      </div>
      <div style={{ color: "#64748b", fontSize: 36, fontFamily: "Inter", marginTop: 12 }}>
        Based on {Math.round(countedReviews).toLocaleString()} reviews
      </div>
    </AbsoluteFill>
  );
};
```

### Scene 3 — Review Carousel (9s, frames 180–450)

Three reviews × 3 seconds each, sliding transitions.

```typescript
const ReviewCarouselScene: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
  const frame = useCurrentFrame();
  const REVIEW_DURATION = 90; // 3s per review

  return (
    <AbsoluteFill style={{ background: "#f8f9fa" }}>
      <TransitionSeries>
        {reviews.map((review, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={REVIEW_DURATION}>
              <ReviewCard review={review} frame={frame} />
            </TransitionSeries.Sequence>
            {i < reviews.length - 1 && (
              <TransitionSeries.Transition
                presentation={slide({ direction: "from-right" })}
                timing={springTiming({ config: { damping: 200 }, durationInFrames: 12 })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>

      {/* Dot progress indicator */}
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 }}>
        {reviews.map((_, i) => {
          const reviewIndex = Math.floor(frame / REVIEW_DURATION);
          return (
            <div
              key={i}
              style={{
                width: reviewIndex === i ? 24 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: reviewIndex === i ? "#f59e0b" : "#e2e8f0",
                transition: "all 0.3s",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Individual review card
const ReviewCard: React.FC<{ review: Review; frame: number }> = ({ review, frame }) => {
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 200 }, from: 0.95, to: 1 });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Large decorative quotation mark above */}
      <div style={{ position: "absolute", top: 160, left: 60, opacity: 0.1, color: "#f59e0b", fontSize: 200, fontWeight: 800, lineHeight: 1 }}>
        "
      </div>

      {/* Review card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: 48,
          width: "100%",
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Stars */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <StarSVG key={s} size={28} color="#f59e0b" filled />
          ))}
        </div>

        {/* Review text */}
        <p style={{ color: "#1a1a1a", fontSize: 36, fontFamily: "Inter", lineHeight: 1.5, margin: 0, marginBottom: 24 }}>
          "{review.text}"
        </p>

        {/* Reviewer */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GoogleGLogo size={28} />
          <span style={{ color: "#64748b", fontSize: 28, fontFamily: "Inter" }}>
            {review.name} · Google Review
          </span>
        </div>
      </div>

      {/* Decorative element below card */}
      <ReviewDecoration review={review} frame={frame} />
    </AbsoluteFill>
  );
};
```

Decorative elements below each review card (pick one per review):
- **Review 1**: Animated rating distribution bar chart (5 bars, gold fill, spring animation)
- **Review 2**: Thumbs-up SVG + count-up of total reviews
- **Review 3**: Map pin SVG + business location text with pulse animation

### Scene 4 — Social Proof Stack (3s, frames 450–540)

Three stat lines stagger in from bottom.

```typescript
const stats = [
  { icon: "⭐", text: `${rating} star rating` },
  { icon: "👥", text: `${reviewCount}+ happy customers` },
  { icon: "📍", text: `${city}, ${state}` },
];

{stats.map((stat, i) => {
  const translateY = spring({
    frame: frame - i * 10,
    fps,
    config: { damping: 200 },
    from: 50,
    to: 0,
  });
  const opacity = interpolate(frame, [i * 10, i * 10 + 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      key={i}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        transform: `translateY(${translateY}px)`,
        opacity,
        marginBottom: 32,
      }}
    >
      <span style={{ fontSize: 48 }}>{stat.icon}</span>
      <span style={{ color: "#1a1a1a", fontSize: 40, fontWeight: 600, fontFamily: "Inter" }}>{stat.text}</span>
    </div>
  );
})}
```

### Scene 5 — CTA (2s, frames 540–600)

Business name + CTA button + contact info. No fade to black — end on clean background.

```typescript
const CTAScene: React.FC<{ businessName: string; ctaText: string; url: string }> = ({ businessName, ctaText, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameScale = spring({ frame, fps, config: { damping: 200 }, from: 0.8, to: 1 });
  const buttonY = spring({ frame: frame - 15, fps, config: { damping: 200 }, from: 40, to: 0 });

  return (
    <AbsoluteFill style={{ background: "#f8f9fa", justifyContent: "center", alignItems: "center", paddingLeft: 60, paddingRight: 60 }}>
      <div style={{ color: "#1a1a1a", fontSize: 56, fontWeight: 800, fontFamily: "Inter", textAlign: "center", transform: `scale(${nameScale})`, marginBottom: 48 }}>
        {businessName}
      </div>

      <div style={{ transform: `translateY(${buttonY}px)`, width: "100%" }}>
        {/* CTA button */}
        <div style={{
          backgroundColor: "#f59e0b",
          borderRadius: 16,
          padding: "24px 0",
          textAlign: "center",
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 700,
          fontFamily: "Inter",
          marginBottom: 24,
        }}>
          {ctaText}
        </div>

        {/* URL / phone */}
        <div style={{ color: "#64748b", fontSize: 36, fontFamily: "Inter", textAlign: "center" }}>
          {url}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

## Star SVG Component

Build stars as SVG — no emoji, for precise fill control:

```typescript
const StarSVG: React.FC<{ size: number; color: string; filled?: boolean; fillPercent?: number }> = ({
  size, color, filled = true, fillPercent = 1,
}) => {
  const id = `star-clip-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={24 * fillPercent} height={24} />
        </clipPath>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={1.5}
        clipPath={filled ? `url(#${id})` : undefined}
      />
    </svg>
  );
};
```

## Google "G" Logo SVG

```typescript
const GoogleGLogo: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
```

## Background Music

```bash
# Smooth jazz / jazz piano for a warm, trustworthy feel
curl "https://pixabay.com/music/search/jazz+piano+smooth/" | grep -oP 'https://[^"]+\.mp3' | head -1
curl -L "<url>" -o public/music.mp3
```

```typescript
<Audio src={staticFile("music.mp3")} volume={0.25} loop />
```

## Deliverable Checklist

- [ ] Reviews scraped and shown before coding
- [ ] 5 scenes totalling ~20 seconds
- [ ] Light theme throughout (`#f8f9fa` background)
- [ ] Stars built as SVG with precise fill control
- [ ] Google "G" logo in review cards
- [ ] Review carousel with slide transitions
- [ ] Progress dots below carousel
- [ ] All text inside safe zone
- [ ] All fonts ≥ 28px; headlines ≥ 56px
- [ ] Background music (smooth jazz) loops
- [ ] `npx remotion studio` launched

## Related Skills

- `remotion-best-practices` — core API, animation primitives, safe zones
- `remotion-product-demo` — for a product ad format instead of testimonial format
