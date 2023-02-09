import React from 'react';

import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';

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

import 'modals/tx_signing_modal.scss';
import type { ITXModalData } from 'models/interfaces';

import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import {
  getModalTitle,
  getTransactionLabel,
} from '../components/tx_signing/helpers';
import {
  TxSigningModalIntroStage,
  TxSigningModalRejectedStage,
  TxSigningModalSuccessStage,
  TxSigningModalWaitingStage,
} from '../components/tx_signing/tx_signing_modal_stages';
import type { StageName, TxDataState } from '../components/tx_signing/types';

class TXSigningModal extends ClassComponent<ITXModalData> {
  private data: TxDataState;
  private stageName: StageName;

  oninit() {
    this.stageName = 'intro';
  }

  view(vnode: ResultNode<ITXModalData>) {
    const { author, txData, txType } = vnode.attrs;

    const txLabel = getTransactionLabel(txType);

    const polkaWallet = app.wallets.wallets.find(
      (w) => w instanceof PolkadotWebWalletController
    );

    const next = (newStage: StageName, newData?: TxDataState) => {
      this.stageName = newStage;
      this.data = newData;
      redraw();
    };

    return (
      <div className="TXSigningModal">
        <div className="compact-modal-title">
          <h3>{getModalTitle(this.stageName, txLabel)}</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          {this.stageName === 'intro' && (
            <TxSigningModalIntroStage
              author={author}
              next={next}
              polkaWallet={polkaWallet}
              txData={txData}
              txType={txType}
            />
          )}
          {this.stageName === 'waiting' && (
            <TxSigningModalWaitingStage next={next} />
          )}
          {this.stageName === 'success' && (
            <TxSigningModalSuccessStage
              blocknum={this.data.blocknum}
              hash={this.data.hash}
              timestamp={this.data.timestamp}
            />
          )}
          {this.stageName === 'rejected' && (
            <TxSigningModalRejectedStage
              blocknum={this.data.blocknum}
              hash={this.data.hash}
              timestamp={this.data.timestamp}
              error={this.data.error}
              next={next}
            />
          )}
        </div>
      </div>
    );
  }
}

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
      redraw();
    });

    return modalP;
  }
};
