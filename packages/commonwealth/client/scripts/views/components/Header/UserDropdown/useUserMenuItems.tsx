import { WalletId, WalletSsoSource } from '@hicommonwealth/core';
import axios from 'axios';
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import WebWalletController from 'controllers/app/web_wallets';
import { setDarkMode } from 'helpers/darkMode';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app, { initAppState } from 'state';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import useGroupMutationBannerStore from 'state/ui/group';
import { UserDropdownItem } from 'views/components/Header/UserDropdown/UserDropdownItem';
import useCheckAuthenticatedAddresses from 'views/components/Header/UserDropdown/useCheckAuthenticatedAddresses';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';

const resetWalletConnectSession = async () => {
  /**
   * Imp to reset wc session on logout as otherwise, subsequent login attempts will fail
   */
  const walletConnectWallet = WebWalletController.Instance.getByName(
    WalletId.WalletConnect,
  );
  await walletConnectWallet.reset();
};

export const handleLogout = async () => {
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

interface UseUserMenuItemsProps {
  setIsAuthModalOpen: (open: boolean) => void;
  setRevalidationModalData: ({
    walletSsoSource,
    walletAddress,
  }: {
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }) => void;
  isMenuOpen: boolean;
  onAddressItemClick?: () => void;
}

const useUserMenuItems = ({
  setIsAuthModalOpen,
  setRevalidationModalData,
  isMenuOpen,
  onAddressItemClick,
}: UseUserMenuItemsProps) => {
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on',
  );
  const { clearSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();
  const { clearSetAdminOnboardingCardVisibilityForCommunities } =
    useAdminOnboardingSliderMutationStore();
  const { authenticatedAddresses } = useCheckAuthenticatedAddresses({
    recheck: isMenuOpen,
  });

  const navigate = useCommonNavigate();

  const user = app.user?.addresses?.[0];
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
            isSignedIn={signed}
            hasJoinedCommunity={isActive}
            address={account.address}
          />
        ),
        onClick: async () => {
          if (!app.config.enforceSessionKeys || signed) {
            onAddressItemClick?.();
            return await setActiveAccount(account);
          }

          onAddressItemClick?.();

          setRevalidationModalData({
            walletSsoSource: walletSsoSource,
            walletAddress: account.address,
          });
        },
      };
    },
  );

  return [
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
            onClick: () => {
              setIsAuthModalOpen(true);
              onAddressItemClick?.();
            },
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
        clearSetAdminOnboardingCardVisibilityForCommunities();

        handleLogout();
      },
    },
  ] as PopoverMenuItem[];
};

export default useUserMenuItems;
