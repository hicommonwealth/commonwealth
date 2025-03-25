# External Development Guide

This guide explains how to create and submit community indexers to the Commonwealth system as an external developer.

## Prerequisites

- Node.js/TypeScript knowledge
- Understanding of the blockchain network you're indexing
- Familiarity with Commonwealth's community model
- GitHub account

## Development Environment Setup

1. **Fork the Repository**
   - Fork the Commonwealth repository
   - Clone your fork locally
   - Install dependencies: `pnpm install`

2. **Local Development**
   - Set up your development environment
   - Configure your local database
   - Set up environment variables

## Creating Your Indexer

### 1. Project Structure

Create a new directory for your indexer:

```
commonwealth/
└── libs/
    └── model/
        └── src/
            └── policies/
                └── utils/
                    └── your-indexer-utils.ts
```

### 2. Package Setup

Add your indexer to the package.json:

```json
{
  "name": "@hicommonwealth/your-indexer",
  "version": "1.0.0",
  "dependencies": {
    "@hicommonwealth/core": "workspace:*",
    "@hicommonwealth/schemas": "workspace:*"
  }
}
```

### 3. Indexer Implementation

Create your indexer implementation:

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

### 4. Configuration

Create a configuration file for your indexer:

```typescript
// libs/model/src/config/your-indexer.config.ts
import { z } from 'zod';

export const YourIndexerConfig = z.object({
  rpc_url: z.string().url(),
  api_key: z.string(),
  // Add other configuration options
});
```

### 5. Schema Definition

Define your data schemas:

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

## Documentation

Create comprehensive documentation for your indexer:

1. **README.md**
   - Overview of your indexer
   - Installation instructions
   - Configuration options
   - Usage examples

2. **API Documentation**
   - Available endpoints
   - Request/response formats
   - Error handling

3. **Testing Guide**
   - Test setup
   - Test cases
   - Mock data

## Submitting Your Indexer

### 1. Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-indexer
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your-indexer implementation"
   ```

3. **Push Changes**
   ```bash
   git push origin feature/your-indexer
   ```

4. **Create Pull Request**
   - Go to the Commonwealth repository
   - Create a new pull request
   - Fill in the PR template

### 2. Pull Request Requirements

1. **Code Quality**
   - Follow TypeScript best practices
   - Include comprehensive tests
   - Add proper documentation
   - Handle errors appropriately

2. **Performance**
   - Implement rate limiting
   - Use pagination where appropriate
   - Optimize database queries
   - Handle large datasets efficiently

3. **Security**
   - Validate all inputs
   - Sanitize data
   - Follow security best practices
   - Handle API keys securely

4. **Testing**
   - Unit tests for all components
   - Integration tests for the full flow
   - Performance tests for large datasets
   - Error handling tests

### 3. Review Process

1. **Initial Review**
   - Code quality check
   - Test coverage verification
   - Documentation review
   - Security assessment

2. **Integration Testing**
   - Test on staging environment
   - Verify performance
   - Check error handling
   - Validate data processing

3. **Final Approval**
   - Security review
   - Performance verification
   - Documentation check
   - Deployment readiness

## Deployment

Once your indexer is approved:

1. **Integration**
   - Your indexer will be integrated into the main codebase
   - Added to the `CommunityIndexers` table
   - Configured in the deployment environment

2. **Monitoring**
   - Set up logging
   - Configure metrics
   - Add alerts
   - Monitor performance

3. **Maintenance**
   - Regular updates
   - Bug fixes
   - Performance improvements
   - Security patches

## Support

1. **Communication Channels**
   - GitHub issues
   - Discord community
   - Email support

2. **Documentation**
   - API reference
   - Integration guide
   - Troubleshooting guide
   - FAQ

## Best Practices

1. **Code Quality**
   - Follow TypeScript best practices
   - Write clean, maintainable code
   - Add comprehensive documentation
   - Include proper error handling

2. **Testing**
   - Write unit tests
   - Add integration tests
   - Test edge cases
   - Verify error handling

3. **Performance**
   - Implement rate limiting
   - Use pagination
   - Optimize queries
   - Handle large datasets

4. **Security**
   - Validate inputs
   - Sanitize data
   - Follow security guidelines
   - Protect sensitive data

## Important Considerations

### API Key and Site Usage
When developing and testing your indexer, please be aware of these critical guidelines:

1. **API Key Management**
   - Use the system's private key for indexer operations
   - Never use user API keys for indexer operations
   - Store API keys securely in environment variables
   - Follow Commonwealth's key management practices

2. **Site Performance**
   - The Commonwealth site is not optimized for handling a large number of communities (e.g., 30,000+) being favorited
   - When testing indexers that create multiple communities:
     - Avoid logging into the site with the same API key used for indexer operations
     - Use separate test accounts for site interaction
     - Consider the performance impact when creating multiple communities

3. **Testing Best Practices**
   - Use dedicated test environments for indexer development
   - Implement rate limiting in your indexers
   - Monitor system performance during testing
   - Consider implementing pagination or lazy loading for community data

## Next Steps

1. Review the [Chain-Specific Guides](./chains/) for your target blockchain
2. Check the [API Reference](./api-reference.md) for available endpoints
3. Follow the [Security Guide](./security.md) for best practices 