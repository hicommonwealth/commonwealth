/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import m from 'mithril';
import type { ITXModalData, IWebWallet } from 'models';

import app from 'state';
import { CWButton } from '../component_kit/cw_button';
import { CWSpinner } from '../component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import { CWText } from '../component_kit/cw_text';
import { TXSigningCLIOption } from './tx_signing_cli_option';
import { TXSigningTransactionBox } from './tx_signing_transaction_box';
import { TXSigningWebWalletOption } from './tx_signing_web_wallet_option';
import type { NextFn, TxDataState } from './types';

type TxSigningModalIntroStageAttrs = ITXModalData &
  NextFn & {
    polkaWallet: IWebWallet<any>;
  };

export class TxSigningModalIntroStage extends ClassComponent<
  TxSigningModalIntroStageAttrs
> {
  private introTab: 'webWallet' | 'commandLine';

  oninit() {
    this.introTab = 'webWallet';
  }

  view(vnode: m.Vnode<TxSigningModalIntroStageAttrs>) {
    const { author, next, polkaWallet, txData, txType } = vnode.attrs;

    return (
      <>
        <CWTabBar>
          <CWTab
            label="Web wallet"
            isSelected={this.introTab === 'webWallet'}
            onclick={() => {
              this.introTab = 'webWallet';
            }}
          />
          <CWTab
            label="Command line"
            isSelected={this.introTab === 'commandLine'}
            onclick={() => {
              this.introTab = 'commandLine';
            }}
          />
        </CWTabBar>
        {this.introTab === 'webWallet' && (
          <TXSigningWebWalletOption
            txData={txData}
            txType={txType}
            author={author}
            next={next}
            wallet={polkaWallet}
          />
        )}
        {this.introTab === 'commandLine' && (
          <TXSigningCLIOption
            txData={txData}
            txType={txType}
            author={author}
            next={next}
          />
        )}
      </>
    );
  }
}

export class TxSigningModalWaitingStage extends ClassComponent<NextFn> {
  private timeoutHandle?: NodeJS.Timeout;
  private timer?: number;
  private timerHandle?: NodeJS.Timeout;

  oncreate(vnode: m.Vnode<NextFn>) {
    const $parent = $('.TXSigningModal');

    this.timer = 0;

    // TODO: set a timeout? We currently have no failure case due to how event handling works.
    this.timerHandle = global.setInterval(() => {
      this.timer++;
      m.redraw();
    }, 1000);

    // for edgeware mainnet, timeout after 10 sec
    // TODO: remove this after the runtime upgrade to Substrate 2.0 rc3+
    if (app.chain?.meta?.id === 'edgeware') {
      this.timeoutHandle = global.setTimeout(() => {
        clearInterval(this.timeoutHandle);

        vnode.attrs.next('success', {
          hash: 'Not available',
        });

        $parent.trigger('modalcomplete');
      }, 10000);
    }
  }

  onremove() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }
  }

  view() {
    return (
      <>
        <CWText>
          Waiting for your transaction to be confirmed by the network...
        </CWText>
        <CWSpinner />
        <CWText>`Waiting ${this.timer || 0}s...</CWText>
      </>
    );
  }
}

export class TxSigningModalSuccessStage extends ClassComponent<TxDataState> {
  view(vnode: m.VnodeDOM<TxDataState, this>) {
    const { blocknum, hash, timestamp } = vnode.attrs;

    return (
      <>
        <TXSigningTransactionBox
          success
          status="Success"
          blockHash={hash}
          blockNum={blocknum || '--'}
          timestamp={timestamp ? timestamp.format() : '--'}
        />
        <CWButton
          onclick={(e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
          }}
          label="Done"
        />
      </>
    );
  }
}

type TxSigningModalRejectedStageAttrs = TxDataState & NextFn;

export class TxSigningModalRejectedStage extends ClassComponent<
  TxSigningModalRejectedStageAttrs
> {
  view(vnode: m.VnodeDOM<TxSigningModalRejectedStageAttrs>) {
    const { blocknum, error, hash, timestamp, next } = vnode.attrs;

    return (
      <>
        <TXSigningTransactionBox
          success={false}
          status={error.toString()}
          blockHash={hash || '--'}
          blockNum={blocknum || '--'}
          timestamp={timestamp ? timestamp.format() : '--'}
        />
        <div class="buttons-row">
          <CWButton
            onclick={(e) => {
              e.preventDefault();
              $(vnode.dom).trigger('modalexit');
            }}
            label="Done"
          />
          <CWButton
            onclick={() => {
              next('intro');
            }}
            label="Try again"
          />
        </div>
      </>
    );
  }
}
