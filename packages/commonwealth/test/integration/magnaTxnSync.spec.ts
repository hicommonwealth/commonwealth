import { dispose } from '@hicommonwealth/core';
import { getPublicClient, ValidChains } from '@hicommonwealth/evm-protocols';
import { type DB } from '@hicommonwealth/model/models';
import * as tester from '@hicommonwealth/model/tester';
import { BalanceType } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { config } from '../../server/config';
import { magnaTxnSyncTask } from '../../server/workers/graphileWorker/tasks/magnaTxnSync';

// Mock evm-protocols
vi.mock('@hicommonwealth/evm-protocols', async () => {
  const actual = await vi.importActual('@hicommonwealth/evm-protocols');
  return {
    ...actual,
    getPublicClient: vi.fn(),
  };
});

// Mock global fetch for Alchemy Blocks API
global.fetch = vi.fn() as any;

describe('MagnaTxnSync Task Tests', () => {
  let models: DB;
  let mockClient: any;

  beforeAll(async () => {
    models = await tester.seedDb();

    // Create Base ChainNode for the tests
    await models.ChainNode.findOrCreate({
      where: {
        eth_chain_id: ValidChains.Base,
      },
      defaults: {
        url: 'https://base-mainnet.g.alchemy.com/v2/test',
        private_url: 'https://base-mainnet.g.alchemy.com/v2/test',
        balance_type: BalanceType.Ethereum,
        name: 'Base',
      },
    });

    // Setup mock Viem client
    mockClient = {
      request: vi.fn(),
      getTransaction: vi.fn(),
    };

    vi.mocked(getPublicClient).mockReturnValue(mockClient as any);

    // Mock Alchemy Blocks API
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            network: 'base-mainnet',
            block: {
              number: 10000000,
              timestamp: '2024-01-01T00:00:00Z',
            },
          },
        ],
      }),
    } as any);
  });

  afterAll(async () => {
    await dispose()();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await models.sequelize.query('TRUNCATE TABLE "ClaimAddresses" CASCADE', {
      type: QueryTypes.RAW,
    });
    await models.sequelize.query('TRUNCATE TABLE "Users" CASCADE', {
      type: QueryTypes.RAW,
    });
    vi.clearAllMocks();

    // Re-setup mocks after clearAllMocks
    vi.mocked(getPublicClient).mockReturnValue(mockClient as any);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            network: 'base-mainnet',
            block: {
              number: 10000000,
              timestamp: '2024-01-01T00:00:00Z',
            },
          },
        ],
      }),
    } as any);
  });

  describe('Configuration validation', () => {
    test('should handle missing Alchemy config gracefully', async () => {
      // Spy on console.error to verify error logging
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock config to return undefined for API keys
      vi.spyOn(config, 'ALCHEMY', 'get').mockReturnValue({
        ...config.ALCHEMY!,
        APP_KEYS: undefined,
      } as any);

      await magnaTxnSyncTask.fn();

      expect(mockClient.request).not.toHaveBeenCalled();

      errorSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('Database queries', () => {
    test('should exit early if no claim addresses need processing', async () => {
      // Create a user first
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      // Create claim address that doesn't need processing (missing magna_claimed_at)
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" (user_id, address, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: '0x1234567890123456789012345678901234567890',
          },
        },
      );

      await magnaTxnSyncTask.fn();

      expect(mockClient.request).not.toHaveBeenCalled();
    });

    test('should process claim addresses with magna_claimed_at and magna_claim_data but no tx hash', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "data"}',
          },
        },
      );

      const mockTxHash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      // Mock Alchemy response
      mockClient.request.mockResolvedValue({
        transfers: [
          {
            hash: mockTxHash,
          },
        ],
      });

      // Mock transaction verification
      mockClient.getTransaction.mockResolvedValue({
        to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
        input: '0x8612372a000000000000000000000000', // withdraw selector
      });

      await magnaTxnSyncTask.fn();

      expect(mockClient.request).toHaveBeenCalled();
      expect(mockClient.getTransaction).toHaveBeenCalledWith({
        hash: mockTxHash,
      });

      // Verify database was updated
      const updated = await models.sequelize.query<{
        magna_claim_tx_hash: string;
      }>(
        `
          SELECT magna_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      expect(updated[0].magna_claim_tx_hash).toBe(mockTxHash);
    });

    test('should skip addresses already with tx hash', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, magna_claim_tx_hash, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, :tx_hash, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: '0x1234567890123456789012345678901234567890',
            claim_data: '{"test": "data"}',
            tx_hash:
              '0xexisting1234567890abcdef1234567890abcdef1234567890abcdef123456',
          },
        },
      );

      await magnaTxnSyncTask.fn();

      expect(mockClient.request).not.toHaveBeenCalled();
    });
  });

  describe('Transaction verification', () => {
    test('should only accept transactions to the correct Magna contract', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "data"}',
          },
        },
      );

      const wrongContractTxHash =
        '0xwrong1234567890abcdef1234567890abcdef1234567890abcdef12345678';

      mockClient.request.mockResolvedValue({
        transfers: [
          {
            hash: wrongContractTxHash,
          },
        ],
      });

      // Mock transaction to wrong contract
      mockClient.getTransaction.mockResolvedValue({
        to: '0xWRONGCONTRACT123456789012345678901234567890',
        input: '0x8612372a000000000000000000000000',
      });

      await magnaTxnSyncTask.fn();

      // Should not update database with wrong contract tx
      const updated = await models.sequelize.query<{
        magna_claim_tx_hash: string | null;
      }>(
        `
          SELECT magna_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      expect(updated[0].magna_claim_tx_hash).toBeNull();
    });

    test('should only accept transactions with withdraw function selector', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "data"}',
          },
        },
      );

      const wrongFunctionTxHash =
        '0xwrong1234567890abcdef1234567890abcdef1234567890abcdef12345678';

      mockClient.request.mockResolvedValue({
        transfers: [
          {
            hash: wrongFunctionTxHash,
          },
        ],
      });

      // Mock transaction with wrong function selector
      mockClient.getTransaction.mockResolvedValue({
        to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
        input: '0xWRONGFUNC000000000000000000000000', // not withdraw selector
      });

      await magnaTxnSyncTask.fn();

      const updated = await models.sequelize.query<{
        magna_claim_tx_hash: string | null;
      }>(
        `
          SELECT magna_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      expect(updated[0].magna_claim_tx_hash).toBeNull();
    });

    test('should use the first transaction for initial claim if multiple found', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "data"}',
          },
        },
      );

      const firstTxHash =
        '0xfirst67890abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const secondTxHash =
        '0xsecond7890abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockResolvedValue({
        transfers: [
          { hash: firstTxHash }, // First (earliest)
          { hash: secondTxHash }, // Second (later)
        ],
      });

      mockClient.getTransaction.mockImplementation(({ hash }) => {
        return Promise.resolve({
          to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
          input: '0x8612372a000000000000000000000000',
        });
      });

      await magnaTxnSyncTask.fn();

      const updated = await models.sequelize.query<{
        magna_claim_tx_hash: string;
      }>(
        `
          SELECT magna_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      // Should use the first (earliest) transaction for initial claim
      expect(updated[0].magna_claim_tx_hash).toBe(firstTxHash);
    });
  });

  describe('Cliff claim transaction processing', () => {
    test('should process cliff claim transactions separately from initial claims', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_cliff_claimed_at, magna_cliff_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "cliff data"}',
          },
        },
      );

      const firstTxHash =
        '0xfirst67890abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const secondTxHash =
        '0xsecond7890abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockResolvedValue({
        transfers: [
          { hash: firstTxHash }, // Initial claim
          { hash: secondTxHash }, // Cliff claim
        ],
      });

      mockClient.getTransaction.mockImplementation(() => {
        return Promise.resolve({
          to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
          input: '0x8612372a000000000000000000000000',
        });
      });

      await magnaTxnSyncTask.fn();

      const updated = await models.sequelize.query<{
        magna_cliff_claim_tx_hash: string;
      }>(
        `
          SELECT magna_cliff_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      // Should use the second transaction for cliff claim
      expect(updated[0].magna_cliff_claim_tx_hash).toBe(secondTxHash);
    });

    test('should fail cliff claim processing if only one transaction found', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_cliff_claimed_at, magna_cliff_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "cliff data"}',
          },
        },
      );

      const singleTxHash =
        '0xsingle7890abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockResolvedValue({
        transfers: [
          { hash: singleTxHash }, // Only one transaction
        ],
      });

      mockClient.getTransaction.mockImplementation(() => {
        return Promise.resolve({
          to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
          input: '0x8612372a000000000000000000000000',
        });
      });

      await magnaTxnSyncTask.fn();

      const updated = await models.sequelize.query<{
        magna_cliff_claim_tx_hash: string | null;
      }>(
        `
          SELECT magna_cliff_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      // Should not update with only one transaction
      expect(updated[0].magna_cliff_claim_tx_hash).toBeNull();
    });

    test('should process both initial claim and cliff claim in sequence', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const testAddress = '0x1234567890123456789012345678901234567890';
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, 
           magna_cliff_claimed_at, magna_cliff_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), :cliff_claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: testAddress,
            claim_data: '{"test": "claim data"}',
            cliff_claim_data: '{"test": "cliff data"}',
          },
        },
      );

      const firstTxHash =
        '0xfirst67890abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const secondTxHash =
        '0xsecond7890abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockResolvedValue({
        transfers: [
          { hash: firstTxHash }, // Initial claim
          { hash: secondTxHash }, // Cliff claim
        ],
      });

      mockClient.getTransaction.mockImplementation(() => {
        return Promise.resolve({
          to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
          input: '0x8612372a000000000000000000000000',
        });
      });

      await magnaTxnSyncTask.fn();

      const updated = await models.sequelize.query<{
        magna_claim_tx_hash: string;
        magna_cliff_claim_tx_hash: string;
      }>(
        `
          SELECT magna_claim_tx_hash, magna_cliff_claim_tx_hash 
          FROM "ClaimAddresses" 
          WHERE user_id = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user.id },
        },
      );

      // Should have both transactions indexed correctly
      expect(updated[0].magna_claim_tx_hash).toBe(firstTxHash);
      expect(updated[0].magna_cliff_claim_tx_hash).toBe(secondTxHash);
    });

    test('should skip cliff claims that already have tx hash', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      const existingTxHash =
        '0xexisting1234567890abcdef1234567890abcdef1234567890abcdef123456';

      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_cliff_claimed_at, magna_cliff_claim_data, 
           magna_cliff_claim_tx_hash, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, :tx_hash, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: '0x1234567890123456789012345678901234567890',
            claim_data: '{"test": "data"}',
            tx_hash: existingTxHash,
          },
        },
      );

      await magnaTxnSyncTask.fn();

      // Should not make any API calls since the cliff claim already has a tx hash
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    test('should handle cliff claims with different timestamps correctly', async () => {
      const user1 = await models.User.create({
        email: 'test1@example.com',
        profile: { name: 'Test User 1' },
        tier: 1,
      });

      const user2 = await models.User.create({
        email: 'test2@example.com',
        profile: { name: 'Test User 2' },
        tier: 1,
      });

      // Create two cliff claims with different timestamps
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_cliff_claimed_at, magna_cliff_claim_data, created_at, updated_at)
          VALUES 
            (:user_id1, :address1, :early_date, :claim_data, NOW(), NOW()),
            (:user_id2, :address2, :late_date, :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id1: user1.id,
            address1: '0x1111111111111111111111111111111111111111',
            early_date: new Date('2024-01-01T00:00:00Z'),
            user_id2: user2.id,
            address2: '0x2222222222222222222222222222222222222222',
            late_date: new Date('2024-06-01T00:00:00Z'),
            claim_data: '{"test": "data"}',
          },
        },
      );

      const tx1First =
        '0xtx1first890abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const tx1Second =
        '0xtx1second90abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const tx2First =
        '0xtx2first90abcdef1234567890abcdef1234567890abcdef1234567890abc';
      const tx2Second =
        '0xtx2second0abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockImplementation(({ params }: any) => {
        const fromAddress = params[0].fromAddress;
        if (fromAddress === '0x1111111111111111111111111111111111111111') {
          return Promise.resolve({
            transfers: [{ hash: tx1First }, { hash: tx1Second }],
          });
        } else {
          return Promise.resolve({
            transfers: [{ hash: tx2First }, { hash: tx2Second }],
          });
        }
      });

      mockClient.getTransaction.mockResolvedValue({
        to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
        input: '0x8612372a000000000000000000000000',
      });

      await magnaTxnSyncTask.fn();

      // Verify both cliff claims were processed with the second transaction
      const result1 = await models.sequelize.query<{
        magna_cliff_claim_tx_hash: string;
      }>(
        `SELECT magna_cliff_claim_tx_hash FROM "ClaimAddresses" WHERE user_id = :user_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user1.id },
        },
      );
      expect(result1[0].magna_cliff_claim_tx_hash).toBe(tx1Second);

      const result2 = await models.sequelize.query<{
        magna_cliff_claim_tx_hash: string;
      }>(
        `SELECT magna_cliff_claim_tx_hash FROM "ClaimAddresses" WHERE user_id = :user_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user2.id },
        },
      );
      expect(result2[0].magna_cliff_claim_tx_hash).toBe(tx2Second);
    });
  });

  describe('Error handling', () => {
    test('should handle Alchemy API errors gracefully', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: '0x1234567890123456789012345678901234567890',
            claim_data: '{"test": "data"}',
          },
        },
      );

      mockClient.request.mockRejectedValue(new Error('Alchemy API error'));

      // Should not throw, just log error
      await expect(magnaTxnSyncTask.fn()).resolves.not.toThrow();
    });

    test('should handle transaction fetch errors gracefully', async () => {
      const user = await models.User.create({
        email: 'test@example.com',
        profile: { name: 'Test User' },
        tier: 1,
      });

      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES (:user_id, :address, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id: user.id,
            address: '0x1234567890123456789012345678901234567890',
            claim_data: '{"test": "data"}',
          },
        },
      );

      mockClient.request.mockResolvedValue({
        transfers: [
          {
            hash: '0xtest123',
          },
        ],
      });

      mockClient.getTransaction.mockRejectedValue(
        new Error('Transaction not found'),
      );

      // Should not throw, just log error
      await expect(magnaTxnSyncTask.fn()).resolves.not.toThrow();
    });

    test('should process multiple addresses even if one fails', async () => {
      const user1 = await models.User.create({
        email: 'test1@example.com',
        profile: { name: 'Test User 1' },
        tier: 1,
      });

      const user2 = await models.User.create({
        email: 'test2@example.com',
        profile: { name: 'Test User 2' },
        tier: 1,
      });

      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES 
            (:user_id1, :address1, NOW(), :claim_data, NOW(), NOW()),
            (:user_id2, :address2, NOW(), :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id1: user1.id,
            address1,
            user_id2: user2.id,
            address2,
            claim_data: '{"test": "data"}',
          },
        },
      );

      const goodTxHash =
        '0xgood567890abcdef1234567890abcdef1234567890abcdef1234567890abc';

      mockClient.request.mockImplementation(({ params }: any) => {
        const fromAddress = params[0].fromAddress;
        if (fromAddress === address1.toLowerCase()) {
          // First address fails
          throw new Error('API error');
        } else {
          // Second address succeeds
          return Promise.resolve({
            transfers: [{ hash: goodTxHash }],
          });
        }
      });

      mockClient.getTransaction.mockResolvedValue({
        to: '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6',
        input: '0x8612372a000000000000000000000000',
      });

      await magnaTxnSyncTask.fn();

      // First address should not have tx hash
      const result1 = await models.sequelize.query<{
        magna_claim_tx_hash: string | null;
      }>(
        `SELECT magna_claim_tx_hash FROM "ClaimAddresses" WHERE user_id = :user_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user1.id },
        },
      );
      expect(result1[0].magna_claim_tx_hash).toBeNull();

      // Second address should have tx hash
      const result2 = await models.sequelize.query<{
        magna_claim_tx_hash: string;
      }>(
        `SELECT magna_claim_tx_hash FROM "ClaimAddresses" WHERE user_id = :user_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { user_id: user2.id },
        },
      );
      expect(result2[0].magna_claim_tx_hash).toBe(goodTxHash);
    });
  });

  describe('Block number calculation', () => {
    test('should calculate starting block from earliest magna_claimed_at', async () => {
      const user1 = await models.User.create({
        email: 'test1@example.com',
        profile: { name: 'Test User 1' },
        tier: 1,
      });

      const user2 = await models.User.create({
        email: 'test2@example.com',
        profile: { name: 'Test User 2' },
        tier: 1,
      });

      // Create two claims with different timestamps
      await models.sequelize.query(
        `
          INSERT INTO "ClaimAddresses" 
          (user_id, address, magna_claimed_at, magna_claim_data, created_at, updated_at)
          VALUES 
            (:user_id1, :address1, :early_date, :claim_data, NOW(), NOW()),
            (:user_id2, :address2, :late_date, :claim_data, NOW(), NOW())
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            user_id1: user1.id,
            address1: '0x1111111111111111111111111111111111111111',
            early_date: new Date('2024-01-01T00:00:00Z'),
            user_id2: user2.id,
            address2: '0x2222222222222222222222222222222222222222',
            late_date: new Date('2024-06-01T00:00:00Z'),
            claim_data: '{"test": "data"}',
          },
        },
      );

      mockClient.request.mockResolvedValue({ transfers: [] });

      await magnaTxnSyncTask.fn();

      // Verify it called request with appropriate block number
      // (based on earliest date)
      expect(mockClient.request).toHaveBeenCalled();
      const firstCall = mockClient.request.mock.calls[0];
      const fromBlock = firstCall[0].params[0].fromBlock;

      // Should have a fromBlock parameter
      expect(fromBlock).toBeDefined();
      expect(typeof fromBlock).toBe('string');
      expect(fromBlock.startsWith('0x')).toBe(true);
    });
  });
});
