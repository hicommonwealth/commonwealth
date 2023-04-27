import React from 'react';

import BN from 'bn.js';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import { CountdownUntilBlock } from 'views/components/countdown';
import { CWButton } from '../component_kit/cw_button';
import { GovExplainer } from '../gov_explainer';
import { useCommonNavigate } from 'navigation/helpers';

type SubstrateProposalStatsProps = { nextLaunchBlock: number };

export const SubstrateProposalStats = (props: SubstrateProposalStatsProps) => {
  const { nextLaunchBlock } = props;

  return (
    <GovExplainer
      statHeaders={[
        {
          statName: 'Democracy Proposals',
          statDescription: `can be introduced by anyone. At a regular interval, the \
            top ranked proposal will become a supermajority-required referendum.`,
        },
      ]}
      stats={[
        {
          statHeading: 'Next proposal or motion becomes a referendum:',
          stat: nextLaunchBlock ? (
            <CountdownUntilBlock block={nextLaunchBlock} />
          ) : (
            '--'
          ),
        },
      ]}
    />
  );
};

type CompoundProposalStatsProps = { chain: Compound };

export const CompoundProposalStats = (props: CompoundProposalStatsProps) => {
  const { chain } = props;
  const navigate = useCommonNavigate();

  const symbol = chain.meta.default_symbol;

  return (
    <GovExplainer
      statHeaders={[
        {
          statName: 'Compound Proposals',
          statDescription: '', // TODO: fill in
        },
      ]}
      stats={[
        {
          statHeading: 'Quorum:',
          stat: `${chain.governance?.quorumVotes
            .div(new BN('1000000000000000000'))
            .toString()} ${symbol}`, // TODO: We shouldn't be hardcoding these decimal amounts
        },
        {
          statHeading: 'Proposal Threshold:',
          stat: `${chain.governance?.proposalThreshold
            .div(new BN('1000000000000000000'))
            .toString()} ${symbol}`,
        },
        {
          statHeading: 'Voting Period Length:',
          stat: `${chain.governance.votingPeriod.toString(10)}`,
        },
      ]}
      statAction={
        <CWButton
          buttonType="primary-blue"
          onClick={() => navigate('/new/proposal')}
          label="New proposal"
        />
      }
    />
  );
};
