import React, { useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/core';
import { setActiveAccount } from 'controllers/app/login';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import WebWalletController from 'controllers/app/web_wallets';
import useWallets from 'hooks/useWallets';
import app from 'state';
import _ from 'underscore';
import { CWAuthButton } from 'views/components/component_kit/CWAuthButtonOld';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { formatAddress } from 'views/components/user/user_block';
import { openConfirmation } from 'views/modals/confirmation_modal';
import './SessionRevalidationModal.scss';

interface SessionRevalidationModalProps {
  onModalClose: () => void;
  walletSsoSource: WalletSsoSource;
  walletAddress: string;
}
const SessionRevalidationModal = ({
  onModalClose,
  walletSsoSource,
  walletAddress,
}: SessionRevalidationModalProps) => {
  const [connectWithEmail, setConnectWithEmail] = useState(false);

  const {
    onWalletAddressSelect,
    onWalletSelect,
    onResetWalletConnect,
    onEmailLogin,
    onSocialLogin,
    setEmail,
    isMagicLoading,
  } = useWallets({
    useSessionKeyLoginFlow: true,
    onModalClose: () => {
      // do nothing, let the user close out of session revalidation
    },
    onSuccess: async (signedAddress) => {
      onModalClose();

      // if user tries to sign in with different address than
      // expected for session key revalidation
      if (signedAddress !== walletAddress) {
        openConfirmation({
          title: 'Address mismatch',
          description: (
            <>
              Expected the address <b>{formatAddress(walletAddress)}</b>, but
              the wallet you signed in with has address{' '}
              <b>{formatAddress(signedAddress)}</b>.
              <br />
              Please try sign again with expected address.
              <br />
            </>
          ),
          buttons: [],
          className: 'AddressMismatch',
        });
      } else {
        const updatedAddress = app.user.activeAccounts.find(
          (addr) => addr.address === walletAddress,
        );
        await setActiveAccount(updatedAddress);
      }
    },
  });

  const chainbase = app.chain?.meta?.base;
  const wallets = WebWalletController.Instance.availableWallets(chainbase);

  const wcEnabled = _.any(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled,
  );

  return (
    <div className="SessionRevalidationModal">
      <CWModalHeader label="Session expired" onModalClose={onModalClose} />
      <CWModalBody>
        <CWText className="info">
          The session for your address{' '}
          <strong>{formatAddress(walletAddress)}</strong> has expired.
        </CWText>
        <CWText className="info">
          To continue what you were doing, sign in with{' '}
          {walletSsoSource && walletSsoSource !== WalletSsoSource.Unknown
            ? walletSsoSource[0].toUpperCase() + walletSsoSource.slice(1)
            : 'your wallet'}{' '}
          again:
        </CWText>
        <div>
          {walletSsoSource === WalletSsoSource.Google ? (
            <CWAuthButton
              type="google"
              label="Sign in with Google"
              onClick={async () => onSocialLogin(WalletSsoSource.Google)}
            />
          ) : walletSsoSource === WalletSsoSource.Discord ? (
            <CWAuthButton
              type="discord"
              label="Discord"
              onClick={async () => onSocialLogin(WalletSsoSource.Discord)}
            />
          ) : walletSsoSource === WalletSsoSource.Github ? (
            <CWAuthButton
              type="github"
              label="Github"
              onClick={() => onSocialLogin(WalletSsoSource.Github)}
            />
          ) : walletSsoSource === WalletSsoSource.Twitter ? (
            <CWAuthButton
              type="twitter"
              label="Twitter"
              onClick={() => onSocialLogin(WalletSsoSource.Twitter)}
            />
          ) : connectWithEmail ? (
            <div>
              {!isMagicLoading ? (
                <CWTextInput
                  autoFocus={true}
                  label="email address"
                  placeholder="your-email@email.com"
                  onInput={(e) => setEmail(e.target.value)}
                  onenterkey={async () => await onEmailLogin()}
                />
              ) : (
                <CWSpinner />
              )}
              <div className="buttons-row">
                <CWButton
                  label="Back"
                  buttonType="secondary-blue"
                  onClick={() => setConnectWithEmail(false)}
                />
                <CWButton
                  label="Connect"
                  onClick={async () => await onEmailLogin()}
                />
              </div>
            </div>
          ) : (
            <CWWalletsList
              useSessionKeyRevalidationFlow={true}
              onResetWalletConnect={onResetWalletConnect}
              onWalletAddressSelect={onWalletAddressSelect}
              onWalletSelect={onWalletSelect}
              onConnectAnotherWay={() => setConnectWithEmail(true)}
              onSocialLogin={(provider: WalletSsoSource) =>
                onSocialLogin(provider)
              }
              darkMode={false}
              wallets={wallets}
              hasNoWalletsLink={false}
              canResetWalletConnect={wcEnabled}
              hideSocialLogins={false}
            />
          )}
        </div>
      </CWModalBody>
    </div>
  );
};

export default SessionRevalidationModal;
