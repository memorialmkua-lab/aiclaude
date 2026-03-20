---
name: figma-to-powerbi
description: "Convert Figma dashboard designs into PowerBI reports — extract layout, colors, typography, generate PowerBI theme JSON, report layout definitions, PBIR scaffolding, and implementation instructions"
origin: ECC
---


# Figma to PowerBI

Convert Figma dashboard designs into functional PowerBI reports. This skill extracts layout structure, color palettes, typography, and component hierarchy from Figma files, maps them to PowerBI equivalents, and generates theme JSON, report layout definitions, and step-by-step implementation instructions. Used by designers and analysts who prototype dashboards in Figma and need to faithfully reproduce them in PowerBI Desktop.

## When to Use

### Must Use (auto-trigger)
- User has a Figma file URL and wants a PowerBI report that matches the design
- User wants to extract a PowerBI theme JSON from a Figma design
- User has a Figma dashboard mockup and needs PowerBI implementation guidance
- User wants to map Figma components to PowerBI visual types

### Recommended (manual trigger)
- User describes a dashboard design verbally and wants both Figma structure and PowerBI output
- User has design tokens or a style guide and wants a PowerBI theme
- User wants to audit whether a PowerBI report matches a Figma design

### Skip (anti-trigger)
- User wants to design a dashboard in Figma (use frontend-designer instead)
- User wants to build a PowerBI data model, write DAX, or set up data connections only
- User wants to embed an existing PowerBI report in a web app
- User wants to create a Figma prototype or component library
- User wants to convert Figma to HTML/CSS/React (use frontend-designer instead)

## Protocol

### Step 1: Gather the Figma Source

Determine what the user has:

**Option A -- Figma file URL provided:**
1. Ask for the user's Figma Personal Access Token (if not already available)
2. Extract the file key from the URL: `https://www.figma.com/file/{FILE_KEY}/...`
3. Call the Figma REST API: `GET https://api.figma.com/v1/files/{FILE_KEY}` with header `X-Figma-Token: {TOKEN}`
4. Parse the returned JSON node tree (DOCUMENT > CANVAS pages > child nodes)

**Option B -- Design description provided (no Figma file):**
1. Ask clarifying questions: How many pages? What chart types? What KPIs? What color scheme?
2. Build a synthetic component tree based on the description
3. Proceed to Step 2 with the synthetic tree

**Option C -- Figma file exported as JSON or screenshots:**
1. Parse the provided JSON or analyze the screenshots
2. Identify frames, text elements, shapes, and colors
3. Build a component tree from the available information

### Step 2: Extract Design Structure

Walk the Figma node tree and extract:

**Layout:**
- Top-level FRAME nodes = report pages
- Child FRAME nodes with auto-layout = visual containers
- absoluteBoundingBox (x, y, width, height) = positioning coordinates
- layoutMode (HORIZONTAL/VERTICAL) = row/column arrangement
- itemSpacing, paddingLeft/Right/Top/Bottom = spacing values

**Colors:**
- fills[].color (r, g, b, a) on FRAME/RECTANGLE nodes = background colors
- fills[].color on TEXT nodes = text colors
- Convert RGBA (0-1 float) to hex: `#RRGGBB`
- Collect unique colors into a palette, ordered by frequency of use

**Typography:**
- style.fontFamily, style.fontSize, style.fontWeight on TEXT nodes
- Group into text classes: title (largest), subtitle, body, caption, metric/callout
- Note: PowerBI may not have the exact font -- map to closest available

**Components:**
- TEXT nodes with numeric content or placeholder text (e.g., "$1.2M", "###") = KPI cards
- RECTANGLE/FRAME nodes with chart-like children = chart placeholders
- Nodes named with keywords like "bar", "line", "pie", "donut", "table" = chart type hints
- FRAME nodes with repeating child patterns = tables or matrices

Build a structured inventory:

