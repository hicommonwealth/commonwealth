/* @jsx m */

import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { navigateToSubpage } from 'router';
import ClassComponent from 'class_component';
import { ChainBase, ChainNetwork, ProposalType } from 'common-common/src/types';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import m from 'mithril';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { CWSidebarMenu } from '../components/component_kit/cw_sidebar_menu';
import type { MenuItem } from '../components/component_kit/types';

const getCreateContentMenuItems = (): MenuItem[] => {
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

  const showSputnikProposalItem = app.chain?.network === ChainNetwork.Sputnik;

  const showOnChainProposalItem =
    (app.chain?.base === ChainBase.CosmosSDK &&
      app.chain?.network !== ChainNetwork.Terra &&
      app.chain?.network !== ChainNetwork.Kava) ||
    (app.chain?.base === ChainBase.Ethereum &&
      app.chain?.network === ChainNetwork.Aave) ||
    app.chain?.network === ChainNetwork.Compound;

  const showSubstrateProposalItems =
    app.chain?.base === ChainBase.Substrate &&
    app.chain?.network !== ChainNetwork.Plasm;

  const getTemplateItems = (): MenuItem[] => {
    const contracts = app.contracts.getCommunityContracts();

    const items = [];

    contracts.map((contract) => {
      for (const cct of contract.ccts) {
        if (
          cct.cctmd.display_options === '2' ||
          cct.cctmd.display_options === '3'
        ) {
          const slugWithSlashRemoved = cct.cctmd.slug.replace('/', '');
          items.push({
            label: `New ${cct.cctmd.nickname}`,
            iconLeft: 'star',
            onclick: () => {
              navigateToSubpage(`/${contract.address}/${slugWithSlashRemoved}`);
            },
          });
        }
      }
    });

    return items;
  };

  const getTopicTemplateItems = (): MenuItem[] =>
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

  const getOnChainProposalItem = (): MenuItem[] =>
    showOnChainProposalItem
      ? [
          {
            label: 'New On-Chain Proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
            iconLeft: 'star',
          },
        ]
      : [];

  const getSputnikProposalItem = (): MenuItem[] =>
    showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onclick: () => navigateToSubpage('/new/proposal'),
            iconLeft: 'democraticProposal',
          },
        ]
      : [];

  const getSubstrateProposalItems = (): MenuItem[] =>
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
            : []) as MenuItem[]),
          {
            label: 'New bounty proposal',
            onclick: () =>
              navigateToSubpage('/new/proposal/:type', {
                type: ProposalType.SubstrateBountyProposal,
              }),
            iconLeft: 'badge',
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

  const getSnapshotProposalItem = (): MenuItem[] =>
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

  const getUniversalCreateItems = (): MenuItem[] => [
    // {
    //   label: 'New Crowdfund',
    //   iconLeft: 'wallet',
    //   onclick: () => {

    //   }
    // },
    {
      label: 'New Community',
      iconLeft: 'people',
      onclick: (e) => {
        e.preventDefault();
        mixpanelBrowserTrack({
          event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
          chainBase: null,
          isCustomDomain: app.isCustomDomain(),
          communityType: null,
        });
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';
        m.route.set('/createCommunity');
      },
    },
    {
      label: 'Gate your Discord',
      iconLeft: 'discord',
      onclick: (e) => {
        e.preventDefault();
        mixpanelBrowserTrack({
          event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
          chainBase: null,
          isCustomDomain: app.isCustomDomain(),
          communityType: null,
        });
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';

        window.open(
          `https://discord.com/oauth2/authorize?client_id=${
            process.env.DISCORD_CLIENT_ID
          }&permissions=8&scope=applications.commands%20bot&redirect_uri=${encodeURI(
            process.env.DISCORD_UI_URL
          )}/callback&response_type=code&scope=bot`
        );
      },
    },
  ];

  return [
    ...(app.activeChainId()
      ? [
          {
            type: 'header',
            label: 'Create Within Community',
          } as MenuItem,
          {
            label: 'New Thread',
            onclick: () => {
              navigateToSubpage('/new/discussion');
            },
            iconLeft: 'write',
          } as MenuItem,
          ...getTopicTemplateItems(),
          ...getOnChainProposalItem(),
          ...getSputnikProposalItem(),
          ...getSubstrateProposalItems(),
          ...getSnapshotProposalItem(),
          ...getTemplateItems(),
        ]
      : []),
    {
      type: 'header',
      label: 'Universal Create',
    },
    ...getUniversalCreateItems(),
  ];
};

export class CreateContentSidebar extends ClassComponent {
  view() {
    return (
      <CWSidebarMenu
        className="CreateContentSidebar"
        menuHeader={{
          label: 'Create',
          onclick: async () => {
            const sidebar = document.getElementsByClassName(
              'CreateContentSidebar'
            );
            sidebar[0].classList.add('onremove');
            setTimeout(() => {
              app.sidebarToggled = false;
              app.sidebarMenu = 'default';
              m.redraw();
            }, 200);
          },
        }}
        menuItems={getCreateContentMenuItems()}
      />
    );
  }
}

export class CreateContentMenu extends ClassComponent {
  view() {
    return (
      <CWMobileMenu
        className="CreateContentMenu"
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

export class CreateContentPopover extends ClassComponent {
  view() {
    if (
      !app.isLoggedIn() ||
      !app.chain ||
      !app.activeChainId() ||
      !app.user.activeAccount
    ) {
      return;
    }

    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconButtonTheme="black" iconName="plusCircle" />}
        menuItems={getCreateContentMenuItems()}
      />
    );
  }
}
