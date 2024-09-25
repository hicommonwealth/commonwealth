import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import { UseMutateAsyncFunction } from '@tanstack/react-query';
import { uuidv4 } from 'lib/util';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { isMobile } from 'react-device-detect';
import type { NavigateOptions, To } from 'react-router-dom';
import app from 'state';
import { fetchCachedCustomDomain } from 'state/api/configuration';
import { useCreateDiscordBotConfigMutation } from 'state/api/discord';
import { CreateDiscordBotConfigProps } from 'state/api/discord/createDiscordBotConfing';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import useUserStore, { userStore } from 'state/ui/user';
import Permissions from 'utils/Permissions';
import type { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWSidebarMenu } from '../../components/component_kit/cw_sidebar_menu';
import { getClasses } from '../../components/component_kit/helpers';
import TokenLaunchButton from '../../components/sidebar/TokenLaunchButton';
import './CreateContentMenu.scss';

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

const getCreateContentMenuItems = (
  navigate: (
    url: To,
    options?: NavigateOptions & { action?: string },
    prefix?: null | string,
  ) => void,
  createDiscordBotConfig?: UseMutateAsyncFunction<
    void,
    unknown,
    CreateDiscordBotConfigProps,
    string
  >,
): PopoverMenuItem[] => {
  const showSnapshotOptions =
    userStore.getState() && !!app.chain?.meta?.snapshot_spaces?.length;

  const { isCustomDomain } = fetchCachedCustomDomain() || {};

  const showOnChainProposalItem =
    app.chain?.base === ChainBase.CosmosSDK &&
    app.chain?.network !== ChainNetwork.Terra &&
    app.chain?.network !== ChainNetwork.Kava;

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

  const getSnapshotProposalItem = (): PopoverMenuItem[] =>
    showSnapshotOptions
      ? [
          {
            label: 'New Snapshot Proposal',
            iconLeft: 'democraticProposal',
            onClick: () => {
              resetSidebarState();
              const snapshotSpaces = app.chain.meta?.snapshot_spaces;
              navigate(`/new/snapshot/${snapshotSpaces}`, {
                action: 'create-proposal',
              });
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
    {
      type: 'element',
      element: <TokenLaunchButton key={2} buttonHeight="sm" />,
    },
  ];

  const getDiscordBotConnectionItems = (): PopoverMenuItem[] => {
    const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
    const botNotConnected = app.chain.meta?.discord_config_id === null;

    if (isAdmin && botNotConnected) {
      return [
        {
          label: 'Connect Discord',
          iconLeft: 'discord',
          onClick: () => {
            const verificationToken = uuidv4();
            createDiscordBotConfig?.({ verificationToken })
              .then(() => {
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
                      verificationToken,
                      redirect_domain: isCustomDomain
                        ? window.location.origin
                        : undefined,
                    }),
                  )}`,
                  '_parent',
                );
              })
              .catch((err) => {
                console.log(err);
              });
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
          ...getSnapshotProposalItem(),
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

  const { mutateAsync: createDiscordBotConfig } =
    useCreateDiscordBotConfigMutation();

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
        onClick: () => {
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
      menuItems={getCreateContentMenuItems(navigate, createDiscordBotConfig)}
    />
  );
};

// eslint-disable-next-line react/no-multi-comp
export const CreateContentPopover = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  if (
    !user.isLoggedIn ||
    !app.chain ||
    !app.activeChainId() ||
    !user.activeAccount
  ) {
    return;
  }

  return (
    <PopoverMenu
      menuItems={getCreateContentMenuItems(navigate)}
      className="create-content-popover"
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
