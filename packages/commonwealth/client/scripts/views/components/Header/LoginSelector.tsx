import React, { useState, useEffect } from 'react';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { addressSwapper } from 'utils';

import _ from 'lodash';

import 'components/Header/LoginSelector.scss';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import { isSameAccount } from 'helpers';

import app from 'state';
import { User } from 'views/components/user/user';
import { LoginModal } from 'views/modals/login_modal';
import NewProfilesController from '../../../controllers/server/newProfiles';
import AddressInfo from '../../../models/AddressInfo';
import ITokenAdapter from '../../../models/ITokenAdapter';
import { CWButton } from '../component_kit/cw_button';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { AccountSelector } from '../component_kit/cw_wallets_list';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { Modal } from '../component_kit/cw_modal';
import useForceRerender from 'hooks/useForceRerender';
import { LoginSelectorMenuLeft } from 'views/components/Header/LoginSelectorMenuLeft';
import { LoginSelectorMenuRight } from 'views/components/Header/LoginSelectorMenuRight';
import { TOSModal } from 'views/components/Header/TOSModal';

const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
  [ChainBase.Solana]: 'Solana',
};

const CHAINNETWORK_SHORT = {
  [ChainNetwork.AxieInfinity]: 'Ronin',
  [ChainNetwork.Terra]: 'Terra',
};

export const LoginSelector = () => {
  const forceRerender = useForceRerender();
  const [profileLoadComplete, setProfileLoadComplete] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSelectorModalOpen, setIsAccountSelectorModalOpen] =
    useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () => {
      setProfileLoadComplete(true);
    });
  });

  useEffect(() => {
    const activeAccounts = app.user?.activeAccounts?.filter(
      (a) => a.chain.id === app.chain.id
    );
    setIsJoined(!!app.user.activeAccount || activeAccounts.length > 0);
  }, [app.user.activeAccount, app.user.activeAccounts]);

  useEffect(() => {
    if (!isLoginModalOpen && app.chain?.meta?.id == 'injective') {
      forceRerender();
    }
  }, [isLoginModalOpen]);

  const leftMenuProps = usePopover();
  const rightMenuProps = usePopover();

  const onLogout = () => {
    forceRerender();
    rightMenuProps.setAnchorEl?.(null);
  };

  if (!app.isLoggedIn()) {
    return (
      <>
        <div className="LoginSelector">
          <CWButton
            buttonType="tertiary-black"
            iconLeft="person"
            label="Log in"
            onClick={() => setIsLoginModalOpen(true)}
          />
        </div>
        <Modal
          content={
            <LoginModal onModalClose={() => setIsLoginModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsLoginModalOpen(false)}
          open={isLoginModalOpen}
        />
      </>
    );
  }

  if (!profileLoadComplete && NewProfilesController.Instance.allLoaded()) {
    setProfileLoadComplete(true);
  }

  const activeChainInfo = app.chain?.meta;
  const activeChainId = activeChainInfo?.id;

  // add all addresses if joining a community
  const activeBase = activeChainInfo?.base;
  const NON_INTEROP_NETWORKS = [ChainNetwork.AxieInfinity];
  const samebaseAddresses = app.user.addresses.filter((a, idx) => {
    // if no active chain, add all addresses
    if (!activeBase) return true;

    // add all items on same base as active chain
    const addressChainInfo = app.config.chains.getById(a.chain.id);
    if (addressChainInfo?.base !== activeBase) return false;

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
    if (addressExists) return false;

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

  // Extract unique addresses
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

  const activeCommunityMeta = app.chain?.meta;
  const hasTermsOfService = !!activeCommunityMeta?.terms;

  // Handles linking the existing address to the community
  async function linkToCommunity(accountIndex: number) {
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
              address: _.omit(addressInfo, 'chain'),
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
  }

  // Handles displaying the login modal or the account selector modal
  // TODO: Replace with pretty modal
  async function performJoinCommunityLinking() {
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
  }

  return (
    <>
      <div className="LoginSelector">
        {app.chain && !app.chainPreloading && profileLoadComplete && !isJoined && (
          <div className="join-button-container">
            <CWButton
              buttonType="tertiary-black"
              onClick={async () => {
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
                    setIsJoined(true);
                  }
                }
              }}
              label={
                sameBaseAddressesRemoveDuplicates.length === 0
                  ? `No ${
                      CHAINNETWORK_SHORT[app.chain?.meta?.network] ||
                      CHAINBASE_SHORT[app.chain?.meta?.base] ||
                      ''
                    } address`
                  : 'Join'
              }
            />
          </div>
        )}
        {profileLoadComplete && (
          <ClickAwayListener
            onClickAway={() => {
              leftMenuProps.setAnchorEl(null);
            }}
          >
            <div className="button-container">
              <div
                className="left-button"
                onClick={leftMenuProps.handleInteraction}
              >
                <User user={app.user.addresses[0]} />
              </div>

              <Popover
                content={<LoginSelectorMenuLeft />}
                {...leftMenuProps}
              />
            </div>
          </ClickAwayListener>
        )}
        <ClickAwayListener
          onClickAway={() => {
            rightMenuProps.setAnchorEl(null);
          }}
        >
          <div className="button-container">
            <div
              className="right-button"
              onClick={rightMenuProps.handleInteraction}
            >
              <CWIconButton iconName="person" iconButtonTheme="black" />
            </div>
            <Popover
              content={<LoginSelectorMenuRight onLogout={onLogout} />}
              {...rightMenuProps}
            />
          </div>
        </ClickAwayListener>
      </div>
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
      <Modal
        content={
          <TOSModal
            onAccept={async () => {
              await performJoinCommunityLinking();
              setIsTOSModalOpen(false);
              setIsJoined(true);
            }}
            onModalClose={() => setIsTOSModalOpen(false)}
          />
        }
        onClose={() => setIsTOSModalOpen(false)}
        open={isTOSModalOpen}
      />
      <Modal
        content={
          <LoginModal
            onSuccess={() => setIsJoined(true)}
            onModalClose={() => setIsLoginModalOpen(false)}
          />
        }
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  );
};
