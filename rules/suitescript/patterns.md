> This file extends [common/patterns.md](../common/patterns.md) with SuiteScript 2.1 specific content.

# SuiteScript Patterns

## Search Patterns

### Search with Dynamic Filters

```javascript
function searchOrders(customerId, startDate, status) {
    const filters = [['mainline', 'is', 'T']];

    if (customerId) {
        filters.push('AND', ['entity', 'anyof', customerId]);
    }
    if (startDate) {
        filters.push('AND', ['trandate', 'onorafter', startDate]);
    }
    if (status) {
        filters.push('AND', ['status', 'anyof', status]);
    }

    return search.create({
        type: search.Type.SALES_ORDER,
        filters: filters,
        columns: ['tranid', 'entity', 'total', 'custbody_warehouse_id']
    });
}
```

### Search to SQL Translation Guide

```javascript
// SQL: SELECT tranid, entity, total FROM salesorder
//      WHERE status = 'B' AND trandate >= '2024-01-01'
search.create({
    type: search.Type.SALES_ORDER,
    filters: [
        ['status', 'anyof', 'SalesOrd:B'],
        'AND',
        ['trandate', 'onorafter', '2024-01-01']
    ],
    columns: ['tranid', 'entity', 'total']
});

// SQL: SELECT * FROM customer WHERE email LIKE '%@acme.com' ORDER BY companyname
search.create({
    type: search.Type.CUSTOMER,
    filters: [['email', 'contains', '@acme.com']],
    columns: [
        search.createColumn({ name: 'companyname', sort: search.Sort.ASC }),
        'email', 'phone'
    ]
});

// SQL: SELECT entity, SUM(total) FROM salesorder GROUP BY entity
search.create({
    type: search.Type.SALES_ORDER,
    filters: [['mainline', 'is', 'T']],
    columns: [
        search.createColumn({ name: 'entity', summary: search.Summary.GROUP }),
        search.createColumn({ name: 'total', summary: search.Summary.SUM })
    ]
});
```

### Paginated Search Results

```javascript
let start = 0;
const pageSize = 1000;
let results;

do {
    results = resultSet.getRange({ start: start, end: start + pageSize });
    results.forEach((result) => {
        const orderId = result.id;
        const total = result.getValue({ name: 'total' });
    });
    start += pageSize;
} while (results.length === pageSize);
```

## Transaction Status Values

```javascript
// Sales Order statuses
// SalesOrd:A = Pending Approval
// SalesOrd:B = Pending Fulfillment
// SalesOrd:C = Cancelled
// SalesOrd:E = Pending Billing
// SalesOrd:F = Billed

const soStatus = search.lookupFields({
    type: search.Type.SALES_ORDER,
    id: salesOrderId,
    columns: ['status']
});

if (soStatus.status[0].value === 'SalesOrd:B') {
    // Pending Fulfillment - ready to ship
}
```

## Record Transform: Item Fulfillment from Sales Order

```javascript
function fulfillOrder(salesOrderId, itemLines) {
    const ifRec = record.transform({
        fromType: record.Type.SALES_ORDER,
        fromId: salesOrderId,
        toType: record.Type.ITEM_FULFILLMENT,
        isDynamic: false
    });

    ifRec.setValue({ fieldId: 'trandate', value: new Date() });
    ifRec.setValue({ fieldId: 'shipmethod', value: 123 });

    const lineCount = ifRec.getLineCount({ sublistId: 'item' });

    for (let i = 0; i < lineCount; i++) {
        const lineKey = ifRec.getSublistValue({
            sublistId: 'item', fieldId: 'lineuniquekey', line: i
        });

        const fulfillLine = itemLines.find(l => l.lineKey === lineKey);

        if (fulfillLine) {
            ifRec.setSublistValue({
                sublistId: 'item', fieldId: 'itemreceive', line: i, value: true
            });
            ifRec.setSublistValue({
                sublistId: 'item', fieldId: 'quantity', line: i, value: fulfillLine.quantity
            });
        }
    }

    return ifRec.save();
}
```

## Custom Record CRUD

