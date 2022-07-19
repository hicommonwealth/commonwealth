/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import { Button, TextArea } from 'construct-ui';

import 'components/tx_signing/tx_signing_cli_option.scss';

import app from 'state';
import { ChainBase } from 'types';
import { ITXModalData, ITXData } from 'models';
import { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import { CodeBlock } from 'views/components/code_block';
import { NextFn } from './types';
import { setupEventListeners } from './helpers';
import { CWValidationText } from '../component_kit/cw_validation_text';

type TXSigningCLIOptionAttrs = ITXModalData & { next: NextFn };

export class TXSigningCLIOption
  implements m.ClassComponent<TXSigningCLIOptionAttrs>
{
  calldata?: ITXData;
  error?: string;

  async oncreate(vnode) {
    if (this.calldata === undefined) {
      this.calldata = await vnode.attrs.txData.unsignedData();
      m.redraw();
    }
  }

  view(vnode) {
    const transact = (...args) => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact(...args);
    };

    let signBlock = m(CodeBlock, { clickToSelect: true }, [
      'Loading transaction data... ',
    ]);

    let instructions;

    let submitAction;

    if (this.calldata && app.chain && app.chain.base === ChainBase.Substrate) {
      const calldata = this.calldata as ISubstrateTXData;

      instructions = m('.instructions', [
        'Use subkey to sign this transaction:',
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
            const signedTx = $(vnode.dom)
              .find('textarea.signedtx')
              .val()
              .toString()
              .trim();
            transact(signedTx);
          } catch (err) {
            throw new Error('Failed to execute signed transaction');
          }
        },
        label: 'Send transaction',
      });
    }

    return m('.TXSigningCLIOption', [
      instructions,
      signBlock,
      m('p', 'Enter the output here:'),
      m(TextArea, {
        class: 'signedtx',
        fluid: true,
        placeholder: 'Signed TX',
      }),
      this.error &&
        m(CWValidationText, {
          message: this.error,
          status: 'failure',
        }),
      submitAction,
      !submitAction &&
        m('p.transaction-loading', 'Still loading transaction...'),
    ]);
  }
}
