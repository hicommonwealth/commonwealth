import React, { useState } from 'react';
import app from 'state';
import { User } from 'views/components/user/user';

import './UserDropdown.scss';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  PopoverMenu,
  PopoverMenuItem,
} from 'views/components/component_kit/cw_popover/cw_popover_menu';
import clsx from 'clsx';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { useCommonNavigate } from 'navigation/helpers';
import { Modal } from 'views/components/component_kit/cw_modal';
import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { UserDropdownItem } from './UserDropdownItem';

// TODO temp items, for sake of UI, should be replaced with dynamic addresses
const addressesMenuItems: PopoverMenuItem[] = [
  {
    type: 'default',
    label: (
      <UserDropdownItem
        isSignedIn={true}
        hasJoinedCommunity={true}
        address="0x067a7910789f214A13E195a025F881E9B59C4D76"
      />
    ),
    onClick: () =>
      console.log('0x067a7910789f214A13E195a025F881E9B59C4D76 clicked'),
  },
  {
    type: 'default',
    label: (
      <UserDropdownItem
        isSignedIn={true}
        hasJoinedCommunity={false}
        address="0x32102345067a7910789f214A13E195a025F881E9B512119"
      />
    ),
    onClick: () =>
      console.log('0x067a7910789f214A13E195a025F881E9B59C4D76 clicked'),
  },
  {
    type: 'default',
    label: (
      <UserDropdownItem
        isSignedIn={false}
        username="commoner001"
        hasJoinedCommunity={false}
      />
    ),
    onClick: () => console.log('commoner001 clicked'),
  },
];

const UserDropdown = () => {
  const navigate = useCommonNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

  return (
    <>
      <PopoverMenu
        className="UserDropdown"
        placement="bottom-end"
        modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
        menuItems={[
          {
            type: 'header',
            label: 'Addresses',
          },
          ...addressesMenuItems,
          {
            type: 'default',
            label: 'Connect a new address',
            onClick: () => setIsLoginModalOpen(true),
          },
          { type: 'divider' },
          {
            type: 'header',
            label: 'Settings',
          },
          {
            type: 'default',
            label: 'View profile',
            onClick: () => navigate(`/profile/id/${profileId}`, {}, null),
          },
          {
            type: 'default',
            label: 'Edit profile',
            onClick: () => navigate(`/profile/edit`, {}, null),
          },
          {
            type: 'default',
            label: 'Notifications',
            onClick: () => navigate('/notification-settings', {}, null),
          },
          {
            type: 'default',
            label: (
              <div className="UserDropdownItem">
                <div>Dark mode</div>
                <CWToggle readOnly checked={isDarkModeOn} />
              </div>
            ),
            preventClosing: true,
            onClick: () => toggleDarkMode(!isDarkModeOn, setIsDarkModeOn),
          },
        ]}
        onOpenChange={(open) => setIsOpen(open)}
        renderTrigger={(onClick) => (
          <button
            className={clsx('UserDropdownTriggerButton', { isOpen })}
            onClick={onClick}
          >
            <User avatarSize={24} user={user} />
            <CWIcon
              iconName={isOpen ? 'caretUp' : 'caretDown'}
              iconSize="small"
              className="caret-icon"
              weight="bold"
            />
          </button>
        )}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  );
};

export default UserDropdown;
