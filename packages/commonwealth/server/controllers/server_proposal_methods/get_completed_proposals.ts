import {
  ServerProposalsController,
  SupportedProposalNetworks,
} from '../server_proposals_controller';
import { IGovernanceV2Helper__factory } from 'common-common/src/eth/types/factories/IGovernanceV2Helper__factory';
import { providers } from 'ethers';
import { IGovernanceV2Helper } from 'common-common/src/eth/types/IGovernanceV2Helper';
import { ChainNetwork } from 'common-common/src/types';
import { ServerError } from 'common-common/src/errors';

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
  contractInfo: { address: string; type: SupportedProposalNetworks }
) {
  let completedProposals: any[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const proposals = await getEthereumAaveProposals(
      contractInfo.address,
      provider
    );
    console.log(JSON.stringify(proposals, null, 2));
    return proposals;
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const proposals = await getCompoundBravoProposals();
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }
}

async function getEthereumAaveProposals(
  aaveGovAddress: string,
  provider: providers.Web3Provider
): ReturnType<IGovernanceV2Helper['getProposals']> {
  const aaveGovHelperAddress = '0x16ff7583ea21055Bf5F929Ec4b896D997Ff35847';
  const govHelper = IGovernanceV2Helper__factory.connect(
    aaveGovHelperAddress,
    provider
  );
  // TODO: skip all proposals cached in redis
  return await govHelper.getProposals(0, 1, aaveGovAddress);
}

async function getCompoundBravoProposals() {}
