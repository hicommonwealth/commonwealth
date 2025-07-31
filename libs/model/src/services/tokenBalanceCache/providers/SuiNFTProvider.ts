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

export class SuiNFTProvider {
  /**
   * Get latest NFT balances
   */
  static async getNFTBalances(
    addresses: string[],
    source: SnapshotSource,
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

    const options: GetSuiNftBalanceOptions = {
      addresses,
      balanceSourceType: 'SuiNFT' as any,
      sourceOptions: {
        suiNetwork: source.suiNetwork,
        collectionId: source.collectionId,
      },
      batchSize: 100,
    };

    const balances = await __get_suinft_balances(
      chainNode.private_url || chainNode.url,
      options,
    );

    log.info(
      `Successfully captured snapshot for ${addresses.length} addresses`,
      {
        network: source.suiNetwork,
        collectionId: source.collectionId,
        addressCount: addresses.length,
      },
    );

    return balances;
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
