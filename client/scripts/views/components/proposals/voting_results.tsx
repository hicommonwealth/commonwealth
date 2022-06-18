/* @jsx m */

import m from 'mithril';
import BN from 'bn.js';
import Web3 from 'web3';

import 'components/proposals/voting_results.scss';

import app from 'state';
import { formatNumberLong, Coin } from 'adapters/currency';
import { VotingType, AnyProposal } from 'models';
import { CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { MolochVote } from 'controllers/chain/ethereum/moloch/proposal';
import { BravoVote } from 'controllers/chain/ethereum/compound/proposal';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import { NearSputnikVoteString } from 'controllers/chain/near/sputnik/types';
import { VoteListing } from './vote_listing';

export const VotingResults: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const votes = proposal.getVotes();

    // TODO: fix up this function for cosmos votes
    if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${votes.filter((v) => v.choice === true).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === true)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${votes.filter((v) => v.choice === false).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === false)}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${
                votes.filter((v) => v.choice === MolochVote.YES).length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === MolochVote.YES)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${votes.filter((v) => v.choice === MolochVote.NO).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === MolochVote.NO)}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal instanceof AaveProposal) {
      const yesVotes: AaveProposalVote[] = votes.filter((v) => !!v.choice);

      const yesBalance = yesVotes.reduce(
        (total, v) => total.add(v.power),
        new BN(0)
      );

      const yesBalanceString = `${formatNumberLong(
        +Web3.utils.fromWei(yesBalance.toString())
      )} ${app.chain.meta.symbol}`;

      const noVotes: AaveProposalVote[] = votes.filter((v) => !v.choice);

      const noBalance = noVotes.reduce(
        (total, v) => total.add(v.power),
        new BN(0)
      );

      const noBalanceString = `${formatNumberLong(
        +Web3.utils.fromWei(noBalance.toString())
      )} ${app.chain.meta.symbol}`;

      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${yesBalanceString} ${yesVotes.length}) voters`}
            </div>
            <div class="results-subheader">
              <span>User</span>
              <span>Power</span>
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => !!v.choice)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${noBalanceString} ${noVotes.length}) voters`}
            </div>
            <div class="results-subheader">
              <span>User</span>
              <span>Power</span>
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => !v.choice)}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.CompoundYesNo) {
      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${
                votes.filter((v) => v.choice === BravoVote.YES).length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === BravoVote.YES)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${votes.filter((v) => v.choice === BravoVote.NO).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === BravoVote.NO)}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.CompoundYesNoAbstain) {
      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${
                votes.filter((v) => v.choice === BravoVote.YES).length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === BravoVote.YES)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${votes.filter((v) => v.choice === BravoVote.NO).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === BravoVote.NO)}
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`Abstain (${
                votes.filter((v) => v.choice === BravoVote.ABSTAIN).length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === BravoVote.ABSTAIN)}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return (
        <div class="VotingResults">
          <div class="results-column yes-votes">
            <div class="results-header">
              {`Yes (${votes.filter((v) => v.choice === true).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === true)}
                amount
                weight
              />
            </div>
          </div>
          <div class="results-column no-votes">
            <div class="results-header">
              {`No (${votes.filter((v) => v.choice === false).length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === false)}
                amount
                weight
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      // return different voting results on completed cosmos proposal, as voters are not available
      if (
        proposal.completed &&
        (proposal as CosmosProposal).data?.state?.tally
      ) {
        const { yes, no, abstain, noWithVeto } = (proposal as CosmosProposal)
          .data.state.tally;

        // TODO: move this marshalling into controller
        const formatCurrency = (n: BN) => {
          const decimals = new BN(10).pow(new BN(app.chain.meta.decimals || 6));
          const denom = app.chain.meta.symbol;
          const coin = new Coin(denom, n, false, decimals);
          return coin.format();
        };

        const voteTotal = yes.add(no).add(abstain).add(noWithVeto);

        const getPct = (n: BN) => {
          return (n.muln(10_000).div(voteTotal).toNumber() / 100).toFixed(2);
        };

        return (
          <div class="VotingResults">
            <div class="results-column">
              <div class="results-header">{`${getPct(yes)}% voted Yes`}</div>
              <div class="results-cell">{`(${formatCurrency(yes)})`}</div>
            </div>
            <div class="results-column">
              <div class="results-header">{`${getPct(no)}% voted No`}</div>
              <div class="results-cell">{`(${formatCurrency(no)})`}</div>
            </div>
            <div class="results-column">
              <div class="results-header">
                {`${getPct(abstain)}% voted Abstain`}
              </div>
              <div class="results-cell">{`(${formatCurrency(abstain)})`}</div>
            </div>
            <div class="results-column">
              <div class="results-header">
                {`${getPct(noWithVeto)}% voted Veto`}
              </div>
              <div class="results-cell">
                {`(${formatCurrency(noWithVeto)})`}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div class="VotingResults">
          <div class="results-column">
            <div class="results-header">
              {`Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === 'Yes')}
              />
            </div>
          </div>
          <div class="results-column">
            <div class="results-header">
              {`Voted no (${votes.filter((v) => v.choice === 'No').length})`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === 'No')}
              />
            </div>
          </div>
          <div class="results-column">
            <div class="results-header">
              {`Voted abstain (${
                votes.filter((v) => v.choice === 'Abstain').length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === 'Abstain')}
              />
            </div>
          </div>
          <div class="results-column">
            <div class="results-header">
              {`Voted veto (${
                votes.filter((v) => v.choice === 'NoWithVeto').length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter((v) => v.choice === 'NoWithVeto')}
              />
            </div>
          </div>
        </div>
      );
    } else if (
      proposal.votingType === VotingType.SimpleYesApprovalVoting &&
      proposal instanceof CosmosProposal
    ) {
      // special case for cosmos proposals in deposit stage
      return (
        <div class="VotingResults">
          <div class="results-column">
            <div class="results-header">{`Approved ${proposal.depositorsAsVotes.length}`}</div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={proposal.depositorsAsVotes}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      return (
        <div class="VotingResults">
          <div class="results-column">
            <div class="results-header">{`Approved ${votes.length}`}</div>
            <div class="results-cell">
              <VoteListing proposal={proposal} votes={votes} />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.YesNoReject) {
      return (
        <div class="VotingResults">
          <div class="results-column">
            <div class="results-header">
              {`Voted approve (${
                votes.filter((v) => v.choice === NearSputnikVoteString.Approve)
                  .length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter(
                  (v) => v.choice === NearSputnikVoteString.Approve
                )}
              />
            </div>
          </div>
          <div class="results-column">
            <div class="results-header">
              {`Voted reject (${
                votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
                  .length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter(
                  (v) => v.choice === NearSputnikVoteString.Reject
                )}
              />
            </div>
          </div>
          <div class="results-column">
            <div class="results-header">
              {`Voted remove (${
                votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
                  .length
              })`}
            </div>
            <div class="results-cell">
              <VoteListing
                proposal={proposal}
                votes={votes.filter(
                  (v) => v.choice === NearSputnikVoteString.Remove
                )}
              />
            </div>
          </div>
        </div>
      );
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      // to be implemented
    } else {
      // to be implemented
    }
  },
};
