---
name: remotion-data-viz
description: Build a 15-second animated data dashboard video (1080x1920, 30fps) from a CSV file. Claude analyzes the data, picks chart types, and animates a vertical stack of 4 panels — KPI hero card, bar chart, donut chart, and line chart — with glass-morphism styling and background music.
origin: ECC
---

# Remotion Data Visualization Dashboard

Turn any CSV into a 15-second animated dashboard video with KPI counters, bar charts, donut charts, and line charts — all on a dark glass-morphism theme.

## When to Activate

- User places a CSV at `public/data.csv`
- Prompt contains "Use the Remotion best practices skill" and a data file
- User wants a data dashboard, infographic, or animated report video

## Prerequisites

Apply the `remotion-best-practices` skill first. Then follow this two-step workflow.

## Workflow

### Step 1 — Analyze Data

Read `public/data.csv`. Identify and show to the user before coding:

1. **Dashboard title** — a compelling headline for the data
2. **Hero KPI** — the single most impressive stat (with suffix: %, $, k, M)
3. **Bar chart data** — categorical comparison (e.g., sales by region)
4. **Donut/pie chart data** — parts of a whole (e.g., market share)
5. **Line chart data** — trend over time (e.g., monthly growth)

If the CSV doesn't have all 4 chart types, adapt: pick the best 4 visualizations for the data.

**Show proposed dashboard layout. Wait for approval before coding.**

### Step 2 — Build the Dashboard

## Composition Spec

```typescript
<Composition
  id="DataDashboard"
  component={DataDashboard}
  durationInFrames={450}   // 15s × 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

## Visual Style

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Card background | `rgba(255,255,255,0.05)` |
| Card border | `1px solid rgba(255,255,255,0.1)` |
| Primary text | `#ffffff` |
| Secondary text | `#94a3b8` |
| Accent 1 | `#6366f1` (indigo) |
| Accent 2 | `#22c55e` (green) |
| Accent 3 | `#f59e0b` (amber) |
| Accent 4 | `#ef4444` (red) |
| Font | Inter (weights 400, 600, 700, 800) |

## Safe Zone & Layout

```typescript
const SAFE = { top: 150, bottom: 170, left: 60, right: 60 };
const PANEL_GAP = 30;
const PANEL_WIDTH = 960; // 1080 - 60*2

// Vertical stack of 4 panels, each roughly equal height
// Total available: 1920 - 150 - 170 = 1600px → ~370px per panel with gaps
```

## Glass-Morphism Card Style

```typescript
const cardStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
  padding: 32,
};
```

## Panel 1 — KPI Hero Card (frames 10–120)

Counts up from 0 to the hero metric with trend indicator.

```typescript
const KPIPanel: React.FC<{
  label: string;
  value: number;
  suffix: string;
  trend: number;      // e.g., +12.5 for 12.5% YoY gain
  trendLabel: string; // e.g., "vs last year"
}> = ({ label, value, suffix, trend, trendLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card scales in
  const cardScale = spring({ frame: frame - 10, fps, config: { damping: 200 }, from: 0.8, to: 1 });
  const cardOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  // Count up
  const countedValue = interpolate(frame, [10, 80], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Trend arrow slides in after count completes
  const trendOpacity = interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" });
  const trendX = spring({ frame: frame - 80, fps, config: { damping: 200 }, from: -20, to: 0 });

  const isPositive = trend >= 0;

  return (
    <div style={{ ...cardStyle, transform: `scale(${cardScale})`, opacity: cardOpacity }}>
      <div style={{ color: "#94a3b8", fontSize: 28, fontFamily: "Inter", marginBottom: 16 }}>
        {label}
      </div>
      <div style={{ color: "#ffffff", fontSize: 88, fontWeight: 800, fontFamily: "Inter", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {formatValue(countedValue, suffix)}
      </div>
      <div style={{ opacity: trendOpacity, transform: `translateX(${trendX}px)`, display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <span style={{ color: isPositive ? "#22c55e" : "#ef4444", fontSize: 32, fontWeight: 700 }}>
          {isPositive ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
        <span style={{ color: "#64748b", fontSize: 28 }}>{trendLabel}</span>
      </div>
    </div>
  );
};

// Format helper
const formatValue = (n: number, suffix: string): string => {
  if (suffix === "k") return `${(n / 1000).toFixed(0)}k`;
  if (suffix === "M") return `${(n / 1_000_000).toFixed(1)}M`;
  if (suffix === "%") return `${n.toFixed(1)}%`;
  if (suffix === "$") return `$${Math.round(n).toLocaleString()}`;
  return Math.round(n).toLocaleString();
};
```

