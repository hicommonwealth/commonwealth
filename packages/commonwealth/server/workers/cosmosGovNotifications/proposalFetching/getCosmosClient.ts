import { QueryClient, setupGovExtension } from '@cosmjs/stargate';
import * as tm from '@cosmjs/tendermint-rpc';
import { GovV1Client, createLCDClient } from '@hicommonwealth/chains';
import { CommunityInstance } from '@hicommonwealth/model';
import { CosmosGovernanceVersion } from '@hicommonwealth/shared';
import { CosmosClientType, GovV1Beta1ClientType } from './types';

export const CosmosClients: Record<string, CosmosClientType> = {};

export async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client,
>(community: CommunityInstance): Promise<CosmosClient> {
  // @ts-expect-error StrictNullChecks
  if (CosmosClients[community.id])
    // @ts-expect-error StrictNullChecks
    return CosmosClients[community.id] as CosmosClient;

  const chainNode = await community.getChainNode();
  if (chainNode?.cosmos_gov_version === CosmosGovernanceVersion.v1) {
    const result = await createLCDClient({
      // @ts-expect-error StrictNullChecks
      restEndpoint: community.ChainNode.alt_wallet_url,
    });

    // @ts-expect-error StrictNullChecks
    CosmosClients[community.id] = result.cosmos.gov.v1;

    // @ts-expect-error StrictNullChecks
    if (!CosmosClients[community.id]) {
      throw new Error(
        `Failed to create Cosmos client for community ${community.id}`,
      );
    }
    // @ts-expect-error StrictNullChecks
    return CosmosClients[community.id] as CosmosClient;
  } else {
    const tmClient = await tm.Tendermint34Client.connect(
      // @ts-expect-error StrictNullChecks
      community.ChainNode.private_url || community.ChainNode.url,
    );
    // @ts-expect-error StrictNullChecks
    CosmosClients[community.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension,
    );

    if (
      // @ts-expect-error StrictNullChecks
      !CosmosClients[community.id] ||
      // @ts-expect-error StrictNullChecks
      !(<GovV1Beta1ClientType>CosmosClients[community.id]).gov
    ) {
      throw new Error(
        `Failed to create Cosmos client for community ${community.id}`,
      );
    }
    // @ts-expect-error StrictNullChecks
    return CosmosClients[community.id] as CosmosClient;
  }
}
