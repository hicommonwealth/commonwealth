import clsx from 'clsx';
import React, { useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/shared';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { User } from 'views/components/user/user';

import useUserMenuItems from '../../useUserMenuItems';

import useUserStore from 'state/ui/user';
import './UserDropdown.scss';

interface UserDropdownProps {
  onAuthModalOpen: () => void;
  onRevalidationModalData: ({
    walletSsoSource,
    walletAddress,
  }: {
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }) => void;
}

const UserDropdown = ({
  onAuthModalOpen,
  onRevalidationModalData,
}: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { RevalidationModal, userMenuItems } = useUserMenuItems({
    onAuthModalOpen,
    onRevalidationModalData,
    isMenuOpen: isOpen,
  });

  const userData = useUserStore();

  const user = userData.addresses?.[0];

  return (
    <>
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
      {RevalidationModal}
    </>
  );
};

export default UserDropdown;
