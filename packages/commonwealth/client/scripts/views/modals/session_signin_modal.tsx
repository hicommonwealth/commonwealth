import React from 'react';
import $ from 'jquery';
import _ from 'underscore';

import 'modals/session_signin_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';

type SessionSigninModalProps = {
  onModalClose: () => void;
};

export const SessionSigninModal = (props: SessionSigninModalProps) => {
  const { onModalClose } = props;

  const chainbase = app.chain?.meta?.base;
  const wallets = app.wallets.availableWallets(chainbase);

  const wcEnabled = _.any(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled
  );

  return (
    <div
      className="SessionSigninModal"
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
            onResetWalletConnect={() => {}}
            onWalletAddressSelect={async () => {}}
            onWalletSelect={async () => {}}
            onConnectAnotherWay={() => {}}
            // useSessionKeyLoginFlow={true}
            wallets={wallets}
            darkMode={false}
            // setSelectedWallet={(wallet) => {
            //   /* do nothing */
            // }}
            // onAccountVerified={() => onModalClose()}
            // linking={false}
            hasNoWalletsLink={false}
            canResetWalletConnect={wcEnabled}
          />
        </div>
      </div>
    </div>
  );
};

/* TODO: uncomment when shipping
export const sessionSigninModal = () => {
  return new Promise<void>((resolve, reject) => {
    app.modals.create({
      modal: SessionSigninModal,
      data: {},
      completeCallback: () => resolve(),
      exitCallback: () => reject(new Error('Invalid signature')),
    });
  });
};
*/
