# SOUL.md — Personal Communication Tone & Relationship Context

This file defines the user's communication preferences and relationship context for the chief-of-staff agent.

## Fallback Values

If `SOUL.md` is not present or a specific section is missing, the chief-of-staff agent uses these defaults:

- **Tone**: Professional but friendly
- **Signature**: None (agent generates without signature)
- **Reply Style**: Concise, action-oriented
- ** formality_level**: balanced

## User Preferences (editable)

| Field | Value | Notes |
|-------|-------|-------|
| name | | Your name |
| email | | Your primary email |
| timezone | | e.g., UTC, America/New_York |
| formality_level | formal / casual / friendly / balanced | Default: balanced |
| signature_style | initials / full-name / none | Default: none |

## Relationship Tones

Override default tone per sender domain or name:

| Sender Pattern | Tone | Notes |
|----------------|------|-------|
| *@github.com | neutral | Automated/transactional |
| *@linkedin.com | professional | Recruiter/LinkedIn |
| *@gmail.com | friendly | Personal |
| *@company.com | professional | Internal work |
| unknown | balanced | Default for unknown senders |

## Draft Reply Preferences

- **Length**: short / medium / long (default: medium)
- **Include greeting**: true / false (default: true)
- **Include sign-off**: true / false (default: false for action_required)
- **Emoji usage**: none / minimal / friendly (default: minimal)

## Scheduling Preferences

- **Default meeting duration**: 30min / 45min / 60min (default: 30min)
- **Available hours**: e.g., 9am-6pm (default: business hours)
- **Buffer between meetings**: 0 / 5 / 15 min (default: 5min)
- **Timezone for scheduling**: (uses timezone field above)
