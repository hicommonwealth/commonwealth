import React from 'react';

import 'components/proposals/proposal_extensions.scss';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import type { AnyProposal } from 'models';

import app from 'state';
import { BalanceInfo } from 'views/components/proposals/balance_info';

import { ConvictionsChooser } from 'views/components/proposals/convictions_chooser';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';

type ProposalExtensionsProps = {
  proposal: AnyProposal;
  setDemocracyVoteConviction?;
  setDemocracyVoteAmount?;
  setCosmosDepositAmount?;
};

export const ProposalExtensions = (props: ProposalExtensionsProps) => {
  const {
    proposal,
    setCosmosDepositAmount,
    setDemocracyVoteAmount,
    setDemocracyVoteConviction,
  } = props;

  React.useEffect(() => {
    if (setDemocracyVoteAmount) setDemocracyVoteAmount(0);
    if (setCosmosDepositAmount) setCosmosDepositAmount(0);
  }, []);

  if (proposal instanceof SubstrateDemocracyReferendum) {
    if (!setDemocracyVoteConviction) return <CWText>Misconfigured</CWText>;
    if (!setDemocracyVoteAmount) return <CWText>Misconfigured</CWText>;
    if (!app.user.activeAccount) return <CWText>Misconfigured</CWText>;

    return (
      <div className="ProposalExtensions">
        <CWText>
          The winning side's coins will be timelocked according to the weight of
          their vote.
        </CWText>
        <ConvictionsChooser callback={setDemocracyVoteConviction} />
        <CWTextInput
          placeholder={`Amount to vote (${app.chain?.chain?.denom})`}
          onInput={(e) => {
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
  } else if (
    proposal instanceof CosmosProposal &&
    proposal.status === 'DepositPeriod'
  ) {
    if (!setCosmosDepositAmount) return <CWText>Misconfigured</CWText>;

    return (
      <div className="ProposalExtensions">
        <CWText>
          Must deposit at least:{' '}
          {(app.chain as Cosmos).governance.minDeposit.format()}
        </CWText>
        <CWTextInput
          placeholder={`Amount to deposit (${app.chain?.chain?.denom})`}
          onInput={(e) => {
            setCosmosDepositAmount(parseInt(e.target.value, 10));
          }}
        />
      </div>
    );
  }
};
