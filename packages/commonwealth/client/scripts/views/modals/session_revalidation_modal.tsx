import React, { useState } from 'react';

import { Modal } from '../components/component_kit/cw_modal';
import _ from 'underscore';
import { uuidv4 } from 'lib/util';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import 'modals/session_signin_modal.scss';

import app from 'state';
import type Account from '../../models/Account';
import WebWalletController from '../../controllers/app/web_wallets';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import useWallets from '../../hooks/useWallets';

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
              <CWWalletsList
                    useSessionKeyRevalidationFlow={true}
                onResetWalletConnect={onResetWalletConnect}
                onWalletAddressSelect={onWalletAddressSelect}
                onWalletSelect={onWalletSelect}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onConnectAnotherWay={() => {}}
                darkMode={false}
                wallets={wallets}
                hasNoWalletsLink={false}
                canResetWalletConnect={wcEnabled}
              />
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
