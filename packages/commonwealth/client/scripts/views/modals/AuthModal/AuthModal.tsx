import { WalletSsoSource } from '@hicommonwealth/core';
import useWallets from 'client/scripts/hooks/useWallets';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  onClose: () => any;
  isOpen: boolean;
};

const AuthModal = ({ onClose, isOpen }: AuthModalProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const { onSocialLogin } = useWallets({
    onModalClose: onClose,
  });

  const tabsList = [
    {
      name: 'Wallet',
      options: ['walletConnect', 'keplr', 'leap', 'phantom', 'polkadot'],
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

          <img src="/static/img/common-logo.svg" className="logo" />

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
            {tabsList[activeTabIndex].options.map((option, key) => (
              <AuthButton
                key={key}
                type={option}
                onClick={async () => await onAuthMethodSelect(option)}
              />
            ))}
          </section>

          <p className="disclaimer">
            By connecting to Common you agree to our&nbsp;
            <br />
            <Link to="/terms">Terms of Service</Link>&nbsp; and&nbsp;
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </section>
      }
    />
  );
};

export { AuthModal };
