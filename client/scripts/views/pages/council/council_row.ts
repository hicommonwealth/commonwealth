import 'pages/council_row.scss';

import m from 'mithril';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';
import Substrate from 'client/scripts/controllers/chain/substrate/main';
import app from 'state';
import { PhragmenElectionVote } from 'client/scripts/controllers/chain/substrate/phragmen_election';
import { pluralize } from 'helpers';
import ViewVotersModal from '../../modals/view_voters_modal';
import User from '../../components/widgets/user';
import ListingRow from '../../components/listing_row';

interface ICollectiveMemberAttrs {
  account: SubstrateAccount;
}

const CouncilRow: m.Component<ICollectiveMemberAttrs> = {
  view: (vnode) => {
    if (!vnode.attrs.account) return;
    const { account } = vnode.attrs;
    const election = (app.chain as Substrate).phragmenElections;

    const votes: PhragmenElectionVote[] = (app.chain as Substrate).phragmenElections.activeElection.getVotes()
      .filter((v) => v.votes.includes(account.address));

    const hasMyVote = app.user.activeAccount && votes.filter((v) => v.account === app.user.activeAccount);

    const rowHeader = m(User, {
      user: account,
      hideAvatar: true,
      popover: true,
    });

    const rowSubheader = m('span.council-row-subheader', election.isMember(account)
      ? `${election.backing(account).format(true)} from ${pluralize(votes.length, 'account')}`
      : `${votes.length} votes`);

    return m(ListingRow, {
      contentLeft: {
        header: rowHeader,
        subheader: rowSubheader,
      },
      contentRight: [],
      rightColSpacing: [0],
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.modals.create({ modal: ViewVotersModal, data: { account, votes } });
      }
    });
  }
};

export default CouncilRow;
