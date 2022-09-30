/* @jsx m */

import m from 'mithril';
import 'components/create_content_popover.scss';
import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { CWMenuItem } from '../components/component_kit/cw_menu_item';

export class CreateContentMenu implements m.ClassComponent {
  view(vnode) {
    const activeAccount = app.user.activeAccount;

    const showSnapshotOptions =
      app.user.activeAccount && app.chain?.meta.snapshot.length > 0;

    const topics = app.topics
      .getByCommunity(app.activeChainId())
      .reduce(
        (acc, current) => (current.featuredInNewPost ? [...acc, current] : acc),
        []
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        <CWMenuItem
          onclick={() => {
            navigateToSubpage('/new/discussion');
          }}
          label="New thread"
        />
        {topics.map((t) => (
          <CWMenuItem
            onclick={() => {
              // TODO Graham 7-19-22: Let's find a non-localStorage solution
              localStorage.setItem(
                `${app.activeChainId()}-active-topic`,
                t.name
              );
              if (t.defaultOffchainTemplate) {
                localStorage.setItem(
                  `${app.activeChainId()}-active-topic-default-template`,
                  t.defaultOffchainTemplate
                );
              } else {
                localStorage.removeItem(
                  `${app.activeChainId()}-active-topic-default-template`
                );
              }
              navigateToSubpage('/new/discussion');
            }}
            label={`New ${t.name} Thread`}
          />
        ))}
        {app.chain?.network === ChainNetwork.Aave ||
          app.chain?.network === ChainNetwork.dYdX ||
          app.chain?.network === ChainNetwork.Compound ||
          app.chain?.base === ChainBase.CosmosSDK ||
          app.chain?.base === ChainBase.Substrate}
        {app.chain?.base === ChainBase.CosmosSDK &&
          app.chain?.network !== ChainNetwork.Terra && (
            <CWMenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
            />
          )}
        {app.chain?.base === ChainBase.Ethereum &&
          app.chain?.network === ChainNetwork.Aave && (
            <CWMenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
            />
          )}
        {app.chain?.network === ChainNetwork.Compound && (
          <CWMenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New On-Chain Proposal"
          />
        )}
        {app.chain?.base === ChainBase.Substrate &&
          app.chain?.network !== ChainNetwork.Plasm && (
            <>
              <CWMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryProposal,
                  })
                }
                label="New treasury proposal"
              />
              <CWMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateDemocracyProposal,
                  })
                }
                label="New democracy proposal"
              />
              <CWMenuItem
                class={
                  activeAccount && (activeAccount as any).isCouncillor
                    ? ''
                    : 'disabled'
                }
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateCollectiveProposal,
                  })
                }
                label="New council motion"
              />
              <CWMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateBountyProposal,
                  })
                }
                label="New bounty proposal"
              />
              <CWMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryTip,
                  })
                }
                label="New tip"
              />
            </>
          )}
        {app.chain.network === ChainNetwork.Sputnik && (
          <CWMenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New Sputnik proposal"
          />
        )}
        {showSnapshotOptions && (
          <CWMenuItem
            onclick={() => {
              const snapshotSpaces = app.chain.meta.snapshot;
              if (snapshotSpaces.length > 1) {
                navigateToSubpage('/multiple-snapshots', {
                  action: 'create-proposal',
                });
              } else {
                navigateToSubpage(`/new/snapshot/${snapshotSpaces}`);
              }
            }}
            label="New Snapshot Proposal"
          />
        )}
      </>
    );
  }
}
