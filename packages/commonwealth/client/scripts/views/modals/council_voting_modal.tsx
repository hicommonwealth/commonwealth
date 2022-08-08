/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/council_voting_modal.scss';

import app from 'state';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { formatCoin } from 'adapters/currency';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
import User from 'views/components/widgets/user';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWText } from '../components/component_kit/cw_text';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';

export class CouncilVotingModal implements m.ClassComponent<{ candidates }> {
  private currentApprovals: Array<string>;
  private currentStake: number;
  private error: string;
  private phragmenStakeAmount: SubstrateCoin;
  private votes: Array<string>;

  oninit(vnode) {
    const candidates = vnode.attrs.candidates || [];
    // get currently set approvals
    const currentVote = (
      app.chain as Substrate
    ).phragmenElections.activeElection.getVotes(app.user.activeAccount);

    const currentStake = currentVote[0] ? currentVote[0].stake.inDollars : 0;

    this.currentStake = currentStake;

    this.phragmenStakeAmount = app.chain.chain.coins(
      parseFloat(String(currentStake)),
      true
    );

    const currentApprovals =
      (currentVote && currentVote.length > 0 && currentVote[0].votes) || [];

    this.currentApprovals = currentApprovals;

    this.votes = candidates
      .filter(
        ([candidate]) =>
          currentApprovals && currentApprovals.includes(candidate.address)
      )
      .map(([candidate]) => candidate.address);
  }

  view(vnode) {
    const { candidates } = vnode.attrs;

    const author = app.user.activeAccount;

    if (!(author instanceof SubstrateAccount)) {
      return <CWText>Council voting only supported on Substrate.</CWText>;
    }

    const submitVote = (e) => {
      this.error = '';

      if (!this.votes || this.votes.length === 0) {
        this.error = 'Select at least one candidate.';
        return;
      }

      const stake: SubstrateCoin = this.phragmenStakeAmount;

      if (!stake || stake.eqn(0)) {
        this.error = 'Must enter an amount.';
        return;
      }

      if (stake.lt((app.chain as Substrate).chain.existentialdeposit)) {
        this.error = 'Amount locked must be above minimum balance.';
        return;
      }

      const voteAccts: string[] = this.votes;

      const voteObj = new PhragmenElectionVote(
        app.user.activeAccount as SubstrateAccount,
        voteAccts,
        stake
      );

      createTXModal(
        (app.chain as Substrate).phragmenElections.activeElection.submitVoteTx(
          voteObj
        )
      ).then(
        () => {
          $(e.target).trigger('modalforceexit');
        },
        (err) => {
          if (err) this.error = err;
          m.redraw();
        }
      );
    };

    const hasApprovals = this.currentApprovals.length > 0;

    const votingBond = (app.chain as Substrate).phragmenElections.votingBond;

    return (
      <div class="CouncilVotingModal">
        <div class="compact-modal-title">
          <h3>Approval Voting</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          <div class="chooser">
            <CWText fontWeight="semiBold">
              Lock any amount of{' '}
              {(app.chain && app.chain.chain && app.chain.chain.denom) ||
                'balance'}{' '}
              to vote. You may unlock at any time.
            </CWText>
            <CWText type="caption">
              A {formatCoin(votingBond)} bond will be reserved in case your vote
              becomes inactive (everyone you are voting for withdraws their
              candidacies). Once inactive, anyone can evict your voter record
              and claim your bond.
            </CWText>
            <CWTextInput
              defaultValue={String(this.currentStake)}
              placeholder="Amount to lock"
              oninput={(e) => {
                this.phragmenStakeAmount = app.chain.chain.coins(
                  parseFloat(e.target.value),
                  true
                );
              }}
            />
            <div class="candidates-container">
              {candidates.map((candidateTuple) => {
                const candidate = candidateTuple[0];
                const address = candidateTuple[0].address;

                const onclick = (e) => {
                  e.preventDefault();

                  const index = this.votes.indexOf(address);

                  if (index === -1) {
                    this.votes.push(address);
                  } else {
                    this.votes.splice(index, 1);
                  }
                };

                return (
                  <div class="candidate-row" onclick={onclick}>
                    <CWCheckbox
                      checked={this.votes.indexOf(address) !== -1}
                      onchange={onclick}
                      label=""
                    />
                    {m(User, { user: candidate })}
                  </div>
                );
              })}
            </div>
            {candidates.length === 0 && (
              <>
                <CWText>No candidates to vote for</CWText>
                {this.error && (
                  <CWValidationText message={this.error} status="failure" />
                )}
              </>
            )}
          </div>
        </div>
        <div class="compact-modal-actions">
          <CWButton
            onclick={submitVote}
            label={hasApprovals ? 'Update vote' : 'Submit vote'}
          />
          {hasApprovals && (
            <CWButton
              buttonType="primary-red"
              onclick={(e) => {
                e.preventDefault();
                const account = app.user.activeAccount as SubstrateAccount;
                createTXModal(
                  (
                    app.chain as Substrate
                  ).phragmenElections.activeElection.removeVoterTx(account)
                ).then(
                  () => {
                    $(e.target).trigger('modalforceexit');
                  },
                  (err) => {
                    if (err) this.error = err;
                    m.redraw();
                  }
                );
              }}
              label="Retract vote"
            />
          )}
        </div>
      </div>
    );
  }
}
