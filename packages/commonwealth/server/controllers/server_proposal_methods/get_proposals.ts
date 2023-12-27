import { ChainNetwork } from '@hicommonwealth/core';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { ServerError } from 'common-common/src/errors';
import { providers } from 'ethers';
import {
  ContractInfo,
  ServerProposalsController,
} from '../server_proposals_controller';
import { formatAaveProposal, getEthereumAaveProposals } from './aave/proposals';
import {
  formatCompoundBravoProposal,
  getCompoundProposals,
} from './compound/proposals';

export type GetProposalsOptions = {
  communityId: string;
};

export type GetProposalsResult =
  | IAaveProposalResponse[]
  | ICompoundProposalResponse[];

export async function __getProposals(
  this: ServerProposalsController,
  { communityId }: GetProposalsOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo,
): Promise<GetProposalsResult> {
  let formattedProposals: GetProposalsResult = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const proposals = await getEthereumAaveProposals(
      contractInfo.address,
      provider,
    );
    formattedProposals = proposals.map((p) => formatAaveProposal(p));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const proposals = await getCompoundProposals(
      contractInfo.address,
      provider,
      this.redisCache,
    );
    formattedProposals = proposals.map((p) => formatCompoundBravoProposal(p));
  } else {
    throw new ServerError(
      `Proposal fetching not supported for community ${communityId} on network ${contractInfo.type}`,
    );
  }

  return formattedProposals;
}
