import React, { useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/shared';
import { setActiveAccount } from 'controllers/app/login';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import WebWalletController from 'controllers/app/web_wallets';
import { addressSwapper } from 'shared/utils';
import app from 'state';
import _ from 'underscore';
import { CWAuthButton } from 'views/components/component_kit/CWAuthButtonOld';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { formatAddress } from 'views/components/user/user_block';
import { openConfirmation } from 'views/modals/confirmation_modal';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import useAuthentication from '../AuthModal/useAuthentication'; // TODO: This modal should be absorbed into AuthModal
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
  } = useAuthentication({
    useSessionKeyLoginFlow: true,
    onModalClose: () => {
      // do nothing, let the user close out of session revalidation
    },
    onSuccess: async (signedAddress) => {
      onModalClose();

      // check if user tries to sign in with different address than
      // expected for session key revalidation

      // @ts-expect-error StrictNullChecks
      const isSubstrate = app.user.activeAccounts.find(
        (addr) => addr.address === walletAddress,
      ).community.ss58Prefix;
      if (
        signedAddress === walletAddress ||
        (isSubstrate &&
          addressSwapper({ address: walletAddress, currentPrefix: 42 }) ===
            signedAddress)
      ) {
        const signedAddressAccount = app.user.activeAccounts.find(
          (addr) => addr.address === walletAddress,
        );
        await setActiveAccount(signedAddressAccount!);
      } else {
        const signedAddressAccount = app.user.activeAccounts.find(
          (addr) => addr.address === signedAddress,
        );
        await setActiveAccount(signedAddressAccount!);
        openConfirmation({
          title: signedAddressAccount
            ? 'Address switched'
            : 'Logged in with unexpected address',
          description: (
            <>
              <p style={{ marginBottom: 6 }}>
                Your active address was <b>{formatAddress(walletAddress!)}</b>,
                but you just signed in with your wallet for{' '}
                <b>{formatAddress(signedAddress!)}</b>.
              </p>
              {signedAddressAccount ? (
                <p>
                  We’ve switched your active address to the one in your wallet.
                </p>
              ) : (
                <p>
                  Select <strong>Connect a new address</strong> in the user menu
                  to connect this as a new address.
                </p>
              )}
            </>
          ),
          buttons: [
            {
              label: 'Continue',
              buttonType: 'primary',
            },
          ],
          className: 'AddressMismatch',
        });
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
      <CWModalHeader label="Verify ownership" onModalClose={onModalClose} />
      <CWModalBody>
        <CWText className="info">
          You haven’t used this address recently, so we need you to sign in
          again.
        </CWText>
        <CWText className="info">
          Please use
          {walletSsoSource && walletSsoSource !== WalletSsoSource.Unknown ? (
            ` ${walletSsoSource[0].toUpperCase() + walletSsoSource.slice(1)} `
          ) : (
            <span>
              {' '}
              your wallet for <strong>
                {formatAddress(walletAddress)}
              </strong>{' '}
            </span>
          )}
          to continue:
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
              label="X (Twitter)"
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
                <CWCircleMultiplySpinner />
              )}
              <div className="buttons-row">
                <CWButton
                  label="Back"
                  buttonType="secondary"
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
