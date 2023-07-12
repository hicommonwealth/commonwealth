import app from 'state';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { addressSwapper } from 'utils';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import AddressInfo from 'models/AddressInfo';
import { isSameAccount } from 'helpers';
import ITokenAdapter from 'models/ITokenAdapter';
import React, { useState } from 'react';
import { Modal } from 'views/components/component_kit/cw_modal';
import { AccountSelector } from 'views/components/component_kit/cw_wallets_list';

const NON_INTEROP_NETWORKS = [ChainNetwork.AxieInfinity];

interface UseJoinCommunityProps {
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTOSModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const useJoinCommunity = ({
  setIsLoginModalOpen,
  setIsTOSModalOpen,
}: UseJoinCommunityProps) => {
  const [isAccountSelectorModalOpen, setIsAccountSelectorModalOpen] =
    useState(false);

  const activeChainInfo = app.chain?.meta;
  const activeBase = activeChainInfo?.base;
  const hasTermsOfService = !!activeChainInfo?.terms;
  const activeChainId = activeChainInfo?.id;

  const samebaseAddresses = app.user.addresses.filter((a, idx) => {
    // if no active chain, add all addresses
    if (!activeBase) {
      return true;
    }

    // add all items on same base as active chain
    const addressChainInfo = app.config.chains.getById(a.chain.id);
    if (addressChainInfo?.base !== activeBase) {
      return false;
    }

    // // ensure doesn't already exist
    const addressExists = !!app.user.addresses.slice(idx + 1).find(
      (prev) =>
        activeBase === ChainBase.Substrate &&
        (app.config.chains.getById(prev.chain.id)?.base === ChainBase.Substrate
          ? addressSwapper({
              address: prev.address,
              currentPrefix: 42,
            }) ===
            addressSwapper({
              address: a.address,
              currentPrefix: 42,
            })
          : prev.address === a.address)
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
    }
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
      setIsLoginModalOpen(true);
    }
  };

  // Handles linking the existing address to the community
  const linkToCommunity = async (accountIndex: number) => {
    const originAddressInfo = sameBaseAddressesRemoveDuplicates[accountIndex];

    if (originAddressInfo) {
      try {
        const targetChain = activeChainId || originAddressInfo.chain.id;

        const address = originAddressInfo.address;

        const res = await linkExistingAddressToChainOrCommunity(
          address,
          targetChain,
          originAddressInfo.chain.id
        );

        if (res && res.result) {
          const { verification_token, addresses, encodedAddress } = res.result;
          app.user.setAddresses(
            addresses.map((a) => {
              return new AddressInfo(
                a.id,
                a.address,
                a.chain,
                a.keytype,
                a.wallet_id
              );
            })
          );
          const addressInfo = app.user.addresses.find(
            (a) => a.address === encodedAddress && a.chain.id === targetChain
          );

          const account = app.chain.accounts.get(
            encodedAddress,
            addressInfo.keytype
          );
          if (app.chain) {
            account.setValidationToken(verification_token);
            console.log('setting validation token');
          }
          if (
            activeChainId &&
            !app.roles.getRoleInCommunity({
              account,
              chain: activeChainId,
            })
          ) {
            await app.roles.createRole({
              address: addressInfo,
              chain: activeChainId,
            });
          }
          await setActiveAccount(account);
          if (
            app.user.activeAccounts.filter((a) => isSameAccount(a, account))
              .length === 0
          ) {
            app.user.setActiveAccounts(
              app.user.activeAccounts.concat([account])
            );
          }
        } else {
          // Todo: handle error
        }

        // If token forum make sure has token and add to app.chain obj
        if (app.chain && ITokenAdapter.instanceOf(app.chain)) {
          await app.chain.activeAddressHasToken(app.user.activeAccount.address);
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
      setIsLoginModalOpen(true);
    } else {
      if (hasTermsOfService) {
        setIsTOSModalOpen(true);
      } else {
        await performJoinCommunityLinking();
      }
    }
  };

  const AccountSelectorModal = (
    <Modal
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

  return {
    handleJoinCommunity,
    sameBaseAddressesRemoveDuplicates,
    performJoinCommunityLinking,
    linkToCommunity,
    AccountSelectorModal,
  };
};

export default useJoinCommunity;
