---
name: content-quality-gate
description: Evaluate AI-generated content against a 9-item quality gate before publishing. Catches CoT leakage, prompt injection residue, hallucinated context, banned phrases, and template patterns that hurt credibility. Use when reviewing AI-generated posts, tweets, articles, or any content headed for public channels.
origin: ECC
tools: Read, Bash, Grep
---

<!--
  日本語メンテナンスガイド
  ========================
  このスキルはAI生成コンテンツの品質チェックを9項目で実行する。

  ■ 9項目チェック
    1. CoT漏出（CRITICAL）— 思考過程の断片が出力に混入
    2. プロンプト漏出（CRITICAL）— system_prompt等の指示文が残留
    3. 環境捏造（HIGH）— AIが知覚できない物理環境の描写
    4. AI的問いかけ（HIGH）— 「みんなは？」等の定型パターン
    5. 禁止フレーズ（HIGH）— 設定ファイルのブロックリスト照合
    6. 接続詞過多（MEDIUM）— 「Furthermore」等のエッセイ調
    7. 読者価値（MEDIUM）— 自分語りだけで持ち帰り情報なし
    8. 文字数制限（HIGH）— プラットフォーム別の上限
    9. バッチ多様性（MEDIUM）— 同じ書き出しの繰り返し

  ■ 変更時の注意
    - 検出パターン追加は各 Check セクション内に追記
    - 禁止フレーズの言語追加は Configuration セクション
    - プラットフォーム追加は Character Limit Validation セクション
    - 元実装: NoraClaw eval-tweet コマンド
-->

# Content Quality Gate

Catch AI-generated content problems before they reach your audience. This skill runs a structured 9-check evaluation that flags chain-of-thought leakage, prompt artifacts, hallucinated environmental details, and generic template language.

## When to Activate

- reviewing AI-generated tweets, posts, or threads before publishing
- evaluating batch-generated content for consistency and diversity
- auditing content pipelines for quality regressions
- validating persona consistency across generated outputs
- running pre-publish checks in automated content workflows

## The 9-Item Quality Gate

### Check 1: Chain-of-Thought Leakage (CRITICAL)

Detect leaked reasoning artifacts that expose the AI's internal process.

**Detection patterns:**
```
[STEP 1], [STEP 2], [FINAL]
**Internal dialogue**, *thinking*
"Let me think about this"
"As an AI language model"
"Step 1:", "Step 2:"
"Perception:", "Internal_Monologue:", "Self_Censorship:"
```

Flag any content where the generation scaffolding bleeds into the output.

### Check 2: Prompt Leakage (CRITICAL)

Detect residual prompt fragments that expose system instructions.

**Detection patterns:**
```
"system_prompt", "prompt:"
Parameter labels: "mood:", "tone:", "word count:"
Instruction fragments: "Generate a", "Write a", "You are a"
Template markers: "{{", "}}", "[INSERT]"
```

### Check 3: Environmental Fabrication (HIGH)

Flag claims about physical context that an AI cannot perceive.

**Detection patterns:**
```
Sensory claims: "the sound of rain", "morning light through the window"
Device awareness: "my monitor's glow", "the hum of the AC"
Physical state: "stretching at my desk", "sipping coffee"
Location specifics: "from my home office", "looking outside"
```

These create an uncanny valley effect. The audience knows (or suspects) it is AI-generated, and fabricated sensory details confirm it.

### Check 4: Generic AI Engagement Patterns (HIGH)

Detect formulaic interaction patterns that signal AI authorship.

**Detection patterns:**
```
"What do you think?"
"Let me know in the comments"
"Who else feels this way?"
"Can anyone relate?"
"Don't forget to like and subscribe"
```

These patterns are overused by AI and reduce perceived authenticity.

### Check 5: Banned Phrase Filtering (HIGH)

Match against a configurable blocklist of overused or off-brand phrases.

**Default banned phrases:**
```
"game-changer", "revolutionary", "groundbreaking"
"dive deep", "unpack", "at the end of the day"
"it's worth noting", "interestingly enough"
"in today's fast-paced world"
"leverage", "synergy", "paradigm shift"
```

