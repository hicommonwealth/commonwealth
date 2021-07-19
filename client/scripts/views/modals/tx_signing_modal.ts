import 'modals/tx_signing_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import { EventEmitter } from 'events';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { Button, TextArea, Grid, Col, Spinner } from 'construct-ui';

import app from 'state';
import { link } from 'helpers';
import { ITXModalData, TransactionStatus, ChainBase, IWebWallet, ITXData, ITransactionResult } from 'models';

import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';
import Substrate from 'controllers/chain/substrate/main';
import { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import { ICosmosTXData } from 'controllers/chain/cosmos/chain';

import AddressSwapper from 'views/components/addresses/address_swapper';
import CodeBlock from 'views/components/widgets/code_block';
import HorizontalTabs from 'views/components/widgets/horizontal_tabs';
import { CompactModalExitButton } from 'views/modal';

const createProposalTransactionLabels = {
  // substrate: accounts
  balanceTransfer: 'Transfer balance',
  // substrate: collective
  createCouncilMotion: 'Create council motion',
  voteCouncilMotions: 'Vote on council motion',
  // substrate: elections
  submitCandidacy: 'Submit candidacy',
  setApprovals: 'Set election votes',
  retractVoter: 'Retract election votes',
  presentWinner: 'Present election winner',
  reapInactiveVoter: 'Claim inactive voter bond',
  // substrate: democracy
  createDemocracyProposal: 'Create democracy proposal',
  notePreimage: 'Note preimage',
  noteImminentPreimage: 'Note imminnet preimage',
  secondDemocracyProposal: 'Second democracy proposal',
  submitDemocracyVote: 'Vote on democracy proposal',
  submitProxyDemocracyVote: 'Vote on democracy proposal (proxy)',
  setProxy: 'Set proxy',
  resignProxy: 'Resign proxy',
  removeProxy: 'Remove proxy',
  delegate: 'Set delegate',
  undelegate: 'Remove delegate',
  // edgeware: treasury
  proposeSpend: 'Propose treasury spend',
  contractInteraction: 'Interact with contract',
  // cosmos: accounts
  MsgSend: 'Send balance',
  MsgDelegate: 'Delegate stake',
  MsgUndelegate: 'Undelegate stake',
  MsgRedelegate: 'Redelegate stake',
  // cosmos: governance
  MsgDeposit: 'Increase proposal deposit',
  MsgVote: 'Submit vote',
  MsgSubmitProposal: 'Submit proposal',
};

const getTransactionLabel = (txname) => {
  return createProposalTransactionLabels[txname];
};

//
// shared components
//

const TXSigningTransactionBox: m.Component<{
  success: boolean,
  status: string,
  blockHash: string,
  blockNum: string,
  timestamp: string,
}> = {
  view: (vnode) => {
    return m('.TXSigningTransactionBox', [
      m('.txbox-header', 'Status'),
      m('.txbox-content', {
        class: vnode.attrs.success ? 'txbox-success' : 'txbox-fail'
      }, vnode.attrs.status),
      m('.txbox-header', 'Block Hash'),
      m('.txbox-content', vnode.attrs.blockHash),
      m('.txbox-header', 'Block Number'),
      m('.txbox-content', vnode.attrs.blockNum),
      m('.txbox-header', 'Timestamp'),
      m('.txbox-content', vnode.attrs.timestamp),
    ]);
  }
};

type TxDataState = Partial<ITransactionResult> & { error?: Error, events?: EventEmitter };
type NextFn = (newState: string, newData?: TxDataState) => void;

//
// tx signing options
//

const setupEventListeners = (vnode: m.Vnode<{
  next: NextFn,
} & ITXModalData, { timerHandle?: NodeJS.Timeout } | {}>) => {
  vnode.attrs.txData.events.once(TransactionStatus.Ready.toString(), () => {
    vnode.attrs.next('WaitingToConfirmTransaction', { events: vnode.attrs.txData.events });
  });
  vnode.attrs.txData.events.once(TransactionStatus.Error.toString(), ({ err }) => {
    vnode.attrs.txData.events.removeAllListeners();
    vnode.attrs.next('SentTransactionRejected', {
      error: new Error('Transaction Failed'), hash: null, err,
    });
  });
  vnode.attrs.txData.events.once(TransactionStatus.Failed.toString(), ({ hash, blocknum, err, timestamp }) => {
    // the transaction may be submitted twice, so only go to a
    // failure state if transaction has not already succeeded
    if ((vnode.state as { timerHandle?: NodeJS.Timeout }).timerHandle) {
      clearInterval((vnode.state as { timerHandle?: NodeJS.Timeout }).timerHandle);
    }
    vnode.attrs.txData.events.removeAllListeners();
    vnode.attrs.next('SentTransactionRejected', {
      error: err,
      hash,
      blocknum,
      timestamp
    });
  });
  vnode.attrs.txData.events.once(TransactionStatus.Success.toString(), ({ hash, blocknum, timestamp }) => {
    vnode.attrs.txData.events.removeAllListeners();
    const $modal = $('.TXSigningModal');
    $modal.trigger('modalcomplete');
    vnode.attrs.next('SentTransactionSuccess', { hash, blocknum, timestamp });
  });
};

interface ITXSigningCLIOptionState {
  calldata?: ITXData;
  error?: string;
}

type TXSigningCLIOptionAttrs = ITXModalData & { next: NextFn };
const TXSigningCLIOption: m.Component<TXSigningCLIOptionAttrs, ITXSigningCLIOptionState> = {
  oncreate: async (vnode) => {
    if (vnode.state.calldata === undefined) {
      vnode.state.calldata = await vnode.attrs.txData.unsignedData();
      m.redraw();
    }
  },
  view: (vnode: m.VnodeDOM<TXSigningCLIOptionAttrs, ITXSigningCLIOptionState>) => {
    const transact = (...args) => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact(...args);
    };

    // TODO: this is substrate specific, add a cosmos codepath
    let signBlock = m(CodeBlock, { clickToSelect: true }, [ 'Loading transaction data... ']);
    let instructions;
    let submitAction;
    if (vnode.state.calldata && app.chain && app.chain.base === ChainBase.CosmosSDK) {
      const calldata = vnode.state.calldata as ICosmosTXData;
      instructions = m('.instructions', [
        'Save the transaction\'s JSON data to a file: ',
        m(CodeBlock, { clickToSelect: true }, `echo '${calldata.call}' > tx.json`),
        ' and then sign the transaction, using the appropriate account:'
      ]);
      signBlock = m('.gaiacli-codeblock', [
        m(CodeBlock, { clickToSelect: true }, [
          `gaiacli tx sign \\
  --chain-id=${calldata.chainId} \\
  --account-number=${calldata.accountNumber} \\
  --sequence=${calldata.sequence} \\
  --signature-only --offline \\
  --from=`,
          m('span.no-select', '<key name> <tx.json>'),
        ])
      ]);
      submitAction = m(Button, {
        intent: 'primary',
        type: 'submit',
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          // try {
          const signedBlob = $(vnode.dom).find('textarea.signedtx').val().toString()
            .trim();
          const signature = JSON.parse(signedBlob);
          transact(signature, calldata.gas);
          // } catch (e) {
          //  throw new Error('Failed to execute signed transaction');
          // }
        },
        label: 'Send transaction',
      });
    } else if (vnode.state.calldata && app.chain && app.chain.base === ChainBase.Substrate) {
      const calldata = vnode.state.calldata as ISubstrateTXData;
      instructions = m('.instructions', [
        'Use subkey to sign this transaction:'
      ]);
      signBlock = m(CodeBlock, { clickToSelect: true }, [
        `subkey ${calldata.isEd25519 ? '-e ' : ''}sign-transaction \\
  --call ${calldata.call.slice(2)} \\
  --nonce ${calldata.nonce} \\
  --prior-block-hash ${calldata.blockHash.slice(2)} \\
  --password "" \\
  --suri "`,
        m('span.no-select', 'secret phrase'),
        '"',
      ]);
      submitAction = m(Button, {
        intent: 'primary',
        type: 'submit',
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          try {
            const signedTx = $(vnode.dom).find('textarea.signedtx').val().toString()
              .trim();
            transact(signedTx);
          } catch (err) {
            throw new Error('Failed to execute signed transaction');
          }
        },
        label: 'Send transaction'
      });
    }
    return m('.TXSigningCLIOption', [
      instructions,
      signBlock,
      // action
      m('p', 'Enter the output here:'),
      m(TextArea, {
        class: 'signedtx',
        fluid: true,
        placeholder: app.chain && app.chain.base === ChainBase.CosmosSDK ? 'Signature JSON' : 'Signed TX',
      }),
      vnode.state.error && m('.error-message', vnode.state.error),
      submitAction,
      !submitAction && m('p.transaction-loading', 'Still loading transaction...'),
    ]);
  }
};

