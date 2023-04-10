/* @jsx m */

import ClassComponent from 'class_component';

import 'components/proposals/voting_actions.scss';
import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposal, CosmosVote } from 'controllers/chain/cosmos/proposal';
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
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import {
  convictionToWeight,
  SubstrateDemocracyReferendum,
} from 'controllers/chain/substrate/democracy_referendum';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import m from 'mithril';
import type { AnyProposal } from 'models';
import { BinaryVote, DepositVote, VotingType } from 'models';

import app from 'state';

import { createTXModal } from 'views/modals/tx_signing_modal';
import { CompoundCancelButton } from '../../pages/view_proposal/proposal_components';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { getCanVote, getVotingResults } from './helpers';
import { ProposalExtensions } from './proposal_extensions';

type CannotVoteAttrs = { label: string };

class CannotVote extends ClassComponent<CannotVoteAttrs> {
  view(vnode: m.Vnode<CannotVoteAttrs>) {
    return (
      <div class="CannotVote">
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

  view(vnode: m.Vnode<VotingActionsAttrs>) {
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
      // TODO: remove when v1 voting is confirmed
      // https://github.com/hicommonwealth/commonwealth/issues/3361
    } else if (app.chain?.meta?.cosmosGovernanceVersion === 'v1') {
      return <CannotVote label="Voting coming soon" />;
    }

    let user;

    if (
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateDemocracyReferendum
    ) {
      user = app.user.activeAccount as SubstrateAccount;
    } else if (proposal instanceof CosmosProposal) {
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
      } else if (proposal instanceof CosmosProposal) {
        if (proposal.status === 'DepositPeriod') {
          // TODO: configure deposit amount
          proposal
            .submitDepositTx(
              user,
              (app.chain as Cosmos).chain.coins(this.amount)
            )
            .then(() => m.redraw())
            .catch((err) => notifyError(err.toString()));
        } else {
          proposal
            .voteTx(new CosmosVote(user, 'Yes'))
            .then(() => m.redraw())
            .catch((err) => notifyError(err.toString()));
        }
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, true))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Approve)
          )
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
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
      } else if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'No'))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.NO))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, false))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Reject)
          )
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
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
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (
        proposal instanceof CompoundProposal &&
        (app.chain as Compound).governance.supportsAbstain
      ) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.ABSTAIN))
          .then(() => m.redraw())
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
          .then(() => m.redraw())
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
            m.redraw();
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
        onclick={voteYes}
        label={hasVotedYes ? 'Voted yes' : 'Vote yes'}
      />
    );

    const noButton = (
      <CWButton
        buttonType="primary-red"
        disabled={!canVote || hasVotedNo || votingModalOpen}
        onclick={voteNo}
        label={hasVotedNo ? 'Voted no' : 'Vote no'}
      />
    );

    // substrate: multi-deposit approve
    const multiDepositApproveButton = (
      <CWButton
        disabled={!canVote || votingModalOpen}
        onclick={voteYes}
        label={hasVotedYes && !canVote ? 'Already approved' : 'Second'}
      />
    );

    // cosmos: abstain
    const abstainButton = (
      <CWButton
        buttonType="primary-red"
        disabled={!canVote || hasVotedAbstain || votingModalOpen}
        onclick={voteAbstain}
        label={hasVotedAbstain ? 'Abstained' : 'Abstain'}
      />
    );

    // cosmos: veto
    const noWithVetoButton = (
      <CWButton
        buttonType="primary-red"
        disabled={!canVote || hasVotedVeto || votingModalOpen}
        onclick={voteVeto}
        label={hasVotedVeto ? 'Vetoed' : 'Veto'}
      />
    );

    // near: remove
    const removeButton = proposal instanceof NearSputnikProposal && (
      <CWButton
        disabled={!canVote || votingModalOpen}
        onclick={voteRemove}
        label={hasVotedRemove ? 'Voted remove' : 'Vote remove'}
      />
    );

    let votingActionObj;

    if (proposal instanceof AaveProposal) {
      votingActionObj = (
        <div class="button-row">
          {yesButton}
          {noButton}
        </div>
      );
    } else if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      votingActionObj = (
        <>
          <div class="button-row">
            {yesButton}
            {noButton}
          </div>
          <ProposalExtensions proposal={proposal} />
        </>
      );
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      votingActionObj = (
        <>
          <div class="button-row">
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
        </>
      );
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      votingActionObj = (
        <>
          <div class="button-row">{multiDepositApproveButton}</div>
          <ProposalExtensions
            proposal={proposal}
            setCosmosDepositAmount={(c) => {
              this.amount = c;
            }}
          />
        </>
      );
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      votingActionObj = (
        <>
          <div class="button-row">
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
        <div class="button-row">
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
        <div class="button-row">
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
        <div class="button-row">
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
      <div class="VotingActions">
        <CWText type="h4" className="voting-actions-header">
          Cast Your Vote
        </CWText>
        {votingActionObj}
      </div>
    );
  }
}
