---
name: post-work-docs
description: Automatically generate documentation (video scripts, knowledge articles) from completed code changes. Spawns parallel sub-agents after meaningful commits to turn implementation work into reusable content without manual effort. Use when you want post-commit documentation automation.
origin: ECC
tools: Read, Write, Bash, Grep, Glob
---

<!--
  日本語メンテナンスガイド
  ========================
  このスキルはコード変更後に動画レポート＋ナレッジ記事を自動生成する。

  ■ 実行フロー
    コミット検知 → 学習価値判定 → Agent 2つ並列起動（背景実行）→ ファイルパス報告

  ■ レポートタイプ（5種）
    A: Before/After比較（数値改善あり）
    B: 気づき・発見（予想外の挙動）
    C: 失敗ポストモーテム（バグ修正・障害復旧）
    D: ハマりポイント集（複数の落とし穴）
    E: 設計ルール確立（パターン・規約策定）

  ■ 変更時の注意
    - レポートタイプ追加は Agent 1 セクション
    - ナレッジ構成変更は Agent 2 セクション
    - トリガー条件変更は Trigger Conditions セクション
    - 元実装: NoraClaw /post-docs コマンド
-->

# Post-Work Documentation

Turn completed code changes into reusable documentation automatically. After meaningful commits, this skill spawns parallel agents to generate video-ready technical reports and structured knowledge articles from your git diff.

## When to Activate

- after completing a bug fix, feature, or refactoring with technical learning value
- when you want to capture implementation knowledge before context is lost
- building a knowledge base from day-to-day development work
- creating technical content (video scripts, blog posts) from real engineering work

## Trigger Conditions

Run when ALL of these are true:

1. Code was changed (not just config tweaks or formatting)
2. Changes contain technical learning value (novel patterns, non-obvious fixes, architectural decisions)
3. User hasn't opted out

**Skip when:**
- Typo or formatting-only changes
- Config value adjustments (changing a timeout from 30 to 60)
- Documentation-only changes
- Already ran post-work docs in this session

## Execution Flow

```
post-work-docs {topic}
  ├── Agent 1: Video Report (parallel, background)
  ├── Agent 2: Knowledge Article (parallel, background)
  └── Main: report file paths on completion
```

Both agents run in parallel and in the background so the main conversation is not blocked.

## Agent 1: Video Report

Generate a short-form technical video script from the code changes.

### Report Type Selection

Choose the best format based on the work done:

| Type | When to Use | Structure |
|------|-------------|-----------|
| **A: Before/After** | Performance improvements, refactors with measurable results | Summary with metrics → Each improvement point (before/after/numbers) → Key message |
| **B: Discovery** | Unexpected findings, non-obvious behaviors | What we found → What you can't know without trying → Lessons → Key message |
| **C: Failure Postmortem** | Bug fixes, incident recovery | What went wrong → Investigation process → Final fix → Why this failure was necessary → Prevention → Key message |
| **D: Pitfall Collection** | Multiple gotchas in one area | Each pitfall: symptom/cause/fix → Key message |
| **E: Design Rule** | Establishing patterns, coding standards | Why rules were needed → Rules with OK/NG examples → Checklist → Key message |

### Key Message Guidelines

1. Include numbers: "Split 896 lines into 13 files"
2. Create contrast: "3 duplicate locations became 1"
3. Add human element: "Burned 2 hours on this"
4. Ask questions: "Do you know why this happens?"

### Output

Write to `docs/video-reports/{slug}.md` where slug is a kebab-case English description (3-6 words).

## Agent 2: Knowledge Article

Generate a structured technical knowledge document.

### Article Structure

```markdown
# {Topic}

## Overview
- Date, problem summary, environment

## Root Cause Analysis
- Symptoms and impact
- Cause identification
- Impact analysis

## Solution
- Options considered (table: option / adopted / rationale)
- Implementation details

## What Was Done
- Code/config changes
- Commands run
- Verification steps

## Scenario-Based Roadmap
- Before vs. after flow
- Uncovered gaps

## Operations Commands
- Useful commands for this area

## Related Files

## Monitoring Points
```

Not every section is required. Skip sections that don't apply. Include actual code snippets and specific paths.

### Output Location

| Condition | Output Path |
|-----------|-------------|
| Related to current repo's code | `docs/knowledge/{slug}.md` |
| General tech (OS, Docker, networking) | A shared knowledge repo if configured |
| Default | `docs/knowledge/{slug}.md` |

## Post-Generation

After both agents complete:

1. Report the generated file paths to the user
2. Optionally commit and push:

```bash
git add docs/video-reports/{slug}.md docs/knowledge/{slug}.md
git commit -m "docs: add {topic} video report and knowledge article"
git push
```

## Flags

- `--video` — Generate video report only
- `--knowledge` — Generate knowledge article only
- (default) — Generate both in parallel

## Hook Integration

To run automatically after commits, add a PostToolUse hook that triggers on Bash commands matching `git commit`:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/post-commit-docs.js\"",
      "async": true,
      "timeout": 60
    }
  ],
  "description": "Generate documentation from meaningful commits"
}
```

The hook script should:
1. Parse the git diff from the commit
2. Evaluate whether changes have learning value (skip trivial changes)
3. If valuable, trigger the post-work-docs skill

## Best Practices

- Run in background (non-blocking) so the main conversation continues
- Generate both video and knowledge docs in parallel for speed
- Use git diff as the primary source of truth for what changed
- Include specific numbers, paths, and commands — not vague summaries
- Let the report type emerge from the content, don't force a format
- Keep video scripts punchy (2-5 minutes of content) and knowledge articles thorough
