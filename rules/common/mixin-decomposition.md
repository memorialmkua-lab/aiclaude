<!--
  日本語メンテナンスガイド
  ========================
  このルールは大きなファイル（スキル/エージェント/サービスクラス）の分割パターンを定義する。

  ■ 概要
    1500行以上 or 3つ以上の機能グループがあるファイルを Mixin パターンで分割する。
    外部からの import パスは変更しない（re-export で互換性維持）。

  ■ Mixin ルール
    - 名前: {Feature}Mixin（例: SchedulerTasksMixin）
    - __init__ は親クラスに集約。Mixin には書かない
    - self は親クラスと共有される
    - 循環 import は遅延 import で回避

  ■ 変更時の注意
    - 新しいアンチパターンを発見したら Anti-Patterns セクションに追加
    - 言語別の例を追加する場合は Examples セクションに追記
-->

# Mixin Decomposition

## When to Split (HIGH)

Split a file when any condition is true:
- File exceeds ~1500 lines
- File contains 3 or more distinct feature groups
- Multiple developers frequently conflict in the same file
- You find yourself scrolling past unrelated code to reach what you need

Split by **feature cohesion**, not by method count. Three related methods are better kept together than split across files.

## The Pattern

```python
# BEFORE: skills/twitter_engine.py (2500 lines, 4 feature groups mixed together)

# AFTER: Split into focused mixins

# skills/twitter_engine_scheduling.py
# ツイートスケジューリング機能
class SchedulingMixin:
    """Tweet scheduling and queue management."""
    # Mixin に __init__ は書かない — self は親クラスと共有

    async def schedule_tweet(self, content, scheduled_time):
        await self.redis.zadd("tweet_queue", {content: scheduled_time.timestamp()})

    async def get_queue(self):
        return await self.redis.zrange("tweet_queue", 0, -1)

# skills/twitter_engine_analytics.py
# エンゲージメント分析機能
class AnalyticsMixin:
    """Engagement tracking and reporting."""

    async def get_engagement(self, tweet_id):
        return await self.api.get_tweet_metrics(tweet_id)

    async def generate_report(self, period="weekly"):
        metrics = await self._collect_metrics(period)
        return self._format_report(metrics)

# skills/twitter_engine.py (now 800 lines — core logic only)
# メインクラス: Mixin を継承して全機能を統合
from .twitter_engine_scheduling import SchedulingMixin
from .twitter_engine_analytics import AnalyticsMixin

class TwitterEngine(SchedulingMixin, AnalyticsMixin):
    def __init__(self, config, redis, api):
        self.config = config
        self.redis = redis
        self.api = api
        # All initialization happens here, never in Mixins
```

## TypeScript Equivalent

```typescript
// BEFORE: services/twitter-engine.ts (2000+ lines)

// AFTER: Split with module augmentation

// services/twitter-engine-scheduling.ts
// スケジューリング機能の分割
export const schedulingMethods = {
  async scheduleTweet(this: TwitterEngine, content: string, time: Date) {
    await this.redis.zadd("tweet_queue", time.getTime(), content);
  },
  async getQueue(this: TwitterEngine) {
    return this.redis.zrange("tweet_queue", 0, -1);
  },
};

// services/twitter-engine.ts (core + mixin composition)
import { schedulingMethods } from "./twitter-engine-scheduling";
import { analyticsMethods } from "./twitter-engine-analytics";

class TwitterEngine {
  constructor(private config: Config, private redis: Redis) {}
  // Core methods here...
}

// Compose mixins
Object.assign(TwitterEngine.prototype, schedulingMethods, analyticsMethods);
export { TwitterEngine };
```

## Rules

1. **Core logic stays in the original file** — Mixins hold feature groups, not the skeleton
2. **Mixin naming**: `{Feature}Mixin` (Python) or `{feature}Methods` (TypeScript)
3. **No `__init__` in Mixins** — All initialization stays in the parent class. `self`/`this` is shared
4. **Parent inherits all Mixins**: `class Foo(BarMixin, BazMixin):`
5. **Preserve external import paths** — Re-export from the original module if needed:
   ```python
   # If external code does: from skills.twitter_engine import SchedulingMixin
   # Keep this re-export in twitter_engine.py
   from .twitter_engine_scheduling import SchedulingMixin  # re-export
   ```
6. **Circular imports** — Use lazy imports:
   ```python
   def some_method(self):
       from .other_module import SomeClass  # 遅延 import で循環回避
       return SomeClass(self.data)
   ```

## Anti-Patterns

### Don't split by method count
```
WRONG:  "This file has 30 methods, let's split into 3 files of 10"
CORRECT: "This file has scheduling, analytics, and generation — three cohesive groups"
```

### Don't create tiny Mixins
```
WRONG:  HelperMixin with 1 method and 15 lines
CORRECT: Keep small helpers in the main file or in a shared utils module
```

### Don't put shared state in Mixins
```python
# WRONG — Mixin が独自の状態を持つ
class BadMixin:
    def __init__(self):  # これは書かない
        self.cache = {}

# CORRECT — 状態は親クラスの __init__ で初期化
class Parent(BadMixin):
    def __init__(self):
        self.cache = {}  # State lives here
```

### Don't split if it's not worth the indirection
Three similar 10-line methods in one file is better than a premature Mixin abstraction. The threshold is ~1500 lines or 3+ distinct feature groups — below that, keep it together.

## Decision Checklist

Before splitting, verify:
- [ ] File exceeds 1500 lines OR has 3+ distinct feature groups
- [ ] Feature groups are identifiable (scheduling, analytics, generation, etc.)
- [ ] Each Mixin will have at least 3-5 related methods
- [ ] External import paths will be preserved via re-export
- [ ] No circular dependency issues (or they can be solved with lazy imports)
- [ ] The split makes the code easier to navigate, not harder
