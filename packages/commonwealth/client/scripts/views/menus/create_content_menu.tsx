import { ChainBase, ChainNetwork, ProposalType } from 'common-common/src/types';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { PopoverMenuItem } from '../components/component_kit/cw_popover/cw_popover_menu';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { CWSidebarMenu } from '../components/component_kit/cw_sidebar_menu';

const getCreateContentMenuItems = (navigate): PopoverMenuItem[] => {
  const showSnapshotOptions =
    app.user.activeAccount && !!app.chain?.meta.snapshot.length;

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

  const getTemplateItems = (): PopoverMenuItem[] => {
    const contracts = app.contracts.getCommunityContracts();

    const items = [];

    contracts.forEach((contract) => {
      if (contract.ccts) {
        for (const cct of contract.ccts) {
          if (
            cct.cctmd.display_options === '2' ||
            cct.cctmd.display_options === '3'
          ) {
            const slugWithSlashRemoved = cct.cctmd.slug.replace('/', '');
            items.push({
              label: `New ${cct.cctmd.nickname}`,
              iconLeft: 'star',
              onClick: () =>
                navigate(`/${contract.address}/${slugWithSlashRemoved}`),
            });
          }
        }
      }
    });

    return items;
  };

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
        sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
        navigate('/createCommunity', {}, null);
      },
    },
    {
      label: 'Gate your Discord',
      iconLeft: 'discord',
      onClick: (e) => {
        e?.preventDefault();
        sidebarStore.getState().setMenu({ name: 'default', isVisible: false });

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
              sidebarStore
                .getState()
                .setMenu({ name: 'default', isVisible: false });
              navigate('/new/discussion');
            },
            iconLeft: 'write',
          } as PopoverMenuItem,
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

export const CreateContentSidebar = () => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();

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
            setMenu({ name: 'default', isVisible: false });
          }, 200);
        },
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentMenu = () => {
  const navigate = useCommonNavigate();
  const { setMobileMenuName } = useSidebarStore();

  return (
    <CWMobileMenu
      className="CreateContentMenu"
      menuHeader={{
        label: 'Create',
        onClick: () => setMobileMenuName('MainMenu'),
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentPopover = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

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
