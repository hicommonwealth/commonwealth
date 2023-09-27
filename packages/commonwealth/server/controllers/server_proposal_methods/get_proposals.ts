import {
  ContractInfo,
  ServerProposalsController,
  SupportedProposalNetworks,
} from '../server_proposals_controller';
import { providers } from 'ethers';
import { ChainNetwork } from 'common-common/src/types';
import { ServerError } from 'common-common/src/errors';
import { formatAaveProposal, getEthereumAaveProposals } from './aave/proposals';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';

export type GetProposalsOptions = {
  chainId: string;
};

export type GetProposalsResult = IAaveProposalResponse[];

export async function __getProposals(
  this: ServerProposalsController,
  { chainId }: GetProposalsOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo
): Promise<GetProposalsResult> {
  let formattedProposals: any[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const proposals = await getEthereumAaveProposals(
      contractInfo.address,
      provider
    );
    formattedProposals = proposals.map((p) => formatAaveProposal(p));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    // const proposals = await getCompoundBravoProposals();
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }

  return formattedProposals;
}
