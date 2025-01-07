import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useState } from 'react';
import { MixpanelGovernanceEvents } from 'shared/analytics/types';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';
import './voting_actions.scss';

import app from 'state';

import { getChainDecimals } from 'client/scripts/controllers/app/webWallets/utils';
import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
import useUserStore from 'state/ui/user';
import { naturalDenomToMinimal } from '../../../../../shared/utils';
import useAppStatus from '../../../hooks/useAppStatus';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CannotVote } from './cannot_vote';
import { getCanVote, getVotingResults } from './helpers';
import { ProposalExtensions } from './proposal_extensions';

type VotingActionsProps = {
  onModalClose: () => void;
  proposal: AnyProposal;
  toggleVotingModal: (newModalState: boolean) => void;
  votingModalOpen: boolean;
  redrawProposals: React.Dispatch<React.SetStateAction<boolean>>;
  proposalRedrawState: boolean;
};

export const VotingActions = ({
  proposal,
  toggleVotingModal,
  votingModalOpen,
  redrawProposals,
  proposalRedrawState,
}: VotingActionsProps) => {
  const [amount, setAmount] = useState<number>();

  const { isAddedToHomeScreen } = useAppStatus();
  const userData = useUserStore();

  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  if (!userData.isLoggedIn) {
    return <CannotVote label="Sign in to vote" />;
  } else if (!userData.activeAccount) {
    return <CannotVote label="Connect an address to vote" />;
  } else if (!proposal.canVoteFrom(userData.activeAccount)) {
    return <CannotVote label="Cannot vote from this address" />;
  }

  let user;

  if (
    proposal instanceof CosmosProposal ||
    proposal instanceof CosmosProposalV1 ||
    proposal instanceof CosmosProposalGovgen ||
    proposal instanceof CosmosProposalV1AtomOne
  ) {
    user = userData.activeAccount as CosmosAccount;
  } else {
    return <CannotVote label="Unrecognized proposal type" />;
  }

  const emitRedraw = () => {
    redrawProposals(!proposalRedrawState);
  };

  const voteYes = async (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen ||
      proposal instanceof CosmosProposalV1AtomOne
    ) {
      if (proposal.status === 'DepositPeriod') {
        const chain = app.chain as Cosmos;
        const depositAmountInMinimalDenom = parseInt(
          naturalDenomToMinimal(
            amount,
            getChainDecimals(chain.meta.id || '', chain.base),
          ),
          10,
        );

        proposal
          .submitDepositTx(user, chain.chain.coins(depositAmountInMinimalDenom))
          .then(emitRedraw)
          .catch((err) => notifyError(err.toString()));
      } else {
        try {
          await proposal.voteTx(new CosmosVote(user, 'Yes'));
          emitRedraw();
          trackAnalytics({
            event: MixpanelGovernanceEvents.COSMOS_VOTE_OCCURRED,
            isPWA: isAddedToHomeScreen,
          });
        } catch (error) {
          notifyError(error.toString());
        }
      }
    } else {
      toggleVotingModal(false);
      return notifyError('Invalid proposal type');
    }
  };

  const voteNo = async (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen ||
      proposal instanceof CosmosProposalV1AtomOne
    ) {
      try {
        await proposal.voteTx(new CosmosVote(user, 'No'));
        emitRedraw();
        trackAnalytics({
          event: MixpanelGovernanceEvents.COSMOS_VOTE_OCCURRED,
          isPWA: isAddedToHomeScreen,
        });
      } catch (err) {
        notifyError(err.toString());
      }
    } else {
      toggleVotingModal(false);
      return notifyError('Invalid proposal type');
    }
  };

  const voteAbstain = (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen ||
      proposal instanceof CosmosProposalV1AtomOne
    ) {
      proposal
        .voteTx(new CosmosVote(user, 'Abstain'))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else {
      toggleVotingModal(false);
      return notifyError('Invalid proposal type');
    }
  };

  const voteVeto = (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen
    ) {
      proposal
        .voteTx(new CosmosVote(user, 'NoWithVeto'))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else {
      toggleVotingModal(false);
      return notifyError('Invalid proposal type');
    }
  };

  const {
    hasVotedYes,
    hasVotedNo,
    hasVotedAbstain,
    hasVotedVeto,
    hasVotedForAnyChoice,
    // @ts-expect-error <StrictNullChecks/>
  } = getVotingResults(proposal, user);

  // @ts-expect-error <StrictNullChecks/>
  const canVote = getCanVote(proposal, hasVotedForAnyChoice);

  const yesButton = (
    <CWButton
      disabled={!canVote || hasVotedYes || votingModalOpen}
      onClick={voteYes}
      label={hasVotedYes ? 'Voted yes' : 'Vote yes'}
    />
  );

  const noButton = (
    <CWButton
      buttonType="destructive"
      disabled={!canVote || hasVotedNo || votingModalOpen}
      onClick={voteNo}
      label={hasVotedNo ? 'Voted no' : 'Vote no'}
    />
  );

  const multiDepositApproveButton = (
    <CWButton
      disabled={!canVote || votingModalOpen}
      onClick={voteYes}
      label={hasVotedYes && !canVote ? 'Already approved' : 'Second'}
    />
  );

  // cosmos: abstain
  const abstainButton = (
    <CWButton
      buttonType="destructive"
      disabled={!canVote || hasVotedAbstain || votingModalOpen}
      onClick={voteAbstain}
      label={hasVotedAbstain ? 'Abstained' : 'Abstain'}
    />
  );

  // cosmos: veto
  const noWithVetoButton = (
    <CWButton
      buttonType="destructive"
      disabled={!canVote || hasVotedVeto || votingModalOpen}
      onClick={voteVeto}
      label={hasVotedVeto ? 'Vetoed' : 'Veto'}
    />
  );

  let votingActionObj;
  if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
    votingActionObj = (
      <>
        <div className="button-row">{multiDepositApproveButton}</div>
        <ProposalExtensions
          // @ts-expect-error <StrictNullChecks/>
          proposal={proposal}
          setCosmosDepositAmount={setAmount}
        />
      </>
    );
  } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
    if (!(proposal instanceof CosmosProposalV1AtomOne)) {
      votingActionObj = (
        <>
          <div className="button-row">
            {yesButton}
            {noButton}
            {abstainButton}
            {noWithVetoButton}
          </div>
          {/* @ts-expect-error StrictNullChecks*/}
          <ProposalExtensions proposal={proposal} />
        </>
      );
    } else {
      votingActionObj = (
        <>
          <div className="button-row">
            {yesButton}
            {noButton}
            {abstainButton}
          </div>
          {/* @ts-expect-error StrictNullChecks*/}
          <ProposalExtensions proposal={proposal} />
        </>
      );
    }
  } else {
    votingActionObj = <CannotVote label="Unsupported proposal type" />;
  }

  return (
    <div className="VotingActions">
      <CWText type="h4" className="voting-actions-header">
        Cast Your Vote
      </CWText>
      {votingActionObj}
    </div>
  );
};
