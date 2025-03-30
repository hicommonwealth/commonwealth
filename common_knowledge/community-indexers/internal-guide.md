# Internal Development Guide

This guide explains how to add new community indexers to the Commonwealth system as an internal developer.

## Prerequisites

- Node.js/TypeScript knowledge
- Understanding of the Commonwealth codebase
- Familiarity with the blockchain network you're indexing
- Access to the Commonwealth development environment

## Adding a New Indexer

### 1. Database Setup

First, add your indexer to the `CommunityIndexers` table:

```typescript
// In a new migration file
await queryInterface.bulkInsert(
  'CommunityIndexers',
  [
    {
      id: 'your-indexer-id',
      status: 'idle',
      last_checked: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  { transaction },
);
```

### 2. Schema Definition

Create a schema for your indexer's data:

```typescript
// libs/schemas/src/entities/your-indexer.schemas.ts
import { z } from 'zod';

export const YourIndexerData = z.object({
  id: z.string(),
  name: z.string(),
  // Add other fields specific to your indexer
});

export const YourIndexerEvent = z.object({
  event_name: z.literal('YourIndexerFound'),
  event_payload: YourIndexerData,
});
```

### 3. Data Source Handler

Create a handler for your data source:

```typescript
// libs/model/src/policies/utils/your-indexer-utils.ts
import { logger } from '@hicommonwealth/core';
import { z } from 'zod';
import { CommunityIndexer } from '@hicommonwealth/schemas';
import moment from 'moment';

const log = logger(import.meta);

export async function indexYourData(
  indexer: z.infer<typeof CommunityIndexer>,
) {
  const cutoffDate = moment(indexer.last_checked).toDate();

  // Fetch your data from the source
  const dataBuffer: Array<z.infer<typeof YourIndexerData>> = [];
  
  // Implement your data fetching logic here
  // Example:
  // for await (const items of paginateYourData({ cutoffDate })) {
  //   dataBuffer.push(...items);
  // }

  // Sort data if needed (e.g., by creation date)
  dataBuffer.sort((a, b) => moment(a.id).valueOf() - moment(b.id).valueOf());

  // Create events
  const eventsBuffer = dataBuffer.map((item) => ({
    event_name: 'YourIndexerFound',
    event_payload: item,
  }));

  // Emit events
  await emitEvent(models.Outbox, eventsBuffer);
}
```

### 4. Add to IndexCommunities Command

Add your indexer to the main indexing command:

```typescript
// libs/model/src/aggregates/community/IndexCommunities.command.ts
// In the switch statement:
switch (indexer.id) {
  case 'clanker':
    await indexClankerTokens(indexer);
    break;
  case 'your-indexer-id':
    await indexYourData(indexer);
    break;
  default:
    throw new Error(`indexer not implemented: ${indexer.id}`);
}
```

### 5. Event Handler

Create an event handler for your indexer's events:

```typescript
// libs/model/src/policies/YourIndexerEvents.policy.ts
import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { createCommunityFromYourData } from './utils/your-indexer-utils';

const log = logger(import.meta);

const inputs = {
  YourIndexerFound: events.YourIndexerFound,
};

export function YourIndexerEvents(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      YourIndexerFound: async ({ payload }) => {
        // Check if community already exists
        const existingCommunity = await models.Community.findOne({
          where: {
            community_indexer_id: 'your-indexer-id',
            // Add other identifying fields
          },
        });

        if (existingCommunity) {
          log.warn(`Community already exists for ${payload.id}`);
          return;
        }

        // Create new community
        await createCommunityFromYourData(payload);
      },
    },
  };
}
```

## Testing

### 1. Unit Tests

```typescript
// libs/model/test/policies/yourIndexerUtils.spec.ts
import { describe, it, expect } from 'vitest';
import { indexYourData } from '../../policies/utils/your-indexer-utils';

describe('YourIndexer Utils', () => {
  it('should process data correctly', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests

```typescript
// packages/commonwealth/test/e2e/your-indexer.spec.ts
import { test } from '@playwright/test';

test.describe('Your Indexer Integration', () => {
  it('should process events and create communities', async () => {
    // Test implementation
  });
});
```

## Monitoring

### 1. Logging

Use the logger for important events:

```typescript
const log = logger(import.meta);

log.info('Starting indexer process');
log.error('Failed to process data', error);
```

### 2. Metrics

Add metrics for monitoring:

```typescript
// Add to your indexer implementation
metrics.increment('your_indexer.processed_items');
metrics.timing('your_indexer.processing_time', duration);
```

## Best Practices

1. **Error Handling**
   - Implement proper error handling
   - Use retries for transient failures
   - Log errors with context

2. **Rate Limiting**
   - Respect API rate limits
   - Implement backoff strategies
   - Handle rate limit errors gracefully

3. **Data Validation**
   - Validate all inputs
   - Handle missing or malformed data
   - Provide clear error messages

4. **Performance**
   - Use batch processing where possible
   - Implement caching when appropriate
   - Monitor processing times

5. **Security**
   - Validate all inputs
   - Sanitize data before storage
   - Follow security best practices

## Important Considerations

### API Key and Admin Handling
When developing and testing indexers, it's crucial to follow these guidelines:

1. **System Actor Usage**
   - Indexers use a system actor for community creation, not user accounts
   - The system actor is created using the `systemActor` helper:
   ```typescript
   const adminAddress = await models.Address.findOne({
     where: {
       address: web3.eth.defaultAccount!,
     },
   });
   
   await command(CreateCommunity(), {
     actor: systemActor({
       id: adminAddress.user_id!,
       address: adminAddress.address,
     }),
     payload: createCommunityPayload,
   });
   ```

2. **API Key Management**
   - For indexer operations, use the system's private key from environment variables:
   ```typescript
   const web3 = commonProtocol.createPrivateEvmClient({
     rpc: chainNode.private_url!,
     privateKey: config.WEB3.PRIVATE_KEY,
   });
   ```
   - Never use user API keys for indexer operations
   - The system's private key is used for all blockchain interactions

3. **Site Performance**
   - The Commonwealth site is not optimized for handling a large number of communities (e.g., 30,000+) being favorited
   - When testing indexers that create multiple communities:
     - Avoid logging into the site with the same API key used for indexer operations
     - Use separate test accounts for site interaction
     - Consider the performance impact when creating multiple communities

4. **Testing Best Practices**
   - Use dedicated test environments for indexer development
   - Implement rate limiting in your indexers
   - Monitor system performance during testing
   - Consider implementing pagination or lazy loading for community data

### Best Practices for Community Creation
When creating communities through your indexer:

1. **Rate Limiting**
   - Implement appropriate rate limiting in your indexer
   - Avoid creating too many communities in a short time period
   - Consider using batch operations for multiple communities

2. **Data Management**
   - Only create communities for verified and valid data
   - Implement proper error handling for failed community creation
   - Keep track of created communities for monitoring

3. **Performance Optimization**
   - Use pagination when fetching community data
   - Implement caching where appropriate
   - Monitor system resources during operation

## Deployment

1. **Environment Variables**
   ```