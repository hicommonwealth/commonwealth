import React, { useEffect } from 'react';

import 'components/proposals/proposal_extensions.scss';
import type { AnyProposal } from '../../../models/types';

import app from 'state';

import Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import {
  useDepositParamsQuery,
  useStakingParamsQuery,
} from 'state/api/chainParams';
import { minimalToNaturalDenom } from '../../../../../shared/utils';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';

type ProposalExtensionsProps = {
  proposal: AnyProposal;
  setDemocracyVoteConviction?;
  setDemocracyVoteAmount?;
  setCosmosDepositAmount?: (amount: number) => void;
};

export const ProposalExtensions = (props: ProposalExtensionsProps) => {
  const { setCosmosDepositAmount, setDemocracyVoteAmount, proposal } = props;
  const { data: stakingDenom } = useStakingParamsQuery();
  const { data: cosmosDepositParams } = useDepositParamsQuery(stakingDenom);

  useEffect(() => {
    if (setDemocracyVoteAmount) setDemocracyVoteAmount(0);
  }, [setDemocracyVoteAmount]);

  useEffect(() => {
    if (setCosmosDepositAmount) setCosmosDepositAmount(0);
  }, [setCosmosDepositAmount]);

  if (
    (proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1) &&
    proposal.status === 'DepositPeriod'
  ) {
    const cosmos = app.chain as Cosmos;
    const meta = cosmos.meta;
    const minDeposit = parseFloat(
      minimalToNaturalDenom(+cosmosDepositParams?.minDeposit, meta?.decimals),
    );

    if (!setCosmosDepositAmount) return <CWText>Misconfigured</CWText>;

    return (
      <div className="ProposalExtensions">
        <CWText>Must deposit at least: {minDeposit}</CWText>
        <CWTextInput
          placeholder={`Amount to deposit (${meta?.default_symbol})`}
          onInput={(e) => {
            setCosmosDepositAmount(e.target.value);
          }}
        />
      </div>
    );
  }
};
