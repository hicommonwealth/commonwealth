import React, { useState } from 'react';
import app, { initAppState } from 'state';
import { User } from 'views/components/user/user';

import { WalletSsoSource } from '@hicommonwealth/core';
import clsx from 'clsx';
import { setActiveAccount } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import useCheckAuthenticatedAddresses from 'views/components/Header/UserDropdown/useCheckAuthenticatedAddresses';
import {
  PopoverMenu,
  PopoverMenuItem,
} from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';
import { LoginModal } from 'views/modals/login_modal';
import { CWModal } from '../../component_kit/new_designs/CWModal';
import './UserDropdown.scss';
import { UserDropdownItem } from './UserDropdownItem';

/* used for logout */
import { WalletId } from '@hicommonwealth/core';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import WebWalletController from 'controllers/app/web_wallets';
import { setDarkMode } from 'helpers/darkMode';
import useGroupMutationBannerStore from 'state/ui/group';

const resetWalletConnectSession = async () => {
  /**
   * Imp to reset wc session on logout as otherwise, subsequent login attempts will fail
   */
  const walletConnectWallet = WebWalletController.Instance.getByName(
    WalletId.WalletConnect,
  );
  await walletConnectWallet.reset();
};

const handleLogout = async () => {
  try {
    await axios.get(`${app.serverUrl()}/logout`);
    await initAppState();
    await resetWalletConnectSession();
    notifySuccess('Signed out');
    setDarkMode(false);
  } catch (err) {
    notifyError('Something went wrong during logging out.');
    window.location.reload();
  }
};

const UserDropdown = () => {
  const navigate = useCommonNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on',
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [revalidationModalData, setRevalidationModalData] = useState<{
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }>(null);
  const { clearSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();

  const { authenticatedAddresses } = useCheckAuthenticatedAddresses({
    recheck: isOpen,
  });

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

  const addresses: PopoverMenuItem[] = app.user.activeAccounts.map(
    (account) => {
      const signed = authenticatedAddresses[account.address];
      const isActive = app.user.activeAccount?.address === account.address;
      const walletSsoSource = app.user.addresses.find(
        (address) => address.address === account.address,
      )?.walletSsoSource;

      return {
        type: 'default',
        label: (
          <UserDropdownItem
            isSignedIn={true /*signed*/}
            hasJoinedCommunity={isActive}
            address={account.address}
          />
        ),
        onClick: async () => {
          if (!app.config.enforceSessionKeys || signed) {
            return await setActiveAccount(account);
          }

          setRevalidationModalData({
            walletSsoSource: walletSsoSource,
            walletAddress: account.address,
          });
        },
      };
    },
  );

  return (
    <>
      <PopoverMenu
        className="UserDropdown"
        placement="bottom-end"
        modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
        menuItems={[
          ...(app.user.activeAccounts.length > 0
            ? ([
                {
                  type: 'header',
                  label: 'Addresses',
                },
                ...addresses,
                {
                  type: 'default',
                  label: 'Connect a new address',
                  onClick: () => setIsLoginModalOpen(true),
                },
                { type: 'divider' },
              ] as PopoverMenuItem[])
            : []),
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
          {
            type: 'default',
            label: 'Sign out',
            onClick: () => {
              clearSetGatingGroupBannerForCommunities();
              handleLogout();
            },
          },
        ]}
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
      <CWModal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
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
