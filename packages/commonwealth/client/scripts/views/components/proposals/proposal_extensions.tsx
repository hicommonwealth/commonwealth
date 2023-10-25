import React from 'react';

import 'components/proposals/proposal_extensions.scss';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { AnyProposal } from '../../../models/types';

import app from 'state';

import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';
import {
  useDepositParamsQuery,
  useStakingParamsQuery,
} from 'state/api/chainParams';

type ProposalExtensionsProps = {
  proposal: AnyProposal;
  setDemocracyVoteConviction?;
  setDemocracyVoteAmount?;
  setCosmosDepositAmount?;
};

export const ProposalExtensions = (props: ProposalExtensionsProps) => {
  const { proposal, setCosmosDepositAmount, setDemocracyVoteAmount } = props;

  React.useEffect(() => {
    if (setDemocracyVoteAmount) setDemocracyVoteAmount(0);
    if (setCosmosDepositAmount) setCosmosDepositAmount(0);
  }, [setCosmosDepositAmount, setDemocracyVoteAmount]);

  const { data: stakingDenom } = useStakingParamsQuery();
  const { data: cosmosDepositParams } = useDepositParamsQuery(stakingDenom);
  const minDeposit = cosmosDepositParams?.minDeposit;

  if (
    proposal instanceof CosmosProposal &&
    proposal.status === 'DepositPeriod'
  ) {
    if (!setCosmosDepositAmount) return <CWText>Misconfigured</CWText>;

    return (
      <div className="ProposalExtensions">
        <CWText>Must deposit at least: {minDeposit?.format()}</CWText>
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
