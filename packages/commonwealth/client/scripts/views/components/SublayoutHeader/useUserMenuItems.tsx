import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import WebWalletController from 'controllers/app/web_wallets';
import { SessionKeyError } from 'controllers/server/sessions';
import { setDarkMode } from 'helpers/darkMode';
import { useCommonNavigate } from 'navigation/helpers';
import app, { initAppState } from 'state';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import useGroupMutationBannerStore from 'state/ui/group';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';

import {
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
} from 'shared/canvas/chainMappings';
import { getSessionSigners } from 'shared/canvas/verify';
import { useFetchConfigurationQuery } from 'state/api/configuration';

import { useCommunityStake } from '../CommunityStake';

import UserMenuItem from './UserMenuItem';
import useCheckAuthenticatedAddresses from './useCheckAuthenticatedAddresses';

const resetWalletConnectSession = async () => {
  /**
   * Imp to reset wc session on logout as otherwise, subsequent login attempts will fail
   */
  const walletConnectWallet = WebWalletController.Instance.getByName(
    WalletId.WalletConnect,
  );
  // @ts-expect-error <StrictNullChecks/>
  await walletConnectWallet.reset();
};

export const handleLogout = async () => {
  try {
    await axios.get(`${app.serverUrl()}/logout`);
    await initAppState();
    await resetWalletConnectSession();
    for (const signer of getSessionSigners()) {
      signer.target.clear();
    }
    notifySuccess('Signed out');
    setDarkMode(false);
  } catch (err) {
    notifyError('Something went wrong during logging out.');
    window.location.reload();
  }
};

interface UseUserMenuItemsProps {
  onAuthModalOpen: () => void;
  onRevalidationModalData: ({
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
  onAuthModalOpen,
  onRevalidationModalData,
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
  const [sessionKeyRevalidationError, setSessionKeyRevalidationError] =
    useState<SessionKeyError | null>(null);
  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: () => {
      setSessionKeyRevalidationError(null);
    },
    error: sessionKeyRevalidationError,
  });

  const { data: configurationData } = useFetchConfigurationQuery();

  const navigate = useCommonNavigate();
  const { stakeEnabled } = useCommunityStake();
  const { selectedAddress, setSelectedAddress } =
    useManageCommunityStakeModalStore();

  const user = app.user?.addresses?.[0];
  // @ts-expect-error <StrictNullChecks/>
  const profileId = user?.profileId || user?.profile.id;

  const uniqueChainAddresses = getUniqueUserAddresses({
    forChain: app?.chain?.base,
  });
  const shouldShowAddressesSwitcherForNonMember =
    stakeEnabled &&
    app.activeChainId() &&
    !app?.user?.activeAccount &&
    uniqueChainAddresses?.length > 0;

  useEffect(() => {
    // if a user is in a stake enabled community without membership, set first user address as active that
    // matches active chain base. This address should show be set to app.user.activeAccount.
    if (!selectedAddress && shouldShowAddressesSwitcherForNonMember) {
      setSelectedAddress(uniqueChainAddresses[0]);
    }

    if (selectedAddress && !shouldShowAddressesSwitcherForNonMember) {
      setSelectedAddress('');
    }
  }, [
    shouldShowAddressesSwitcherForNonMember,
    uniqueChainAddresses,
    selectedAddress,
    setSelectedAddress,
  ]);

  const addresses: PopoverMenuItem[] = app.user.activeAccounts.map(
    (account) => {
      const communityCaip2Prefix = chainBaseToCaip2(account.community.base);
      const communityIdOrPrefix =
        account.community.base === ChainBase.CosmosSDK
          ? account.community.ChainNode?.bech32
          : account.community.ChainNode?.ethChainId;
      const communityCanvasChainId = chainBaseToCanvasChainId(
        account.community.base,
        // @ts-expect-error StrictNullChecks
        communityIdOrPrefix,
      );
      const caip2Address = `${communityCaip2Prefix}:${communityCanvasChainId}:${account.address}`;

      const signed = authenticatedAddresses[caip2Address];
      const isActive = app.user.activeAccount?.address === account.address;
      const walletSsoSource = app.user.addresses.find(
        (address) => address.address === account.address,
      )?.walletSsoSource;

      return {
        type: 'default',
        label: (
          <UserMenuItem
            isSignedIn={!configurationData?.enforceSessionKeys || signed}
            hasJoinedCommunity={isActive}
            address={account.address}
          />
        ),
        onClick: async () => {
          if (!configurationData?.enforceSessionKeys || signed) {
            onAddressItemClick?.();
            return await setActiveAccount(account);
          }

          onAddressItemClick?.();

          onRevalidationModalData({
            // @ts-expect-error <StrictNullChecks/>
            walletSsoSource: walletSsoSource,
            walletAddress: account.address,
          });
        },
      };
    },
  );

  const uniqueChainAddressOptions: PopoverMenuItem[] = uniqueChainAddresses.map(
    (address) => {
      const signed = true;
      const isActive = selectedAddress === address;

      return {
        type: 'default',
        label: (
          <UserMenuItem
            isSignedIn={signed}
            hasJoinedCommunity={isActive}
            address={address}
          />
        ),
        onClick: () => setSelectedAddress(address),
      };
    },
  );

  return {
    RevalidationModal,
    userMenuItems: [
      // if a user is in a stake enabled community without membership, show user addresses that
      // match active chain base in the dropdown. This address should show be set to app.user.activeAccount.
      ...(shouldShowAddressesSwitcherForNonMember
        ? ([
            {
              type: 'header',
              label: 'Addresses',
            },
            ...uniqueChainAddressOptions,
            { type: 'divider' },
          ] as PopoverMenuItem[])
        : []),
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
                onAuthModalOpen();
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
        label: 'My community stake',
        onClick: () => navigate(`/myCommunityStake`, {}, null),
      },
      {
        type: 'default',
        label: 'Notifications',
        onClick: () => navigate('/notification-settings', {}, null),
      },
      {
        type: 'default',
        label: (
          <div className="UserMenuItem">
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick: async () => {
          clearSetGatingGroupBannerForCommunities();
          clearSetAdminOnboardingCardVisibilityForCommunities();
          await handleLogout();
        },
      },
    ] as PopoverMenuItem[],
  };
};

export default useUserMenuItems;
