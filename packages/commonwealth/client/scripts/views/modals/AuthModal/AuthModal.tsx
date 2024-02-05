import { ChainBase, WalletSsoSource } from '@hicommonwealth/core';
import useWallets from 'client/scripts/hooks/useWallets';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import AuthButton from '../../components/AuthButton';
import { AuthTypes, AuthWallets } from '../../components/AuthButton/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
} from '../../components/component_kit/new_designs/CWModal';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import './AuthModal.scss';
import { AuthModalProps, AuthModalTabs } from './types';

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  showWalletsFor,
}: AuthModalProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const { wallets, onWalletSelect, onSocialLogin } = useWallets({
    onModalClose: onClose,
    onSuccess,
  });

  const cosmosWallets = (wallets || [])
    .filter((wallet) => wallet.chain === ChainBase.CosmosSDK)
    .map((wallet) => wallet.name);
  const solanaWallets = (wallets || [])
    .filter((wallet) => wallet.chain === ChainBase.Solana)
    .map((wallet) => wallet.name);
  const substrateWallets = (wallets || [])
    .filter((wallet) => wallet.chain === ChainBase.Substrate)
    .map((wallet) => wallet.name);

  const tabsList: AuthModalTabs[] = [
    {
      name: 'Wallet',
      options: [
        // Branches:
        // 1. If `showWalletsFor` is present then show wallets for that chain
        // 2. else show all wallets if on any non-community page
        // 3. else when on any community page, show wallets specific to that community
        ...([app?.chain?.base, showWalletsFor].includes(ChainBase.Ethereum) ||
        !app?.chain?.base
          ? ['walletconnect']
          : []),
        ...([app?.chain?.base, showWalletsFor].includes(ChainBase.CosmosSDK) ||
        !app?.chain?.base
          ? cosmosWallets
          : []),
        ...([app?.chain?.base, showWalletsFor].includes(ChainBase.Solana) ||
        !app?.chain?.base
          ? solanaWallets
          : []),
        ...([app?.chain?.base, showWalletsFor].includes(ChainBase.Substrate) ||
        !app?.chain?.base
          ? substrateWallets
          : []),
      ] as AuthWallets[],
    },
    {
      name: 'Email or Social',
      options: ['google', 'discord', 'x', 'github', 'email'],
    },
  ];

  const onAuthMethodSelect = async (option: AuthTypes) => {
    if (option === 'email') {
      // TODO: implement this in https://github.com/hicommonwealth/commonwealth/issues/6386
      return;
    }

    // if any wallet option is selected
    if (activeTabIndex === 0) {
      await onWalletSelect(
        wallets.find(
          (wallet) => wallet.name.toLowerCase() === option.toLowerCase(),
        ),
      );
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
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="medium"
      content={
        <section className="AuthModal">
          <CWIcon iconName="close" onClick={onClose} className="close-btn" />

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
                  isSelected={tabsList[activeTabIndex].name === tab.name}
                  onClick={() => setActiveTabIndex(index)}
                />
              ))}
            </CWTabsRow>

            <section className="auth-options">
              {activeTabIndex === 0 &&
              tabsList[activeTabIndex].options.length === 0 ? (
                <AuthButton type="NO_WALLETS_FOUND" />
              ) : (
                tabsList[activeTabIndex].options.map((option, key) => (
                  <AuthButton
                    key={key}
                    type={option}
                    onClick={async () => await onAuthMethodSelect(option)}
                  />
                ))
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
      }
    />
  );
};

export { AuthModal };
