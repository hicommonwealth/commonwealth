import { ChainBase, ChainNetwork } from '@hicommonwealth/core';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import { isSameAccount } from 'helpers';
import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import app from 'state';
import { addressSwapper } from 'utils';
import { AccountSelector } from 'views/components/component_kit/cw_wallets_list';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import TOSModal from 'views/modals/TOSModal';
import { LoginModal } from 'views/modals/login_modal';
import { useFlag } from '../../../hooks/useFlag';
import { AuthModal } from '../../modals/AuthModal';
import { CWModal } from '../component_kit/new_designs/CWModal';

const NON_INTEROP_NETWORKS = [ChainNetwork.AxieInfinity];

const useJoinCommunity = () => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [isAccountSelectorModalOpen, setIsAccountSelectorModalOpen] =
    useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const activeChainInfo = app.chain?.meta;
  const activeBase = activeChainInfo?.base;
  const hasTermsOfService = !!activeChainInfo?.terms;
  const activeCommunityId = activeChainInfo?.id;

  const samebaseAddresses = app.user.addresses.filter((a, idx) => {
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
    const addressExists = !!app.user.addresses.slice(idx + 1).find(
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

    // filter additionally by chain network if in list of non-interop, unless we are on that chain
    // TODO: make this related to wallet.specificChains
    if (
      NON_INTEROP_NETWORKS.includes(addressChainInfo?.network) &&
      activeChainInfo?.network !== addressChainInfo?.network
    ) {
      return false;
    }
    return true;
  });

  const uniqueAddresses = [];
  const sameBaseAddressesRemoveDuplicates = samebaseAddresses.filter(
    (addressInfo) => {
      if (!uniqueAddresses.includes(addressInfo.address)) {
        uniqueAddresses.push(addressInfo.address);
        return true;
      }
      return false;
    },
  );

  const performJoinCommunityLinking = async () => {
    if (
      sameBaseAddressesRemoveDuplicates.length > 1 &&
      app.activeChainId() !== 'axie-infinity'
    ) {
      setIsAccountSelectorModalOpen(true);
    } else if (
      sameBaseAddressesRemoveDuplicates.length === 1 &&
      app.activeChainId() !== 'axie-infinity'
    ) {
      await linkToCommunity(0);
    } else {
      setIsAuthModalOpen(true);
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

        const res = await linkExistingAddressToChainOrCommunity(
          address,
          targetCommunity,
          originAddressInfo.community.id,
        );

        if (res && res.result) {
          const { verification_token, addresses, encodedAddress } = res.result;
          app.user.setAddresses(
            addresses.map((a) => {
              return new AddressInfo({
                id: a.id,
                address: a.address,
                chainId: a.community_id,
                keytype: a.keytype,
                walletId: a.wallet_id,
              });
            }),
          );
          const addressInfo = app.user.addresses.find(
            (a) =>
              a.address === encodedAddress &&
              a.community.id === targetCommunity,
          );

          const account = app.chain.accounts.get(
            encodedAddress,
            addressInfo.keytype,
          );
          if (app.chain) {
            account.setValidationToken(verification_token);
            console.log('setting validation token');
          }
          if (
            activeCommunityId &&
            !app.roles.getRoleInCommunity({
              account,
              community: activeCommunityId,
            })
          ) {
            await app.roles.createRole({
              address: addressInfo,
              community: activeCommunityId,
            });
          }
          await setActiveAccount(account);
          if (
            app.user.activeAccounts.filter((a) => isSameAccount(a, account))
              .length === 0
          ) {
            app.user.setActiveAccounts(
              app.user.activeAccounts.concat([account]),
            );
          }
        } else {
          // Todo: handle error
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleJoinCommunity = async () => {
    if (
      sameBaseAddressesRemoveDuplicates.length === 0 ||
      app.chain?.meta?.id === 'injective' ||
      (app.user.activeAccount?.address?.slice(0, 3) === 'inj' &&
        app.chain?.meta.id !== 'injective')
    ) {
      setIsAuthModalOpen(true);
    } else {
      if (hasTermsOfService) {
        setIsTOSModalOpen(true);
      } else {
        await performJoinCommunityLinking();
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

  const LoginModalWrapper = (
    <>
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
    </>
  );

  const JoinCommunityModals = (
    <>
      {AccountSelectorModal}
      {TermsOfServiceModal}
      {LoginModalWrapper}
    </>
  );

  return {
    handleJoinCommunity,
    sameBaseAddressesRemoveDuplicates,
    JoinCommunityModals,
  };
};

export default useJoinCommunity;
