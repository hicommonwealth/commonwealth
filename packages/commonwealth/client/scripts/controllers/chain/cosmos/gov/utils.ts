import { CosmosGovernanceVersion } from '@hicommonwealth/shared';
import { AtomOneLCD, LCD } from 'shared/chain/types/cosmos';
import Cosmos from '../adapter';
import CosmosGovernanceV1AtomOne from './atomone/governance-v1';
import { CosmosProposalV1AtomOne } from './atomone/proposal-v1';
import {
  getActiveProposalsV1AtomOne,
  getCompletedProposalsV1AtomOne,
} from './atomone/utils-v1';
import CosmosGovernanceGovgen from './govgen/governance-v1beta1';
import { CosmosProposalGovgen } from './govgen/proposal-v1beta1';
import {
  getActiveProposalsV1Beta1 as getActiveProposalsGovgen,
  getCompletedProposalsV1Beta1 as getCompletedProposalsGovgen,
} from './govgen/utils-v1beta1';
import CosmosGovernanceV1 from './v1/governance-v1';
import { CosmosProposalV1 } from './v1/proposal-v1';
import { getActiveProposalsV1, getCompletedProposalsV1 } from './v1/utils-v1';
import CosmosGovernance from './v1beta1/governance-v1beta1';
import { CosmosProposal } from './v1beta1/proposal-v1beta1';
import {
  getActiveProposalsV1Beta1,
  getCompletedProposalsV1Beta1,
} from './v1beta1/utils-v1beta1';

// -- Gov methods for all Cosmos SDK versions as of 0.46.11: --

/* This can be used for v1 or v1beta1 */
export const getCompletedProposals = async (
  cosmosChain: Cosmos,
): Promise<CosmosProposal[]> => {
  const { chain, accounts, governance, meta } = cosmosChain;
  console.log(cosmosChain);
  const isAtomone =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1atomone;
  const isGovgen =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1beta1govgen;
  const isV1 =
    meta.ChainNode?.cosmosGovernanceVersion === CosmosGovernanceVersion.v1;
  const betaAttemptFailed =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1beta1Failed;

  let cosmosProposals = [];
  if (isAtomone) {
    const v1proposals = await getCompletedProposalsV1AtomOne(
      chain.lcd as AtomOneLCD,
    );
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1proposals.map(
      (p) =>
        new CosmosProposalV1AtomOne(
          chain,
          accounts,
          governance as CosmosGovernanceV1AtomOne,
          p,
        ),
    );
  } else if (isGovgen) {
    const v1Beta1Proposals = await getCompletedProposalsGovgen(chain.api);
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Beta1Proposals.map(
      (p) =>
        new CosmosProposalGovgen(
          chain,
          accounts,
          governance as CosmosGovernanceGovgen,
          p,
        ),
    );
  } else if (!isGovgen && (isV1 || betaAttemptFailed)) {
    const v1Proposals = await getCompletedProposalsV1(chain.lcd as LCD);

    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Proposals.map(
      (p) =>
        new CosmosProposalV1(
          chain,
          accounts,
          governance as CosmosGovernanceV1,
          p,
        ),
    );
  } else {
    const v1Beta1Proposals = await getCompletedProposalsV1Beta1(chain.api);
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Beta1Proposals.map(
      (p) =>
        new CosmosProposal(chain, accounts, governance as CosmosGovernance, p),
    );
  }

  // @ts-expect-error StrictNullChecks
  Promise.all(cosmosProposals.map((p) => p.init()));
  return cosmosProposals;
};

/* This can be used for v1 or v1beta1 */
export const getActiveProposals = async (
  cosmosChain: Cosmos,
): Promise<CosmosProposal[]> => {
  const { chain, accounts, governance, meta } = cosmosChain;
  const isAtomone =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1atomone;
  const isGovgen =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1beta1govgen;
  const isV1 =
    meta.ChainNode?.cosmosGovernanceVersion === CosmosGovernanceVersion.v1;
  const betaAttemptFailed =
    meta.ChainNode?.cosmosGovernanceVersion ===
    CosmosGovernanceVersion.v1beta1Failed;
  let cosmosProposals = [];
  if (isAtomone) {
    const v1Proposals = await getActiveProposalsV1AtomOne(
      chain.lcd as AtomOneLCD,
    );
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Proposals.map(
      (p) =>
        new CosmosProposalV1AtomOne(
          chain,
          accounts,
          governance as CosmosGovernanceV1AtomOne,
          p,
        ),
    );
  } else if (isGovgen) {
    const v1Beta1Proposals = await getActiveProposalsGovgen(chain.api);
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Beta1Proposals.map(
      (p) =>
        new CosmosProposal(chain, accounts, governance as CosmosGovernance, p),
    );
  } else if (!isGovgen && (isV1 || betaAttemptFailed)) {
    const v1Proposals = await getActiveProposalsV1(chain.lcd);
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Proposals.map(
      (p) =>
        new CosmosProposalV1(
          chain,
          accounts,
          governance as CosmosGovernanceV1,
          p,
        ),
    );
  } else {
    const v1Beta1Proposals = await getActiveProposalsV1Beta1(chain.api);
    // @ts-expect-error StrictNullChecks
    cosmosProposals = v1Beta1Proposals.map(
      (p) =>
        new CosmosProposal(chain, accounts, governance as CosmosGovernance, p),
    );
  }

  // @ts-expect-error StrictNullChecks
  Promise.all(cosmosProposals.map((p) => p.init()));
  return cosmosProposals;
};
