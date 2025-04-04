import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useMemo, useState } from 'react';
import { MixpanelGovernanceEvents } from 'shared/analytics/types';
import app from 'state';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';
import './voting_actions.scss';

import { getChainDecimals } from 'client/scripts/controllers/app/webWallets/utils';
import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
import moment from 'moment';
import useUserStore from 'state/ui/user';
import { naturalDenomToMinimal } from '../../../../../shared/utils';
import useAppStatus from '../../../hooks/useAppStatus';
import { calculateTimeRemaining } from '../../pages/Snapshots/ViewSnapshotProposal/SnapshotPollCard/utils';
import { CWButton } from '../component_kit/new_designs/CWButton';

import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { CannotVote } from './cannot_vote';
import { getCanVote, getVotingResults } from './helpers';
import { ProposalExtensions } from './proposal_extensions';
import { getVoteOptions } from './utils';
import VotingActionCard from './VotingActionCard';

type VotingActionsProps = {
  onModalClose: () => void;
  proposal: AnyProposal;
  toggleVotingModal: (newModalState: boolean) => void;
  votingModalOpen: boolean;
  redrawProposals: React.Dispatch<React.SetStateAction<boolean>>;
  proposalRedrawState: boolean;
  toggleShowVotesDrawer: (newModalState: boolean) => void;
};

export const VotingActions = ({
  proposal,
  toggleVotingModal,
  votingModalOpen,
  redrawProposals,
  proposalRedrawState,
  toggleShowVotesDrawer,
}: VotingActionsProps) => {
  const [amount, setAmount] = useState<number>();
  const { isAddedToHomeScreen } = useAppStatus();
  const userData = useUserStore();

  const timeRemaining = useMemo(() => {
    // @ts-expect-error <StrictNullChecks/>
    const end = new Date(moment(proposal?.data?.votingEndTime));
    return calculateTimeRemaining(end);
  }, [proposal]);
  let user;
  const isPastDate = moment(proposal?.data?.votingEndTime).isBefore(moment());

  const {
    hasVotedYes,
    hasVotedNo,
    hasVotedAbstain,
    hasVotedVeto,
    hasVotedForAnyChoice,
  } = getVotingResults(proposal, user);

  const defaultVotingOption = useMemo(() => {
    if (hasVotedYes) return 'yes';
    if (hasVotedNo) return 'no';
    if (hasVotedAbstain) return 'abstain';
    if (hasVotedVeto) return 'NoWithVeto';
    return undefined; // No default if user hasn't voted
  }, [hasVotedYes, hasVotedNo, hasVotedAbstain, hasVotedVeto]);

  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  if (!userData.isLoggedIn) {
    return <CannotVote label="Sign in to vote" />;
  } else if (!userData.activeAccount) {
    return <CannotVote label="Connect an address to vote" />;
  } else if (!proposal.canVoteFrom(userData.activeAccount)) {
    return <CannotVote label="Cannot vote from this address" />;
  }

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

  const voteYes = async () => {
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

  const voteNo = async () => {
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

  const voteAbstain = async () => {
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen ||
      proposal instanceof CosmosProposalV1AtomOne
    ) {
      try {
        await proposal.voteTx(new CosmosVote(user, 'Abstain'));
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

  const voteVeto = async () => {
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1 ||
      proposal instanceof CosmosProposalGovgen
    ) {
      try {
        await proposal.voteTx(new CosmosVote(user, 'NoWithVeto'));
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

  const handleVote = (e: string) => {
    if (e === 'yes') {
      voteYes().catch((err) => notifyError(err.toString()));
    } else if (e === 'no') {
      voteNo().catch((err) => notifyError(err.toString()));
    } else if (e === 'abstain') {
      voteAbstain().catch((err) => notifyError(err.toString()));
    } else if (e === 'veto') {
      voteVeto().catch((err) => notifyError(err.toString()));
    }
  };

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
    if ((proposal as CosmosProposal).data?.state?.tally) {
      const { yes, no, abstain, noWithVeto } = (proposal as CosmosProposal).data
        .state.tally;

      const voteResult = getVoteOptions(yes, no, abstain, noWithVeto);
      if (!(proposal instanceof CosmosProposalV1AtomOne)) {
        const voteOptions = [
          { label: 'Yes', value: 'yes', voteCount: 0 },
          { label: 'No', value: 'no', voteCount: 0 },
          { label: 'Abstain', value: 'abstain', voteCount: 0 },
          { label: 'Veto', value: 'veto', voteCount: 0 },
        ];

        votingActionObj = (
          <>
            <CWTooltip
              content={
                isPastDate
                  ? 'The poll has ended.'
                  : hasVotedForAnyChoice
                    ? 'You have already voted.'
                    : ''
              }
              placement="top"
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                >
                  <VotingActionCard
                    options={voteOptions}
                    canVote={canVote && !votingModalOpen}
                    onVote={handleVote}
                    type="cosmos"
                    timeRemaining={timeRemaining}
                    votingOption={voteResult}
                    toggleShowVotesDrawer={toggleShowVotesDrawer}
                    defaultVotingOption={defaultVotingOption}
                  />
                </div>
              )}
            />

            {/* @ts-expect-error StrictNullChecks*/}
            <ProposalExtensions proposal={proposal} />
          </>
        );
      }
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

  return <div className="VotingActions">{votingActionObj}</div>;
};
