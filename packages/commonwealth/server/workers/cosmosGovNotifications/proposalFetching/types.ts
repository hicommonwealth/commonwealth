import { GovExtension, QueryClient } from '@cosmjs/stargate';
import { GovV1Client, ProposalSDKType } from '@hicommonwealth/chains';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

export type AllCosmosProposals = {
  v1: { [chainId: string]: ProposalSDKType[] };
  v1Beta1: { [chainId: string]: Proposal[] };
};
export type GovV1Beta1ClientType = QueryClient & GovExtension;
export type CosmosClientType = GovV1Beta1ClientType | GovV1Client;
