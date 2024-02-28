import { QueryClient, setupGovExtension } from '@cosmjs/stargate';
import * as tm from '@cosmjs/tendermint-rpc';
import { GovV1Client, createLCDClient } from '@hicommonwealth/chains';
import { CommunityInstance } from '@hicommonwealth/model';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../../../config';
import { CosmosClientType, GovV1Beta1ClientType } from './types';

export const CosmosClients: Record<string, CosmosClientType> = {};

export async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client,
>(community: CommunityInstance): Promise<CosmosClient> {
  if (CosmosClients[community.id])
    return CosmosClients[community.id] as CosmosClient;

  if (COSMOS_GOV_V1_CHAIN_IDS.includes(community.id)) {
    const result = await createLCDClient({
      restEndpoint: community.ChainNode.alt_wallet_url,
    });

    CosmosClients[community.id] = result.cosmos.gov.v1;

    if (!CosmosClients[community.id]) {
      throw new Error(
        `Failed to create Cosmos client for community ${community.id}`,
      );
    }
    return CosmosClients[community.id] as CosmosClient;
  } else {
    const tmClient = await tm.Tendermint34Client.connect(
      community.ChainNode.url || community.ChainNode.private_url,
    );
    CosmosClients[community.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension,
    );

    if (
      !CosmosClients[community.id] ||
      !(<GovV1Beta1ClientType>CosmosClients[community.id]).gov
    ) {
      throw new Error(
        `Failed to create Cosmos client for community ${community.id}`,
      );
    }
    return CosmosClients[community.id] as CosmosClient;
  }
}
