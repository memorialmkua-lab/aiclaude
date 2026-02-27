---
name: directory-enumeration-reliability
description: "Glob skips symlinks; use ls -la or ls -d for directory enumeration that includes symlinked entries"
user-invokable: false
---

# Directory Enumeration: Glob Skips Symlinks

**Extracted:** 2026-02-24
**Context:** When listing subdirectories or enumerating installed skills/plugins/modules

## Problem
The `Glob` tool does not follow symlinks. If a directory contains a mix of real directories and symlinked directories (common in plugin/skill systems), Glob will silently omit the symlinked entries. This produces incomplete counts with no error or warning.

**Root cause discovered:** In `~/.claude/skills/`, 4 of 11 skills were symlinks to `~/.agents/skills/`. Glob's `**/*` pattern returned files from the 7 real directories only, missing all 4 symlinked skills entirely.

## Solution
- Use `ls -la` via Bash to enumerate directories — it shows symlinks explicitly and follows them for listing
- Use `ls -d */` for a clean directory-only listing that includes symlinks
- If a directory might contain symlinks, NEVER rely on Glob alone for enumeration
- When Glob returns fewer results than expected, check for symlinks with `ls -la` before assuming the count is correct

## When to Use
- Listing installed skills, plugins, packages, or modules (these commonly use symlinks)
- Any time you need a complete count of subdirectories
- When reporting inventory to the user (wrong counts erode trust)
- After any Glob result that seems unexpectedly small

## Anti-Pattern
```
# BAD: misses symlinked directories
Glob pattern="**/*" path="/some/plugin/dir"

# GOOD: includes symlinks, shows which entries ARE symlinks
ls -la /some/plugin/dir/
```