const TXSigningWebWalletOption: m.Component<{
  wallet?: IWebWallet<any>,
  next: NextFn,
} & ITXModalData, {}> = {
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
    const foundAuthorInWebWallet = webWallet && !!webWallet.accounts.find((v) => {
      return AddressSwapper({
        address: v.address,
        currentPrefix: (app.chain as Substrate).chain.ss58Format,
      }) === vnode.attrs.author.address;
    });
    return m('.TXSigningSeedOrMnemonicOption', [
      m('div', [
        'Use a ',
        link('a', 'https://polkadot.js.org/extension/', 'polkadot-js', { target: '_blank' }),
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
              : 'Sign and send transaction'
      }),
    ]);
  }
};

type TXSigningSeedOrMnemonicOptionAttrs = ITXModalData & { next: NextFn };
const TXSigningSeedOrMnemonicOption: m.Component<TXSigningSeedOrMnemonicOptionAttrs, {}> = {
  view: (vnode: m.VnodeDOM<TXSigningSeedOrMnemonicOptionAttrs>) => {
    const transact = () => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact();
    };
    return m('.TXSigningSeedOrMnemonicOption', [
      (!vnode.attrs.author.getSeed() && !vnode.attrs.author.getMnemonic()) ? m('form', [
        m('.instructions', 'Enter your key phrase to sign this transaction:'),
        m('.warn', 'This is insecure. Only use key phrases for testnets or throwaway accounts.'),
        m(TextArea, {
          class: 'mnemonic',
          placeholder: 'Key phrase or seed',
          fluid: true,
          oncreate: (vvnode) => $(vvnode.dom).focus()
        }),
        m(Button, {
          intent: 'primary',
          type: 'submit',
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            const newKey = `${$(vnode.dom).find('textarea.mnemonic').val().toString()
              .trim()}`;
            try {
              if (mnemonicValidate(newKey)) {
                vnode.attrs.author.setMnemonic(newKey);
              } else {
                vnode.attrs.author.setSeed(newKey);
              }
              transact();
            } catch (err) {
              throw new Error('Key phrase or seed did not match this account');
            }
          },
          label: 'Send transaction'
        }),
      ]) : [
        m('div', 'This account is already unlocked. Click here to sign the transaction:'),
        m(Button, {
          intent: 'primary',
          type: 'submit',
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            transact();
          },
          oncreate: (vvnode) => $(vvnode.dom).focus(),
          label: 'Send transaction'
        }),
      ],
    ]);
  }
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
  [state: string]: m.Component<ITXSigningModalStateAttrs, ITXSigningModalState>
} = {
  Intro: {
    view: (vnode) => {
      const txLabel = getTransactionLabel(vnode.attrs.txType);
      const polkaWallet = app.wallets.wallets
        .find((w) => w instanceof PolkadotWebWalletController);

      return m('.TXSigningModalBody.Intro', [
        m('.compact-modal-title', [
          m('h3', [
            'Sign transaction',
            (txLabel ? `: ${txLabel}` : '')
          ]),
          m(CompactModalExitButton),
        ]),
        m('.compact-modal-body', [
          m(HorizontalTabs, [{
            name: 'Web wallet',
            content: m(TXSigningWebWalletOption, {
              txData: vnode.attrs.txData,
              txType: vnode.attrs.txType,
              author: vnode.attrs.author,
              next: vnode.attrs.next,
              wallet: polkaWallet,
            }),
            selected: !(vnode.attrs.author.getSeed() || vnode.attrs.author.getMnemonic())
              && polkaWallet
              && polkaWallet.available
              && polkaWallet.enabled
              && polkaWallet.accounts.find((v) => v.address === vnode.attrs.author.address),
          }, {
            name: 'Command line',
            content: m(TXSigningCLIOption, {
              txData: vnode.attrs.txData,
              txType: vnode.attrs.txType,
              author: vnode.attrs.author,
              next: vnode.attrs.next,
            }),
          }, {
            name: 'Key phrase',
            content: m(TXSigningSeedOrMnemonicOption, {
              txData: vnode.attrs.txData,
              txType: vnode.attrs.txType,
              author: vnode.attrs.author,
              next: vnode.attrs.next,
            }),
            // select mnemonic if the account is already unlocked
            selected: app.chain.base === ChainBase.Substrate
              && (vnode.attrs.author.getSeed() || vnode.attrs.author.getMnemonic()),
            disabled: app.chain.base !== ChainBase.Substrate,
          }]),
        ])
      ]);
    }
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
      if (app.chain?.meta?.chain?.id === 'edgeware') {
        vnode.state.timeoutHandle = global.setTimeout(() => {
          clearInterval(vnode.state.timeoutHandle);
          vnode.attrs.next('SentTransactionSuccess', {
            hash: 'Not available'
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
        m('.compact-modal-title', [ m('h3', 'Confirm transaction') ]),
        m('.compact-modal-body', [
          m('.TXSigningBodyText', 'Waiting for your transaction to be confirmed by the network...'),
          m(Spinner, { active: true }),
          m('br'),
          m(Button, {
            intent: 'primary',
            type: 'submit',
            disabled: true,
            fluid: true,
            rounded: true,
            onclick: (e) => (undefined),
            label: `Waiting ${vnode.state.timer || 0}s...`
          }),
        ]),
      ]);
    }
  },
  SentTransactionSuccess: {
    view: (vnode: m.VnodeDOM<ITXSigningModalStateAttrs, ITXSigningModalState>) => {
      return m('.TXSigningModalBody.SentTransactionSuccess', [
        m('.compact-modal-title', [ m('h3', 'Transaction confirmed') ]),
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
            label: 'Done'
          }),
        ]),
      ]);
    }
  },
  SentTransactionRejected: {
    view: (vnode: m.VnodeDOM<ITXSigningModalStateAttrs, ITXSigningModalState>) => {
      return m('.TXSigningModalBody.SentTransactionRejected', [
        m('.compact-modal-title', [ m('h3', 'Transaction rejected') ]),
        m('.compact-modal-body', [
          m(TXSigningTransactionBox, {
            success: false,
            status: vnode.attrs.stateData.error.toString(),
            blockHash: vnode.attrs.stateData.hash ? `${vnode.attrs.stateData.hash}` : '--',
            blockNum: vnode.attrs.stateData.blocknum ? `${vnode.attrs.stateData.blocknum}` : '--',
            timestamp: vnode.attrs.stateData.timestamp ? `${vnode.attrs.stateData.timestamp.format()}` : '--',
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
                label: 'Done'
              }),
            ]),
            m(Col, { span: 6 }, [
              m(Button, {
                intent: 'none',
                fluid: true,
                rounded: true,
                style: 'margin-left: 10px',
                oncreate: (vvnode) => $(vvnode.dom).focus(),
                onclick: (e) => { vnode.attrs.next('Intro'); },
                label: 'Try again'
              }),
            ]),
          ]),
        ]),
      ]);
    }
  },
};

const TXSigningModal: m.Component<ITXModalData, {
  stateName: string
  data: TxDataState,
}> = {
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
          }
        }),
      ])
    ];
  }
};

export const createTXModal = async (dataP: ITXModalData | Promise<ITXModalData>) => {
  const data = await Promise.resolve(dataP);
  if (data) {
    const modalP = new Promise((resolve, reject) => {
      let complete = false;
      app.modals.create({
        modal: TXSigningModal,
        completeCallback: () => { complete = true; },
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

export default TXSigningModal;