Configure project-specific lists in a persona or brand config file.

### Check 6: Banned Connector Filtering (MEDIUM)

Flag overuse of formal connectors that make content read like an essay.

**Default banned connectors:**
```
"Furthermore,", "Moreover,", "Additionally,"
"In conclusion,", "To summarize,"
"That being said,", "Having said that,"
"It goes without saying,"
```

One or two are fine. Three or more in a single post is a strong AI signal.

### Check 7: Reader Value Assessment (MEDIUM)

Evaluate whether the content provides actionable value to the reader.

**Fail conditions:**
- Pure self-reference with no takeaway ("I did X, I felt Y, I learned Z" with no transferable insight)
- Vague encouragement without specifics ("Keep pushing!", "You got this!")
- Restating common knowledge without a new angle

**Pass conditions:** The reader can think "I didn't know that", "I should try that", or "That explains something I've seen."

### Check 8: Character Limit Validation (HIGH)

Enforce platform-specific length constraints.

**Default limits:**
```
X (Twitter):     280 characters
LinkedIn:       3000 characters
TikTok caption:  150 characters (recommended)
YouTube title:   100 characters
Instagram:      2200 characters
```

Override per-platform in your config.

### Check 9: Batch Diversity Check (MEDIUM)

When evaluating multiple generated outputs, flag repetitive patterns.

**Detection:**
- Same opening phrase (first 10-15 characters) appearing 2+ times in a batch
- Same sentence structure repeated across outputs
- Same emoji/hashtag pattern in every output

## Output Format

### Per-Item Results

| # | CoT | Prompt | Env | Generic | Banned | Connectors | Value | Length | Diversity |
|---|-----|--------|-----|---------|--------|------------|-------|--------|-----------|
| 1 | PASS | PASS | FAIL | PASS | PASS | PASS | PASS | PASS | — |
| 2 | PASS | PASS | PASS | PASS | FAIL | PASS | WARN | PASS | — |
| ALL | — | — | — | — | — | — | — | — | PASS |

### Issue Details

List each failure with severity, item number, check name, and the specific match:

```
#1 [HIGH] Environmental Fabrication: detected "morning light through the window"
#2 [HIGH] Banned Phrase: detected "game-changer"
#2 [MEDIUM] Reader Value: self-referential without transferable insight
```

### Summary

| Severity | Pass | Fail/Warn | Rate |
|----------|------|-----------|------|
| CRITICAL | N | N | N% |
| HIGH | N | N | N% |
| MEDIUM | N | N | N% |

**Verdict:** PASS / WARN (medium issues only) / FAIL (critical or high issues)

## Configuration

Create a quality gate config to customize checks:

```toml
[quality_gate]
enabled_checks = ["cot", "prompt", "env", "generic", "banned", "connectors", "value", "length", "diversity"]

[quality_gate.banned_phrases]
phrases = ["game-changer", "revolutionary", "dive deep"]

[quality_gate.banned_connectors]
connectors = ["Furthermore,", "Moreover,", "In conclusion,"]

[quality_gate.platform_limits]
x = 280
linkedin = 3000
tiktok = 150

[quality_gate.thresholds]
min_reader_value_score = 0.6
max_duplicate_openings = 1
```

## Integration Patterns

### As a Pre-Publish Hook

Run the quality gate before any content reaches external platforms. Block on CRITICAL/HIGH failures, warn on MEDIUM.

### As a Batch Evaluator

Generate N pieces of content, run the gate on all N, report aggregate statistics. Use this to tune prompts and catch systematic issues.

### As a Prompt Regression Test

After changing generation prompts, run the gate on 5-10 outputs to verify quality hasn't regressed. Track pass rates over time.

## Best Practices

- Run the gate on every batch, not just spot checks
- Treat CRITICAL failures as hard blocks — never publish content with CoT or prompt leakage
- Update banned phrase lists as you discover new AI-isms in your domain
- The environmental fabrication check is especially important for persona-driven accounts
- Batch diversity matters most when scheduling multiple posts — audiences notice repetition
