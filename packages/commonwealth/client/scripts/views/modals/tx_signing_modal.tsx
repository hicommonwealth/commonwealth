/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import { Button, Grid, Col, Spinner } from 'construct-ui';

import 'modals/tx_signing_modal.scss';

import app from 'state';
import { link } from 'helpers';
import { ITXModalData, IWebWallet } from 'models';
import { addressSwapper } from 'commonwealth/shared/utils';
import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';
import Substrate from 'controllers/chain/substrate/main';
import HorizontalTabs from 'views/components/widgets/horizontal_tabs';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { TXSigningTransactionBox } from '../components/tx_signing/tx_signing_transaction_box';
import {
  getTransactionLabel,
  setupEventListeners,
} from '../components/tx_signing/helpers';
import { NextFn, TxDataState } from '../components/tx_signing/types';
import { TXSigningCLIOption } from '../components/tx_signing/tx_signing_cli_option';
// import { getClasses } from '../components/component_kit/helpers';

const TXSigningWebWalletOption: m.Component<
  {
    wallet?: IWebWallet<any>;
    next: NextFn;
  } & ITXModalData,
  {}
> = {
  oncreate: (vnode) => {
    // try to enable web wallet
    if (vnode.attrs.wallet && !vnode.attrs.wallet.enabled) {
      vnode.attrs.wallet.enable().then(() => m.redraw());
    }
  },
  view: (vnode) => {
    const webWallet = vnode.attrs.wallet as PolkadotWebWalletController;
    const transact = async () => {
      const acct = vnode.attrs.author;
      try {
        if (!webWallet.enabling && !webWallet.enabled) {
          await webWallet.enable();
        }
        const signer = await webWallet.getSigner(acct.address);
        setupEventListeners(vnode);
        vnode.attrs.txData.transact(acct.address, signer);
      } catch (e) {
        console.error(e);
      }
    };
    const foundAuthorInWebWallet =
      webWallet &&
      !!webWallet.accounts.find((v) => {
        return (
          addressSwapper({
            address: v.address,
            currentPrefix: (app.chain as Substrate).chain.ss58Format,
          }) === vnode.attrs.author.address
        );
      });
    return m('.TXSigningWebWalletOption', [
      m('div', [
        'Use a ',
        link('a', 'https://polkadot.js.org/extension/', 'polkadot-js', {
          target: '_blank',
        }),
        ' compatible wallet to sign the transaction:',
      ]),
      m(Button, {
        type: 'submit',
        intent: 'primary',
        rounded: true,
        disabled: !webWallet || (webWallet?.enabled && !foundAuthorInWebWallet),
        onclick: async (e) => {
          if (webWallet && !webWallet.available) {
            await vnode.attrs.wallet.enable();
            m.redraw();
          }
          await transact();
        },
        oncreate: (vvnode) => $(vvnode.dom).focus(),
        label: !webWallet
          ? 'No extension detected'
          : !webWallet.enabled
          ? 'Connect to extension'
          : !foundAuthorInWebWallet
          ? 'Current address not in wallet'
          : 'Sign and send transaction',
      }),
    ]);
  },
};

interface ITXSigningModalStateAttrs extends ITXModalData {
  stateName: string;
  stateData: TxDataState;
  next: NextFn;
}

interface ITXSigningModalState {
  timer?: number;
  timerHandle?: NodeJS.Timeout;
  timeoutHandle?: NodeJS.Timeout;
}

