import React, { useState } from 'react';

import { Modal } from '../components/component_kit/cw_modal';
import _ from 'underscore';
import { uuidv4 } from 'lib/util';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import 'modals/session_signin_modal.scss';

import app from 'state';
import useWallets from '../../hooks/useWallets';
import type Account from '../../models/Account';
import WebWalletController from '../../controllers/app/web_wallets';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { notifyError } from 'controllers/app/notifications';
import { loginWithMagicLink } from 'controllers/app/login';

type SessionRevalidationModalProps = {
  onClose: () => void;
  onVerified: (address: string) => void;
};

const SessionRevalidationModal = ({ onVerified, onClose }: SessionRevalidationModalProps) => {
  const [open, setOpen] = useState(true);
  const {
    onWalletAddressSelect,
    onWalletSelect,
    onResetWalletConnect,
  } = useWallets({
    useSessionKeyLoginFlow: true,
    onModalClose: () => {
      // do nothing, let the user close out of session revalidation
    },
    onSuccess: (address: string) => {
      onVerified(address);
    }
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
  const [email, setEmail] = useState();
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const handleSetEmail = (e) => setEmail(e.target.value);
  const onEmailLogin = async () => {
    setIsMagicLoading(true);

    if (!email) {
      notifyError('Please enter a valid email address.');
      setIsMagicLoading(false);
      return;
    }

    try {
      // const newlyVerifiedMagicAddress = await loginWithMagicLink({ email });
      // TODO: call revalidate session directly
      // setIsMagicLoading(false);
      // onVerified(newlyVerifiedMagicAddress);
    } catch (e) {
      notifyError("Couldn't send magic link");
      setIsMagicLoading(false);
      console.error(e);
    }
  }

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
              Your previous login was awhile ago. Re-connect your wallet to
              continue:
            </p>
          </div>
          <div className="compact-modal-actions">
            <div>
          {connectWithEmail ?
            <div>
              {!isMagicLoading ? (
                <CWTextInput
                  autoFocus={true}
                  label="email address"
                  placeholder="your-email@email.com"
                  onInput={handleSetEmail}
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
            :
              <CWWalletsList
                useSessionKeyRevalidationFlow={true}
                onResetWalletConnect={onResetWalletConnect}
                onWalletAddressSelect={onWalletAddressSelect}
                onWalletSelect={onWalletSelect}
                onConnectAnotherWay={() => setConnectWithEmail(true)}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onSocialLogin={() => null}
                darkMode={false}
                wallets={wallets}
                hasNoWalletsLink={false}
                canResetWalletConnect={wcEnabled}
            />}
            </div>
          </div>
        </div>
      }
    onClose={onClose}
    open={open}
      />
  );
};

export const openSessionRevalidation = ({ onVerified, onClose }: SessionRevalidationModalProps) => {
  const id = uuidv4();
  const target = document.createElement('div');
  let root: Root = null;

  target.id = id;

  root = createRoot(target);
  root.render(<SessionRevalidationModal
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
  />);
};
