import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainVote, AddressInfo } from 'models';
import { CompactModalExitButton } from 'views/modal';
import User from 'views/components/widgets/user';

const OffchainVotingModal : m.Component<{ votes: OffchainVote[] }, {}> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;
    if (!votes || votes.length === 0) return;

    return m('.OffchainVotingModal', [
      m('.compact-modal-title', [
        m('h3', 'Votes'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', votes.map((vote) => m('.offchain-poll-voter', [
        m('.offchain-poll-voter-user', [
          m(User, {
            avatarSize: 16,
            popover: true,
            linkify: true,
            user: new AddressInfo(null, vote.address, vote.author_chain, null, null),
            hideIdentityIcon: true,
          }),
        ]),
        m('.offchain-poll-voter-choice', vote.option),
      ])),
      )
    ]);
  }
};

export default OffchainVotingModal;
