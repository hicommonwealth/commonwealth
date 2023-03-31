import React from 'react';

import { redraw } from 'mithrilInterop';
import { ChainBase, ChainNetwork, ProposalType } from 'common-common/src/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
// import { MixpanelCommunityCreationEvent } from 'analytics/types';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import type { PopoverMenuItem } from '../components/component_kit/cw_popover/cw_popover_menu';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';

import { CWSidebarMenu } from '../components/component_kit/cw_sidebar_menu';
import { useCommonNavigate } from 'navigation/helpers';
import { useUser } from 'context/userContext';

const getCreateContentMenuItems = (navigate): PopoverMenuItem[] => {
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

  const getTopicTemplateItems = (): PopoverMenuItem[] =>
    topics.map((t) => ({
      label: `New ${t.name} Thread`,
      iconLeft: 'write',
      onClick: () => {
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
        navigate('/new/discussion');
      },
    }));

  const getOnChainProposalItem = (): PopoverMenuItem[] =>
    showOnChainProposalItem
      ? [
          {
            label: 'New On-Chain Proposal',
            onClick: () => navigate('/new/proposal'),
            iconLeft: 'star',
          },
        ]
      : [];

  const getSputnikProposalItem = (): PopoverMenuItem[] =>
    showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onClick: () => navigate('/new/proposal'),
            iconLeft: 'democraticProposal',
          },
        ]
      : [];

  const getSubstrateProposalItems = (): PopoverMenuItem[] =>
    showSubstrateProposalItems
      ? [
          {
            label: 'New treasury proposal',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryProposal,
              }),
            iconLeft: 'treasuryProposal',
          },
          {
            label: 'New democracy proposal',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateDemocracyProposal,
              }),
            iconLeft: 'democraticProposal',
          },
          {
            label: 'New tip',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryTip,
              }),
            iconLeft: 'jar',
          },
        ]
      : [];

  const getSnapshotProposalItem = (): PopoverMenuItem[] =>
    showSnapshotOptions
      ? [
          {
            label: 'New Snapshot Proposal',
            iconLeft: 'democraticProposal',
            onClick: () => {
              const snapshotSpaces = app.chain.meta.snapshot;
              if (snapshotSpaces.length > 1) {
                navigate('/multiple-snapshots', {
                  action: 'create-proposal',
                });
              } else {
                navigate(`/new/snapshot/${snapshotSpaces}`);
              }
            },
          },
        ]
      : [];

  const getUniversalCreateItems = (): PopoverMenuItem[] => [
    // {
    //   label: 'New Crowdfund',
    //   iconLeft: 'wallet',
    //   onClick: () => {

    //   }
    // },
    {
      label: 'New Community',
      iconLeft: 'people',
      onClick: (e) => {
        e?.preventDefault();
        // mixpanelBrowserTrack({
        //   event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
        //   chainBase: null,
        //   isCustomDomain: app.isCustomDomain(),
        //   communityType: null,
        // });
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';
        app.sidebarRedraw.emit('redraw');
        navigate('/createCommunity', {}, null);
      },
    },
    {
      label: 'Gate your Discord',
      iconLeft: 'discord',
      onClick: (e) => {
        e?.preventDefault();
        // mixpanelBrowserTrack({
        //   event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
        //   chainBase: null,
        //   isCustomDomain: app.isCustomDomain(),
        //   communityType: null,
        // });
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';
        app.sidebarRedraw.emit('redraw');

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
          } as PopoverMenuItem,
          {
            label: 'New Thread',
            onClick: () => {
              navigate('/new/discussion');
            },
            iconLeft: 'write',
          } as PopoverMenuItem,
          ...getTopicTemplateItems(),
          ...getOnChainProposalItem(),
          ...getSputnikProposalItem(),
          ...getSubstrateProposalItems(),
          ...getSnapshotProposalItem(),
        ]
      : []),
    {
      type: 'header',
      label: 'Universal Create',
    },
    ...getUniversalCreateItems(),
  ];
};

export const CreateContentSidebar = () => {
  const navigate = useCommonNavigate();

  return (
    <CWSidebarMenu
      className="CreateContentSidebar"
      menuHeader={{
        label: 'Create',
        onClick: async () => {
          const sidebar = document.getElementsByClassName(
            'CreateContentSidebar'
          );
          sidebar[0].classList.add('onremove');
          setTimeout(() => {
            app.sidebarToggled = false;
            app.sidebarMenu = 'default';
            app.sidebarRedraw.emit('redraw');
            redraw();
          }, 200);
        },
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentMenu = () => {
  const navigate = useCommonNavigate();

  return (
    <CWMobileMenu
      className="CreateContentMenu"
      menuHeader={{
        label: 'Create',
        onClick: () => {
          app.mobileMenu = 'MainMenu';
          app.sidebarRedraw.emit('redraw');
        },
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentPopover = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUser();

  if (
    !isLoggedIn ||
    !app.chain ||
    !app.activeChainId() ||
    !app.user.activeAccount
  ) {
    return;
  }

  return (
    <PopoverMenu
      menuItems={getCreateContentMenuItems(navigate)}
      renderTrigger={(onclick) => (
        <CWIconButton
          iconButtonTheme="black"
          iconName="plusCircle"
          onClick={onclick}
        />
      )}
    />
  );
};
