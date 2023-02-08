import React from 'react';

import { ClassComponent, ResultNode} from

 'mithrilInterop';
import { navigateToSubpage } from 'router';
import BN from 'bn.js';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import { CountdownUntilBlock } from 'views/components/countdown';
import { CWButton } from '../component_kit/cw_button';
import { GovExplainer } from '../gov_explainer';

type SubstrateProposalStatsAttrs = { nextLaunchBlock: number };

export class SubstrateProposalStats extends ClassComponent<SubstrateProposalStatsAttrs> {
  view(vnode: ResultNode<SubstrateProposalStatsAttrs>) {
    const { nextLaunchBlock } = vnode.attrs;

    return (
      <GovExplainer
        statHeaders={[
          {
            statName: 'Democracy Proposals',
            statDescription: `can be introduced by anyone. At a regular interval, the \
            top ranked proposal will become a supermajority-required referendum.`,
          },
          {
            statName: 'Council Motions',
            statDescription: `can be introduced by councillors. They can directly \
            approve/reject treasury proposals, propose simple-majority referenda, or create fast-track referenda.`,
          },
        ]}
        stats={[
          {
            statHeading: 'Next proposal or motion becomes a referendum:',
            stat: nextLaunchBlock ? (
              <CountdownUntilBlock
                block={nextLaunchBlock}
                includeSeconds={false}
              />
            ) : (
              '--'
            ),
          },
        ]}
      />
    );
  }
}

type CompoundProposalStatsAttrs = { chain: Compound };

export class CompoundProposalStats extends ClassComponent<CompoundProposalStatsAttrs> {
  view(vnode: ResultNode<CompoundProposalStatsAttrs>) {
    const { chain } = vnode.attrs;

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
            onClick={() => navigateToSubpage('/new/proposal')}
            label="New proposal"
          />
        }
      />
    );
  }
}
