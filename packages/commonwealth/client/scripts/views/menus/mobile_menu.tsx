import React, { useEffect } from 'react';

import app, { initAppState } from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { MenuItem } from '../components/component_kit/types';
import useSidebarStore from 'state/ui/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';
import NewProfilesController from 'controllers/server/newProfiles';
import { useCommonNavigate } from 'navigation/helpers';
import { NavigateOptions, To } from 'react-router';
import axios from 'axios';

export const getMobileMenuItems = (
  setMobileMenuName: (name: MobileMenuName) => void,
  navigate: (url: To, options?: NavigateOptions, prefix?: string) => void
): Array<MenuItem> => {
  console.log({ user: app.user });
  const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
  const chain =
    typeof activeAccount.chain === 'string'
      ? activeAccount.chain
      : activeAccount.chain?.id;
  const profile = NewProfilesController.Instance.getProfile(
    chain,
    activeAccount.address
  );
  return [
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle',
            iconRight: 'chevronRight',
            onClick: () => setMobileMenuName('CreateContentMenu'),
          },
        ]
      : []) as Array<MenuItem>),
    {
      label: 'Help',
      iconLeft: 'help',
      iconRight: 'chevronRight',
      onClick: () => setMobileMenuName('HelpMenu'),
    },
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            iconLeft: 'bell',
            iconRight: 'chevronRight',
            type: 'notification',
            hasUnreads: !!app.user?.notifications.numUnread,
            onClick: () => setMobileMenuName('NotificationsMenu'),
          },
        ]
      : []) as Array<MenuItem>),
    ...((app.isLoggedIn()
      ? [
          {
            label: 'View Profile',
            iconLeft: 'person',
            iconRight: 'chevronRight',
            onClick: () => navigate(`/profile/id/${profile.id}`, {}, null),
          },
        ]
      : []) as Array<MenuItem>),
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Edit Profile',
            iconLeft: 'write',
            iconRight: 'chevronRight',
            onClick: () => navigate(`/profile/edit`, {}, null),
          },
        ]
      : []) as Array<MenuItem>),
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Logout',
            iconLeft: 'logout',
            iconRight: 'chevronRight',
            onClick: () => {
              axios
                .get(`${app.serverUrl()}/logout`, { withCredentials: true })
                .then(async () => {
                  await initAppState();
                })
                .catch(() => {
                  // eslint-disable-next-line no-restricted-globals
                  location.reload();
                });
            },
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export const MobileMenu = () => {
  const { setMobileMenuName } = useSidebarStore();
  const navigate = useCommonNavigate();

  return (
    <CWMobileMenu
      className="MobileMenu"
      menuItems={getMobileMenuItems(setMobileMenuName, navigate)}
    />
  );
};
