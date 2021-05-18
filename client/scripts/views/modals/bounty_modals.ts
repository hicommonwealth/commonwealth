import 'modals/bounty_modals.scss';

import m from 'mithril';
import { Button, Input } from 'construct-ui';
import Substrate from 'controllers/chain/substrate/main';

import app from 'state';

export const ApproveBountyModal: m.Component<{ bountyId: number }, { approvals: number }> = {
  view: (vnode) => {
    const { bountyId } = vnode.attrs;

    return m('.ApproveBountyModal', [
      m('.compact-modal-title', [
        m('h3', 'Approve bounty'),
      ]),
      m('.compact-modal-body', [
        m('p', [
          'Create a council motion to approve this bounty?',
        ]),
        m('p', [
          'You must select a valid number of approvals, or the motion will fail.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            const approvals = +(e.target as any).value;
            vnode.state.approvals = approvals;
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
            if (isNaN(vnode.state.approvals)) return;
            await (app.chain as Substrate).bounties.createBountyApprovalMotionTx(
              this.app.user?.activeAccount?.address, bountyId
            );

            // done
            $(e.target).trigger('modalcomplete');
            setTimeout(() => {
              $(e.target).trigger('modalexit');
            }, 0);
          },
          label: 'Go to send transaction',
	}),
      ]),
    ]);
  }
};

export const ProposeCuratorModal: m.Component<{ bountyId: number }, { approvals: number, curator: string, fee: number }> = {
  view: (vnode) => {
    const { bountyId } = vnode.attrs;
    const { curator, fee } = vnode.state;
    const feeCoins = app.chain.chain.coins(fee);

    return m('.ProposeCuratorModal', [
      m('.compact-modal-title', [
        m('h3', 'Propose curator'),
      ]),
      m('.compact-modal-body', [
        m('p', [
          'Propose a curator to manage this bounty.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            vnode.state.curator = (e.target as any).value;
          },
          placeholder: 'Curator address',
        }),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            vnode.state.fee = (e.target as any).value;
          },
          placeholder: 'Fee',
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            await (app.chain as Substrate).bounties.proposeCuratorTx(
              this.app.user?.activeAccount?.address, bountyId, curator, feeCoins
            );

            // done
            $(e.target).trigger('modalcomplete');
            setTimeout(() => {
              $(e.target).trigger('modalexit');
            }, 0);
          },
          label: 'Go to send transaction',
	}),
      ]),
    ]);
  }
};

export const AwardBountyModal: m.Component<{ bountyId: number }, { approvals: number, recipient: string }> = {
  view: (vnode) => {
    const { bountyId } = vnode.attrs;
    const { recipient } = vnode.state;

    return m('.AwardBountyModal', [
      m('.compact-modal-title', [
        m('h3', 'Approve bounty'),
      ]),
      m('.compact-modal-body', [
        m('p', [
          'Award this bounty to the recipient. This action will take effect after a delay.'
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            vnode.state.recipient = (e.target as any).value;
          },
          placeholder: 'Recipient address',
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            await (app.chain as Substrate).bounties.awardBountyTx(
              this.app.user?.activeAccount?.address, bountyId, recipient
            );

            // done
            $(e.target).trigger('modalcomplete');
            setTimeout(() => {
              $(e.target).trigger('modalexit');
            }, 0);
          },
          label: 'Go to send transaction',
	}),
      ]),
    ]);
  }
};

export const ExtendExpiryModal: m.Component<{ bountyId: number }, { approvals: number, remark: string }> = {
  view: (vnode) => {
    const { bountyId } = vnode.attrs;
    const { remark } = vnode.state;

    return m('.ExtendExpiryModal', [
      m('.compact-modal-title', [
        m('h3', 'Approve bounty'),
      ]),
      m('.compact-modal-body', [
        m('p', [
          'Extend this bounty? You can include a remark summarizing progress so far.',
        ]),
        m(Input, {
          fluid: true,
          oninput: (e) => {
            vnode.state.remark = (e.target as any).value;
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
            await (app.chain as Substrate).bounties.extendBountyExpiryTx(
              this.app.user?.activeAccount?.address, bountyId, remark
            );

            // done
            $(e.target).trigger('modalcomplete');
            setTimeout(() => {
              $(e.target).trigger('modalexit');
            }, 0);
          },
          label: 'Go to send transaction',
	}),
      ]),
    ]);
  }
};
