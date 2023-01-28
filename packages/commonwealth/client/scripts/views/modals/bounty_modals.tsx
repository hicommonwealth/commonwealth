/* @jsx jsx */
import React from 'react';

import ClassComponent from 'class_component';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import type Substrate from 'controllers/chain/substrate/adapter';
import $ from 'jquery';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'modals/bounty_modals.scss';

import app from 'state';
import { AddressInputTypeahead } from 'views/components/address_input_typeahead';
import { alertModalWithText } from 'views/modals/alert_modal';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { CWButton } from '../components/component_kit/cw_button';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';

type BountyModalAttrs = {
  bountyId: number;
};

export class ApproveBountyModal extends ClassComponent<BountyModalAttrs> {
  private approvals: number;

  view(vnode: ResultNode<BountyModalAttrs>) {
    const { bountyId } = vnode.attrs;

    return (
      <div className="ApproveBountyModal">
        <div className="compact-modal-title">
          <h3>Approve bounty</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWText>Create a council motion to approve this bounty?</CWText>
          <CWText>
            You must select a valid number of approvals, or the motion will
            fail.
          </CWText>
          <CWTextInput
            onInput={(e) => {
              const approvals = +(e.target as any).value;
              this.approvals = approvals;
            }}
            placeholder="Number of approvals"
          />
        </div>
        <div className="compact-modal-actions">
          <CWButton
            onClick={async (e) => {
              e.preventDefault();
              if (Number.isNaN(this.approvals)) return;
              await createTXModal(
                (app.chain as Substrate).bounties.createBountyApprovalMotionTx(
                  app.user?.activeAccount as SubstrateAccount,
                  bountyId,
                  this.approvals
                )
              );

              // done
              $(e.target).trigger('modalcomplete');
              setTimeout(async () => {
                $(e.target).trigger('modalexit');
                await alertModalWithText(
                  'Council motion created! Next, the motion must be approved to fund the bounty.'
                )();
              }, 0);
            }}
            label="Go to send transaction"
          />
        </div>
      </div>
    );
  }
}

export class ProposeCuratorModal extends ClassComponent<BountyModalAttrs> {
  private approvals: number;
  private curator: string;
  private fee: number;

  view(vnode: ResultNode<BountyModalAttrs>) {
    const { bountyId } = vnode.attrs;
    const { curator, fee, approvals } = this;
    const feeCoins = app.chain.chain.coins(fee, true);

    return (
      <div className="ProposeCuratorModal">
        <div className="compact-modal-title">
          <h3>Propose curator</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWText>Propose a curator and fee to manage this bounty.</CWText>
          <CWText>
            The fee should be a portion of the bounty that will go to the
            curator once the bounty is completed.
          </CWText>
          <AddressInputTypeahead
            options={{
              fluid: true,
              placeholder: 'Curator address',
            }}
            onInput={(result) => {
              this.curator = result.address;
            }}
          />
          <CWTextInput
            onInput={(e) => {
              this.fee = +(e.target as any).value;
            }}
            placeholder={`Fee (${app.chain?.chain?.denom})`}
          />
          <CWText>
            This will create a council motion, that needs to be approved by a
            sufficient number of councillors as configured by the chain.
          </CWText>
          <CWTextInput
            onInput={(e) => {
              this.approvals = +(e.target as any).value;
            }}
            placeholder="Approvals required"
          />
        </div>
        <div className="compact-modal-actions">
          <CWButton
            onClick={async (e) => {
              e.preventDefault();
              if (Number.isNaN(this.approvals)) return;
              await createTXModal(
                (app.chain as Substrate).bounties.proposeCuratorTx(
                  app.user?.activeAccount as SubstrateAccount,
                  bountyId,
                  curator,
                  feeCoins,
                  approvals
                )
              );

              // done
              $(e.target).trigger('modalcomplete');
              setTimeout(async () => {
                $(e.target).trigger('modalexit');
                await alertModalWithText(
                  'Curator proposed! Next, the motion must be approved & the curator must accept.'
                )();
              }, 0);
            }}
            label="Go to send transaction"
          />
        </div>
      </div>
    );
  }
}

export class AwardBountyModal extends ClassComponent<BountyModalAttrs> {
  private recipient: string;

  view(vnode: ResultNode<BountyModalAttrs>) {
    const { bountyId } = vnode.attrs;
    const { recipient } = this;

    return (
      <div className="AwardBountyModal">
        <div className="compact-modal-title">
          <h3>Approve bounty</h3>
        </div>
        <div className="compact-modal-body">
          <CWText>
            Award this bounty to the recipient. This action will take effect
            after a delay.
          </CWText>
          <AddressInputTypeahead
            options={{
              fluid: true,
              placeholder: 'Recipient address',
            }}
            onInput={(result) => {
              this.recipient = result.address;
            }}
          />
        </div>
        <div className="compact-modal-actions">
          <CWButton
            onClick={async (e) => {
              e.preventDefault();
              await createTXModal(
                (app.chain as Substrate).bounties.awardBountyTx(
                  app.user?.activeAccount as SubstrateAccount,
                  bountyId,
                  recipient
                )
              );

              // done
              $(e.target).trigger('modalcomplete');
              setTimeout(async () => {
                $(e.target).trigger('modalexit');
                await alertModalWithText(
                  'Payout recorded! Once the review period has passed, the recipient will be able to claim the bounty.'
                )();
              }, 0);
            }}
            label="Go to send transaction"
          />
        </div>
      </div>
    );
  }
}

export class ExtendExpiryModal extends ClassComponent<BountyModalAttrs> {
  private remark: string;

  view(vnode: ResultNode<BountyModalAttrs>) {
    const { bountyId } = vnode.attrs;
    const { remark } = this;

    return (
      <div className="ExtendExpiryModal">
        <div className="compact-modal-title">
          <h3>Approve bounty</h3>
        </div>
        <div className="compact-modal-body">
          <CWText>
            Extend this bounty? You should include a remark summarizing progress
            so far.
          </CWText>
          <CWTextInput
            onInput={(e) => {
              this.remark = (e.target as any).value;
            }}
            placeholder="Remark"
          />
        </div>
        <div className="compact-modal-actions">
          <CWButton
            onClick={async (e) => {
              e.preventDefault();
              await createTXModal(
                (app.chain as Substrate).bounties.extendBountyExpiryTx(
                  app.user?.activeAccount as SubstrateAccount,
                  bountyId,
                  remark
                )
              );

              // done
              $(e.target).trigger('modalcomplete');
              setTimeout(async () => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
            label="Go to send transaction"
          />
        </div>
      </div>
    );
  }
}
