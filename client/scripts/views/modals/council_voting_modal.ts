import 'modals/council_voting_modal.scss';

import $ from 'jquery';
import m from 'mithril';

import app from 'state';
import { Button, Input } from 'construct-ui';

import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { formatCoin } from 'adapters/currency';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
import { MultipleButtonSelectorFormField } from 'views/components/forms';
import User from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/modal';
import { createTXModal } from 'views/modals/tx_signing_modal';

const CouncilVotingModal = {
  view: (vnode) => {
    const author = app.user.activeAccount;
    const candidates = vnode.attrs.candidates || [];
    if (!author) return m('div', 'Must be logged in');
    if (!(author instanceof SubstrateAccount)) return m('div', 'Council voting only supported on Substrate.');

    // get currently set approvals
    const currentVote = (app.chain as Substrate).phragmenElections.activeElection.getVotes(author);
    const currentStake = (currentVote[0]) ? currentVote[0].stake.inDollars : 0;
    const currentApprovals = (currentVote && currentVote.length > 0 && currentVote[0].votes) || [];
    const hasApprovals = currentApprovals.length > 0;
    const defaultSelection = candidates
      .filter(([candidate]) => currentApprovals && currentApprovals.includes(candidate.address))
      .map(([candidate]) => candidate.address);
    if (vnode.state.votes === undefined) {
      vnode.state.votes = defaultSelection;
    }

    const submitVote = (e) => {
      vnode.state.error = '';
      if (!vnode.state.votes || vnode.state.votes.length === 0) {
        vnode.state.error = 'Select at least one candidate.';
        return;
      }
      const stake: SubstrateCoin = vnode.state.phragmenStakeAmount;
      if (!stake || stake.eqn(0)) {
        vnode.state.error = 'Must enter an amount.';
        return;
      }
      if (stake.lt((app.chain as Substrate).chain.existentialdeposit)) {
        vnode.state.error = 'Amount locked must be above minimum balance.';
        return;
      }

      const voteAccts: string[] = vnode.state.votes;
      const voteObj = new PhragmenElectionVote(app.user.activeAccount as SubstrateAccount, voteAccts, stake);
      createTXModal((app.chain as Substrate).phragmenElections.activeElection.submitVoteTx(voteObj)).then(() => {
        $(vnode.dom).trigger('modalforceexit');
      }, (err) => {
        if (err) vnode.state.error = err;
        m.redraw();
      });
    };
    const votingBond = (app.chain as Substrate).phragmenElections.votingBond;

    return m('.CouncilVotingModal', [
      m('.compact-modal-title', [
        m('h3', 'Approval Voting'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('.chooser', [
          m('p', [
            `Lock any amount of ${(app.chain && app.chain.chain && app.chain.chain.denom) || 'balance'} to vote. `,
            'You may unlock at any time.'
          ]),
          m('p', [
            `A ${formatCoin(votingBond)} bond will be reserved in case your vote becomes inactive (everyone you are `,
            'voting for withdraws their candidacies). Once inactive, anyone can evict your voter record and claim ',
            'your bond.'
          ]),
          m(Input, {
            class: 'phragmen-vote-amount',
            name: 'amount',
            fluid: true,
            defaultValue: String(currentStake),
            placeholder: 'Amount to lock',
            autocomplete: 'off',
            oncreate: () => {
              vnode.state.phragmenStakeAmount = app.chain.chain.coins(parseFloat(String(currentStake)), true);
            },
            oninput: (e) => {
              vnode.state.phragmenStakeAmount = app.chain.chain.coins(parseFloat(e.target.value), true);
            }
          }),
          m(MultipleButtonSelectorFormField, {
            name: 'candidate',
            choices: candidates.map(([candidate, slot]) => ({
              value: candidate.address,
              label: m(User, { user: candidate }),
            })),
            callback: (result) => {
              // votes array has type string[]
              vnode.state.votes = result;
            },
            defaultSelection
          }),
          candidates.length === 0 && m('.no-candidates', 'No candidates to vote for'),
          vnode.state.error && m('.voting-error', vnode.state.error),
        ])
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          type: 'submit',
          onclick: submitVote,
          fluid: true,
          label: hasApprovals ? 'Update vote' : 'Submit vote',
          intent: 'primary',
        }),
        hasApprovals && m(Button, {
          class: 'retract-vote',
          intent: 'negative',
          fluid: true,
          style: 'margin-top: 10px;',
          onclick: (e) => {
            e.preventDefault();
            const account = app.user.activeAccount as SubstrateAccount;
            createTXModal((app.chain as Substrate).phragmenElections.activeElection.removeVoterTx(account))
              .then(() => {
                $(vnode.dom).trigger('modalforceexit');
              }, (err) => {
                if (err) vnode.state.error = err;
                m.redraw();
              });
          },
          label: 'Retract vote'
        }),
      ]),
    ]);
  }
};

export default CouncilVotingModal;
