> This file extends [common/testing.md](../common/testing.md) with SuiteScript 2.1 specific content.

# SuiteScript Testing

## Pre-Deployment Testing Checklist

### Unit Testing
- [ ] Test with 1 record (happy path)
- [ ] Test with missing required fields
- [ ] Test with invalid data (negative quantities, etc.)
- [ ] Test with null/undefined values
- [ ] Test with maximum field lengths

### Volume Testing
- [ ] Test with 10 records (typical batch)
- [ ] Test with 100 records (large batch)
- [ ] Test with 1,000+ records (stress test)
- [ ] Monitor governance at each volume level
- [ ] Verify no performance degradation

### Integration Testing
- [ ] Test API calls succeed
- [ ] Test API rate limiting (force 429 response)
- [ ] Test API timeout scenarios
- [ ] Test with invalid credentials
- [ ] Test network failure handling

### User Experience Testing
- [ ] Test across all affected roles
- [ ] Verify UI responsiveness
- [ ] Check error messages are user-friendly
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify mobile experience if applicable

### Production Readiness
- [ ] Set log level to ERROR or EMERGENCY
- [ ] Remove debug logging statements
- [ ] Verify email notifications go to correct recipients
- [ ] Document any known limitations
- [ ] Create rollback plan
- [ ] Schedule deployment during low-usage window

## Debugging Techniques

### Add Comprehensive Logging

```javascript
// Log input values
log.debug('Input Values', JSON.stringify({
    orderId: orderId,
    customerId: customerId,
    totalAmount: totalAmount
}));

// Log search results
searchObj.run().each((result) => {
    log.debug('Search Result', JSON.stringify({
        id: result.id,
        values: result.values
    }));
    return true;
});

// Log record field values
const rec = record.load({ type: 'salesorder', id: orderId });
log.debug('Record Fields', JSON.stringify({
    status: rec.getValue({ fieldId: 'status' }),
    total: rec.getValue({ fieldId: 'total' }),
    custbody_warehouse_id: rec.getValue({ fieldId: 'custbody_warehouse_id' })
}));
```

### Common Issues Checklist

- Field ID is wrong (check in browser inspector)
- Status value doesn't match expected (log actual value)
- Date comparison using wrong format (use date objects)
- Sublist index off by one (zero-indexed)
- Using `setValue` instead of `setCurrentValue` (or vice versa depending on dynamic mode)

## Finding Field Internal IDs

1. **Show Internal IDs**: Home > Set Preferences > Check "Show Internal IDs"
2. **Browser Inspector**: Right-click field, look for `id` attribute in HTML
3. **Records Browser**: Setup > Customization > Records Browser
4. **Saved Search Preview**: Build search in UI first, verify results, then use in script

## Script Execution Monitoring

- **Execution Log**: Customization > Scripting > Script Execution Log (filter by script, date, log level)
- **Deployment Status**: Customization > Scripting > Script Deployments
- **Script Queue**: Customization > Scripting > Script Queue (for Scheduled/Map-Reduce)

### Field Not Updating Checklist

- [ ] Field ID is correct (inspect element in browser)
- [ ] Field is not read-only or calculated
- [ ] User has permission to edit field
- [ ] Workflow or other script is not overwriting value
- [ ] Using `setValue` not `setCurrentValue` (unless dynamic mode)
- [ ] Record is being saved after setting value

## Troubleshooting Common Errors

### SSS_USAGE_LIMIT_EXCEEDED (Governance Exceeded)

Causes: Loading too many records in a loop, searching within search results, creating too many records without batching.

Fix: Use `search.lookupFields()` (1 unit) instead of `record.load()` (5-10 units). Cache records. Switch to Map/Reduce for large volumes.

### SSS_TIME_LIMIT_EXCEEDED (Script Timeout)

Limits: User Event 300s, Suitelet 300s, Map stage 300s, Reduce stage 900s.

Fix: Reduce work per execution, use Map/Reduce for batch processing, remove unnecessary logging, optimize searches.

## Deployment Record Settings

| Setting | Testing | Production |
|---------|---------|------------|
| Status | Testing | Released |
| Log Level | DEBUG | ERROR or EMERGENCY |
| Deployed | Checked | Checked |
| Audience | Test roles | Appropriate roles |
