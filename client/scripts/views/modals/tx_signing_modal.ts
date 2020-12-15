import 'modals/tx_signing_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { Button, TextArea, Grid, Col } from 'construct-ui';

import app from 'state';
import { formatAsTitleCase, link } from 'helpers';
import { ITXModalData, ITransactionResult, TransactionStatus, ChainBase } from 'models';

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
  // edgeware: signaling
  createSignalingProposal: 'Create signaling proposal',
  advanceSignalingProposal: 'Start/finish polling',
  submitSignalingVote: 'Vote in signaling proposal',
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

const TXSigningTransactionBox = {
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

//
// tx signing options
//

const TXSigningCLIOption = {
  oncreate: async (vnode) => {
    if (vnode.state.calldata === undefined) {
      vnode.state.calldata = await vnode.attrs.txData.unsignedData();
      m.redraw();
    }
  },
  view: (vnode) => {
    const transact = (...args) => {
      const obs = vnode.attrs.txData.transact(...args);
      obs.subscribe((txData: ITransactionResult) => {
        if (txData.status === TransactionStatus.Ready) {
          vnode.attrs.next('WaitingToConfirmTransaction', { obs });
        } else {
          vnode.attrs.next('SentTransactionRejected', {
            error: new Error('Transaction Failed'), hash: null, err: txData.err
          });
        }
      });
    };

    // TODO: this is substrate specific, add a cosmos codepath
    let signBlock = m(CodeBlock, { clickToSelect: true }, [ 'Loading transaction data... ']);
    let instructions;
    let submitAction;
    if (vnode.state.calldata && app.chain && app.chain.base === ChainBase.CosmosSDK) {
      const calldata: ICosmosTXData = vnode.state.calldata;
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

const TXSigningWebWalletOption = {
  oncreate: (vnode) => {
    // try to enable web wallet
    if ((app.chain as Substrate).webWallet && !(app.chain as Substrate).webWallet.enabled) {
      (app.chain as Substrate).webWallet.enable().then(() => m.redraw());
    }
  },
  view: (vnode) => {
    const transact = async () => {
      const acct = vnode.attrs.author;
      try {
        const signer = await (app.chain as Substrate).webWallet.getSigner(acct.address);
        const obs = vnode.attrs.txData.transact(acct.address, signer);
        obs.subscribe((txData: ITransactionResult) => {
          if (txData.status === TransactionStatus.Ready) {
            vnode.attrs.next('WaitingToConfirmTransaction', { obs });
          } else {
            vnode.attrs.next('SentTransactionRejected', { hash: null, error: txData.err });
          }
        });
      } catch (e) { console.log(e); }
    };
    const isWebWalletAvailable = (app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available;
    const isWebWalletEnabled = (app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.enabled;
    const isAuthorInWebWallet = (app.chain as Substrate).webWallet
      && !!(app.chain as Substrate).webWallet.accounts.find((v) => {
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
        disabled: !isWebWalletEnabled || !isAuthorInWebWallet,
        onclick: async (e) => { await transact(); },
        oncreate: (vvnode) => $(vvnode.dom).focus(),
        label: !isWebWalletAvailable
          ? 'No extension detected'
          : !isWebWalletEnabled
            ? 'Connect to extension'
            : !isAuthorInWebWallet
              ? 'Current address not in wallet'
              : 'Sign and send transaction'
      }),
    ]);
  }
};

const TXSigningSeedOrMnemonicOption = {
  view: (vnode) => {
    const transact = () => {
      const obs = vnode.attrs.txData.transact();
      obs.subscribe((txData: ITransactionResult) => {
        if (txData.status === TransactionStatus.Ready) {
          vnode.attrs.next('WaitingToConfirmTransaction', { obs });
        } else {
          vnode.attrs.next('SentTransactionRejected', { error: txData.err, hash: null });
        }
      });
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

const TXSigningModalStates = {
  Intro: {
    view: (vnode) => {
      const txLabel = getTransactionLabel(vnode.attrs.txType);

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
              author: vnode.attrs.author,
              next: vnode.attrs.next,
            }),
            selected: app.chain.base === ChainBase.Substrate
              && !(vnode.attrs.author.getSeed() || vnode.attrs.author.getMnemonic())
              && (app.chain as Substrate).webWallet
              && (app.chain as Substrate).webWallet.available
              && (app.chain as Substrate).webWallet.enabled
              && (app.chain as Substrate).webWallet.accounts.find((v) => v.address === vnode.attrs.author.address),
            disabled: app.chain.base !== ChainBase.Substrate,
          }, {
            name: 'Command line',
            content: m(TXSigningCLIOption, {
              txData: vnode.attrs.txData,
              author: vnode.attrs.author,
              next: vnode.attrs.next,
            }),
          }, {
            name: 'Key phrase',
            content: m(TXSigningSeedOrMnemonicOption, {
              txData: vnode.attrs.txData,
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
      const $parent = $(vnode.dom).closest('.TXSigningModal');

      vnode.state.timer = 0;
      // TODO: set a timeout? We currently have no failure case due to how event handling works.
      vnode.state.timerHandle = setInterval(() => {
        vnode.state.timer++;
        m.redraw();
      }, 1000);
      // for edgeware mainnet, timeout after 10 sec
      // TODO: remove this after the runtime upgrade to Substrate 2.0 rc3+
      if (app.chain?.meta?.chain?.id === 'edgeware') {
        vnode.state.timeoutHandle = setTimeout(() => {
          clearInterval(vnode.state.timeoutHandle);
          vnode.attrs.next('SentTransactionSuccess', {
            hash: 'Not available (this chain is using an out of date API)',
            blocknum: '--',
            timestamp: '--',
          });
          $parent.trigger('modalcomplete');
        }, 10000);
      }

      vnode.attrs.stateData.obs.subscribe((data: ITransactionResult) => {
        if (data.status === TransactionStatus.Success) {
          vnode.attrs.next('SentTransactionSuccess', {
            hash: data.hash,
            blocknum: data.blocknum,
            timestamp: data.timestamp
          });
          $parent.trigger('modalcomplete');
        }
        // the transaction may be submitted twice, so only go to a
        // failure state if transaction has not already succeeded
        if (vnode.state.stateName !== 'SentTransactionRejected'
            && (data.status === TransactionStatus.Failed || data.status === TransactionStatus.Error)) {
          if (vnode.state.timerHandle) {
            clearInterval(vnode.state.timerHandle);
          }
          vnode.attrs.next('SentTransactionRejected', {
            error: data.err,
            hash: data.hash,
            blocknum: data.blocknum,
            timestamp: data.timestamp
          });
        }
      });
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
          m('span.icon-spinner2.animate-spin'),
          m('br'),
          m(Button, {
            intent: 'primary',
            type: 'submit',
            disabled: true,
            fluid: true,
            onclick: (e) => (undefined),
            label: `Waiting ${vnode.state.timer || 0}s...`
          }),
        ]),
      ]);
    }
  },
  SentTransactionSuccess: {
    view: (vnode) => {
      return m('.TXSigningModalBody.SentTransactionSuccess', [
        m('.compact-modal-title', [ m('h3', 'Transaction confirmed') ]),
        m('.compact-modal-body', [
          m(TXSigningTransactionBox, {
            success: true,
            status: 'Success',
            blockHash: `${vnode.attrs.stateData.hash}`,
            blockNum: `${vnode.attrs.stateData.blocknum}`,
            timestamp: vnode.attrs.stateData.timestamp?.format
              ? `${vnode.attrs.stateData.timestamp.format()}`
              : '--',
          }),
          m(Button, {
            intent: 'primary',
            type: 'submit',
            fluid: true,
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
    view: (vnode) => {
      return m('.TXSigningModalBody.SentTransactionRejected', [
        m('.compact-modal-title', [ m('h3', 'Transaction rejected') ]),
        m('.compact-modal-body', [
          m(TXSigningTransactionBox, {
            success: false,
            status: vnode.attrs.stateData.error,
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

const TXSigningModal = {
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
