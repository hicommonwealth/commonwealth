import { QueryClient, setupGovExtension } from '@cosmjs/stargate';
import * as tm from '@cosmjs/tendermint-rpc';
import { GovV1Client, createLCDClient } from '@hicommonwealth/chains';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../../../config';
import { CommunityInstance } from '../../../models/community';
import { CosmosClientType, GovV1Beta1ClientType } from './types';

export const CosmosClients: Record<string, CosmosClientType> = {};

export async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client,
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
      chain.ChainNode.url || chain.ChainNode.private_url,
    );
    CosmosClients[chain.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension,
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
