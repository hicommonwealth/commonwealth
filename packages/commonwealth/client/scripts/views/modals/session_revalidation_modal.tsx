import React, { useState, useEffect } from 'react';
import { WalletSsoSource } from 'common-common/src/types';

import { Modal } from '../components/component_kit/cw_modal';
import _ from 'underscore';
import { uuidv4 } from 'lib/util';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import 'modals/session_revalidation_modal.scss';

import app from 'state';
import useWallets from '../../hooks/useWallets';
import WebWalletController from '../../controllers/app/web_wallets';
import { CWAuthButton } from '../components/component_kit/cw_auth_button';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import { CWTooltip } from '../components/component_kit/cw_popover/cw_tooltip';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { formatAddress } from '../components/user/user_block';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';

import { UserBlock } from '../components/user/user_block';
import { isSameAccount } from 'helpers';
import { setActiveAccount } from 'controllers/app/login';
import { notifySuccess } from 'controllers/app/notifications';

type SessionRevalidationModalProps = {
  walletName: string;
  walletAddress: string;
  walletSsoSource: WalletSsoSource;
  canvasChainId: string;
  onClose: () => void;
  onVerified: (address: string | undefined) => void;
};

const SessionRevalidationModal = ({
  walletName,
  walletAddress,
  walletSsoSource,
  canvasChainId,
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
    isMagicLoading,
  } = useWallets({
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

  // modal state
  const [loginAgain, setLoginAgain] = useState(false);
  const [selectNewAccount, setSelectNewAccount] = useState(false);
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
          {loginAgain && (
            <>
              <div className="compact-modal-body">
                <CWText type="h4">Proceed with current address</CWText>
                <CWText>
                  To renew your session for the address{' '}
                  <strong>{formatAddress(walletAddress)}</strong>, log in with{' '}
                  {walletSsoSource &&
                  walletSsoSource !== WalletSsoSource.Unknown
                    ? walletSsoSource
                    : 'the wallet that you used'}{' '}
                  again:
                </CWText>
              </div>
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
                    onSocialLogin={(provider: WalletSsoSource) =>
                      onSocialLogin(provider)
                    }
                    darkMode={false}
                    wallets={wallets}
                    hasNoWalletsLink={false}
                    canResetWalletConnect={wcEnabled}
                    hideSocialLogins={true}
                  />
                )}
              </div>
              <div className="compact-modal-actions">
                <CWButton
                  label="Go back"
                  buttonType="secondary-black"
                  onClick={() => setLoginAgain(false)}
                />
              </div>
            </>
          )}
          {selectNewAccount && (
            <>
              <div className="compact-modal-body">
                <CWText type="h4">
                  Switch address or proceed with current address
                </CWText>
              </div>
              <div className="compact-modal-actions">
                <CWButton
                  label="Continue"
                  buttonType="primary-black"
                  onClick={() => null}
                />
                <CWButton
                  label="Go back"
                  buttonType="secondary-black"
                  onClick={() => setSelectNewAccount(false)}
                />
              </div>
            </>
          )}
          {!loginAgain && !selectNewAccount && (
            <>
              <div className="compact-modal-body">
                <CWText type="h4">
                  Switch address or proceed with current address
                </CWText>
                <CWText>
                  Oops! It looks like the session for your current address has
                  expired. Just a fancy way of saying you may need to log in again.
                </CWText>
                <CWText>
                  To create threads, comment, or upvote, you will need access to
                  the original wallet or login method you used for{' '}
                  <strong>{formatAddress(walletAddress)}</strong>. Or, you can
                  switch to another recently used address if you have one.
                </CWText>
                <CWText>
                  Either way, your Common display name will remain the same.
                </CWText>
              </div>
              <div className="compact-modal-actions">
                <CWButton
                  label="Proceed with current address"
                  buttonType="primary-black"
                  onClick={() => setLoginAgain(true)}
                />
                <CWTooltip
                  placement="bottom-end"
                  content={
                    <div className="SessionRevalidationAddressSelector">
                      {app.user.activeAccounts.map((account, index) => (
                        <SessionRevalidationAddress
                          key={index}
                          account={account}
                          canvasChainId={canvasChainId}
                          onClose={onClose}
                        />
                      ))}
                    </div>
                  }
                  renderTrigger={(handleInteraction) => (
                    <CWButton
                      label="Switch address"
                      buttonType="secondary-black"
                      onClick={handleInteraction}
                    />
                  )}
                />
              </div>
            </>
          )}
        </div>
      }
      onClose={onClose}
      open={true}
    />
  );
};

const SessionRevalidationAddress = ({ account, onClose, canvasChainId }) => {
  const [skUnavailable, setSkUnavailable] = useState<boolean>();

  useEffect(() => {
    if (isSameAccount(account, app.user.activeAccount)) {
      setSkUnavailable(true);
      return;
    }
    app.sessions
      .getSessionController(app.chain.base)
      .hasAuthenticatedSession(canvasChainId, account.address)
      .then((result) => setSkUnavailable(!result));
  }, [app.chain.base]);

  return (
    <div
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveAccount(account);
        notifySuccess('Address switched');
        onClose();
      }}
      className={
        skUnavailable ? 'revalidate-address-unavailable' : 'revalidate-address'
      }
    >
      <UserBlock
        user={account}
        showRole={false}
        compact
        hideAvatar
        selected={false}
      />
      {skUnavailable ? '(login expired)' : ''}
    </div>
  );
};

export const openSessionRevalidation = ({
  walletName,
  walletAddress,
  walletSsoSource,
  canvasChainId,
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
      canvasChainId={canvasChainId}
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
