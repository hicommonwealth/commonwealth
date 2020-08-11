import 'pages/councillor_row.scss';

import m from 'mithril';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';
import Substrate from 'client/scripts/controllers/chain/substrate/main';
import app from 'state';
import { PhragmenElectionVote } from 'client/scripts/controllers/chain/substrate/phragmen_election';
import ViewVotersModal from '../../modals/view_voters_modal';
import User from '../../components/widgets/user';
import Row from '../../components/row';

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
      tooltip: true,
    });

    const rowSubheader = m('.council-row-subheader', election.isMember(account)
      ? election.backing(account).format(true)
      : votes.length);

    return m(Row, {
      contentLeft: {
        header: rowHeader,
        subheader: rowSubheader,
      },
      // TODO: Hookup keys via array indexes for Gov, Council, Disc
      contentRight: [],
      rightColSpacing: [0],
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({ modal: ViewVotersModal, data: { account, votes } });
      }
    });
  }
};

export default CouncilRow;