```
Page: "Sales Overview"
  Container: KPI Row (x:0, y:0, w:1280, h:200, layout:horizontal)
    Card: Revenue (type:kpi, value:"$1.2M", color:#1A3C5E)
    Card: Orders (type:kpi, value:"4,521", color:#2E7D32)
    Card: Growth (type:kpi, value:"+12%", color:#E65100)
  Container: Charts Row (x:0, y:220, w:1280, h:400, layout:horizontal)
    Chart: Monthly Revenue (type:bar, w:640, h:400)
    Chart: Category Split (type:pie, w:640, h:400)
  Container: Detail Table (x:0, y:640, w:1280, h:300)
    Table: Sales Detail (type:table, columns:6)
```

### Step 3: Map Figma Elements to PowerBI Visuals

Use this mapping reference:

| Figma Element | Detection Criteria | PowerBI Visual | Visual Type ID |
|---|---|---|---|
| Frame (top-level) | Direct child of CANVAS | Report Page | (page) |
| Frame with auto-layout | layoutMode set, contains children | Visual group/section | (container) |
| Text with large font + number | fontSize >= 24, numeric content | Card visual | card |
| Text with label + number pair | Label text above/beside metric | Multi-row card | multiRowCard |
| Rectangle/Frame named "*bar*" | Name contains "bar" or tall-narrow children | Clustered bar chart | clusteredBarChart |
| Rectangle/Frame named "*column*" | Name contains "column" | Clustered column chart | clusteredColumnChart |
| Rectangle/Frame named "*line*" | Name contains "line" or has path-like shapes | Line chart | lineChart |
| Rectangle/Frame named "*pie*" or circle | Circular shape or name contains "pie" | Pie chart | pieChart |
| Rectangle/Frame named "*donut*" | Name contains "donut" | Donut chart | donutChart |
| Rectangle/Frame with grid children | Repeating rows/columns pattern | Table | tableEx |
| Rectangle/Frame named "*matrix*" | Name contains "matrix" or pivot | Matrix | pivotTable |
| Frame named "*filter*" or "*slicer*" | Name contains "filter"/"slicer" | Slicer | slicer |
| Frame named "*map*" | Name contains "map" or geo reference | Map / Filled map | map / filledMap |
| Rectangle with image fill | Has image fill type | Image | image |
| Text block (paragraph) | Multi-line text, body font size | Text box | textbox |
| Frame named "*gauge*" | Name contains "gauge" or semicircle shape | Gauge | gauge |
| Frame named "*kpi*" | Name contains "KPI" | KPI visual | kpi |
| Frame named "*treemap*" | Name contains "treemap" | Treemap | treemap |
| Frame named "*waterfall*" | Name contains "waterfall" | Waterfall chart | waterfallChart |
| Frame named "*scatter*" | Name contains "scatter" | Scatter chart | scatterChart |
| Frame named "*funnel*" | Name contains "funnel" | Funnel chart | funnel |

**Ambiguous elements:** When a Figma element could map to multiple PowerBI visuals, ask the user. Present the options with visual descriptions and let them choose.

### Step 4: Generate PowerBI Theme JSON

Convert extracted design tokens into a PowerBI theme file:

```json
{
  "name": "Theme Name from Figma File",
  "dataColors": [
    "#hex1", "#hex2", "#hex3", "#hex4",
    "#hex5", "#hex6", "#hex7", "#hex8"
  ],
  "background": "#canvas-background-hex",
  "foreground": "#primary-text-hex",
  "tableAccent": "#primary-accent-hex",
  "textClasses": {
    "callout": {
      "fontSize": 28,
      "fontFace": "Figma-Title-Font-or-Fallback",
      "color": "#metric-text-hex"
    },
    "title": {
      "fontSize": 14,
      "fontFace": "Figma-Subtitle-Font-or-Fallback",
      "color": "#title-text-hex"
    },
    "header": {
      "fontSize": 12,
      "fontFace": "Figma-Body-Font-or-Fallback",
      "color": "#header-text-hex"
    },
    "label": {
      "fontSize": 10,
      "fontFace": "Figma-Body-Font-or-Fallback",
      "color": "#label-text-hex"
    }
  },
  "visualStyles": {
    "*": {
      "*": {
        "background": [{"color": {"solid": {"color": "#visual-bg-hex"}}}],
        "border": [{"show": true, "color": "#border-hex", "radius": 8}],
        "shadow": [{"show": false}]
      }
    }
  }
}
```

