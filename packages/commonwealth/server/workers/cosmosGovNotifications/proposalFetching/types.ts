import { GovExtension, QueryClient } from '@cosmjs/stargate';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { ProposalSDKType } from 'protocol/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { LCDQueryClient as GovV1Client } from 'protocol/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';

export type AllCosmosProposals = {
  v1: { [chainId: string]: ProposalSDKType[] };
  v1Beta1: { [chainId: string]: Proposal[] };
};
export type GovV1Beta1ClientType = QueryClient & GovExtension;

export type CosmosClientType = GovV1Beta1ClientType | GovV1Client;
