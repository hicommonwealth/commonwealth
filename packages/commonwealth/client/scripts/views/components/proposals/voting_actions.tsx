/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/proposals/voting_actions.scss';

import app from 'state';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { BinaryVote, DepositVote, VotingType, AnyProposal } from 'models';
import {
  SubstrateDemocracyReferendum,
  convictionToWeight,
} from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';
import MolochProposal, {
  MolochProposalVote,
  MolochVote,
  MolochProposalState,
} from 'controllers/chain/ethereum/moloch/proposal';
import CompoundProposal, {
  CompoundProposalVote,
  BravoVote,
} from 'controllers/chain/ethereum/compound/proposal';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { notifyError } from 'controllers/app/notifications';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import Cosmos from 'controllers/chain/cosmos/adapter';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import {
  NearSputnikVote,
  NearSputnikVoteString,
} from 'controllers/chain/near/sputnik/types';
import { NearAccount } from 'controllers/chain/near/account';

import { createTXModal } from 'views/modals/tx_signing_modal';
import { ProposalExtensions } from './proposal_extensions';
import { getCanVote, getVotingResults } from './helpers';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import {
  CompoundCancelButton,
  MolochCancelButton,
} from '../../pages/view_proposal/proposal_components';

type CannotVoteAttrs = { label: string };

class CannotVote extends ClassComponent<CannotVoteAttrs> {
  view(vnode: ResultNode<CannotVoteAttrs>) {
    return (
      <div className="CannotVote">
        <CWButton disabled label={vnode.attrs.label} />
      </div>
    );
  }
}

type VotingActionsAttrs = {
  onModalClose: () => void;
  proposal: AnyProposal;
  toggleVotingModal: (newModalState: boolean) => void;
  votingModalOpen: boolean;
};

export class VotingActions extends ClassComponent<VotingActionsAttrs> {
  private amount: number;
  private conviction: number;

