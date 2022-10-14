/* @jsx m */

import m from 'mithril';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { MenuItem } from '../components/component_kit/types';

const getCreateContentMenuItems = (): Array<MenuItem> => {
  const activeAccount = app.user.activeAccount;

  const showSnapshotOptions =
    app.user.activeAccount && !!app.chain?.meta.snapshot.length;

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

  const getTopicThreads = (): Array<MenuItem> =>
    topics.map((t) => ({
      label: `New ${t.name} Thread`,
      iconLeft: 'write',
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
    }));

  const getOnChainProposalItem = (): Array<MenuItem> =>
    showOnChainProposalItem
      ? [
          {
            label: 'New On-Chain Proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
            iconLeft: 'democraticProposal',
          },
        ]
      : [];

  const getSputnikProposalItem = (): Array<MenuItem> =>
    showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
            iconLeft: 'democraticProposal',
          },
        ]
      : [];

  const getSubstrateProposalItems = (): Array<MenuItem> =>
    showSubstrateProposalItems
      ? [
          {
            label: 'New treasury proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryProposal,
              }),
            iconLeft: 'treasuryProposal',
          },
          {
            label: 'New democracy proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateDemocracyProposal,
              }),
            iconLeft: 'democraticProposal',
          },
          ...(((activeAccount as SubstrateAccount)?.isCouncillor
            ? [
                {
                  label: 'New council motion',
                  onclick: () =>
                    navigateToSubpage('/new/proposal/:type', {
                      type: ProposalType.SubstrateCollectiveProposal,
                    }),
                  iconLeft: 'councilProposal',
                },
              ]
            : []) as Array<MenuItem>),
          {
            label: 'New bounty proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateBountyProposal,
              }),
            iconLeft: 'democraticProposal',
          },
          {
            label: 'New tip',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryTip,
              }),
            iconLeft: 'jar',
          },
        ]
      : [];

  const getSnapshotProposalItem = (): Array<MenuItem> =>
    showSnapshotOptions
      ? [
          {
            label: 'New Snapshot Proposal',
            iconLeft: 'democraticProposal',
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
      : [];

  return [
    {
      label: 'New Thread',
      onclick: () => {
        navigateToSubpage('/new/discussion');
      },
      iconLeft: 'write',
    },
    ...getTopicThreads(),
    ...getOnChainProposalItem(),
    ...getSputnikProposalItem(),
    ...getSubstrateProposalItems(),
    ...getSnapshotProposalItem(),
  ];
};

export class CreateContentMenu implements m.ClassComponent {
  view() {
    return (
      <CWMobileMenu
        menuHeader={{
          label: 'Create',
          onclick: () => {
            app.mobileMenu = 'MainMenu';
          },
        }}
        menuItems={getCreateContentMenuItems()}
      />
    );
  }
}

export class CreateContentPopover implements m.ClassComponent {
  view() {
    if (!app.isLoggedIn() || !app.chain || !app.activeChainId()) return;

    return (
      <CWPopoverMenu
        trigger={
          <CWIconButton
            iconButtonTheme="black"
            disabled={!app.user.activeAccount}
            iconName="plusCircle"
          />
        }
        menuItems={getCreateContentMenuItems()}
      />
    );
  }
}
