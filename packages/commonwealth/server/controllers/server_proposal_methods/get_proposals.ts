import {ContractInfo, ServerProposalsController } from '../server_proposals_controller';
import { providers } from 'ethers';
import { ChainNetwork } from 'common-common/src/types';
import { ServerError } from 'common-common/src/errors';
import { formatAaveProposal, getEthereumAaveProposals } from './aave/proposals';
import {
  formatCompoundBravoProposal,
  getCompoundProposals,
} from './compound/proposals';
import { DB } from '../../models';
import { ContractInfo } from '../server_proposals_controller';
import { GovVersion } from './compound/types';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';

export type GetProposalsOptions = {
  chainId: string;
};

export type GetProposalsResult = IAaveProposalResponse[];

export async function __getProposals(
  this: ServerProposalsController,
  { chainId }: GetProposalsOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo,
  models: DB
): Promise<GetProposalsResult> {
  let formattedProposals: any[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const proposals = await getEthereumAaveProposals(
      contractInfo.address,
      provider
    );
    formattedProposals = proposals.map((p) => formatAaveProposal(p));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const proposals = await getCompoundProposals(
      contractInfo.govVersion,
      contractInfo.address,
      provider,
      models
    );
    formattedProposals = proposals.map((p) => formatCompoundBravoProposal(p));
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }

  return formattedProposals;
}
