import { addressSwapper, ChainBase } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { trpc } from 'client/scripts/utils/trpcClient';
import { setActiveAccount } from 'controllers/app/login';
import { isSameAccount } from 'helpers';
import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { AccountSelector } from 'views/components/component_kit/AccountSelector/AccountSelector';
import TOSModal from 'views/modals/TOSModal';
import { useToggleCommunityStarMutation } from '../../../state/api/communities/index';
import { AuthModal } from '../../modals/AuthModal';
import { CWModal } from '../component_kit/new_designs/CWModal';

const useJoinCommunity = () => {
  const [isAccountSelectorModalOpen, setIsAccountSelectorModalOpen] =
    useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { mutateAsync: toggleCommunityStar } = useToggleCommunityStarMutation();
  const utils = trpc.useUtils();
  const { mutateAsync: joinCommunity } =
    trpc.community.joinCommunity.useMutation({
      onSuccess: () => {
        // reset xp cache
        utils.quest.getQuests.invalidate();
        utils.user.getXps.invalidate();
      },
    });

  const user = useUserStore();

  const activeChainInfo = app.chain?.meta;
  const activeBase = activeChainInfo?.base;
  const hasTermsOfService = !!activeChainInfo?.terms;
  const activeCommunityId = activeChainInfo?.id;

  const samebaseAddresses = user.addresses.filter((a, idx) => {
    // if no active chain, add all addresses
    if (!activeBase) {
      return true;
    }

    // add all items on same base as active chain
    if (a?.community?.base !== activeBase) {
      return false;
    }

    // // ensure doesn't already exist
    const addressExists = !!user.addresses.slice(idx + 1).find(
      (prev) =>
        activeBase === ChainBase.Substrate &&
        (prev.community?.base === ChainBase.Substrate
          ? addressSwapper({
              address: prev.address,
              currentPrefix: 42,
            }) ===
            addressSwapper({
              address: a.address,
              currentPrefix: 42,
            })
          : prev.address === a.address),
    );

    if (addressExists) {
      return false;
    }

    return true;
  });

  const uniqueAddresses = [];
  const sameBaseAddressesRemoveDuplicates = samebaseAddresses.filter(
    (addressInfo) => {
      // @ts-expect-error <StrictNullChecks/>
      if (!uniqueAddresses.includes(addressInfo.address)) {
        // @ts-expect-error <StrictNullChecks/>
        uniqueAddresses.push(addressInfo.address);
        return true;
      }
      return false;
    },
  );

  const performJoinCommunityLinking = async () => {
    if (sameBaseAddressesRemoveDuplicates.length > 1) {
      setIsAccountSelectorModalOpen(true);
    } else if (sameBaseAddressesRemoveDuplicates.length === 1) {
      await linkToCommunity(0);
      return true;
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Handles linking the specified address to the specified community
  const linkSpecificAddressToSpecificCommunity = async ({
    address,
    community,
    activeChainId,
  }: {
    address: string;
    community: {
      id: string;
      name: string;
      iconUrl: string;
      base: string;
    };
    activeChainId?: string;
  }) => {
    try {
      user.setData({ addressSelectorSelectedAddress: address });

      const {
        address: joinedAddress,
        address_id,
        base,
        ss58Prefix,
        wallet_id,
      } = await joinCommunity({
        community_id: community.id,
      });

      user.setData({ addressSelectorSelectedAddress: undefined });

      // update addresses and user communities
      user.setData({
        ...(!user.communities.find((c) => c.id === community.id) && {
          communities: [
            ...user.communities,
            {
              id: community.id,
              iconUrl: activeChainInfo?.icon_url || community.iconUrl || '',
              name: activeChainInfo?.name || community.name || '',
              isStarred: false,
            },
          ],
        }),
        addresses: user.addresses.concat(
          new AddressInfo({
            userId: user.id,
            id: address_id,
            address,
            community: {
              id: community.id,
              base,
              ss58Prefix,
            },
            walletId: wallet_id,
          }),
        ),
      });

      // set verification token for the newly created account
      const account = app?.chain?.accounts?.get?.(joinedAddress);

      // set active address if in a community
      if (activeChainId) {
        account && (await setActiveAccount(account));

        // update active accounts
        if (
          account &&
          user.accounts.filter((a) => isSameAccount(a, account)).length === 0
        ) {
          user.setData({
            accounts: [...user.accounts, account],
          });
        }
      }
    } catch (err) {
      notifyError(err.message);
    }
  };

  // Handles linking the existing address to the community
  const linkToCommunity = async (accountIndex: number) => {
    const originAddressInfo = sameBaseAddressesRemoveDuplicates[accountIndex];

    if (originAddressInfo) {
      try {
        const targetCommunity =
          activeCommunityId || originAddressInfo.community.id;

        const address = originAddressInfo.address;

        await linkSpecificAddressToSpecificCommunity({
          address,
          community: {
            id: targetCommunity,
            name: activeChainInfo.name,
            base: activeChainInfo.base,
            iconUrl: activeChainInfo.icon_url || '',
          },
          activeChainId: activeCommunityId,
        });

        await toggleCommunityStar({
          community: activeCommunityId || '',
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleJoinCommunity = async () => {
    if (
      sameBaseAddressesRemoveDuplicates.length === 0 ||
      app.chain?.meta?.id === 'injective' ||
      (user.activeAccount?.address?.slice(0, 3) === 'inj' &&
        app.chain?.meta.id !== 'injective')
    ) {
      setIsAuthModalOpen(true);
      return false;
    } else {
      if (hasTermsOfService) {
        setIsTOSModalOpen(true);
        return false;
      } else {
        return await performJoinCommunityLinking();
      }
    }
  };

  const AccountSelectorModal = (
    <CWModal
      size="small"
      content={
        <AccountSelector
          accounts={sameBaseAddressesRemoveDuplicates.map((addressInfo) => ({
            address: addressInfo.address,
          }))}
          walletNetwork={activeChainInfo?.network}
          walletChain={activeChainInfo?.base}
          onSelect={async (accountIndex) => {
            await linkToCommunity(accountIndex);
            setIsAccountSelectorModalOpen(false);
          }}
          onModalClose={() => setIsAccountSelectorModalOpen(false)}
        />
      }
      onClose={() => setIsAccountSelectorModalOpen(false)}
      open={isAccountSelectorModalOpen}
    />
  );

  const TermsOfServiceModal = (
    <CWModal
      size="medium"
      content={
        <TOSModal
          onAccept={async () => {
            await performJoinCommunityLinking();
            setIsTOSModalOpen(false);
          }}
          onModalClose={() => setIsTOSModalOpen(false)}
        />
      }
      onClose={() => setIsTOSModalOpen(false)}
      open={isTOSModalOpen}
    />
  );

  const JoinCommunityModals = (
    <>
      {AccountSelectorModal}
      {TermsOfServiceModal}
      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        isOpen={isAuthModalOpen}
      />
    </>
  );

  return {
    handleJoinCommunity,
    sameBaseAddressesRemoveDuplicates,
    JoinCommunityModals,
    linkSpecificAddressToSpecificCommunity,
  };
};

export default useJoinCommunity;