## Panel 2 — Bar Chart (frames 25–180)

Horizontal bars grow from 0, staggered by index.

```typescript
const BarChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  color?: string;
}> = ({ data, color = "#6366f1" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...data.map((d) => d.value));
  const maxBarWidth = 700; // px, leaving room for labels

  return (
    <div style={cardStyle}>
      <div style={{ color: "#ffffff", fontSize: 36, fontWeight: 700, fontFamily: "Inter", marginBottom: 24 }}>
        By Category
      </div>
      {data.map((item, i) => {
        const barWidth = spring({
          frame: frame - 25 - i * 10,
          fps,
          config: { damping: 200 },
          from: 0,
          to: (item.value / maxValue) * maxBarWidth,
        });
        const valueOpacity = interpolate(
          frame,
          [25 + i * 10 + 20, 25 + i * 10 + 35],
          [0, 1],
          { extrapolateRight: "clamp" }
        );

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ color: "#94a3b8", fontSize: 28, fontFamily: "Inter", width: 200, textAlign: "right", flexShrink: 0 }}>
              {item.label}
            </div>
            <div style={{ position: "relative", height: 44 }}>
              <div
                style={{
                  height: 44,
                  width: barWidth,
                  background: `linear-gradient(90deg, ${color} 0%, #8b5cf6 100%)`,
                  borderRadius: "0 8px 8px 0",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: -60,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#ffffff",
                  fontSize: 28,
                  fontFamily: "Inter",
                  fontWeight: 600,
                  opacity: valueOpacity,
                }}
              >
                {item.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

## Panel 3 — Donut Chart (frames 50–270)

SVG donut segments draw clockwise, legend fades in.

```typescript
const DonutChart: React.FC<{
  data: Array<{ label: string; value: number }>;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const RADIUS = 80;
  const STROKE_WIDTH = 24;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const CENTER = 120;

  // Each segment draws in sequence
  let cumulativePercent = 0;
  const segments = data.map((item, i) => {
    const percent = item.value / total;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    const startAngle = startPercent * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;

    // Draw this segment after previous finishes
    const prevFrames = data.slice(0, i).reduce((sum, d) => sum + Math.round((d.value / total) * 60), 0);
    const segFrames = Math.round(percent * 60);
    const localFrame = Math.max(0, frame - 50 - prevFrames);
    const drawProgress = interpolate(localFrame, [0, segFrames], [0, 1], { extrapolateRight: "clamp" });

    return { item, percent, startAngle, endAngle, drawProgress, color: COLORS[i % COLORS.length] };
  });

  // SVG arc path helper
  const describeArc = (startAngle: number, endAngle: number, progress: number) => {
    const actualEnd = startAngle + (endAngle - startAngle) * progress;
    const x1 = CENTER + RADIUS * Math.cos(startAngle);
    const y1 = CENTER + RADIUS * Math.sin(startAngle);
    const x2 = CENTER + RADIUS * Math.cos(actualEnd);
    const y2 = CENTER + RADIUS * Math.sin(actualEnd);
    const largeArc = (endAngle - startAngle) * progress > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 40 }}>
      <svg width={240} height={240} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
        {/* Track */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE_WIDTH} />
        {/* Segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(seg.startAngle, seg.endAngle, seg.drawProgress)}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Legend */}
      <div>
        {segments.map((seg, i) => {
          const legendOpacity = interpolate(frame, [50 + i * 12, 50 + i * 12 + 15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, opacity: legendOpacity }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: seg.color, flexShrink: 0 }} />
              <span style={{ color: "#94a3b8", fontSize: 28, fontFamily: "Inter" }}>
                {seg.item.label}
              </span>
              <span style={{ color: "#ffffff", fontSize: 28, fontFamily: "Inter", fontWeight: 600, marginLeft: "auto" }}>
                {(seg.percent * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## Panel 4 — Line Chart (frames 70–360)

SVG polyline draws left to right, data points pop in as the line reaches them.

```typescript
const LineChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  color?: string;
}> = ({ data, color = "#22c55e" }) => {
  const frame = useCurrentFrame();

  const CHART_WIDTH = 880;
  const CHART_HEIGHT = 200;
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));

  // Map data to SVG coords
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((d.value - minVal) / (maxVal - minVal)) * CHART_HEIGHT,
    label: d.label,
    value: d.value,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Total polyline length (approximate)
  const totalLength = points.reduce((len, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return len + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  // Draw progress
  const drawProgress = interpolate(frame, [70, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gradient fill reveal
  const fillOpacity = interpolate(frame, [100, 200], [0, 0.15], { extrapolateRight: "clamp" });

  return (
    <div style={cardStyle}>
      <div style={{ color: "#ffffff", fontSize: 36, fontWeight: 700, fontFamily: "Inter", marginBottom: 24 }}>
        Trend Over Time
      </div>

      <svg width={CHART_WIDTH} height={CHART_HEIGHT + 50} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 50}`}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <clipPath id="progressClip">
            <rect x={0} y={0} width={CHART_WIDTH * drawProgress} height={CHART_HEIGHT + 50} />
          </clipPath>
        </defs>

        {/* Gradient fill */}
        <polyline
          points={`0,${CHART_HEIGHT} ${polylinePoints} ${CHART_WIDTH},${CHART_HEIGHT}`}
          fill={`url(#lineGrad)`}
          stroke="none"
          opacity={fillOpacity}
          clipPath="url(#progressClip)"
        />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#progressClip)"
        />

        {/* Data point circles */}
        {points.map((p, i) => {
          const pointFrame = 70 + Math.round((i / (data.length - 1)) * 280);
          const pointScale = spring({
            frame: frame - pointFrame,
            fps: 30,
            config: { damping: 200 },
            from: 0,
            to: 1,
          });
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={6 * pointScale} fill={color} />
              <text
                x={p.x}
                y={CHART_HEIGHT + 30}
                textAnchor="middle"
                fill="#64748b"
                fontSize={22}
                fontFamily="Inter"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
```

## Reusable CountUp Component

```typescript
const CountUp: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  endFrame: number;
  suffix?: string;
  decimals?: number;
}> = ({ from, to, startFrame, endFrame, suffix = "", decimals = 0 }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}
      {suffix}
    </span>
  );
};
```

## CSV Parsing

```typescript
// Parse CSV in a Node.js script, then import the result as JSON
// scripts/parse-csv.js
const fs = require("fs");
const lines = fs.readFileSync("public/data.csv", "utf8").trim().split("\n");
const headers = lines[0].split(",").map((h) => h.trim());
const rows = lines.slice(1).map((line) => {
  const values = line.split(",");
  return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim()]));
});
fs.writeFileSync("src/data.json", JSON.stringify(rows, null, 2));
```

```bash
node scripts/parse-csv.js
```

Then import in your component:
```typescript
import data from "./data.json";
```

## Scene Timing

| Panel | Start frame | Notes |
|-------|-------------|-------|
| Title + source | 0 | fade in, stays throughout |
| KPI Hero Card | 10 | scale in, count up |
| Bar Chart | 25 | bars grow staggered |
| Donut Chart | 50 | segments draw sequentially |
| Line Chart | 70 | line draws left to right |

## Background Music

```bash
# Lo-fi or electronic beat to match data dashboard energy
curl "https://pixabay.com/music/search/lo-fi+beat/" | grep -oP 'https://[^"]+\.mp3' | head -1
curl -L "<url>" -o public/music.mp3
```

```typescript
<Audio src={staticFile("music.mp3")} volume={0.3} loop />
```

## Deliverable Checklist

- [ ] CSV analyzed and layout proposed before coding
- [ ] 4 chart panels with correct data from the CSV
- [ ] KPI card uses count-up with appropriate suffix
- [ ] Bar chart bars grow with staggered spring
- [ ] Donut chart segments draw clockwise in sequence
- [ ] Line chart draws left to right with point pop-ins
- [ ] All cards use glass-morphism style
- [ ] All text inside safe zone
- [ ] All fonts ≥ 28px; headlines ≥ 56px
- [ ] Background music loops
- [ ] `npx remotion studio` launched

## Related Skills

- `remotion-best-practices` — core API, animation primitives, safe zones
- `remotion-education-explainer` — when you want to narrate the data story as an explainer
