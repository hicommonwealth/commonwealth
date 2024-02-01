import { ChainBase, WalletSsoSource } from '@hicommonwealth/core';
import useWallets from 'client/scripts/hooks/useWallets';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import AuthButton from '../../components/AuthButton';
import { AuthTypes } from '../../components/AuthButton/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import './AuthModal.scss';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => any;
  onSuccess?: () => any;
  showWalletsFor?: ChainBase.CosmosSDK | ChainBase.Ethereum;
};

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

  const tabsList = [
    {
      name: 'Wallet',
      options: [
        // Note: If `showWalletsFor` is present then show wallets for that chain, else
        // only show ethereum based wallets options on non-community pages or on ethereum based communities
        ...((!showWalletsFor
          ? !app?.chain?.base
          : showWalletsFor === ChainBase.Ethereum) ||
        app?.chain?.base === ChainBase.Ethereum
          ? ['walletConnect']
          : []),
        // only show cosmos based wallets on non-community pages or on cosmos based communities
        ...(wallets || [])
          .filter(
            (wallet) =>
              ((!showWalletsFor
                ? !app?.chain?.base
                : showWalletsFor === ChainBase.CosmosSDK) ||
                app?.chain?.base === ChainBase.CosmosSDK) &&
              wallet.chain === ChainBase.CosmosSDK,
          )
          .map((wallet) => wallet.name),
        // only show solana based wallets on solana based communities
        ...(wallets || [])
          .filter(
            (wallet) =>
              app?.chain?.base === ChainBase.Solana &&
              wallet.chain === ChainBase.Solana,
          )
          .map((wallet) => wallet.name),
        // only show substrate based wallets on substrate based communities
        ...(wallets || [])
          .filter(
            (wallet) =>
              app?.chain?.base === ChainBase.Substrate &&
              wallet.chain === ChainBase.Substrate,
          )
          .map((wallet) => wallet.name),
      ],
    },
    {
      name: 'Email or Social',
      options: ['google', 'discord', 'x', 'github', 'email'],
    },
  ] as const;

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
      content={
        <section className="AuthModal">
          <CWIcon iconName="close" onClick={onClose} className="close-btn" />

          <img src="/static/img/branding/common-logo.svg" className="logo" />

          <CWText type="h2" className="header" isCentered>
            Sign into Common
          </CWText>

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

          <CWText className="disclaimer">
            By connecting to Common you agree to our&nbsp;
            <br />
            <Link to="/terms">Terms of Service</Link>
            &nbsp;and&nbsp;
            <Link to="/privacy">Privacy Policy</Link>
          </CWText>
        </section>
      }
    />
  );
};

export { AuthModal };
