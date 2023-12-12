import React from 'react';

import type Compound from 'controllers/chain/ethereum/compound/adapter';
import { BigNumber } from 'ethers';
import { useCommonNavigate } from 'navigation/helpers';
import { CWButton } from '../component_kit/cw_button';
import { GovExplainer } from '../gov_explainer';

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
            .div(BigNumber.from('1000000000000000000'))
            .toString()} ${symbol}`, // TODO: We shouldn't be hardcoding these decimal amounts
        },
        {
          statHeading: 'Proposal Threshold:',
          stat: `${chain.governance?.proposalThreshold
            .div(BigNumber.from('1000000000000000000'))
            .toString()} ${symbol}`, // TODO: We shouldn't be hardcoding these decimal amounts
        },
        {
          statHeading: 'Voting Period Length:',
          stat: `${chain.governance.votingPeriod.toString()}`,
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