  view(vnode: ResultNode<VotingActionsAttrs>) {
    const { onModalClose, proposal, toggleVotingModal, votingModalOpen } =
      vnode.attrs;

    if (proposal instanceof SubstrateTreasuryProposal) {
      return;
    } else if (!app.isLoggedIn()) {
      return <CannotVote label="Log in to vote" />;
    } else if (!app.user.activeAccount) {
      return <CannotVote label="Connect an address to vote" />;
    } else if (!proposal.canVoteFrom(app.user.activeAccount)) {
      return <CannotVote label="Cannot vote from this address" />;
    }

    let user;

    if (
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateDemocracyReferendum ||
      proposal instanceof SubstratePhragmenElection ||
      proposal instanceof SubstrateCollectiveProposal
    ) {
      user = app.user.activeAccount as SubstrateAccount;
    } else if (proposal instanceof CosmosProposal) {
      user = app.user.activeAccount as CosmosAccount;
    } else if (
      proposal instanceof MolochProposal ||
      proposal instanceof CompoundProposal ||
      proposal instanceof AaveProposal
    ) {
      user = app.user.activeAccount as EthereumAccount;
    } else if (proposal instanceof NearSputnikProposal) {
      user = app.user.activeAccount as NearAccount;
    } else {
      return <CannotVote label="Unrecognized proposal type" />;
    }

    const voteYes = async (e) => {
      e.preventDefault();
      toggleVotingModal(true);

      if (proposal instanceof SubstrateDemocracyProposal) {
        createTXModal(
          proposal.submitVoteTx(
            new DepositVote(user, proposal.deposit),
            onModalClose
          )
        );
      } else if (proposal instanceof SubstrateDemocracyReferendum) {
        if (this.conviction === undefined) {
          toggleVotingModal(false);
          return notifyError('Must select a conviction');
        }

        if (this.amount === 0) {
          toggleVotingModal(false);
          return notifyError('Must select a valid amount');
        }

        createTXModal(
          proposal.submitVoteTx(
            new BinaryVote(
              user,
              true,
              this.amount,
              convictionToWeight(this.conviction)
            ),
            onModalClose
          )
        );
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(
          proposal.submitVoteTx(new BinaryVote(user, true), onModalClose)
        );
      } else if (proposal instanceof CosmosProposal) {
        if (proposal.status === 'DepositPeriod') {
          // TODO: configure deposit amount
          proposal
            .submitDepositTx(
              user,
              (app.chain as Cosmos).chain.coins(this.amount)
            )
            .then(() => redraw())
            .catch((err) => notifyError(err.toString()));
        } else {
          proposal
            .voteTx(new CosmosVote(user, 'Yes'))
            .then(() => redraw())
            .catch((err) => notifyError(err.toString()));
        }
      } else if (proposal instanceof MolochProposal) {
        proposal
          .submitVoteWebTx(new MolochProposalVote(user, MolochVote.YES))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.YES))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, true))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Approve)
          )
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof SubstratePhragmenElection) {
        toggleVotingModal(false);
        return notifyError(
          'Unimplemented proposal type - use election voting modal'
        );
      } else {
        toggleVotingModal(false);
        return notifyError('Invalid proposal type');
      }
    };

    const voteNo = (e) => {
      e.preventDefault();
      toggleVotingModal(true);

      if (proposal instanceof SubstrateDemocracyReferendum) {
        if (this.conviction === undefined) {
          toggleVotingModal(false);
          return notifyError('Must select a conviction');
        }

        if (this.amount === 0) {
          toggleVotingModal(false);
          return notifyError('Must select a valid amount');
        }

        createTXModal(
          proposal.submitVoteTx(
            new BinaryVote(
              user,
              false,
              this.amount,
              convictionToWeight(this.conviction)
            ),
            onModalClose
          )
        );
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(
          proposal.submitVoteTx(new BinaryVote(user, false), onModalClose)
        );
      } else if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'No'))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof MolochProposal) {
        proposal
          .submitVoteWebTx(new MolochProposalVote(user, MolochVote.NO))
          .then(() => redraw());
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.NO))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, false))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Reject)
          )
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else {
        toggleVotingModal(false);
        return notifyError('Invalid proposal type');
      }
    };

    const processProposal = (e) => {
      e.preventDefault();
      toggleVotingModal(true);

      if (proposal instanceof MolochProposal) {
        proposal
          .processTx()
          .then(() => {
            onModalClose();
            redraw();
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

    const voteAbstain = (e) => {
      e.preventDefault();
      toggleVotingModal(true);

      if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'Abstain'))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (
        proposal instanceof CompoundProposal &&
        (app.chain as Compound).governance.supportsAbstain
      ) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.ABSTAIN))
          .then(() => redraw())
          .catch((err) => notifyError(err.toString()));
      } else {
        toggleVotingModal(false);
        return notifyError('Invalid proposal type');
      }
    };

    const voteVeto = (e) => {
      e.preventDefault();
      toggleVotingModal(true);

      if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'NoWithVeto'))
          .then(() => redraw())
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
            new NearSputnikVote(user, NearSputnikVoteString.Remove)
          )
          .then(() => {
            onModalClose();
            redraw();
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

    // substrate: multi-deposit approve
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

    // moloch: process
    const processButton = proposal instanceof MolochProposal && (
      <CWButton
        disabled={
          proposal.state !== MolochProposalState.ReadyToProcess ||
          votingModalOpen
        }
        onClick={processProposal}
        label={proposal.data.processed ? 'Processed' : 'Process'}
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
        <React.Fragment>
          <div className="button-row">
            {yesButton}
            {noButton}
          </div>
          <ProposalExtensions proposal={proposal} />
        </React.Fragment>
      );
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      votingActionObj = (
        <React.Fragment>
          <div className="button-row">
            {yesButton}
            {noButton}
          </div>
          <ProposalExtensions
            proposal={proposal}
            setDemocracyVoteConviction={(c) => {
              this.conviction = c;
            }}
            setDemocracyVoteAmount={(c) => {
              this.amount = c;
            }}
          />
        </React.Fragment>
      );
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      votingActionObj = (
        <React.Fragment>
          <div className="button-row">{multiDepositApproveButton}</div>
          <ProposalExtensions
            proposal={proposal}
            setCosmosDepositAmount={(c) => {
              this.amount = c;
            }}
          />
        </React.Fragment>
      );
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      votingActionObj = (
        <React.Fragment>
          <div className="button-row">
            {yesButton}
            {noButton}
            {abstainButton}
            {noWithVetoButton}
          </div>
          <ProposalExtensions proposal={proposal} />
        </React.Fragment>
      );
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      votingActionObj = (
        <React.Fragment>
          <div className="button-row">
            {yesButton}
            {noButton}
            {processButton}
            <MolochCancelButton
              molochMember={user}
              onModalClose={onModalClose}
              proposal={proposal as MolochProposal}
              votingModalOpen={votingModalOpen}
            />
          </div>
          <ProposalExtensions proposal={proposal} />
        </React.Fragment>
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
  }
}
