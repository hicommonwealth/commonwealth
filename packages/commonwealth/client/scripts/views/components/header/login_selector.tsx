import React, { useState, useEffect } from 'react';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import { initAppState } from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { addressSwapper } from 'utils';
import $ from 'jquery';
import { redraw } from 'mithrilInterop';

import _ from 'lodash';

import 'components/header/login_selector.scss';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import { notifySuccess } from 'controllers/app/notifications';
import { isSameAccount, pluralize } from 'helpers';
import { setDarkMode } from 'helpers/darkMode';
import type { Account } from 'models';
import { AddressInfo, ITokenAdapter } from 'models';

import app from 'state';
import { User } from 'views/components/user/user';
import { LoginModal } from 'views/modals/login_modal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { SelectAddressModal } from '../../modals/select_address_modal';
import { CWButton } from '../component_kit/cw_button';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { CWToggle, toggleDarkMode } from '../component_kit/cw_toggle';
import { AccountSelector } from '../component_kit/cw_wallets_list';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { UserBlock } from '../user/user_block';
import { CWDivider } from '../component_kit/cw_divider';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { Modal } from '../component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import useForceRerender from 'hooks/useForceRerender';

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

type LoginSelectorMenuLeftAttrs = {
  activeAddressesWithRole: Array<Account>;
  nAccountsWithoutRole: number;
};

export const LoginSelectorMenuLeft = ({
  activeAddressesWithRole,
  nAccountsWithoutRole,
}: LoginSelectorMenuLeftAttrs) => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSelectAddressModalOpen, setIsSelectAddressModalOpen] =
    useState(false);
  const [profileId, setProfileId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const changeSelectedAddress = () => {
    const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
    setSelectedAddress(activeAccount.address);
    forceRerender();
  };

  useEffect(() => {
    // force rerender when new address is connected
    app.user.isFetched.on('redraw', () => {
      changeSelectedAddress();
    });

    return () => {
      app.user.isFetched.off('redraw', () => {
        changeSelectedAddress();
      });
    };
  }, []);

  useEffect(() => {
    const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
    const chain =
      typeof activeAccount.chain === 'string'
        ? activeAccount.chain
        : activeAccount.chain?.id;
    const profile = app.newProfiles.getProfile(chain, activeAccount.address);
    setProfileId(profile.id);
    setSelectedAddress(activeAccount.address);
  }, []);

  const { activeAccounts } = app.user;

  return (
    <div className="LoginSelectorMenu left">
      {app.activeChainId() && (
        <>
          <CWText type="caption" className="title">
            Select address to use
          </CWText>
          {activeAccounts.map((account, i) => {
            return (
              <div
                key={i}
                className={`login-menu-item ${
                  selectedAddress === account.address ? 'selected' : ''
                }`}
                onClick={async () => {
                  await setActiveAccount(account);
                  setSelectedAddress(account.address);
                  redraw();
                }}
              >
                <UserBlock
                  user={account}
                  selected={isSameAccount(account, app.user.activeAccount)}
                  showRole={false}
                  compact
                  hideAvatar
                />
              </div>
            );
          })}
        </>
      )}
      {activeAccounts.length > 0 && <CWDivider />}
      <div
        className="login-menu-item"
        onClick={() => {
          navigate(`/profile/id/${profileId}`, {}, null);
        }}
      >
        <CWText type="caption">View profile</CWText>
      </div>
      <div
        className="login-menu-item"
        onClick={() => {
          navigate(`/profile/edit`, {}, null);
        }}
      >
        <CWText type="caption">Edit profile</CWText>
      </div>
      <div
        className="login-menu-item"
        onClick={() => {
          if (nAccountsWithoutRole > 0) {
            setIsSelectAddressModalOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      >
        <CWText type="caption">
          {nAccountsWithoutRole > 0
            ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
            : 'Connect a new address'}
        </CWText>
      </div>
      <Modal
        content={
          <SelectAddressModal
            onModalClose={() => setIsSelectAddressModalOpen(false)}
          />
        }
        onClose={() => setIsSelectAddressModalOpen(false)}
        open={isSelectAddressModalOpen}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </div>
  );
};

interface LoginSelectorMenuRightProps {
  onLogout: () => void;
}

export const LoginSelectorMenuRight = ({
  onLogout,
}: LoginSelectorMenuRightProps) => {
  const navigate = useCommonNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );

  const resetWalletConnectSession = async () => {
    /**
     * Imp to reset wc session on logout as subsequent login attempts fail
     */
    const walletConnectWallet = app.wallets.getByName(WalletId.WalletConnect);
    await walletConnectWallet.reset();
  };

  return (
    <>
      <div className="LoginSelectorMenu right">
        <div
          className="login-menu-item"
          onClick={() => navigate('/notification-settings', {}, null)}
        >
          <CWText type="caption">Notification settings</CWText>
        </div>
        <div className="login-menu-item">
          <CWToggle
            checked={isDarkModeOn}
            onChange={(e) => {
              isDarkModeOn
                ? toggleDarkMode(false, setIsDarkModeOn)
                : toggleDarkMode(true, setIsDarkModeOn);
              e.stopPropagation();
              redraw();
            }}
          />
          <div className="login-darkmode-label">
            <CWText type="caption">Dark mode</CWText>
          </div>
        </div>
        <CWDivider />
        <div className="login-menu-item" onClick={() => setIsModalOpen(true)}>
          <CWText type="caption">Send feedback</CWText>
        </div>
        <div
          className="login-menu-item"
          onClick={() => {
            $.get(`${app.serverUrl()}/logout`)
              .then(async () => {
                await initAppState();
                await resetWalletConnectSession();

                notifySuccess('Logged out');
                onLogout();
                setDarkMode(false);
              })
              .catch(() => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
          }}
        >
          <CWText type="caption">Logout</CWText>
        </div>
      </div>
      <Modal
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

type TOSModalProps = {
  onAccept: () => void;
  onModalClose: () => void;
};

const TOSModal = ({ onModalClose, onAccept }: TOSModalProps) => {
  return (
    <div className="TOSModal">
      <div className="close-button-wrapper">
        <CWIconButton
          iconButtonTheme="primary"
          iconName="close"
          iconSize="small"
          className="close-icon"
          onClick={onModalClose}
        />
      </div>
      <div className="content-wrapper">
        <CWText>
          By clicking accept you agree to the community's Terms of Service
        </CWText>
        <CWButton onClick={onAccept} label="Accept" />
      </div>
    </div>
  );
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
    setIsJoined(!!app.user.activeAccount);
  }, [app.user.activeAccount]);

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

  const activeAddressesWithRole = app.user.activeAccounts.filter((account) => {
    return app.roles.getRoleInCommunity({
      account,
      chain: app.activeChainId(),
    });
  });

  const activeAccountsByRole = app.roles.getActiveAccountsByRole();

  const nAccountsWithoutRole = activeAccountsByRole.filter(
    ([role]) => !role
  ).length;

  if (!profileLoadComplete && app.newProfiles.allLoaded()) {
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
        redraw();
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
                if(sameBaseAddressesRemoveDuplicates.length === 0) {
                  setIsLoginModalOpen(true)
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
                content={
                  <LoginSelectorMenuLeft
                    activeAddressesWithRole={activeAddressesWithRole}
                    nAccountsWithoutRole={nAccountsWithoutRole}
                  />
                }
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
          <LoginModal onModalClose={() => setIsLoginModalOpen(false)} />
        }
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  );
};
