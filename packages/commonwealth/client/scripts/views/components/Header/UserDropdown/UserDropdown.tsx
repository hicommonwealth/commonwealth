import clsx from 'clsx';
import React, { useState } from 'react';
import app from 'state';

import { WalletSsoSource } from '@hicommonwealth/core';
import useUserMenuItems from 'views/components/Header/UserDropdown/useUserMenuItems';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { User } from 'views/components/user/user';
import { AuthModal } from 'views/modals/AuthModal';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';
import { LoginModal } from 'views/modals/login_modal';

import { useFlag } from '../../../../hooks/useFlag';
import { CWModal } from '../../component_kit/new_designs/CWModal';

import './UserDropdown.scss';

const UserDropdown = () => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [revalidationModalData, setRevalidationModalData] = useState<{
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }>(null);

  const userMenuItems = useUserMenuItems({
    setIsAuthModalOpen,
    setRevalidationModalData,
    isMenuOpen: isOpen,
  });

  const user = app.user?.addresses?.[0];

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
      {!newSignInModalEnabled ? (
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsAuthModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsAuthModalOpen(false)}
          open={isAuthModalOpen}
        />
      ) : (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          isOpen={isAuthModalOpen}
        />
      )}
      <CWModal
        size="medium"
        content={
          <SessionRevalidationModal
            onModalClose={() => setRevalidationModalData(null)}
            walletSsoSource={revalidationModalData?.walletSsoSource}
            walletAddress={revalidationModalData?.walletAddress}
          />
        }
        onClose={() => setRevalidationModalData(null)}
        open={!!revalidationModalData}
      />
    </>
  );
};

export default UserDropdown;