**Font mapping rules:**
| Figma Font | PowerBI Fallback | Notes |
|---|---|---|
| Inter, SF Pro, Helvetica Neue | Segoe UI | Default PowerBI system font |
| Roboto | Segoe UI | Close match |
| Playfair Display, Merriweather | Georgia | Serif fallback |
| JetBrains Mono, Fira Code | Consolas | Monospace fallback |
| Poppins, Nunito, Open Sans | Segoe UI | Sans-serif fallback |
| Any Google Font installed locally | Use as-is | Only works if font is installed on all viewers' machines |

**Color extraction rules:**
1. `dataColors` -- collect the 8 most prominent accent colors from the Figma file (chart fills, KPI backgrounds, icon colors). Order by visual weight/importance.
2. `background` -- the canvas/page background fill color.
3. `foreground` -- the primary body text color.
4. `tableAccent` -- the most prominent accent/brand color (used for table headers, slicer highlights).

### Step 5: Generate Report Layout Specification

For each page, produce a layout specification that the user can recreate in PowerBI Desktop. Use the PowerBI coordinate system (default canvas: 1280 x 720 pixels).

**Coordinate conversion from Figma:**
1. Get the Figma frame dimensions (the top-level frame acting as the page)
2. Calculate scale factors: `scaleX = 1280 / figmaFrameWidth`, `scaleY = 720 / figmaFrameHeight`
3. For each child element: `pbiX = (figmaX - frameX) * scaleX`, `pbiY = (figmaY - frameY) * scaleY`
4. Similarly scale width and height

Produce a per-page layout table:

```
Page: "Sales Overview" (1280 x 720)
| Visual | Type | X | Y | Width | Height | Config Notes |
|--------|------|---|---|-------|--------|-------------|
| Revenue KPI | card | 20 | 20 | 290 | 160 | callout: "$1.2M", color: #1A3C5E |
| Orders KPI | card | 330 | 20 | 290 | 160 | callout: "4,521", color: #2E7D32 |
| Growth KPI | card | 640 | 20 | 290 | 160 | callout: "+12%", color: #E65100 |
| Monthly Rev | clusteredColumnChart | 20 | 200 | 620 | 350 | x-axis: Month, y-axis: Revenue |
| Category Split | pieChart | 660 | 200 | 600 | 350 | legend: bottom |
| Sales Detail | tableEx | 20 | 570 | 1240 | 130 | columns: Region, Product, Revenue, Qty, Growth, Status |
```

### Step 6: Generate PBIR Files (Advanced -- Optional)

If the user wants machine-readable output for the new PBIR format (PowerBI Enhanced Report Format, default from March 2026):

**report.json:**
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/1.0.0/schema.json",
  "themeCollection": {
    "baseTheme": {"name": "Custom Figma Theme", "reportVersionAtImport": "5.53", "type": "ResourcePackage"}
  },
  "layoutOptimization": 0
}
```

**For each page, create a folder with page.json:**
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/1.0.0/schema.json",
  "name": "Sales Overview",
  "displayName": "Sales Overview",
  "displayOption": 1,
  "height": 720,
  "width": 1280
}
```

**For each visual, create a folder with visual.json:**
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/1.0.0/schema.json",
  "name": "visual_revenue_kpi",
  "position": {"x": 20, "y": 20, "z": 0, "width": 290, "height": 160},
  "visual": {"visualType": "card"}
}
```

Note: PBIR files require data binding configuration that depends on the actual data model. Generate the structural scaffolding and document where data bindings need to be added.

### Step 7: Deliver Implementation Guide

Produce a step-by-step guide the user follows in PowerBI Desktop:

1. **Import theme:** View > Themes > Browse for themes > select the generated JSON file
2. **Create pages:** For each page in the layout spec, add a new page and rename it
3. **Place visuals:** For each visual in the layout table, add the visual type from the Visualizations pane and resize/position it according to the coordinates
4. **Configure visuals:** Drag data fields into the visual's field wells (Values, Axis, Legend, etc.) per the config notes
5. **Apply formatting:** Use the Format pane to match remaining Figma details (borders, shadows, padding, conditional formatting)
6. **Final review:** Compare PowerBI output side-by-side with the Figma design and adjust pixel-level differences

### Step 8: Handle Data Model (If Provided)

If the user provides a data source or schema:

1. **Generate Power Query M code** for each data connection:
```
let
    Source = Sql.Database("server", "database"),
    Table = Source{[Schema="dbo", Item="SalesData"]}[Data],
    #"Selected Columns" = Table.SelectColumns(Table, {"Date", "Region", "Product", "Revenue", "Quantity"})
