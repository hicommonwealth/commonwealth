/* @jsx m */

import m from 'mithril';
import 'components/create_content_popover.scss';
import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';

const getCreateContentMenu = () => {
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

  const showSputnikProposalItem = app.chain.network === ChainNetwork.Sputnik;

  const showOnChainProposalItem =
    (app.chain?.base === ChainBase.CosmosSDK &&
      app.chain?.network !== ChainNetwork.Terra) ||
    (app.chain?.base === ChainBase.Ethereum &&
      app.chain?.network === ChainNetwork.Aave) ||
    app.chain?.network === ChainNetwork.Compound;

  const showSubstrateProposalItems =
    app.chain?.base === ChainBase.Substrate &&
    app.chain?.network !== ChainNetwork.Plasm;

  return [
    {
      onclick: () => {
        navigateToSubpage('/new/discussion');
      },
      label: 'New thread',
    },
    ...topics.map((t) => ({
      onclick: () => {
        // TODO Graham 7-19-22: Let's find a non-localStorage solution
        localStorage.setItem(`${app.activeChainId()}-active-topic`, t.name);
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
      },
      label: `New ${t.name} Thread`,
    })),
    ...(showOnChainProposalItem
      ? [
          {
            onclick: () => navigateToSubpage('/new/proposal'),
            label: 'New On-Chain Proposal',
          },
        ]
      : []),
    ...(showSputnikProposalItem
      ? [
          {
            onclick: () => navigateToSubpage('/new/proposal'),
            label: 'New Sputnik proposal',
          },
        ]
      : []),
    ...(showSubstrateProposalItems
      ? [
          {
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryProposal,
              }),
            label: 'New treasury proposal',
          },
          {
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateDemocracyProposal,
              }),
            label: 'New democracy proposal',
          },
          {
            class:
              activeAccount && (activeAccount as SubstrateAccount).isCouncillor
                ? ''
                : 'disabled',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateCollectiveProposal,
              }),
            label: 'New council motion',
          },
          {
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateBountyProposal,
              }),
            label: 'New bounty proposal',
          },
          {
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryTip,
              }),
            label: 'New tip',
          },
        ]
      : []),
    ...(showSnapshotOptions
      ? [
          {
            onclick: () => {
              const snapshotSpaces = app.chain.meta.snapshot;
              if (snapshotSpaces.length > 1) {
                navigateToSubpage('/multiple-snapshots', {
                  action: 'create-proposal',
                });
              } else {
                navigateToSubpage(`/new/snapshot/${snapshotSpaces}`);
              }
            },
            label: 'New Snapshot Proposal',
          },
        ]
      : []),
  ];
};
export class CreateContentMenu implements m.ClassComponent {
  view() {
    return <>{getCreateContentMenu()}</>;
  }
}
