/* @jsx m */

import m from 'mithril';
import { Input } from 'construct-ui';

import 'components/proposals/proposal_extensions.scss';

import app from 'state';
import { CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { AnyProposal } from 'models';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';
import Cosmos from 'controllers/chain/cosmos/main';

import { ConvictionsChooser } from 'views/components/proposals/convictions_chooser';
import { BalanceInfo } from 'views/components/proposals/balance_info';

export class ProposalExtensions
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
      setDemocracyVoteConviction?;
      setDemocracyVoteAmount?;
      setCosmosDepositAmount?;
    }>
{
  view(vnode) {
    const {
      proposal,
      setCosmosDepositAmount,
      setDemocracyVoteAmount,
      setDemocracyVoteConviction,
    } = vnode.attrs;

    if (proposal instanceof SubstrateDemocracyReferendum) {
      if (!setDemocracyVoteConviction) return 'Misconfigured';
      if (!setDemocracyVoteAmount) return 'Misconfigured';
      if (!app.user.activeAccount) return 'Misconfigured';

      return (
        <div class="ProposalExtensions">
          <div style="font-size: 90%; line-height: 1.2;">
            The winning side's coins will be timelocked according to the weight
            of their vote:
          </div>
          <div style="margin: 16px 0 12px;">
            <ConvictionsChooser callback={setDemocracyVoteConviction} />
          </div>
          <Input
            fluid
            placeholder={`Amount to vote (${app.chain?.chain?.denom})`}
            oncreate={() => {
              setDemocracyVoteAmount(0);
            }}
            oninput={(e) => {
              setDemocracyVoteAmount(parseFloat(e.target.value));
            }}
          />
          {app.user.activeAccount instanceof SubstrateAccount && (
            <BalanceInfo account={app.user.activeAccount} />
          )}
        </div>
      );
    } else if (proposal instanceof SubstrateDemocracyProposal) {
      return (
        <div class="ProposalExtensions">
          <div class="proposal-second">
            Cost to second: {proposal.deposit.format()}
          </div>
        </div>
      );
    } else if (proposal instanceof SubstratePhragmenElection) {
      const votingBond = (app.chain as Substrate).phragmenElections.votingBond;

      return (
        <div class="ProposalExtensions">
          Voting on councillor candidacies requires a voting bond of{' '}
          <strong>{votingBond ? votingBond.format() : '--'}</strong>
          which is returned when the election is completed.
          {/* TODO XXX: check whether user has deposited a voting bond
        m('.proposal-bond', 'You have not deposited a voting bond for the current election.'),
        m('.proposal-bond', 'You have already deposited a voting bond for the current election.'), */}
        </div>
      );
    } else if (
      proposal instanceof CosmosProposal &&
      proposal.status === 'DepositPeriod'
    ) {
      if (!setCosmosDepositAmount) return 'Misconfigured';

      return (
        <div class="ProposalExtensions">
          <div class="proposal-second">
            Must deposit at least:{' '}
            {(app.chain as Cosmos).governance.minDeposit.format()}
          </div>
          <Input
            fluid
            // TODO: support multiple denom
            placeholder={`Amount to deposit (${app.chain?.chain?.denom})`}
            oncreate={() => {
              setCosmosDepositAmount(0);
            }}
            oninput={(e) => {
              setCosmosDepositAmount(parseInt(e.target.value, 10));
            }}
          />
          {/* TODO: balance display */}
        </div>
      );
    }
  }
}
