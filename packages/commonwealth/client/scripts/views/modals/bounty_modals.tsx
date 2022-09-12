/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import { Button, Input } from 'construct-ui';

import 'modals/bounty_modals.scss';

import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { AddressInputTypeahead } from 'views/components/address_input_typeahead';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { alertModalWithText } from 'views/modals/alert_modal';

export class ApproveBountyModal
  implements m.ClassComponent<{ bountyId: number }>
{
  private approvals: number;

  view(vnode) {
    const { bountyId } = vnode.attrs;

    return m('.ApproveBountyModal', [
      m('.compact-modal-title', [m('h3', 'Approve bounty')]),
      m('.compact-modal-body', [
        m('p', ['Create a council motion to approve this bounty?']),
        m('p', [
          'You must select a valid number of approvals, or the motion will fail.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            const approvals = +(e.target as any).value;
            this.approvals = approvals;
          },
          placeholder: 'Number of approvals',
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
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
          },
          label: 'Go to send transaction',
        }),
      ]),
    ]);
  }
}

export class ProposeCuratorModal
  implements m.ClassComponent<{ bountyId: number }>
{
  private approvals: number;
  private curator: string;
  private fee: number;

  view(vnode) {
    const { bountyId } = vnode.attrs;
    const { curator, fee, approvals } = this;
    const feeCoins = app.chain.chain.coins(fee, true);

    return m('.ProposeCuratorModal', [
      m('.compact-modal-title', [m('h3', 'Propose curator')]),
      m('.compact-modal-body', [
        m('p', ['Propose a curator and fee to manage this bounty.']),
        m('p', [
          'The fee should be a portion of the bounty, that will go to the curator once the bounty is completed.',
        ]),
        m(AddressInputTypeahead, {
          options: {
            fluid: true,
            placeholder: 'Curator address',
          },
          oninput: (result) => {
            this.curator = result.address;
          },
        }),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            this.fee = +(e.target as any).value;
          },
          placeholder: `Fee (${app.chain?.chain?.denom})`,
        }),
        m('p', [
          'This will create a council motion, that needs to be approved by a sufficient number of councillors as configured by the chain.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            this.approvals = +(e.target as any).value;
          },
          placeholder: 'Approvals required',
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
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
          },
          label: 'Go to send transaction',
        }),
      ]),
    ]);
  }
}

export class AwardBountyModal
  implements m.ClassComponent<{ bountyId: number }>
{
  private approvals: number;
  private recipient: string;

  view(vnode) {
    const { bountyId } = vnode.attrs;
    const { recipient } = this;

    return m('.AwardBountyModal', [
      m('.compact-modal-title', [m('h3', 'Approve bounty')]),
      m('.compact-modal-body', [
        m('p', [
          'Award this bounty to the recipient. This action will take effect after a delay.',
        ]),
        m(AddressInputTypeahead, {
          options: {
            fluid: true,
            placeholder: 'Recipient address',
          },
          oninput: (result) => {
            this.recipient = result.address;
          },
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
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
          },
          label: 'Go to send transaction',
        }),
      ]),
    ]);
  }
}

export class ExtendExpiryModal
  implements m.ClassComponent<{ bountyId: number }>
{
  approvals: number;
  remark: string;

  view(vnode) {
    const { bountyId } = vnode.attrs;
    const { remark } = this;

    return m('.ExtendExpiryModal', [
      m('.compact-modal-title', [m('h3', 'Approve bounty')]),
      m('.compact-modal-body', [
        m('p', [
          'Extend this bounty? You should include a remark summarizing progress so far.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            this.remark = (e.target as any).value;
          },
          placeholder: 'Remark',
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
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
          },
          label: 'Go to send transaction',
        }),
      ]),
    ]);
  }
}
