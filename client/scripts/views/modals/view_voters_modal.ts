import 'modals/view_voters_modal.scss';

import { default as m } from 'mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CompactModalExitButton } from 'views/modal';
import User from '../components/widgets/user';
import app from 'state';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_elections';
import { formatAddressShort } from 'helpers';

interface IViewVotersModalAttrs {
  account: SubstrateAccount;
  votes: PhragmenElectionVote[];
}

const ViewVotersModal: m.Component<IViewVotersModalAttrs> = {
  view: (vnode) => {
    const { address } = vnode.attrs.account;

    return m('.ViewVotersModal', [
      m('.compact-modal-title', [
        m('h3', `Voters for ${formatAddressShort(address)}`),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        vnode.attrs.votes.map(
          (vote) => m(VoterRow, { vote })
        ),
        m('.clear'),
      ]),
    ]);
  }
};

export default ViewVotersModal;

interface IVoterRowAttrs {
  vote: PhragmenElectionVote;
}

const VoterRow: m.Component<IVoterRowAttrs> = {
  view: (vnode) => {
    const { account, stake } = vnode.attrs.vote;

    return m('.VoterRow', {
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeChainId()}/account/${account.address}}`);
        }
      }, [
      m('.proposal-row-left', [
        m('.proposal-pre', [
          m(User, {
            user: account,
            avatarOnly: true,
            avatarSize: 36,
            tooltip: true,
          }),
        ]),
        m('.proposal-pre-mobile', [
          m(User, {
            user: account,
            avatarOnly: true,
            avatarSize: 16,
            tooltip: true,
          }),
        ]),
      ]),
      m('.proposal-row-main.container', [
        m('.proposal-row-main.item', [
          m('.proposal-row-subheading', 'Voter'),
          m('.proposal-row-metadata', [
            m('.proposal-user', [
              m(User, {
                user: account,
                hideAvatar: true,
                tooltip: true,
              }),
            ]),
            m('.proposal-user-mobile', [
              m(User, {
                user: account,
                hideAvatar: true,
                tooltip: true,
              }),
            ]),
          ]),
        ]),
        // Hiding this for now because it looks like the API Query for Stakes of is returning the incorrect value
        // on both Polkadot Apps and CW
        m('.proposal-row-main.item', [
          m('.proposal-row-subheading', 'Locked'),
          m('.proposal-row-metadata', stake.format(true)),
        ]),
      ]),
      m('.proposal-row-xs-clear'),
      ]);
    }
}
