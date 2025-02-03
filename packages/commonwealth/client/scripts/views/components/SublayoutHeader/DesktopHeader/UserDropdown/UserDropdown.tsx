import clsx from 'clsx';
import React, { useState } from 'react';

import useInviteLinkModal from 'state/ui/modals/inviteLinkModal';
import useUserStore from 'state/ui/user';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { User } from 'views/components/user/user';

import useUserMenuItems from '../../useUserMenuItems';

import './UserDropdown.scss';

interface UserDropdownProps {
  onAuthModalOpen: () => void;
}

const UserDropdown = ({ onAuthModalOpen }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const { userMenuItems } = useUserMenuItems({
    onAuthModalOpen,
    isMenuOpen: isOpen,
    onReferralItemClick: () => setIsInviteLinkModalOpen(true),
  });

  const userData = useUserStore();

  const user = userData.addresses?.[0];

  return (
    <PopoverMenu
      className="UserDropdown"
      placement="bottom-end"
      modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
      menuItems={userMenuItems}
      onOpenChange={(open) => setIsOpen(open)}
      renderTrigger={(onClick) => (
        <button
          className={clsx('UserDropdownTriggerButton', { isOpen })}
          onClick={onClick}
        >
          <User
            avatarSize={24}
            userAddress={user?.address}
            userCommunityId={user?.community?.id}
          />
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
