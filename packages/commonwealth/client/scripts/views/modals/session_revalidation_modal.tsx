import React, { useState } from 'react';
import { WalletSsoSource } from 'common-common/src/types';

import { Modal } from '../components/component_kit/cw_modal';
import _ from 'underscore';
import { uuidv4 } from 'lib/util';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import 'modals/session_signin_modal.scss';

import app from 'state';
import useWallets from '../../hooks/useWallets';
import WebWalletController from '../../controllers/app/web_wallets';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { formatAddress } from '../components/user/user_block';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';

type SessionRevalidationModalProps = {
  walletName: string,
  walletAddress: string,
  walletSsoSource: WalletSsoSource,
  onClose: () => void;
  onVerified: (address: string | undefined) => void;
};

const SessionRevalidationModal = ({
  walletName,
  walletAddress,
  walletSsoSource,
  onVerified,
  onClose,
}: SessionRevalidationModalProps) => {
  const {
    onWalletAddressSelect,
    onWalletSelect,
    onResetWalletConnect,
    onEmailLogin,
    onSocialLogin,
    setEmail,
    isMagicLoading
  } =
    useWallets({
      useSessionKeyLoginFlow: true,
      onModalClose: () => {
        // do nothing, let the user close out of session revalidation
      },
      onSuccess: (address: string | undefined) => {
        onVerified(address);
      },
    });
  const chainbase = app.chain?.meta?.base;
  const wallets = WebWalletController.Instance.availableWallets(chainbase);

  const wcEnabled = _.any(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled
  );

  // magic-related state
  const [connectWithEmail, setConnectWithEmail] = useState(false);

  return (
    <Modal
      content={
        <div
          className="SessionRevalidationModal"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="compact-modal-body">
            <h3>Re-connect wallet</h3>
            <p>
              Your previous login was a while ago.
              Re-connect {walletName ?? "your wallet"} with the
              address <strong>{formatAddress(walletAddress)}</strong>{" "}
              {walletSsoSource && walletSsoSource !== WalletSsoSource.Unknown ? <>via {walletSsoSource}</> : ""}
              {" "}to continue:
            </p>
          </div>
          <div className="compact-modal-actions">
            <div>
              {connectWithEmail ? (
                <div>
                  {!isMagicLoading ? (
                    <CWTextInput
                      autoFocus={true}
                      label="email address"
                      placeholder="your-email@email.com"
                      onInput={(e) => setEmail(e.target.value)}
                      onenterkey={onEmailLogin}
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
                  <CWButton label="Connect" onClick={onEmailLogin} />
                  </div>
                </div>
              ) : (
                <CWWalletsList
                  useSessionKeyRevalidationFlow={true}
                  onResetWalletConnect={onResetWalletConnect}
                  onWalletAddressSelect={onWalletAddressSelect}
                  onWalletSelect={onWalletSelect}
                  onConnectAnotherWay={() => setConnectWithEmail(true)}
                  onSocialLogin={(provider: WalletSsoSource) => onSocialLogin(provider)}
                  darkMode={false}
                  wallets={wallets}
                  hasNoWalletsLink={false}
                  canResetWalletConnect={wcEnabled}
                />
              )}
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      open={true}
    />
  );
};

export const openSessionRevalidation = ({
  walletName,
  walletAddress,
  walletSsoSource,
  onVerified,
  onClose,
}: SessionRevalidationModalProps) => {
  const id = uuidv4();
  const target = document.createElement('div');
  let root: Root = null;

  target.id = id;

  root = createRoot(target);
  root.render(
    <SessionRevalidationModal
      walletName={walletName}
      walletAddress={walletAddress}
      walletSsoSource={walletSsoSource}
      onVerified={(address: string) => {
        root.unmount();
        target.remove();
        onVerified(address);
      }}
      onClose={() => {
        root.unmount();
        target.remove();
        onClose();
      }}
    />
  );
};
