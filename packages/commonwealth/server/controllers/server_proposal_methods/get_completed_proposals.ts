import { ServerProposalsController } from '../server_proposals_controller';
import { providers } from 'ethers';
import { ChainNetwork } from 'common-common/src/types';
import { ServerError } from 'common-common/src/errors';
import { formatAaveProposal, getEthereumAaveProposals } from './aave/proposals';
import {
  formatCompoundBravoProposal,
  getCompoundProposals,
  GovVersion,
} from './compound/proposals';
import { DB } from '../../models';
import { ContractInfo } from '../server_proposals_controller';

export type GetCompletedProposalsOptions = {
  chainId: string;
};

export type GetCompletedProposalsResult = {
  completedProposals: any[];
};

export async function __getCompletedProposals(
  this: ServerProposalsController,
  { chainId }: GetCompletedProposalsOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo,
  models: DB
) {
  let completedProposals: any[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const proposals = await getEthereumAaveProposals(
      contractInfo.address,
      provider
    );
    completedProposals = proposals.map((p) => formatAaveProposal(p));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const proposals = await getCompoundProposals(
      contractInfo.govVersion,
      contractInfo.address,
      provider,
      models
    );
    completedProposals = proposals.map((p) => formatCompoundBravoProposal(p));
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }

  return completedProposals;
}
