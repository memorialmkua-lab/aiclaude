> This file extends [common/hooks.md](../common/hooks.md) with SuiteScript 2.1 specific content.

# SuiteScript Hooks

## Deployment Schedule

| Script Type | Schedule | Notes |
|-------------|----------|-------|
| Daily Order Sync | 2:00 AM EST | Avoid Oracle ERP batch window |
| Inventory Report | 6:00 AM EST | Before warehouse opens |
| Error Monitor | Every 1 hour (8 AM - 8 PM EST) | Business hours only |

Map/Reduce scripts are submitted on-demand via scheduled script or workflow (priority: Medium unless rush processing).

## Deployment Checklist

- [ ] Status: "Testing" initially, "Released" after validation
- [ ] Deployed: Checked to activate
- [ ] Log Level: DEBUG for testing, ERROR for production
- [ ] Audience: Select appropriate roles
- [ ] Execution Context: Choose contexts where script should run (UI, Web Services, CSV Import, Scheduled)

## Script Parameters

Define script parameters in deployment records for configurable values:

| Parameter ID | Label | Type | Notes |
|--------------|-------|------|-------|
| custscript_ss_api_key | API Key | Free-Form Text | External API credentials |
| custscript_ss_api_secret | API Secret | Password | External API credentials |

Access in code via:

```javascript
const script = runtime.getCurrentScript();
const apiKey = script.getParameter({ name: 'custscript_ss_api_key' });
```
