/* @jsx m */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import $ from 'jquery';

import 'modals/session_signin_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWWalletsList } from '../components/component_kit/cw_wallets_list';

const SessionSigninModal = {
  confirmExit: async () => true,
  view(vnode) {
    const chainbase = app.chain?.meta?.base;
    const wallets = app.wallets.availableWallets(chainbase);

    return (
      <div
        class="SessionSigninModal"
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onmousedown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div class="compact-modal-body">
          <h3>Re-connect wallet</h3>
          <p>Your previous login has expired. Re-connect your wallet to finish what you were doing.</p>
        </div>
        <div class="compact-modal-actions">
          <div>
            <CWWalletsList
              useSessionKeyLoginFlow={true}
              wallets={wallets}
              darkMode={false}
              setSelectedWallet={(wallet) => { /* do nothing */ }}
              accountVerifiedCallback={(account) => {
                $(vnode.dom).trigger('modalcomplete')
                $(vnode.dom).trigger('modalexit')
              }}
              linking={false}
              hideConnectAnotherWayLink={true}
            />
          </div>
        </div>
      </div>
    );
  },
};

export const sessionSigninModal = () => {
  return new Promise((resolve, reject) => {
    app.modals.create({
      modal: SessionSigninModal,
      data: {},
      completeCallback: () => resolve(),
      exitCallback: () => reject(),
    });
  });
};
