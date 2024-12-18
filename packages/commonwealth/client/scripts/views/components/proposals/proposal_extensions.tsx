import React, { useEffect } from 'react';

import type { AnyProposal } from '../../../models/types';
import './proposal_extensions.scss';

import app from 'state';

import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
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

  let isGovgen = false;
  if (proposal instanceof CosmosProposalGovgen) {
    isGovgen = true;
  }

  const { data: cosmosDepositParams } = useDepositParamsQuery(
    // @ts-expect-error <StrictNullChecks/>
    stakingDenom,
    isGovgen,
  );

  useEffect(() => {
    if (setDemocracyVoteAmount) setDemocracyVoteAmount(0);
  }, [setDemocracyVoteAmount]);

  useEffect(() => {
    if (setCosmosDepositAmount) setCosmosDepositAmount(0);
  }, [setCosmosDepositAmount]);

  if (
    (proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen ||
      proposal instanceof CosmosProposalV1AtomOne) &&
    proposal.status === 'DepositPeriod'
  ) {
    const cosmos = app.chain as Cosmos;
    const meta = cosmos.meta;
    const minDeposit = parseFloat(
      // @ts-expect-error <StrictNullChecks/>
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
