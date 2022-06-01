/* @jsx m */

import m from 'mithril';
import BN from 'bn.js';

import { navigateToSubpage } from 'app';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { CountdownUntilBlock } from 'views/components/countdown';
import { GovExplainer } from '../gov_explainer';
import { CWButton } from '../component_kit/cw_button';

export class SubstrateProposalStats
  implements m.ClassComponent<{ nextLaunchBlock: number }>
{
  view(vnode) {
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

export class CompoundProposalStats
  implements m.ClassComponent<{ chain: Compound }>
{
  view(vnode) {
    const { chain } = vnode.attrs;

    const symbol = chain.meta.symbol;

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
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New proposal"
          />
        }
      />
    );
  }
}
