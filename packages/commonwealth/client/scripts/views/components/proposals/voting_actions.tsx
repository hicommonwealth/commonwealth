import React, { useEffect, useState } from 'react';

import 'components/proposals/voting_actions.scss';
import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import type EthereumAccount from 'controllers/chain/ethereum/account';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import CompoundProposal, {
  BravoVote,
  CompoundProposalVote,
} from 'controllers/chain/ethereum/compound/proposal';
import type { NearAccount } from 'controllers/chain/near/account';
import NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import {
  NearSputnikVote,
  NearSputnikVoteString,
} from 'controllers/chain/near/sputnik/types';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';

import app from 'state';

import { naturalDenomToMinimal } from '../../../../../shared/utils';
import { CompoundCancelButton } from '../../pages/view_proposal/proposal_components';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { CannotVote } from './cannot_vote';
import { getCanVote, getVotingResults } from './helpers';
import { ProposalExtensions } from './proposal_extensions';

type VotingActionsProps = {
  onModalClose: () => void;
  proposal: AnyProposal;
  toggleVotingModal: (newModalState: boolean) => void;
  votingModalOpen: boolean;
};

export const VotingActions = (props: VotingActionsProps) => {
  const { onModalClose, proposal, toggleVotingModal, votingModalOpen } = props;

  const [amount, setAmount] = useState<number>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(app.isLoggedIn());
  const [, setConviction] = useState<number>();

  useEffect(() => {
    app.loginStateEmitter.once('redraw', () => {
      setIsLoggedIn(app.isLoggedIn());
    });

    return () => {
      app.loginStateEmitter.removeAllListeners();
    };
  }, []);

  if (!isLoggedIn) {
    return <CannotVote label="Sign in to vote" />;
  } else if (!app.user.activeAccount) {
    return <CannotVote label="Connect an address to vote" />;
  } else if (!proposal.canVoteFrom(app.user.activeAccount)) {
    return <CannotVote label="Cannot vote from this address" />;
  }

  let user;

  if (
    proposal instanceof CosmosProposal ||
    proposal instanceof CosmosProposalV1
  ) {
    user = app.user.activeAccount as CosmosAccount;
  } else if (
    proposal instanceof CompoundProposal ||
    proposal instanceof AaveProposal
  ) {
    user = app.user.activeAccount as EthereumAccount;
  } else if (proposal instanceof NearSputnikProposal) {
    user = app.user.activeAccount as NearAccount;
  } else {
    return <CannotVote label="Unrecognized proposal type" />;
  }

  const emitRedraw = () => {
    app.proposalEmitter.emit('redraw');
  };

  const voteYes = async (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1
    ) {
      if (proposal.status === 'DepositPeriod') {
        const chain = app.chain as Cosmos;
        const depositAmountInMinimalDenom = parseInt(
          naturalDenomToMinimal(amount, chain.meta?.decimals),
          10,
        );

        proposal
          .submitDepositTx(user, chain.chain.coins(depositAmountInMinimalDenom))
          .then(emitRedraw)
          .catch((err) => notifyError(err.toString()));
      } else {
        proposal
          .voteTx(new CosmosVote(user, 'Yes'))
          .then(emitRedraw)
          .catch((err) => notifyError(err.toString()));
      }
    } else if (proposal instanceof CompoundProposal) {
      proposal
        .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.YES))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (proposal instanceof AaveProposal) {
      proposal
        .submitVoteWebTx(new AaveProposalVote(user, true))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (proposal instanceof NearSputnikProposal) {
      proposal
        .submitVoteWebTx(
          new NearSputnikVote(user, NearSputnikVoteString.Approve),
        )
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else {
      toggleVotingModal(false);
      return notifyError('Invalid proposal type');
    }
  };

  const voteNo = (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (
      proposal instanceof CosmosProposal ||
      proposal instanceof CosmosProposalV1
    ) {
      proposal
        .voteTx(new CosmosVote(user, 'No'))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (proposal instanceof CompoundProposal) {
      proposal
        .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.NO))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (proposal instanceof AaveProposal) {
      proposal
        .submitVoteWebTx(new AaveProposalVote(user, false))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (proposal instanceof NearSputnikProposal) {
      proposal
        .submitVoteWebTx(
          new NearSputnikVote(user, NearSputnikVoteString.Reject),
        )
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
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
      proposal instanceof CosmosProposalV1
    ) {
      proposal
        .voteTx(new CosmosVote(user, 'Abstain'))
        .then(emitRedraw)
        .catch((err) => notifyError(err.toString()));
    } else if (
      proposal instanceof CompoundProposal &&
      (app.chain as Compound).governance.supportsAbstain
    ) {
      proposal
        .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.ABSTAIN))
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
      proposal instanceof CosmosProposalV1
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

  const voteRemove = (e) => {
    e.preventDefault();
    toggleVotingModal(true);

    if (proposal instanceof NearSputnikProposal) {
      proposal
        .submitVoteWebTx(
          new NearSputnikVote(user, NearSputnikVoteString.Remove),
        )
        .then(() => {
          onModalClose();
        })
        .catch((err) => {
          onModalClose();
          notifyError(err.toString());
        });
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
    hasVotedRemove,
  } = getVotingResults(proposal, user);

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
      buttonType="primary-red"
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
      buttonType="primary-red"
      disabled={!canVote || hasVotedAbstain || votingModalOpen}
      onClick={voteAbstain}
      label={hasVotedAbstain ? 'Abstained' : 'Abstain'}
    />
  );

  // cosmos: veto
  const noWithVetoButton = (
    <CWButton
      buttonType="primary-red"
      disabled={!canVote || hasVotedVeto || votingModalOpen}
      onClick={voteVeto}
      label={hasVotedVeto ? 'Vetoed' : 'Veto'}
    />
  );

  // near: remove
  const removeButton = proposal instanceof NearSputnikProposal && (
    <CWButton
      disabled={!canVote || votingModalOpen}
      onClick={voteRemove}
      label={hasVotedRemove ? 'Voted remove' : 'Vote remove'}
    />
  );

  let votingActionObj;

  if (proposal instanceof AaveProposal) {
    votingActionObj = (
      <div className="button-row">
        {yesButton}
        {noButton}
      </div>
    );
  } else if (proposal.votingType === VotingType.SimpleYesNoVoting) {
    votingActionObj = (
      <>
        <div className="button-row">
          {yesButton}
          {noButton}
        </div>
        <ProposalExtensions proposal={proposal} />
      </>
    );
  } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
    votingActionObj = (
      <>
        <div className="button-row">
          {yesButton}
          {noButton}
        </div>
        <ProposalExtensions
          proposal={proposal}
          setDemocracyVoteConviction={(c) => {
            setConviction(c);
          }}
          setDemocracyVoteAmount={(c) => {
            setAmount(c);
          }}
        />
      </>
    );
  } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
    votingActionObj = (
      <>
        <div className="button-row">{multiDepositApproveButton}</div>
        <ProposalExtensions
          proposal={proposal}
          setCosmosDepositAmount={setAmount}
        />
      </>
    );
  } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
    votingActionObj = (
      <>
        <div className="button-row">
          {yesButton}
          {noButton}
          {abstainButton}
          {noWithVetoButton}
        </div>
        <ProposalExtensions proposal={proposal} />
      </>
    );
  } else if (proposal.votingType === VotingType.CompoundYesNo) {
    votingActionObj = (
      <div className="button-row">
        {yesButton}
        <CompoundCancelButton
          onModalClose={onModalClose}
          proposal={proposal as CompoundProposal}
          votingModalOpen={votingModalOpen}
        />
      </div>
    );
  } else if (proposal.votingType === VotingType.CompoundYesNoAbstain) {
    votingActionObj = (
      <div className="button-row">
        {yesButton}
        {noButton}
        {abstainButton}
        <CompoundCancelButton
          onModalClose={onModalClose}
          proposal={proposal as CompoundProposal}
          votingModalOpen={votingModalOpen}
        />
      </div>
    );
  } else if (proposal.votingType === VotingType.YesNoReject) {
    votingActionObj = (
      <div className="button-row">
        {yesButton}
        {noButton}
        {removeButton}
      </div>
    );
  } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
    votingActionObj = <CannotVote label="Unsupported proposal type" />;
  } else if (proposal.votingType === VotingType.None) {
    votingActionObj = <CannotVote label="Unsupported proposal type" />;
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
