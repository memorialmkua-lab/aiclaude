---
name: comfyui-workflow-verify
description: Validate and convert ComfyUI workflows through a 6-step pipeline — GUI-to-API conversion, node compatibility checking, dependency analysis, bypass strategy generation, live endpoint testing, and clean template output. Use when working with ComfyUI image/video generation workflows.
origin: ECC
tools: Read, Write, Bash, Grep
---

<!--
  日本語メンテナンスガイド
  ========================
  このスキルはComfyUIワークフローを6ステップで検証・変換する。

  ■ 6ステップ
    1. ワークフロー取得＋形式判定（GUI/API）
    2. ノード互換性チェック（object_info照合）
    3. Missingノード影響分析（依存グラフ追跡）
    4. クリーンAPIテンプレート構築（15-20ノード目標）
    5. ライブエンドポイントテスト送信
    6. 結果レポート出力

  ■ ノード分類
    - OK: object_infoに存在 → そのまま
    - Frontend-only: Note, SetNode等 → 安全に除去
    - Missing: 未登録 → バイパスまたは要修正

  ■ 変更時の注意
    - Frontend-onlyリスト更新は Step 2
    - バイパスパターン追加は Step 3
    - エラー修正パターン追加は Step 5
    - 元実装: NoraClaw comfyui-workflow-verify スキル
-->

# ComfyUI Workflow Verify & Convert

Validate ComfyUI workflow JSON files and convert GUI-exported workflows into clean, API-ready templates. Catches incompatible nodes, broken dependency chains, and frontend-only artifacts before they cause silent runtime failures.

## When to Activate

- converting a ComfyUI GUI workflow to API format
- debugging why a workflow fails when submitted via API
- cleaning up a workflow for production use (removing unnecessary nodes)
- verifying node compatibility after ComfyUI or custom node updates
- building workflow templates with dynamic prompt injection

## The 6-Step Pipeline

### Step 1: Workflow Acquisition & Format Detection

Determine the workflow format:

- **GUI format**: Top-level `nodes` array and `links` array. Contains visual layout data, widget values, and frontend-only nodes.
- **API format**: Top-level keys are numeric strings (`"1"`, `"2"`, ...). Each value has `class_type` and `inputs`. This is what the `/prompt` endpoint accepts.

Extract a node inventory:

| Field | Description |
|-------|-------------|
| `id` / key | Node identifier |
| `class_type` | Node type name |
| `mode` | GUI only: 0=active, 2=muted, 4=bypassed |
| `inputs` | Parameters and connections |

### Step 2: Node Compatibility Check

Query the ComfyUI API for available nodes:

```bash
curl -s "http://<endpoint>/object_info" | \
  python3 -c "import json,sys; print('\n'.join(sorted(json.load(sys.stdin).keys())))"
```

Classify each workflow node into three categories:

| Category | Meaning | Action |
|----------|---------|--------|
| **OK** | Node exists in `object_info` | Keep |
| **Frontend-only** | GUI helper, not needed for API execution | Remove safely |
| **Missing** | Not in `object_info`, not frontend-only | Needs bypass or fix |

**Known frontend-only nodes** (safe to remove):
```
Note, MarkdownNote, PrimitiveNode
GetNode, SetNode
Mute / Bypass Relay (rgthree)
Mute / Bypass Repeater (rgthree)
Fast Bypasser (rgthree), Fast Muter (rgthree)
AddLabel, mxSlider, DisplayAny
SystemNotification|pysssss
```

### Step 3: Missing Node Impact Analysis

For each missing node, trace the dependency graph:

1. **Input sources**: What feeds into this node?
2. **Output consumers**: What depends on this node's output?
3. **Critical path**: Is this node in the chain to the final output (SaveImage, VHS_VideoCombine, etc.)?

**Known bypass patterns:**

| Missing Node | Bypass Strategy | Impact |
|-------------|----------------|--------|
| UnloadAllModels | Route `value` input directly to output consumers | Lose model unloading, pipeline works |
| Any Switch (rgthree) | Route `any_01` input directly to output | Lose switching, pipeline works |
| TorchCompile | Remove entirely | Lose compilation optimization |

