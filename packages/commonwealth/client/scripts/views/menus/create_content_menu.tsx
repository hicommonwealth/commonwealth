/* @jsx m */

import 'components/create_content_popover.scss';

import m from 'mithril';
import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { MenuItemAttrs } from './types';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';

export const getCreateContentMenuItemAttrs = (): MenuItemAttrs[] => {
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
      label: 'New Thread',
      onclick: () => {
        navigateToSubpage('/new/discussion');
      },
    },
    ...topics.map((t) => ({
      label: `New ${t.name} Thread`,
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
    })),
    ...(showOnChainProposalItem
      ? [
          {
            label: 'New On-Chain Proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
          },
        ]
      : []),
    ...(showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
          },
        ]
      : []),
    ...(showSubstrateProposalItems
      ? [
          {
            label: 'New treasury proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryProposal,
              }),
          },
          {
            label: 'New democracy proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateDemocracyProposal,
              }),
          },
          ...((activeAccount as SubstrateAccount)?.isCouncillor
            ? [
                {
                  label: 'New council motion',
                  onclick: () =>
                    navigateToSubpage('/new/proposal/:type', {
                      type: ProposalType.SubstrateCollectiveProposal,
                    }),
                },
              ]
            : []),
          {
            label: 'New bounty proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateBountyProposal,
              }),
          },
          {
            label: 'New tip',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryTip,
              }),
          },
        ]
      : []),
    ...(showSnapshotOptions
      ? [
          {
            label: 'New Snapshot Proposal',
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
          },
        ]
      : []),
  ];
};

export class CreateContentMenu implements m.ClassComponent {
  view() {
    return (
      <CWMobileMenu
        className="MainMenu"
        menuHeader={{
          label: 'Create',
          onclick: (e) => {
            app.mobileMenu = 'MainMenu';
          },
        }}
        menuItems={getCreateContentMenuItemAttrs().map((attr) => ({
          ...attr,
          iconName: 'write',
        }))}
      />
    );
  }
}
