import 'modals/confirm_snapshot_vote_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel } from 'construct-ui';

import { CompactModalExitButton } from 'views/modal';

const ConfirmSnapshotVoteModal: m.Component<{
}, {
  error: any,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;

    return m('.ConfirmSnapshotVoteModal', [
      m('.compact-modal-title', [
        m('h3', 'Confirm vote'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
				m('h4', [
					`Are you sure you want to vote ${'Keep ChainLi...'}`,
					m('br'),
					'This action cannot be undone.'
				]),
				m('.vote-info', [
					m('.d-flex', [
						m('span', {class: 'text-blue'}, 'Option'),
						m('span', 'Kepp ChainLink Oracle Price')
					]),
					m('.d-flex', [
						m('span', {class: 'text-blue'}, 'Snapshot'),
						m('a', [
							'8,112,482',
							m('i', {class: 'iconexternal-link'})
						]),
					]),
					m('.d-flex', [
						m('span', {class: 'text-blue'}, 'Your voting power'),
						m('span', '0 SushiPOWER')
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
						},
						label: 'Vote',
					})
				])
      ])
    ]);
  }
};

export default ConfirmSnapshotVoteModal;
