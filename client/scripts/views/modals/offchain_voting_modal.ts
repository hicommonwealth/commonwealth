import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainVote, AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';

const OffchainVotingModal: m.Component<{ votes: OffchainVote[] }, {}> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;
    if (!votes || votes.length === 0) return;
    const csvRows = [];
    votes.forEach((vote) => csvRows.push([vote.address, vote.option]));

    return m('.OffchainVotingModal', [
      m('.compact-modal-title', [m('h3', 'Votes'), m(CompactModalExitButton)]),
      m('.compact-modal-body', [
        m('.download-link', [
          m(
            'a',
            {
              onclick: (e) => {
                e.preventDefault();
                const csvContent = `data:text/csv;charset=utf-8,${csvRows
                  .map((e) => e.join(','))
                  .join('\n')}`;
                const encodedUri = encodeURI(csvContent);
                window.open(encodedUri);
              },
            },
            'Download all votes as CSV'
          ),
        ]),
        votes.map((vote) =>
          m('.offchain-poll-voter', [
            m('.offchain-poll-voter-user', [
              m(User, {
                avatarSize: 16,
                popover: true,
                linkify: true,
                user: new AddressInfo(
                  null,
                  vote.address,
                  vote.authorChain,
                  null,
                  null
                ),
                hideIdentityIcon: true,
              }),
            ]),
            m('.offchain-poll-voter-choice', vote.option),
          ])
        ),
      ]),
    ]);
  },
};

export default OffchainVotingModal;
