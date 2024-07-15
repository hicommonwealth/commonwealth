import { addressSwapper, ChainBase } from '@hicommonwealth/shared';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import { isSameAccount } from 'helpers';
import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { AccountSelector } from 'views/components/component_kit/cw_wallets_list';
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
    const addressChainInfo = app.config.chains.getById(a.community.id);
    if (addressChainInfo?.base !== activeBase) {
      return false;
    }

    // // ensure doesn't already exist
    const addressExists = !!user.addresses.slice(idx + 1).find(
      (prev) =>
        activeBase === ChainBase.Substrate &&
        (app.config.chains.getById(prev.community.id)?.base ===
        ChainBase.Substrate
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
    communityId,
    communityChainBase,
    activeChainId,
  }: {
    address: string;
    communityId: string;
    communityChainBase: string;
    activeChainId?: string;
  }) => {
    try {
      const res = await linkExistingAddressToChainOrCommunity(
        address,
        communityId,
        communityChainBase,
      );

      if (res && res.data.result) {
        const { verification_token, addresses, encodedAddress } =
          res.data.result;

        // update addresses
        user.setData({
          addresses: addresses.map((a) => {
            return new AddressInfo({
              id: a.id,
              address: a.address,
              communityId: a.community_id,
              keytype: a.keytype,
              walletId: a.wallet_id,
            });
          }),
        });

        // get newly added address info
        const addressInfo = user.addresses.find(
          (a) => a.address === encodedAddress && a.community.id === communityId,
        );

        // set verification token for the newly created account
        const account = app?.chain?.accounts?.get?.(
          encodedAddress,
          // @ts-expect-error <StrictNullChecks/>
          addressInfo.keytype,
        );
        if (account && app.chain) {
          account?.setValidationToken?.(verification_token);
        }

        // set active address if in a community
        if (activeChainId) {
          // set role in community
          if (
            !app.roles.getRoleInCommunity({
              account,
              community: activeChainId,
            })
          ) {
            await app.roles.createRole({
              // @ts-expect-error <StrictNullChecks/>
              address: addressInfo,
              community: activeChainId,
            });
          }

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
      } else {
        // Todo: handle error
      }
    } catch (err) {
      console.error(err);
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
          communityId: targetCommunity,
          communityChainBase: originAddressInfo.community.id,
          activeChainId: activeCommunityId,
        });

        await toggleCommunityStar({
          community: activeCommunityId,
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
