---
name: claude-job-hunter
description: Quality-first job application pipeline. Reads a job URL, tailors your CV with visible reasoning, writes a specific cover letter, and logs every application to a personal outcome tracker. One strong application beats ten generic ones.
origin: community
tools: Read, Write, WebFetch
---

# Claude Job Hunter

A four-agent pipeline for job applications that show reasoning, not just output.

Mass-apply bots get flagged by ATS systems. Recruiters spot templated letters instantly. This workflow produces one well-targeted application per role — with every tailoring decision explained so you can learn what's working over time.

## When to Activate

- Applying to a specific job and want your CV genuinely tailored, not just reformatted
- You want to see *why* each change was made, not just the output
- You're tracking applications over time and want a compounding record of what works
- You want a cover letter that opens with something real about the company

## Agents Required

This skill chains four agents in order. All four are available in this repository.

| Step | Agent | What it does |
|------|-------|-------------|
| 1 | `job-reader` | Visits the job URL via WebFetch, extracts structured JSON — requirements, red flags, salary, visa sponsorship, company mission |
| 2 | `cv-tailor` | Reorders and reframes your CV to match the role. Shows full reasoning for every change. Never invents skills. |
| 3 | `cover-letter-writer` | Writes a 3-paragraph cover letter in your voice — specific to the company, no boilerplate openers |
| 4 | `application-tracker` | Appends a structured entry to `applications.md` and maintains a running summary of all application statuses |

## Usage

### Step 1 — Read the job

```
Run job-reader on https://example.com/jobs/123
```

Returns a JSON object with the role's full details. Save or copy this — you'll pass it to the next two agents.

### Step 2 — Tailor your CV

```
Run cv-tailor with this job JSON: [paste JSON]
And my CV: [paste your CV as plain text]
```

Output: `## Tailoring Reasoning` → `## Tailored CV` → `## Match Score`

If the match score is below 5, the agent will flag it. You decide whether to proceed.

### Step 3 — Write the cover letter

```
Run cover-letter-writer with this job JSON: [paste JSON]
And this tailored CV: [paste tailored CV]
```

Output: 3-paragraph cover letter. No preamble.

### Step 4 — Log the application

```
Run application-tracker for [Company] — [Role], status: Applied, match score: [N]
```

Appends a structured entry to `applications.md` and updates the summary counts.

## The Tracker Flywheel

Every logged application builds `applications.md` — a personal A/B test log. Over time you'll see which tailoring strategies produced responses, which red flags were worth ignoring, and which match scores actually predicted interviews.

The more you use it, the more signal you have.

## Hard Rules

- `cv-tailor` will never invent skills or experience. It only reorders and reframes what you already have.
- Always run `application-tracker` after every attempt — including skips and rejections.
- Match score below 5 = flag and skip unless it's a deliberate stretch application.

## Source

Full project with TypeScript queue management and examples:
[github.com/tobilobasalawu/claude-job-hunter](https://github.com/tobilobasalawu/claude-job-hunter)
