import React, { useState } from 'react';
import app from 'state';
import { User } from 'views/components/user/user';

import './UserDropdown.scss';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from 'views/components/component_kit/cw_popover/cw_popover_menu';
import clsx from 'clsx';
import { CWText } from 'views/components/component_kit/cw_text';
import { formatAddressShort } from 'helpers';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { useCommonNavigate } from 'navigation/helpers';

interface UserDropdownItemProps {
  username?: string;
  address?: string;
  isSignedIn: boolean;
  hasJoinedCommunity: boolean;
}
const UserDropdownItem = ({
  username,
  address,
  isSignedIn,
  hasJoinedCommunity,
}: UserDropdownItemProps) => {
  return (
    <div className={clsx('UserDropdownItem', { isSignedIn })}>
      <CWText type="b2" className="identification">
        {username || formatAddressShort(address, 6)}
      </CWText>
      {hasJoinedCommunity && (
        <span className="check-icon">
          <CWIcon iconSize="small" iconName="checkCircleFilled" />
        </span>
      )}
      {!isSignedIn && !hasJoinedCommunity && (
        <CWText type="caption">Signed out</CWText>
      )}
    </div>
  );
};

const UserDropdown = () => {
  const navigate = useCommonNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );

  const user = app.user.addresses[0];
  return (
    <PopoverMenu
      className="UserDropdown"
      placement="bottom-end"
      modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
      menuItems={[
        {
          type: 'header',
          label: 'Addresses',
        },
        {
          type: 'default',
          label: (
            <UserDropdownItem
              isSignedIn={true}
              // username="commoner001"
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
              // username="commoner001"
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
              username="commoner001asdljkasdkjakshdnkjhas"
              hasJoinedCommunity={false}
              // address="0x067a7910789f214A13E195a025F881E9B59C4D76"
            />
          ),
          onClick: () => console.log('commoner001 clicked'),
        },
        {
          type: 'default',
          label: 'Connect a new address',
          onClick: () => {
            console.log('click');
          },
        },
        { type: 'divider' },
        {
          type: 'header',
          label: 'Settings',
        },
        {
          type: 'default',
          label: 'View profile',
          onClick: () => navigate(`/profile/id/${user.profileId}`, {}, null),
        },
        {
          type: 'default',
          label: 'Edit profile',
          onClick: () => {
            console.log('click');
          },
        },
        {
          type: 'default',
          label: 'Notifications',
          onClick: () => {
            console.log('click');
          },
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
  );
};

export default UserDropdown;
