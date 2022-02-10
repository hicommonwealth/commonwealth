import 'modals/confirm_snapshot_vote_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button } from 'construct-ui';
import { navigateToSubpage } from 'app';

import {
  SnapshotProposal,
  SnapshotSpace,
  getVersion,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';

import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { ChainBase } from 'types';
import { formatNumberShort } from 'adapters/currency';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';

enum NewVoteErrors {
  SomethingWentWrong = 'Something went wrong!',
}

const ConfirmSnapshotVoteModal: m.Component<
  {
    space: SnapshotSpace;
    proposal: SnapshotProposal;
    id: string;
    selectedChoice: string;
    totalScore: number;
    scores: any;
    snapshot: any;
  },
  {
    error: any;
    saving: boolean;
  }
> = {
  view: (vnode) => {
    const author = app.user.activeAccount;
    const {
      proposal,
      space,
      id,
      selectedChoice,
      totalScore,
      scores,
      snapshot,
    } = vnode.attrs;
    return m('.ConfirmSnapshotVoteModal', [
      m('.compact-modal-title', [
        m('h3', 'Confirm vote'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('h4', [
          `Are you sure you want to vote "${proposal.choices[selectedChoice]}"?`,
          m('br'),
          'This action cannot be undone.',
        ]),
        m('.vote-info', [
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Option'),
            m('span', `${proposal.choices[selectedChoice]}`),
          ]),
          // TODO: this links out to the block explorer specific to each space, which we don't hardcode
          // m('.d-flex', [
          //   m('span', { class: 'text-blue' }, 'Snapshot'),
          //   m('a', { href: `${_explorer(space.network, proposal.snapshot, 'block')}`, target: '_blank' }, [
          //     `${formatNumberShort(proposal.snapshot, '0,0')}`,
          //     m('i', { class: 'iconexternal-link' })
          //   ]),
          // ]),
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Your voting power'),
            m(
              'span',
              `${formatNumberShort(totalScore)} ${space.symbol
                .slice(0, 6)
                .trim()}...`
            ),
          ]),
        ]),
        m('.button-group', [
          m(Button, {
            intent: 'none',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            },
            label: 'Cancel',
          }),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.saving = true;
              const version = await getVersion();
              const msg: any = {
                address: author.address,
                msg: JSON.stringify({
                  version,
                  timestamp: (Date.now() / 1e3).toFixed(),
                  space: space.id,
                  type: 'vote',
                  payload: {
                    proposal: id,
                    choice: selectedChoice + 1,
                    metadata: {},
                  },
                }),
              };

              try {
                const wallet = await app.wallets.locateWallet(
                  author.address,
                  ChainBase.Ethereum
                );
                if (
                  !(
                    wallet instanceof MetamaskWebWalletController ||
                    wallet instanceof WalletConnectWebWalletController
                  )
                ) {
                  throw new Error('Invalid wallet.');
                }
                msg.sig = await wallet.signMessage(msg.msg);
                await wallet.disable();

                const result = await $.post(
                  `${app.serverUrl()}/snapshotAPI/sendMessage`,
                  { ...msg }
                );
                if (result.status === 'Failure') {
                  const errorMessage =
                    result && result.message.error_description
                      ? `${result.message.error_description}`
                      : NewVoteErrors.SomethingWentWrong;
                  notifyError(errorMessage);
                } else if (result.status === 'Success') {
                  $(e.target).trigger('modalexit');
                  navigateToSubpage(`/snapshot/${space.id}`);
                }
              } catch (err) {
                const errorMessage = err.message;
                notifyError(errorMessage);
              }

              vnode.state.saving = false;
            },
            label: 'Vote',
          }),
        ]),
      ]),
    ]);
  },
};

export default ConfirmSnapshotVoteModal;
