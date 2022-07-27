/* @jsx m */

import m from 'mithril';

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
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWText } from '../component_kit/cw_text';

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
          <CWText>
            The winning side's coins will be timelocked according to the weight
            of their vote.
          </CWText>
          <ConvictionsChooser callback={setDemocracyVoteConviction} />
          <CWTextInput
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
      return <CWText>Cost to second: {proposal.deposit.format()}</CWText>;
    } else if (proposal instanceof SubstratePhragmenElection) {
      const votingBond = (app.chain as Substrate).phragmenElections.votingBond;

      return (
        <CWText>
          Voting on councillor candidacies requires a voting bond of{' '}
          <strong>{votingBond ? votingBond.format() : '--'}</strong> which is
          returned when the election is completed.
        </CWText>
      );
    } else if (
      proposal instanceof CosmosProposal &&
      proposal.status === 'DepositPeriod'
    ) {
      if (!setCosmosDepositAmount) return 'Misconfigured';

      return (
        <div class="ProposalExtensions">
          <CWText>
            Must deposit at least:{' '}
            {(app.chain as Cosmos).governance.minDeposit.format()}
          </CWText>
          <CWTextInput
            placeholder={`Amount to deposit (${app.chain?.chain?.denom})`}
            oncreate={() => {
              setCosmosDepositAmount(0);
            }}
            oninput={(e) => {
              setCosmosDepositAmount(parseInt(e.target.value, 10));
            }}
          />
        </div>
      );
    }
  }
}
