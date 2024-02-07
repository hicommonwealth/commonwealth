import {
  ChainBase,
  ChainNetwork,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/core';
import useWallets from 'client/scripts/hooks/useWallets';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import AuthButton from '../../../components/AuthButton';
import {
  AuthTypes,
  AuthWallets,
  EVMWallets,
} from '../../../components/AuthButton/types';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from '../../../components/component_kit/new_designs/CWModal';
import {
  CWTab,
  CWTabsRow,
} from '../../../components/component_kit/new_designs/CWTabs';
import { EVMWalletsSubModal } from '../EVMWalletsSubModal';
import { EmailForm } from '../EmailForm';
import { AuthModalTabs, BaseModalProps } from '../types';
import './BaseModal.scss';

const BaseModal = ({ onClose, onSuccess, showWalletsFor }: BaseModalProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isEVMWalletsModalVisible, setIsEVMWalletsModalVisible] =
    useState(false);
  const [isAuthenticatingWithEmail, setIsAuthenticatingWithEmail] =
    useState(false);

  const handleClose = async () => {
    setIsAuthenticatingWithEmail(false);
    setIsEVMWalletsModalVisible(false);
    isWalletConnectEnabled && (await onResetWalletConnect());
    await onClose();
  };

  const {
    wallets = [],
    isMagicLoading,
    isWalletConnectEnabled,
    onResetWalletConnect,
    onEmailLogin,
    onWalletSelect,
    onSocialLogin,
  } = useWallets({
    onModalClose: handleClose,
    onSuccess,
  });

  const filterWalletNames = (byChain: ChainBase) =>
    wallets
      .filter((wallet) => wallet.chain === byChain)
      .map((wallet) => wallet.name);
  const findWalletById = (walletId: WalletId) =>
    wallets.find((wallet) => wallet.name === walletId);

  const hasWalletConnect = findWalletById(WalletId.WalletConnect);
  const evmWallets = filterWalletNames(ChainBase.Ethereum) as EVMWallets[];
  const cosmosWallets = filterWalletNames(ChainBase.CosmosSDK);
  const solanaWallets = filterWalletNames(ChainBase.Solana);
  const substrateWallets = filterWalletNames(ChainBase.Substrate);
  const nearWallet = findWalletById(WalletId.NearWallet)?.name;
  const roninWallet = findWalletById(WalletId.Ronin)?.name;

  const getWalletNames = () => {
    // Wallet Display Logic:
    // 1. When `showWalletsFor` is present, show wallets for that specific chain only.
    // 2. On communities based on 'Ethereum', 'Cosmos', 'Solana', 'Substrate', or 'Near' chains:
    //    - Display wallets specific to the respective community chain.
    //    - 'Near' is the only community where 'Near' wallet is shown
    // 3. On non-community pages, show 'Ethereum', 'Cosmos', 'Solana', and 'Substrate' based wallets
    // 4. On specific communities, show specific wallets
    //    a. On 'axie-infinity' community, only show 'Ronin' wallet
    //    b. On 'terra' community, only show 'terrastation' and 'terra-walletconnect' (wallet connect for terra) wallets
    //    c. On 'evmos' and 'injective' communities, only show 'cosm-metamask' (metamask for cosmos communities) and
    //       'keplr-ethereum' (keplr for ethereum communities) wallets

    const showWalletsForSpecificChains = showWalletsFor || app?.chain?.base;
    if (showWalletsForSpecificChains) {
      switch (showWalletsForSpecificChains) {
        case ChainBase.Ethereum:
          if (
            !showWalletsFor &&
            app?.chain?.meta?.id === ChainNetwork.AxieInfinity &&
            roninWallet
          ) {
            return [roninWallet];
          }

          return hasWalletConnect ? ['walletconnect'] : [];
        case ChainBase.CosmosSDK:
          return cosmosWallets;
        case ChainBase.Solana:
          return solanaWallets;
        case ChainBase.Substrate:
          return substrateWallets;
        case ChainBase.NEAR:
          return nearWallet ? [nearWallet] : [];
        default:
          return [];
      }
    }

    if (!app?.chain?.base) {
      return [
        ...(hasWalletConnect ? ['walletconnect'] : []),
        ...cosmosWallets,
        ...solanaWallets,
        ...substrateWallets,
      ];
    }

    return [];
  };

  const tabsList: AuthModalTabs[] = [
    {
      name: 'Wallet',
      options: getWalletNames() as AuthWallets[],
    },
    {
      name: 'Email or Social',
      options: ['google', 'discord', 'x', 'github', 'email'],
    },
  ];

  const onAuthMethodSelect = async (option: AuthTypes) => {
    if (option === 'email') {
      setIsAuthenticatingWithEmail(true);
      return;
    }

    // if any wallet option is selected
    if (activeTabIndex === 0) {
      // if wallet connect option is selected, open the EVM wallet list modal
      if (option === 'walletconnect' && !isEVMWalletsModalVisible) {
        setIsEVMWalletsModalVisible(true);
        return;
      }

      await onWalletSelect(wallets.find((wallet) => wallet.name === option));
    }

    // if any SSO option is selected
    if (activeTabIndex === 1) {
      // TODO: decide if twitter references are to be updated to 'x'
      await onSocialLogin(
        option === 'x' ? WalletSsoSource.Twitter : (option as WalletSsoSource),
      );
    }
  };

  return (
    <>
      <section className="BaseModal">
        <CWIcon iconName="close" onClick={handleClose} className="close-btn" />

        <img src="/static/img/branding/common-logo.svg" className="logo" />

        <CWText type="h2" className="header" isCentered>
          Sign into Common
        </CWText>

        <CWModalBody className="content">
          <CWTabsRow className="tabs">
            {tabsList.map((tab, index) => (
              <CWTab
                key={tab.name}
                label={tab.name}
                isDisabled={isMagicLoading}
                isSelected={tabsList[activeTabIndex].name === tab.name}
                onClick={() => setActiveTabIndex(index)}
              />
            ))}
          </CWTabsRow>

          <section className="auth-options">
            {/* On the wallets tab, if no wallet is found, show "No wallets Found" */}
            {activeTabIndex === 0 &&
              tabsList[activeTabIndex].options.length === 0 && (
                <AuthButton type="NO_WALLETS_FOUND" />
              )}

            {/*
              If email option is selected don't render SSO's list,
              else render wallets/SSO's list based on activeTabIndex
            */}
            {(activeTabIndex === 0 ||
              (activeTabIndex === 1 && !isAuthenticatingWithEmail)) &&
              tabsList[activeTabIndex].options.map((option, key) => (
                <AuthButton
                  key={key}
                  type={option}
                  disabled={isMagicLoading}
                  onClick={async () => await onAuthMethodSelect(option)}
                />
              ))}

            {/* If email option is selected from the SSO's list, show email form */}
            {activeTabIndex === 1 && isAuthenticatingWithEmail && (
              <EmailForm
                isLoading={isMagicLoading}
                onCancel={() => setIsAuthenticatingWithEmail(false)}
                onSubmit={async ({ email }) => await onEmailLogin(email)}
              />
            )}
          </section>
        </CWModalBody>

        <CWModalFooter className="footer">
          <CWText isCentered>
            By connecting to Common you agree to our&nbsp;
            <br />
            <Link to="/terms">Terms of Service</Link>
            &nbsp;and&nbsp;
            <Link to="/privacy">Privacy Policy</Link>
          </CWText>
        </CWModalFooter>
      </section>
      <EVMWalletsSubModal
        availableWallets={
          [
            ...(evmWallets.includes('walletconnect') ? ['walletconnect'] : []),
            ...evmWallets.filter((x) => x !== 'walletconnect'),
          ] as EVMWallets[]
        }
        isOpen={isEVMWalletsModalVisible}
        onClose={async () => {
          setIsEVMWalletsModalVisible(false);
          isWalletConnectEnabled && (await onResetWalletConnect());
        }}
        onWalletSelect={async (option) => await onAuthMethodSelect(option)}
        disabled={isMagicLoading}
        canResetWalletConnect={isWalletConnectEnabled}
        onResetWalletConnect={onResetWalletConnect}
      />
    </>
  );
};

export { BaseModal };
