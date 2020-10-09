import 'modals/view_voters_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CompactModalExitButton } from 'views/modal';
import app from 'state';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
import { formatAddressShort } from 'helpers';
import User from '../components/widgets/user';

interface IVoterRowAttrs {
  vote: PhragmenElectionVote;
}

const VoterRow: m.Component<IVoterRowAttrs> = {
  view: (vnode: m.VnodeDOM<IVoterRowAttrs>) => {
    const { account, stake } = vnode.attrs.vote;

    return m('.VoterRow', {
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeChainId()}/account/${account.address}`);
        $(vnode.dom).trigger('modalexit');
      }
    }, [
      m('.proposal-row-left', [
        m('.proposal-pre', [
          m(User, {
            user: account,
            avatarOnly: true,
            avatarSize: 36,
            popover: true,
          }),
        ]),
        m('.proposal-pre-mobile', [
          m(User, {
            user: account,
            avatarOnly: true,
            avatarSize: 16,
            popover: true,
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
                popover: true,
              }),
            ]),
            m('.proposal-user-mobile', [
              m(User, {
                user: account,
                hideAvatar: true,
                popover: true,
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
    ]);
  }
};

interface IViewVotersModalAttrs {
  account: SubstrateAccount;
  votes: PhragmenElectionVote[];
}

const ViewVotersModal: m.Component<IViewVotersModalAttrs> = {
  view: (vnode) => {
    const { address, chain } = vnode.attrs.account;

    return m('.ViewVotersModal', [
      m('.compact-modal-title', [
        m('h3', `Voters for ${formatAddressShort(address, chain.id)}`),
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
