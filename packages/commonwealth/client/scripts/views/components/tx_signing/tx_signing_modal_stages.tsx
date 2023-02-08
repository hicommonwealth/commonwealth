import React from 'react';

import $ from 'jquery';
import type { ITXModalData, IWebWallet } from 'models';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

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

export class TxSigningModalIntroStage extends ClassComponent<TxSigningModalIntroStageAttrs> {
  private introTab: 'webWallet' | 'commandLine';

  oninit() {
    this.introTab = 'webWallet';
  }

  view(vnode: ResultNode<TxSigningModalIntroStageAttrs>) {
    const { author, next, polkaWallet, txData, txType } = vnode.attrs;

    return (
      <React.Fragment>
        <CWTabBar>
          <CWTab
            label="Web wallet"
            isSelected={this.introTab === 'webWallet'}
            onClick={() => {
              this.introTab = 'webWallet';
            }}
          />
          <CWTab
            label="Command line"
            isSelected={this.introTab === 'commandLine'}
            onClick={() => {
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
      </React.Fragment>
    );
  }
}

export class TxSigningModalWaitingStage extends ClassComponent<NextFn> {
  private timeoutHandle?: NodeJS.Timeout;
  private timer?: number;
  private timerHandle?: NodeJS.Timeout;

  oncreate(vnode: ResultNode<NextFn>) {
    const $parent = $('.TXSigningModal');

    this.timer = 0;

    // TODO: set a timeout? We currently have no failure case due to how event handling works.
    this.timerHandle = global.setInterval(() => {
      this.timer++;
      redraw();
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
      <React.Fragment>
        <CWText>
          Waiting for your transaction to be confirmed by the network...
        </CWText>
        <CWSpinner />
        <CWText>`Waiting ${this.timer || 0}s...</CWText>
      </React.Fragment>
    );
  }
}

export class TxSigningModalSuccessStage extends ClassComponent<TxDataState> {
  view(vnode: ResultNode<TxDataState>) {
    const { blocknum, hash, timestamp } = vnode.attrs;

    return (
      <React.Fragment>
        <TXSigningTransactionBox
          success
          status="Success"
          blockHash={hash}
          blockNum={blocknum || '--'}
          timestamp={timestamp ? timestamp.format() : '--'}
        />
        <CWButton
          onClick={(e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
          }}
          label="Done"
        />
      </React.Fragment>
    );
  }
}

type TxSigningModalRejectedStageAttrs = TxDataState & NextFn;

export class TxSigningModalRejectedStage extends ClassComponent<TxSigningModalRejectedStageAttrs> {
  view(vnode: ResultNode<TxSigningModalRejectedStageAttrs>) {
    const { blocknum, error, hash, timestamp, next } = vnode.attrs;

    return (
      <React.Fragment>
        <TXSigningTransactionBox
          success={false}
          status={error.toString()}
          blockHash={hash || '--'}
          blockNum={blocknum || '--'}
          timestamp={timestamp ? timestamp.format() : '--'}
        />
        <div className="buttons-row">
          <CWButton
            onClick={(e) => {
              e.preventDefault();
              $(vnode.dom).trigger('modalexit');
            }}
            label="Done"
          />
          <CWButton
            onClick={() => {
              next('intro');
            }}
            label="Try again"
          />
        </div>
      </React.Fragment>
    );
  }
}