**Cannot bypass:** Nodes that transform data types (e.g., segmentation, encoding conversion). These need the custom node installed.

### Step 4: Build Clean API Template

**From GUI format:**
1. Keep only active nodes (`mode === 0`)
2. Strip frontend-only nodes
3. Apply bypass strategies for missing nodes
4. Build API structure:

```json
{
  "1": {
    "class_type": "LoadImage",
    "inputs": {
      "image": "input.png"
    }
  },
  "2": {
    "class_type": "KSampler",
    "inputs": {
      "seed": 42,
      "steps": 30,
      "cfg": 7.0,
      "sampler_name": "euler",
      "scheduler": "normal",
      "model": ["1", 0],
      "positive": ["3", 0],
      "negative": ["4", 0],
      "latent_image": ["5", 0]
    }
  }
}
```

5. Transfer parameters exactly from the original (steps, cfg, scheduler, precision, model paths, dimensions)
6. Target: **15-20 nodes** for a clean production template

**From API format:**
1. Remove missing nodes, reconnect broken references
2. Strip frontend-only nodes, replace GetNode/SetNode references with direct connections
3. Renumber node IDs sequentially

### Step 5: Live Endpoint Testing

```bash
# 1. Verify ComfyUI is running
curl -s "http://<endpoint>/system_stats"

# 2. Submit the template
curl -s -X POST "http://<endpoint>/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt": <template_json>}'

# 3. Check execution
curl -s "http://<endpoint>/history/<prompt_id>"
```

**Common error fixes:**

| Error | Fix |
|-------|-----|
| `Required input 'X' is missing` | Add default value or connection for input X |
| `Invalid class_type 'X'` | Node not available — remove or bypass |
| `Output type mismatch` | Check output index in source connection |
| `Value not in list` | Enum parameter — check valid values in `object_info` |

### Step 6: Result Report

```markdown
## Conversion Summary

| Item | Value |
|------|-------|
| Source | workflow.json |
| Format | GUI → API |
| Original nodes | 45 |
| Clean template nodes | 18 |
| Removed | 22 (Frontend-only: 15, Missing: 3, Muted: 4) |
| Bypassed | 2 |

## Removed/Bypassed Nodes

| Node | Type | Reason | Action |
|------|------|--------|--------|
| #5 | Note | Frontend-only | Removed |
| #12 | UnloadAllModels | Missing (bypassable) | Value passthrough |

## Parameters

| Parameter | Value | Node |
|-----------|-------|------|
| steps | 30 | KSampler |
| cfg | 7.0 | KSampler |
| scheduler | normal | KSampler |

## Test Result

| Item | Result |
|------|--------|
| Status | Success / Failed / Running |
| prompt_id | abc-123 |
```

## Template Variables

For production templates that accept dynamic input, use placeholder syntax:

```json
{
  "437": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "{{PROMPT}}"
    }
  }
}
```

At runtime, replace `{{PROMPT}}` with actual content. Support multiple placeholders: `{{PROMPT_1}}`, `{{PROMPT_2}}`, `{{IMAGE}}`, etc.

## Known Issues

### Model Path Backslashes
Windows model paths use backslashes (`FastMix\\model.safetensors`). In JSON, double-escape them. If possible, place models in the root ComfyUI models directory to avoid path separators entirely.

### NODE_CLASS_MAPPINGS Gaps
Some custom node packages load successfully but don't register their nodes (especially with ComfyUI 2.0's SmartType/VariantSupport changes). These appear as "loaded" in startup logs but are missing from `object_info`. Treat them as Missing nodes.

## Best Practices

- Always run the full 6-step pipeline on new workflows
- Keep a library of known frontend-only node names for your custom node setup
- Test with a fixed seed (42) first, then switch to random for production
- Save clean templates separately from GUI workflows — never edit the GUI file directly
- After ComfyUI updates, re-run Step 2 to catch newly broken nodes
