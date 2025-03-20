# Ethereum Community Indexer Guide

This guide explains how to create community indexers for Ethereum-based communities.

## Overview

Ethereum community indexers can create communities based on various on-chain data sources, including:
- ERC-20 tokens
- ERC-721 NFTs
- ERC-1155 tokens
- DAO governance contracts
- DeFi protocols

## Implementation Guide

### 1. Configuration

```typescript
// src/config.ts
import { ChainNetwork, ChainBase } from '@hicommonwealth/core';

export const EthereumIndexerConfig = {
  id: 'ethereum-indexer',
  name: 'Ethereum Indexer',
  description: 'Indexes Ethereum-based communities',
  network: ChainNetwork.Ethereum,
  base: ChainBase.Ethereum,
  pollingInterval: 60000, // 1 minute
  requiredParams: ['rpc_url', 'api_key'],
  supportedTypes: ['token', 'nft', 'dao'],
};
```

### 2. Web3 Setup

```typescript
// src/web3.ts
import { ethers } from 'ethers';
import { EthereumIndexerConfig } from './config';

export class Web3Client {
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(config: typeof EthereumIndexerConfig) {
    this.provider = new ethers.JsonRpcProvider(config.requiredParams.rpc_url);
    this.signer = new ethers.Wallet(config.requiredParams.api_key, this.provider);
  }

  async getContract(address: string, abi: any) {
    return new ethers.Contract(address, abi, this.signer);
  }
}
```

### 3. Token Indexer Implementation

```typescript
// src/indexers/token.ts
import { Indexer } from '@hicommonwealth/core';
import { Web3Client } from '../web3';
import { ERC20_ABI } from '../abis';

export class TokenIndexer implements Indexer {
  private web3: Web3Client;

  constructor(private config: typeof EthereumIndexerConfig) {
    this.web3 = new Web3Client(config);
  }

  async index(communityId: string) {
    const contract = await this.web3.getContract(communityId, ERC20_ABI);
    
    const [name, symbol, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
    ]);

    return {
      id: communityId,
      name,
      symbol,
      totalSupply: totalSupply.toString(),
      type: 'token',
    };
  }
}
```

### 4. NFT Indexer Implementation

```typescript
// src/indexers/nft.ts
import { Indexer } from '@hicommonwealth/core';
import { Web3Client } from '../web3';
import { ERC721_ABI } from '../abis';

export class NFTIndexer implements Indexer {
  private web3: Web3Client;

  constructor(private config: typeof EthereumIndexerConfig) {
    this.web3 = new Web3Client(config);
  }

  async index(communityId: string) {
    const contract = await this.web3.getContract(communityId, ERC721_ABI);
    
    const [name, symbol, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
    ]);

    return {
      id: communityId,
      name,
      symbol,
      totalSupply: totalSupply.toString(),
      type: 'nft',
    };
  }
}
```

### 5. DAO Indexer Implementation

```typescript
// src/indexers/dao.ts
import { Indexer } from '@hicommonwealth/core';
import { Web3Client } from '../web3';
import { DAO_ABI } from '../abis';

export class DAOIndexer implements Indexer {
  private web3: Web3Client;

  constructor(private config: typeof EthereumIndexerConfig) {
    this.web3 = new Web3Client(config);
  }

  async index(communityId: string) {
    const contract = await this.web3.getContract(communityId, DAO_ABI);
    
    const [name, token, votingPeriod] = await Promise.all([
      contract.name(),
      contract.token(),
      contract.votingPeriod(),
    ]);

    return {
      id: communityId,
      name,
      token,
      votingPeriod: votingPeriod.toString(),
      type: 'dao',
    };
  }
}
```

## Common ABIs

```typescript
// src/abis/index.ts
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
];

export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
];

export const DAO_ABI = [
  'function name() view returns (string)',
  'function token() view returns (address)',
  'function votingPeriod() view returns (uint256)',
  'function quorum() view returns (uint256)',
];
```

## Testing

### 1. Unit Tests

```typescript
// src/__tests__/token.test.ts
import { describe, it, expect } from 'vitest';
import { TokenIndexer } from '../indexers/token';
import { EthereumIndexerConfig } from '../config';

describe('TokenIndexer', () => {
  it('should fetch token data', async () => {
    const indexer = new TokenIndexer(EthereumIndexerConfig);
    const data = await indexer.index('0x...');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('symbol');
  });
});
```

### 2. Integration Tests

```typescript
// src/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { Web3Client } from '../web3';

describe('Web3 Integration', () => {
  it('should connect to Ethereum network', async () => {
    const web3 = new Web3Client(EthereumIndexerConfig);
    const contract = await web3.getContract('0x...', ERC20_ABI);
    expect(contract).toBeDefined();
  });
});
```

## Best Practices

1. **RPC Node Management**
   - Use multiple RPC providers for redundancy
   - Implement fallback mechanisms
   - Cache RPC responses when appropriate

2. **Gas Optimization**
   - Batch RPC calls
   - Use multicall contracts
   - Cache frequently accessed data

3. **Error Handling**
   - Handle network errors gracefully
   - Implement retry mechanisms
   - Log failed transactions

4. **Rate Limiting**
   - Respect RPC provider limits
   - Implement request queuing
   - Use exponential backoff

## Common Issues

1. **Network Issues**
   - RPC node failures
   - Network congestion
   - Gas price spikes

2. **Contract Issues**
   - Non-standard implementations
   - Missing functions
   - Upgradeable contracts

3. **Performance Issues**
   - Slow RPC responses
   - Large data sets
   - Complex queries

## Monitoring

1. **Metrics to Track**
   - RPC response times
   - Error rates
   - Gas costs
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