in
    #"Selected Columns"
```

2. **Generate DAX measures** for KPIs identified in the Figma design:
```
Total Revenue = SUM(Sales[Revenue])
Revenue Growth = DIVIDE([Total Revenue] - CALCULATE([Total Revenue], DATEADD(Dates[Date], -1, YEAR)), CALCULATE([Total Revenue], DATEADD(Dates[Date], -1, YEAR)))
Order Count = COUNTROWS(Sales)
```

3. **Map data fields to visuals** in the layout specification.

## Key Rules

- NEVER modify the Figma file -- this skill is read-only extraction
- NEVER assume chart types from ambiguous shapes -- ask the user when uncertain
- NEVER hardcode data values from Figma mockup text into DAX measures -- those are placeholder values
- NEVER skip font mapping -- always provide a PowerBI-compatible fallback for every Figma font
- NEVER generate a theme with fewer than 6 dataColors -- PowerBI charts cycle through these colors and too few creates visual repetition
- ALWAYS convert Figma RGBA (0-1 float range) to hex before using in PowerBI theme JSON
- ALWAYS scale coordinates proportionally when Figma frame size differs from PowerBI canvas (1280x720)
- ALWAYS include the theme JSON as the first output -- it is the highest-value, lowest-effort artifact
- ALWAYS warn when a Figma font is not available in PowerBI by default and explain the installation requirement
- ALWAYS preserve the visual hierarchy from the Figma design -- if something is prominent in Figma, it should be prominent in PowerBI

## Output Format

The skill produces these artifacts (in order of priority):

| Artifact | Format | File | When |
|---|---|---|---|
| PowerBI Theme | JSON | `{project-name}-theme.json` | Always |
| Layout Specification | Markdown table | Inline in response | Always |
| Implementation Guide | Numbered steps | Inline in response | Always |
| PBIR Report Files | JSON (folder structure) | `{project-name}-pbir/` folder | On request or for complex reports |
| Power Query M Code | M language | Inline or `.pq` file | When data source is provided |
| DAX Measures | DAX | Inline or `.dax` file | When data model is provided |
| Mapping Audit | Markdown table | Inline in response | When Figma has ambiguous elements |

## Examples

### Example 1 -- Simple KPI Dashboard

**Input:** "Convert this Figma sales dashboard to PowerBI. It has 3 KPI cards at the top (Revenue, Orders, Growth Rate), a bar chart showing monthly revenue, and a pie chart for revenue by category. Colors are navy (#1A3C5E), green (#2E7D32), orange (#E65100), with white background and dark gray text."

**Output:**

Theme JSON:
```json
{
  "name": "Sales Dashboard",
  "dataColors": ["#1A3C5E", "#2E7D32", "#E65100", "#1565C0", "#6A1B9A", "#00838F", "#AD1457", "#F57F17"],
  "background": "#FFFFFF",
  "foreground": "#333333",
  "tableAccent": "#1A3C5E",
  "textClasses": {
    "callout": {"fontSize": 28, "fontFace": "Segoe UI Semibold", "color": "#1A3C5E"},
    "title": {"fontSize": 14, "fontFace": "Segoe UI Semibold", "color": "#333333"},
    "header": {"fontSize": 12, "fontFace": "Segoe UI", "color": "#555555"},
    "label": {"fontSize": 10, "fontFace": "Segoe UI", "color": "#777777"}
  },
  "visualStyles": {
    "*": {
      "*": {
        "background": [{"color": {"solid": {"color": "#FFFFFF"}}}],
        "border": [{"show": true, "color": "#E0E0E0", "radius": 8}],
        "shadow": [{"show": true, "color": "#00000010", "preset": "bottomRight"}]
      }
    }
  }
}
```

Layout:
```
Page: "Sales Overview" (1280 x 720)
| Visual | Type | X | Y | Width | Height |
|--------|------|---|---|-------|--------|
| Revenue | card | 20 | 20 | 400 | 160 |
| Orders | card | 440 | 20 | 400 | 160 |
| Growth Rate | card | 860 | 20 | 400 | 160 |
| Monthly Revenue | clusteredColumnChart | 20 | 200 | 740 | 500 |
| Revenue by Category | pieChart | 780 | 200 | 480 | 500 |
```

### Example 2 -- Design Token Extraction Only

**Input:** "I just need the PowerBI theme from this Figma file. Colors are: primary #D04A02, secondary #2D2D2D, background #F5F5F5, accent #E8732A. Fonts: Helvetica Neue for headings, Arial for body."

**Output:**

```json
{
  "name": "Brand Theme",
  "dataColors": ["#D04A02", "#E8732A", "#2D2D2D", "#5C5C5C", "#8B8B8B", "#B85C1A", "#FF8A3D", "#1A1A1A"],
  "background": "#F5F5F5",
  "foreground": "#2D2D2D",
  "tableAccent": "#D04A02",
  "textClasses": {
    "callout": {"fontSize": 28, "fontFace": "Segoe UI Semibold", "color": "#2D2D2D"},
    "title": {"fontSize": 14, "fontFace": "Segoe UI Semibold", "color": "#2D2D2D"},
    "header": {"fontSize": 12, "fontFace": "Segoe UI", "color": "#5C5C5C"},
    "label": {"fontSize": 10, "fontFace": "Segoe UI", "color": "#8B8B8B"}
  }
}
```

Note: Helvetica Neue and Arial are not standard PowerBI fonts. Mapped to Segoe UI (PowerBI default sans-serif). If Helvetica Neue is installed on all report viewers' machines, replace "Segoe UI Semibold" with "Helvetica Neue" in the theme JSON.

### Example 3 -- Multi-Page HR Analytics Dashboard

**Input:** "Figma file has 3 pages: (1) Headcount Overview with 4 KPI cards, a stacked bar chart by department, and a line chart of headcount trend. (2) Attrition Analysis with a waterfall chart, donut chart by reason, and a table of recent exits. (3) Diversity Metrics with grouped bar charts and a treemap. Use the company brand: teal #008080, dark gray #2C3E50, light gray #ECF0F1."

**Output:**

Theme JSON generated with teal-based dataColors palette. Layout specs for all 3 pages with visual placement coordinates. Implementation guide covering page creation, visual placement, and data binding for each chart type.

## Error Handling and Edge Cases

| Situation | Response |
|-----------|----------|
| Figma API returns 403/404 | Verify the token has file read permissions. Check if the file URL is a valid Figma file (not a FigJam or prototype link). |
| Figma file has no frames | Cannot generate layout. Inform user that the file must contain at least one Frame node at the top level. |
| Figma file uses unsupported fonts | Map to PowerBI-safe fallbacks (see font table in Step 2). Warn user in the implementation guide. |
| PowerBI theme JSON exceeds 50KB | Simplify — reduce dataColors to 12, remove redundant nested overrides, use inheritance. |
| User provides a Figma prototype link instead of design file | Extract the file key from the prototype URL (same underlying file). Note that prototype interactions will be ignored. |
| User wants pixel-perfect reproduction | Set expectations upfront — PowerBI rendering differs from Figma. Provide closest structural match and document deviations. |
| Figma file has hundreds of layers | Focus on top-level frames only (these map to PowerBI pages). Ignore deeply nested decorative elements. |

## Verification Checklist

After generating PowerBI artifacts, verify:

- [ ] Theme JSON is valid JSON (parse without errors)
- [ ] All dataColors are valid hex codes (#RRGGBB format)
- [ ] At least 8 dataColors defined (prevents cycling issues)
- [ ] Font families in theme exist in PowerBI's font list
- [ ] Report layout coordinates are within 1280x720 canvas bounds
- [ ] No Figma-specific values leaked (node IDs, API tokens)
- [ ] Implementation guide references correct PowerBI menu paths
- [ ] PBIR files (if generated) follow the schema structure

## Common Pitfalls

- **Assuming Figma frame names are reliable:** Many designers use default names like "Frame 427". Do not rely solely on node names for chart type detection -- cross-reference with visual shape, children count, and dimensions.
- **Ignoring Figma auto-layout direction:** A horizontal auto-layout frame maps to a row of visuals in PowerBI. A vertical auto-layout maps to a column. Missing this creates wrong visual arrangements.
- **Generating too few dataColors:** PowerBI cycles through dataColors for chart series. If you only provide 3 colors for a chart with 8 series, the colors repeat. Always generate at least 8.
- **Using Figma pixel dimensions directly:** Figma frames can be any size. PowerBI default canvas is 1280x720. Always scale proportionally.
- **Forgetting font availability:** Fonts that look great in Figma may not exist in PowerBI. Always provide fallbacks and warn the user.
- **Treating Figma placeholder text as data:** Numbers in Figma mockups ("$1.2M") are design placeholders, not real data. Never hardcode these into DAX measures.
- **Skipping the visual hierarchy:** If a KPI card is 3x the size of others in Figma, it should be proportionally larger in PowerBI too. Preserve relative sizing.
- **Not handling gradients:** Figma supports linear/radial gradients in fills. PowerBI theme JSON does not support gradients in dataColors or background. Pick the dominant color from the gradient and note the limitation.
- **Generating PBIR without data model context:** PBIR visual JSON files need data binding configuration. Without knowing the actual data model, you can only generate the structural/positional scaffolding.

## Limitations

This skill CANNOT:

1. **Create a complete .pbix file programmatically** -- the PBIX binary format is not publicly documented by Microsoft. The skill generates theme JSON and layout specs that must be imported/recreated in PowerBI Desktop.
2. **Handle interactive Figma prototypes** -- prototype transitions, hover states, and click interactions have no equivalent in PowerBI static reports.
3. **Convert Figma animations** -- animated elements in Figma cannot be represented in PowerBI.
4. **Map every Figma component to PowerBI** -- freeform vector illustrations, complex SVG icons, and decorative elements have no direct PowerBI visual equivalent. These must be exported as images and imported separately.
5. **Guarantee pixel-perfect reproduction** -- PowerBI's rendering engine, font metrics, and chart padding differ from Figma. The output will be a close structural match, not an exact pixel replica.
6. **Generate data bindings without a data model** -- visual configuration (which field goes on which axis) requires knowledge of the actual data source, not just the Figma design.
7. **Support Figma gradients in themes** -- PowerBI theme JSON only accepts solid colors. Gradients are approximated to their dominant solid color.
8. **Handle custom Figma plugins/widgets** -- plugin-generated content may not expose standard node properties through the REST API.
9. **Access Figma files without an API token** -- the user must provide a valid Figma Personal Access Token with file read permissions.
10. **Deploy reports to PowerBI Service** -- the skill generates local artifacts. Publishing to PowerBI Service requires separate authentication and API calls.

## Cross-References

- upstream: `frontend-designer` -- may produce the original Figma dashboard design that this skill converts
- upstream: `ux-reviewer` -- may audit the Figma design for usability before conversion
- downstream: User manually imports artifacts into PowerBI Desktop (no downstream skill currently)

## Changelog

### 1.0.0
- Initial release
- Figma REST API node tree extraction
- PowerBI theme JSON generation from Figma design tokens
- Visual mapping reference (20 Figma element types to PowerBI visuals)
- Coordinate scaling from Figma frames to PowerBI canvas
- PBIR scaffolding generation (optional)
- Font fallback mapping table
- 3 worked examples (simple, token-only, multi-page)
