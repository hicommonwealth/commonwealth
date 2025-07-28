import { logger } from '@hicommonwealth/core';
import { SuiClient } from '@mysten/sui/client';
import { models } from '../../../database';
import type { Balances, GetSuiNftBalanceOptions } from '../types';
import { __get_suinft_balances } from './get_suinft_balances';

const log = logger(import.meta);

export interface SnapshotSource {
  type: 'sui_nft';
  suiNetwork: string;
  collectionId: string;
}

export interface GetSnapshotOptions {
  addresses: string[];
  source: SnapshotSource;
  blockHeight?: bigint;
}

export class SuiNFTProvider {
  /**
   * Get a snapshot of NFT balances at a specific block height or latest
   */
  static async getSnapshot(
    addresses: string[],
    source: SnapshotSource,
    blockHeight?: bigint,
  ): Promise<Balances> {
    const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
      where: {
        balance_type: 'sui',
        name: source.suiNetwork,
      },
    });

    if (!chainNode) {
      const msg = `ChainNode for Sui network ${source.suiNetwork} does not exist`;
      log.error(msg, undefined);
      throw new Error(msg);
    }

    const client = new SuiClient({
      url: chainNode.private_url || chainNode.url,
    });

    try {
      // For now, we'll get the current balances since Sui doesn't have a straightforward
      // way to query historical NFT ownership at specific block heights.
      // In production, you might want to use checkpoints or maintain your own indexing
      const options: GetSuiNftBalanceOptions = {
        addresses,
        balanceSourceType: 'SuiNFT' as any,
        sourceOptions: {
          suiNetwork: source.suiNetwork,
          collectionId: source.collectionId,
        },
        batchSize: 100,
      };

      // If a specific block height is requested, we need to handle historical data
      if (blockHeight) {
        log.warn(
          `Historical block queries not fully implemented for Sui NFTs. Using current state.`,
          { blockHeight: blockHeight.toString() },
        );
        // TODO: Implement checkpoint-based historical queries
        // For now, fall back to current state
      }

      const balances = await __get_suinft_balances(
        chainNode.private_url || chainNode.url,
        options,
      );

      log.info(
        `Successfully captured snapshot for ${addresses.length} addresses`,
        {
          network: source.suiNetwork,
          collectionId: source.collectionId,
          blockHeight: blockHeight?.toString(),
          addressCount: addresses.length,
        },
      );

      return balances;
    } catch (error) {
      log.error('Failed to capture Sui NFT snapshot', error as Error, {
        network: source.suiNetwork,
        collectionId: source.collectionId,
        blockHeight: blockHeight?.toString(),
        addressCount: addresses.length,
      });
      throw error;
    }
  }

  /**
   * Get the current latest block height for the Sui network
   */
  static async getLatestBlockHeight(suiNetwork: string): Promise<bigint> {
    const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
      where: {
        balance_type: 'sui',
        name: suiNetwork,
      },
    });

    if (!chainNode) {
      throw new Error(`ChainNode for Sui network ${suiNetwork} does not exist`);
    }

    const client = new SuiClient({
      url: chainNode.private_url || chainNode.url,
    });

    try {
      const latestCheckpoint = await client.getLatestCheckpointSequenceNumber();
      return BigInt(latestCheckpoint);
    } catch (error) {
      log.error('Failed to get latest Sui checkpoint', error as Error, {
        network: suiNetwork,
      });
      throw error;
    }
  }
}
