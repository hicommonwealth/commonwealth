/* eslint-disable react/no-multi-comp */
import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { uuidv4 } from 'lib/util';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { isMobile } from 'react-device-detect';
import app from 'state';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import type { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import Permissions from '../../utils/Permissions';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWSidebarMenu } from '../components/component_kit/cw_sidebar_menu';
import { getClasses } from '../components/component_kit/helpers';

const resetSidebarState = () => {
  //Bouncer pattern -- I have found isMobile does not always detect screen
  //size when responsively resizing so added a redundancy with window.innerWidth
  if (!isMobile || window.innerWidth > 425) return;

  if (sidebarStore.getState().userToggledVisibility !== 'open') {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
  } else {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: true });
  }
};

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
              onClick: () => {
                resetSidebarState();
                navigate(`/${contract.address}/${slugWithSlashRemoved}`);
              },
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
            onClick: () => {
              resetSidebarState();
              navigate('/new/proposal');
            },
            iconLeft: 'star',
          },
        ]
      : [];

  const getSputnikProposalItem = (): PopoverMenuItem[] =>
    showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onClick: () => {
              resetSidebarState();
              navigate('/new/proposal');
            },
            iconLeft: 'democraticProposal',
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
              resetSidebarState();
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
    {
      label: 'Create community',
      isButton: true,
      iconLeft: 'peopleNew',
      iconLeftWeight: 'bold',
      onClick: (e) => {
        e?.preventDefault();
        resetSidebarState();
        navigate('/createCommunity', {}, null);
      },
    },
  ];

  const getDiscordBotConnectionItems = (): PopoverMenuItem[] => {
    const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
    const botNotConnected = app.chain.meta.discordConfigId === null;

    if (isAdmin && botNotConnected) {
      return [
        {
          label: 'Connect Discord',
          iconLeft: 'discord',
          onClick: async () => {
            try {
              const verification_token = uuidv4();
              await app.discord.createConfig(verification_token);

              const isCustomDomain = app.isCustomDomain();

              window.open(
                `https://discord.com/oauth2/authorize?client_id=${
                  process.env.DISCORD_CLIENT_ID
                }&permissions=1024&scope=applications.commands%20bot&redirect_uri=${encodeURI(
                  `${
                    !isCustomDomain
                      ? window.location.origin
                      : 'https://commonwealth.im'
                  }`,
                )}/discord-callback&response_type=code&scope=bot&state=${encodeURI(
                  JSON.stringify({
                    cw_chain_id: app.activeChainId(),
                    verification_token,
                    redirect_domain: isCustomDomain
                      ? window.location.origin
                      : undefined,
                  }),
                )}`,
                '_parent',
              );
            } catch (err) {
              console.log(err);
            }
          },
        },
      ];
    } else {
      return [];
    }
  };

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
              resetSidebarState();
              navigate('/new/discussion');
            },
            iconLeft: 'pencil',
          } as PopoverMenuItem,
          ...getOnChainProposalItem(),
          ...getSputnikProposalItem(),
          ...getSnapshotProposalItem(),
          ...getTemplateItems(),
          ...getDiscordBotConnectionItems(),
        ]
      : []),
    {
      type: 'header',
      label: 'Universal Create',
    },
    ...getUniversalCreateItems(),
  ];
};

export const CreateContentSidebar = ({
  isInsideCommunity,
}: {
  isInsideCommunity: boolean;
}) => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();

  return (
    <CWSidebarMenu
      className={getClasses<{
        heightInsideCommunity: boolean;
      }>(
        {
          heightInsideCommunity: isInsideCommunity,
        },
        'CreateContentSidebar',
      )}
      menuHeader={{
        label: 'Create',
        onClick: async () => {
          const sidebar = document.getElementsByClassName(
            'CreateContentSidebar',
          );
          sidebar[0].classList.add('onremove');
          setTimeout(() => {
            const isSidebarOpen =
              !!sidebarStore.getState().userToggledVisibility;
            setMenu({ name: 'default', isVisible: isSidebarOpen });
          }, 200);
        },
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentPopover = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  if (
    !isLoggedIn ||
    !app.chain ||
    !app.activeChainId() ||
    !hasJoinedCommunity
  ) {
    return;
  }

  return (
    <PopoverMenu
      menuItems={getCreateContentMenuItems(navigate)}
      renderTrigger={(onClick, isMenuOpen) => (
        <CWTooltip
          content="Create content"
          placement="bottom"
          renderTrigger={(handleInteraction, isTooltipOpen) => (
            <CWIconButton
              iconButtonTheme="black"
              iconName="plusCirclePhosphor"
              onClick={(e) =>
                handleIconClick({
                  e,
                  isMenuOpen,
                  isTooltipOpen,
                  handleInteraction,
                  onClick,
                })
              }
              onMouseEnter={(e) => {
                handleMouseEnter({ e, isMenuOpen, handleInteraction });
              }}
              onMouseLeave={(e) => {
                handleMouseLeave({ e, isTooltipOpen, handleInteraction });
              }}
            />
          )}
        />
      )}
    />
  );
};
