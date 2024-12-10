import {
  ChainBase,
  WalletId,
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
  getSessionSigners,
} from '@hicommonwealth/shared';
import axios from 'axios';
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import WebWalletController from 'controllers/app/web_wallets';
import { SessionKeyError } from 'controllers/server/sessions';
import { setDarkMode } from 'helpers/darkMode';
import { getUniqueUserAddresses } from 'helpers/user';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import app, { initAppState } from 'state';
import { EXCEPTION_CASE_VANILLA_getCommunityById } from 'state/api/communities/getCommuityById';
import { SERVER_URL } from 'state/api/config';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import useGroupMutationBannerStore from 'state/ui/group';
import {
  useAuthModalStore,
  useManageCommunityStakeModalStore,
} from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import useAuthentication from '../../modals/AuthModal/useAuthentication';
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
    await axios.get(`${SERVER_URL}/logout`);
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
  isMenuOpen: boolean;
  onAddressItemClick?: () => void;
  onReferralItemClick?: () => void;
}

const useUserMenuItems = ({
  onAuthModalOpen,
  isMenuOpen,
  onAddressItemClick,
  onReferralItemClick,
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

  const referralsEnabled = useFlag('referrals');

  const userData = useUserStore();
  const hasMagic = userData.addresses?.[0]?.walletId === WalletId.Magic;

  const { openMagicWallet } = useAuthentication({});

  const navigate = useCommonNavigate();
  const { stakeEnabled } = useCommunityStake();
  const { selectedAddress, setSelectedAddress } =
    useManageCommunityStakeModalStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const [canvasSignedAddresses, setCanvasSignedAddresses] = useState<string[]>(
    [],
  );

  const uniqueChainAddresses = getUniqueUserAddresses({
    forChain: app?.chain?.base,
  });
  const shouldShowAddressesSwitcherForNonMember =
    stakeEnabled &&
    app.activeChainId() &&
    !userData?.activeAccount &&
    uniqueChainAddresses?.length > 0;

  useEffect(() => {
    // if a user is in a stake enabled community without membership, set first user address as active that
    // matches active chain base. This address should show be set to user.activeAccount in useUserStore().
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

  const updateCanvasSignedAddresses = useCallback(async () => {
    const signedAddresses: string[] = [];

    await Promise.all(
      userData.accounts.map(async (account) => {
        // making a fresh query to get chain and community info for this address
        // as all the necessary fields don't exist on user.address, these should come
        // from api in the user address response, and the extra api call here removed
        const community = await EXCEPTION_CASE_VANILLA_getCommunityById(
          account.community.id,
          true,
        );
        if (community) {
          const communityCaip2Prefix = chainBaseToCaip2(
            account?.community?.base as ChainBase,
          );
          const communityIdOrPrefix =
            community.base === ChainBase.CosmosSDK
              ? community.ChainNode?.bech32
              : community.ChainNode?.eth_chain_id;
          const communityCanvasChainId = chainBaseToCanvasChainId(
            account?.community?.base as ChainBase,
            // @ts-expect-error StrictNullChecks
            communityIdOrPrefix,
          );
          const did = `did:pkh:${communityCaip2Prefix}:${communityCanvasChainId}:${account.address}`;

          const signed = authenticatedAddresses[did];
          if (signed) signedAddresses.push(account.address);
        }
      }),
    );

    setCanvasSignedAddresses(signedAddresses);
  }, [authenticatedAddresses, userData.accounts]);

  useEffect(() => {
    updateCanvasSignedAddresses().catch(console.error);
  }, [updateCanvasSignedAddresses]);

  const addresses: PopoverMenuItem[] = userData.accounts.map((account) => {
    const signed = canvasSignedAddresses.includes(account.address);
    const isActive = userData.activeAccount?.address === account.address;

    return {
      type: 'default',
      label: (
        <UserMenuItem
          isSignedIn={signed}
          hasJoinedCommunity={isActive}
          address={account.address}
        />
      ),
      onClick: async () => {
        if (signed) {
          onAddressItemClick?.();
          return await setActiveAccount(account);
        }

        onAddressItemClick?.();

        checkForSessionKeyRevalidationErrors(
          new SessionKeyError({
            name: 'SessionKeyError',
            message: 'Session Key Expired',
            address: account.address,
          }),
        );
      },
    };
  });

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
    userMenuItems: [
      // if a user is in a stake enabled community without membership, show user addresses that
      // match active chain base in the dropdown. This address should show be set to
      // user.activeAccount of useUserStore().
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
      ...(userData.accounts.length > 0
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
        onClick: () => navigate(`/profile/id/${userData.id}`, {}, null),
      },
      {
        type: 'default',
        label: 'Edit profile',
        onClick: () => navigate(`/profile/edit`, {}, null),
      },
      ...(hasMagic
        ? [
            {
              type: 'default',
              label: (
                <div className="UserMenuItem">
                  <div>Open wallet</div>
                  <CWIconButton iconName="arrowSquareOut" />
                </div>
              ),
              onClick: () => openMagicWallet(),
            },
          ]
        : []),
      ...(referralsEnabled
        ? [
            {
              type: 'default',
              label: 'Get referral link',
              onClick: () => {
                onReferralItemClick?.();
              },
            },
          ]
        : []),
      {
        type: 'default',
        label: 'My transactions',
        onClick: () => navigate(`/myTransactions`, {}, null),
      },
      {
        type: 'default',
        label: 'Notification settings',
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
