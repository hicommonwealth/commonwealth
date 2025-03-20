# Solana Community Indexer Guide

This guide explains how to create community indexers for Solana-based communities.

## Overview

Solana community indexers can create communities based on various on-chain data sources, including:
- SPL tokens
- NFT collections
- DAO governance programs
- DeFi protocols
- Metaplex metadata

## Implementation Guide

### 1. Configuration

```typescript
// src/config.ts
import { ChainNetwork, ChainBase } from '@hicommonwealth/core';

export const SolanaIndexerConfig = {
  id: 'solana-indexer',
  name: 'Solana Indexer',
  description: 'Indexes Solana-based communities',
  network: ChainNetwork.Solana,
  base: ChainBase.Solana,
  pollingInterval: 60000, // 1 minute
  requiredParams: ['rpc_url', 'api_key'],
  supportedTypes: ['token', 'nft', 'dao'],
};
```

### 2. Solana Client Setup

```typescript
// src/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaIndexerConfig } from './config';

export class SolanaClient {
  private connection: Connection;

  constructor(config: typeof SolanaIndexerConfig) {
    this.connection = new Connection(config.requiredParams.rpc_url, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }

  async getAccountInfo(address: string) {
    const pubkey = new PublicKey(address);
    return this.connection.getAccountInfo(pubkey);
  }

  async getTokenSupply(address: string) {
    const pubkey = new PublicKey(address);
    return this.connection.getTokenSupply(pubkey);
  }
}
```

### 3. Token Indexer Implementation

```typescript
// src/indexers/token.ts
import { Indexer } from '@hicommonwealth/core';
import { SolanaClient } from '../solana';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class TokenIndexer implements Indexer {
  private solana: SolanaClient;

  constructor(private config: typeof SolanaIndexerConfig) {
    this.solana = new SolanaClient(config);
  }

  async index(communityId: string) {
    const [accountInfo, supply] = await Promise.all([
      this.solana.getAccountInfo(communityId),
      this.solana.getTokenSupply(communityId),
    ]);

    if (!accountInfo) {
      throw new Error('Token account not found');
    }

    return {
      id: communityId,
      supply: supply.value.amount,
      decimals: supply.value.decimals,
      type: 'token',
    };
  }
}
```

### 4. NFT Indexer Implementation

```typescript
// src/indexers/nft.ts
import { Indexer } from '@hicommonwealth/core';
import { SolanaClient } from '../solana';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

export class NFTIndexer implements Indexer {
  private solana: SolanaClient;

  constructor(private config: typeof SolanaIndexerConfig) {
    this.solana = new SolanaClient(config);
  }

  async index(communityId: string) {
    const accountInfo = await this.solana.getAccountInfo(communityId);
    
    if (!accountInfo) {
      throw new Error('NFT account not found');
    }

    const metadata = await Metadata.fromAccountAddress(
      this.solana.connection,
      new PublicKey(communityId)
    );

    return {
      id: communityId,
      name: metadata.data.name,
      symbol: metadata.data.symbol,
      uri: metadata.data.uri,
      type: 'nft',
    };
  }
}
```

### 5. DAO Indexer Implementation

```typescript
// src/indexers/dao.ts
import { Indexer } from '@hicommonwealth/core';
import { SolanaClient } from '../solana';
import { DAO_PROGRAM_ID } from '../constants';

export class DAOIndexer implements Indexer {
  private solana: SolanaClient;

  constructor(private config: typeof SolanaIndexerConfig) {
    this.solana = new SolanaClient(config);
  }

  async index(communityId: string) {
    const accountInfo = await this.solana.getAccountInfo(communityId);
    
    if (!accountInfo) {
      throw new Error('DAO account not found');
    }

    // Parse DAO account data
    const daoData = await this.parseDAOAccount(accountInfo);

    return {
      id: communityId,
      name: daoData.name,
      token: daoData.token,
      votingPeriod: daoData.votingPeriod,
      type: 'dao',
    };
  }

  private async parseDAOAccount(accountInfo: any) {
    // Implement DAO account data parsing
    return {
      name: '',
      token: '',
      votingPeriod: 0,
    };
  }
}
```

## Program IDs and Constants

```typescript
// src/constants.ts
import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const NFT_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const DAO_PROGRAM_ID = new PublicKey('your_dao_program_id');
```

## Testing

### 1. Unit Tests

```typescript
// src/__tests__/token.test.ts
import { describe, it, expect } from 'vitest';
import { TokenIndexer } from '../indexers/token';
import { SolanaIndexerConfig } from '../config';

describe('TokenIndexer', () => {
  it('should fetch token data', async () => {
    const indexer = new TokenIndexer(SolanaIndexerConfig);
    const data = await indexer.index('your_token_address');
    expect(data).toHaveProperty('supply');
    expect(data).toHaveProperty('decimals');
  });
});
```

### 2. Integration Tests

```typescript
// src/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { SolanaClient } from '../solana';

describe('Solana Integration', () => {
  it('should connect to Solana network', async () => {
    const solana = new SolanaClient(SolanaIndexerConfig);
    const accountInfo = await solana.getAccountInfo('your_account_address');
    expect(accountInfo).toBeDefined();
  });
});
```

## Best Practices

1. **RPC Node Management**
   - Use multiple RPC providers
   - Implement fallback mechanisms
   - Cache RPC responses

2. **Transaction Handling**
   - Use appropriate commitment levels
   - Handle transaction timeouts
   - Implement retry logic

3. **Error Handling**
   - Handle network errors
   - Validate account data
   - Log failed operations

4. **Rate Limiting**
   - Respect RPC limits
   - Implement request queuing
   - Use exponential backoff

## Common Issues

1. **Network Issues**
   - RPC node failures
   - Network congestion
   - Transaction timeouts

2. **Account Issues**
   - Invalid account addresses
   - Missing account data
   - Program account errors

3. **Performance Issues**
   - Slow RPC responses
   - Large data sets
   - Complex queries

## Monitoring

1. **Metrics to Track**
   - RPC response times
   - Error rates
   - Transaction success rates
   - Indexing progress

2. **Alerts to Set Up**
   - RPC node failures
   - High error rates
   - Slow response times
   - Failed transactions

## Next Steps

1. Review the [API Reference](../api-reference.md) for available endpoints
2. Follow the [Security Guide](../security.md) for best practices
3. Check the [Testing Guide](../testing.md) for more details 