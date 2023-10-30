import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import { CommunityInstance } from '../../../models/chain';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../../../config';
import { createLCDClient } from 'common-common/src/cosmos-ts/src/codegen/cosmos/lcd';
import * as tm from '@cosmjs/tendermint-rpc';
import { QueryClient, setupGovExtension } from '@cosmjs/stargate';
import { CosmosClientType, GovV1Beta1ClientType } from './types';

export const CosmosClients: Record<string, CosmosClientType> = {};

export async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client
>(chain: CommunityInstance): Promise<CosmosClient> {
  if (CosmosClients[chain.id]) return CosmosClients[chain.id] as CosmosClient;

  if (COSMOS_GOV_V1_CHAIN_IDS.includes(chain.id)) {
    const result = await createLCDClient({
      restEndpoint: chain.ChainNode.alt_wallet_url,
    });

    CosmosClients[chain.id] = result.cosmos.gov.v1;

    if (!CosmosClients[chain.id]) {
      throw new Error(`Failed to create Cosmos client for chain ${chain.id}`);
    }
    return CosmosClients[chain.id] as CosmosClient;
  } else {
    const tmClient = await tm.Tendermint34Client.connect(
      chain.ChainNode.url || chain.ChainNode.private_url
    );
    CosmosClients[chain.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension
    );

    if (
      !CosmosClients[chain.id] ||
      !(<GovV1Beta1ClientType>CosmosClients[chain.id]).gov
    ) {
      throw new Error(`Failed to create Cosmos client for chain ${chain.id}`);
    }
    return CosmosClients[chain.id] as CosmosClient;
  }
}