```javascript
// CREATE
const shipmentLog = record.create({ type: 'customrecord_warehouse_shipment', isDynamic: true });
shipmentLog.setValue({ fieldId: 'custrecord_ship_order_ref', value: salesOrderId });
shipmentLog.setValue({ fieldId: 'custrecord_ship_tracking', value: trackingNumber });
shipmentLog.setValue({ fieldId: 'custrecord_ship_date', value: new Date() });
const logId = shipmentLog.save();

// READ
const shipmentLog = record.load({ type: 'customrecord_warehouse_shipment', id: logId });
const tracking = shipmentLog.getValue({ fieldId: 'custrecord_ship_tracking' });

// UPDATE (efficient - no full load needed)
record.submitFields({
    type: 'customrecord_warehouse_shipment',
    id: logId,
    values: {
        custrecord_ship_status: 'Delivered',
        custrecord_delivery_date: new Date()
    }
});

// DELETE
record.delete({ type: 'customrecord_warehouse_shipment', id: logId });

// SEARCH
search.create({
    type: 'customrecord_warehouse_shipment',
    filters: [
        ['custrecord_ship_date', 'within', 'today'],
        'AND',
        ['custrecord_ship_status', 'anyof', ['1', '2']]
    ],
    columns: ['custrecord_ship_order_ref', 'custrecord_ship_tracking', 'custrecord_ship_status']
});
```

## Map/Reduce Template

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/https', 'N/runtime', 'N/email'],
    (record, search, https, runtime, email) => {

        const getInputData = () => {
            return search.load({ id: 'customsearch_orders_ready_ship' });
        };

        const map = (context) => {
            try {
                const searchResult = JSON.parse(context.value);
                const orderId = searchResult.id;

                const orderData = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: orderId,
                    columns: ['tranid', 'entity', 'custbody_priority_ship', 'shipaddress']
                });

                // Process and emit to reduce
                context.write({
                    key: orderId,
                    value: { /* processed data */ }
                });

            } catch (e) {
                log.error('Map Error', `Order ${context.key}: ${e.message}`);
                context.write({ key: context.key, value: { success: false, error: e.message } });
            }
        };

        const reduce = (context) => {
            try {
                const orderId = context.key;
                const results = context.values.map(v => JSON.parse(v));

                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: orderId,
                    values: { /* field updates */ },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });

            } catch (e) {
                log.error('Reduce Error', `Order ${context.key}: ${e.message}`);
            }
        };

        const summarize = (context) => {
            let successCount = 0;
            let failureCount = 0;
            const failedOrders = [];

            context.mapSummary.errors.iterator().each((key, error) => {
                failureCount++;
                failedOrders.push({ orderId: key, error: error });
                return true;
            });

            context.reduceSummary.errors.iterator().each((key, error) => {
                failureCount++;
                failedOrders.push({ orderId: key, error: error });
                return true;
            });

            successCount = context.inputSummary.length - failureCount;

            email.send({
                author: -5,
                recipients: ['ops@acme.com'],
                subject: `Sync ${failureCount > 0 ? 'ERRORS' : 'Complete'} - ${successCount}/${context.inputSummary.length}`,
                body: `Total: ${context.inputSummary.length}, Success: ${successCount}, Failed: ${failureCount}\nGovernance: ${context.usage} units, Time: ${context.seconds}s`
            });
        };

        return { getInputData, map, reduce, summarize };
    });
```

### Map/Reduce Stage Guidelines

| Stage | Purpose | Timeout | Guidelines |
|-------|---------|---------|------------|
| getInputData | Define WHAT to process | N/A | Return search object, array, or SuiteQL results |
| map | Light processing per record | 300s | Filter, validate, enrich with lookupFields, emit key/value |
| reduce | Heavy processing per key | 900s | Aggregate, create/update records, batch operations |
| summarize | Cleanup and notifications | 3600s | Final reporting, send emails, handle errors |

## Submit Background Tasks

```javascript
// Map/Reduce task
const mrTask = task.create({
    taskType: task.TaskType.MAP_REDUCE,
    scriptId: 'customscript_process_orders',
    deploymentId: 'customdeploy_process_orders',
    params: {
        custscript_start_date: '2025-01-01',
        custscript_end_date: '2025-01-31'
    }
});
const mrTaskId = mrTask.submit();

// Scheduled Script task
const schedTask = task.create({
    taskType: task.TaskType.SCHEDULED_SCRIPT,
    scriptId: 'customscript_daily_sync',
    deploymentId: 'customdeploy_daily_sync'
});
const schedTaskId = schedTask.submit();
```

## Record Caching Pattern

```javascript
const customerCache = new Map();

function getCustomer(customerId) {
    if (!customerCache.has(customerId)) {
        customerCache.set(customerId, record.load({
            type: record.Type.CUSTOMER,
            id: customerId
        }));
    }
    return customerCache.get(customerId);
}
```
