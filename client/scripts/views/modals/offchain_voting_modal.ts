import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainVote, AddressInfo } from 'models';
import { CompactModalExitButton } from 'views/modal';
import User from 'views/components/widgets/user';

import app from 'state';
import { formatAddressShort } from '../../../../shared/utils';

const OffchainVotingModal : m.Component<{ votes: OffchainVote[] }, {}> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;
    if (!votes || votes.length === 0) return;
    var csvRows = [];
    votes.forEach(vote => {
      let displayName;
      let profile = app.profiles.getProfile(vote.author_chain, vote.address);
      if(profile)
        displayName = profile.displayName;
      else
        displayName = formatAddressShort(
          vote.address,
          vote.author_chain,
          false
        );
      csvRows.push([displayName, vote.option]);
    });

    return m('.OffchainVotingModal', [
      m('.compact-modal-title', [
        m('h3', 'Votes'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', 
      [
        m('a', {
          style: { 'cursor': 'pointer' },
          'onclick': (e) => {
            e.preventDefault();
            let csvContent = "data:text/csv;charset=utf-8," 
              + csvRows.map(e => e.join(",")).join("\n");
            var encodedUri = encodeURI(csvContent);
            window.open(encodedUri);
          }
        }, 'Download all votes as CSV'),
        votes.map((vote) => m('.offchain-poll-voter', [
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
      ]
      )
    ]);
  }
};

export default OffchainVotingModal;