const TXSigningModalStates: {
  [state: string]: m.Component<ITXSigningModalStateAttrs, ITXSigningModalState>;
} = {
  Intro: {
    view: (vnode) => {
      const txLabel = getTransactionLabel(vnode.attrs.txType);
      const polkaWallet = app.wallets.wallets.find(
        (w) => w instanceof PolkadotWebWalletController
      );

      return m('.TXSigningModalBody.Intro', [
        m('.compact-modal-title', [
          m('h3', ['Sign transaction', txLabel ? `: ${txLabel}` : '']),
          m(ModalExitButton),
        ]),
        m('.compact-modal-body', [
          m(HorizontalTabs, [
            {
              name: 'Web wallet',
              content: m(TXSigningWebWalletOption, {
                txData: vnode.attrs.txData,
                txType: vnode.attrs.txType,
                author: vnode.attrs.author,
                next: vnode.attrs.next,
                wallet: polkaWallet,
              }),
              selected:
                polkaWallet &&
                polkaWallet.available &&
                polkaWallet.enabled &&
                polkaWallet.accounts.find(
                  (v) => v.address === vnode.attrs.author.address
                ),
            },
            {
              name: 'Command line',
              content: m(TXSigningCLIOption, {
                txData: vnode.attrs.txData,
                txType: vnode.attrs.txType,
                author: vnode.attrs.author,
                next: vnode.attrs.next,
              }),
            },
          ]),
        ]),
      ]);
    },
  },
  WaitingToConfirmTransaction: {
    oncreate: (vnode) => {
      const $parent = $('.TXSigningModal');

      vnode.state.timer = 0;
      // TODO: set a timeout? We currently have no failure case due to how event handling works.
      vnode.state.timerHandle = global.setInterval(() => {
        vnode.state.timer++;
        m.redraw();
      }, 1000);
      // for edgeware mainnet, timeout after 10 sec
      // TODO: remove this after the runtime upgrade to Substrate 2.0 rc3+
      if (app.chain?.meta?.id === 'edgeware') {
        vnode.state.timeoutHandle = global.setTimeout(() => {
          clearInterval(vnode.state.timeoutHandle);
          vnode.attrs.next('SentTransactionSuccess', {
            hash: 'Not available',
          });
          $parent.trigger('modalcomplete');
        }, 10000);
      }
    },
    onremove: (vnode) => {
      if (vnode.state.timerHandle) {
        clearInterval(vnode.state.timerHandle);
      }
    },
    view: (vnode) => {
      return m('.TXSigningModalBody.WaitingToConfirmTransaction', [
        m('.compact-modal-title', [m('h3', 'Confirm transaction')]),
        m('.compact-modal-body', [
          m(
            '.TXSigningBodyText',
            'Waiting for your transaction to be confirmed by the network...'
          ),
          m(Spinner, { active: true }),
          m('br'),
          m(Button, {
            intent: 'primary',
            type: 'submit',
            disabled: true,
            fluid: true,
            rounded: true,
            onclick: (e) => undefined,
            label: `Waiting ${vnode.state.timer || 0}s...`,
          }),
        ]),
      ]);
    },
  },
  SentTransactionSuccess: {
    view: (
      vnode: m.VnodeDOM<ITXSigningModalStateAttrs, ITXSigningModalState>
    ) => {
      return m('.TXSigningModalBody.SentTransactionSuccess', [
        m('.compact-modal-title', [m('h3', 'Transaction confirmed')]),
        m('.compact-modal-body', [
          m(TXSigningTransactionBox, {
            success: true,
            status: 'Success',
            blockHash: `${vnode.attrs.stateData.hash}`,
            blockNum: `${vnode.attrs.stateData.blocknum || '--'}`,
            timestamp: vnode.attrs.stateData.timestamp?.format
              ? `${vnode.attrs.stateData.timestamp.format()}`
              : '--',
          }),
          m(Button, {
            intent: 'primary',
            type: 'submit',
            fluid: true,
            rounded: true,
            oncreate: (vvnode) => $(vvnode.dom).focus(),
            onclick: (e) => {
              e.preventDefault();
              $(vnode.dom).trigger('modalexit');
            },
            label: 'Done',
          }),
        ]),
      ]);
    },
  },
  SentTransactionRejected: {
    view: (
      vnode: m.VnodeDOM<ITXSigningModalStateAttrs, ITXSigningModalState>
    ) => {
      return m('.TXSigningModalBody.SentTransactionRejected', [
        m('.compact-modal-title', [m('h3', 'Transaction rejected')]),
        m('.compact-modal-body', [
          m(TXSigningTransactionBox, {
            success: false,
            status: vnode.attrs.stateData.error.toString(),
            blockHash: vnode.attrs.stateData.hash
              ? `${vnode.attrs.stateData.hash}`
              : '--',
            blockNum: vnode.attrs.stateData.blocknum
              ? `${vnode.attrs.stateData.blocknum}`
              : '--',
            timestamp: vnode.attrs.stateData.timestamp
              ? `${vnode.attrs.stateData.timestamp.format()}`
              : '--',
          }),
          m(Grid, [
            m(Col, { span: 6 }, [
              m(Button, {
                intent: 'primary',
                type: 'submit',
                style: 'margin-right: 10px',
                fluid: true,
                rounded: true,
                onclick: (e) => {
                  e.preventDefault();
                  $(vnode.dom).trigger('modalexit');
                },
                label: 'Done',
              }),
            ]),
            m(Col, { span: 6 }, [
              m(Button, {
                intent: 'none',
                fluid: true,
                rounded: true,
                style: 'margin-left: 10px',
                oncreate: (vvnode) => $(vvnode.dom).focus(),
                onclick: (e) => {
                  vnode.attrs.next('Intro');
                },
                label: 'Try again',
              }),
            ]),
          ]),
        ]),
      ]);
    },
  },
};

const TXSigningModal: m.Component<
  ITXModalData,
  {
    stateName: string;
    data: TxDataState;
  }
> = {
  view: (vnode) => {
    const DEFAULT_STATE = 'Intro';
    return [
      m('.TXSigningModal', [
        m(TXSigningModalStates[vnode.state.stateName || DEFAULT_STATE], {
          // pass transaction down to each step's view
          author: vnode.attrs.author,
          txType: vnode.attrs.txType,
          txData: vnode.attrs.txData,
          // pass transaction signing state down to each step's view
          stateName: vnode.state.stateName,
          stateData: vnode.state.data,
          // handle state transitions
          next: (newState, newData) => {
            vnode.state.stateName = newState;
            vnode.state.data = newData;
            m.redraw();
          },
        }),
      ]),
    ];
  },
};

export const createTXModal = async (
  dataP: ITXModalData | Promise<ITXModalData>
) => {
  const data = await Promise.resolve(dataP);
  if (data) {
    const modalP = new Promise((resolve, reject) => {
      let complete = false;
      app.modals.create({
        modal: TXSigningModal,
        completeCallback: () => {
          complete = true;
        },
        exitCallback: () => {
          if (data.cb) {
            data.cb(complete);
          }
          return complete ? resolve(data) : reject(data);
        },
        data,
      });
      m.redraw();
    });
    return modalP;
  }
};
