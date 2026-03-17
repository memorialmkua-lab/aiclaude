> This file extends [common/security.md](../common/security.md) with SuiteScript 2.1 specific content.

# SuiteScript Security

## API Credentials

Never hardcode API keys or secrets. Always use script parameters:

```javascript
// CORRECT - credentials from script parameters
function getShipStationAuth() {
    const script = runtime.getCurrentScript();
    const apiKey = script.getParameter({ name: 'custscript_ss_api_key' });
    const apiSecret = script.getParameter({ name: 'custscript_ss_api_secret' });

    return encode.convert({
        string: apiKey + ':' + apiSecret,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64
    });
}

// WRONG - hardcoded credentials
const API_KEY = 'sk_live_abc123'; // NEVER do this
```

## HTTP Calls with Error Handling

```javascript
function callWarehouseAPI(endpoint, payload) {
    try {
        const response = https.post({
            url: 'https://api.warehouse.acme.com/v1/' + endpoint,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAPIToken()
            },
            body: JSON.stringify(payload)
        });

        if (response.code !== 200) {
            throw new Error(`API Error ${response.code}: ${response.body}`);
        }

        return JSON.parse(response.body);

    } catch (e) {
        log.error('API Call Failed', `Endpoint: ${endpoint}, Error: ${e.message}`);
        throw e;
    }
}
```

## Error Handling - Prevent Data Leaks

- Error messages sent to users must not expose internal field IDs, stack traces, or system details
- Log full error details server-side with `log.error()`, return sanitized messages to UI
- Email notifications for critical errors should go to ops/dev teams, not end users

## Error Notification Pattern

```javascript
try {
    // Business logic
} catch (e) {
    log.error('Processing Failed', `Order ${orderId}: ${e.message}\nStack: ${e.stack}`);

    if (e.name === 'SSS_MISSING_REQD_ARGUMENT') {
        email.send({
            author: -5,
            recipients: ['ops@acme.com', 'rchambliss@terillium.com'],
            subject: `URGENT: Order Processing Error - ${orderId}`,
            body: `Error processing sales order ${orderId}.\n\nError: ${e.message}\n\nStack Trace:\n${e.stack}`
        });
    }

    // Log to custom record for tracking
    createErrorLog({
        recordType: 'salesorder',
        recordId: orderId,
        errorMessage: e.message,
        errorStack: e.stack
    });

    throw e;
}
```

## Rate Limiting and Retry

Use exponential backoff for external API calls:

```javascript
function callAPIWithRetry(endpoint, payload, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = https.post({
                url: endpoint,
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.code === 200) {
                return JSON.parse(response.body);
            } else if (response.code === 429) {
                log.audit('Rate Limited', `Retry ${attempt}/${maxRetries}`);
                const waitMs = Math.pow(2, attempt) * 1000;
                const start = Date.now();
                while (Date.now() - start < waitMs) { }
                continue;
            } else {
                throw new Error(`API Error ${response.code}: ${response.body}`);
            }
        } catch (e) {
            if (attempt === maxRetries) throw e;
            log.error('API Retry', `Attempt ${attempt} failed: ${e.message}`);
        }
    }
}
```

## Deployment Execution Contexts

Control which contexts trigger scripts to prevent unintended execution:

| Context | Typical Setting | Notes |
|---------|----------------|-------|
| User Interface | Yes | Manual entry/edit |
| Web Services | Yes | API integrations |
| CSV Import | No | Avoid triggering on bulk import |
| Scheduled | No | Unless specifically needed |

## Script Parameter Security Checklist

- [ ] All API keys/secrets stored in script parameters, not in code
- [ ] Script parameters marked as password type where appropriate
- [ ] Error messages do not expose internal system details to end users
- [ ] HTTP calls use HTTPS, never HTTP
- [ ] Retry logic includes maximum attempt limits to prevent infinite loops
