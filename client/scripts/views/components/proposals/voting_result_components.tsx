/* @jsx m */
/* eslint-disable max-classes-per-file */

import m from 'mithril';

import 'components/proposals/voting_result_components.scss';

import { AnyProposal, IVote } from 'models';
import { NearSputnikVoteString } from 'controllers/chain/near/sputnik/types';
import { VoteListing } from './vote_listing';
import { CWText } from '../component_kit/cw_text';

type BaseVotingResultAttrs = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

type VotingResultAttrs = {
  getAbstainVotes?: () => void;
  getNoVotes: () => void;
  getYesVotes: () => void;
  proposal: AnyProposal;
};

export class VotingResult implements m.ClassComponent<VotingResultAttrs> {
  view(vnode) {
    const { getAbstainVotes, getNoVotes, getYesVotes, proposal } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column-yes">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Yes (${getYesVotes.length})`}
          </CWText>
          <VoteListing proposal={proposal} votes={getYesVotes} />
        </div>
        <div class="results-column-no">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`No (${getNoVotes.length})`}
          </CWText>
          <VoteListing proposal={proposal} votes={getNoVotes} />
        </div>
        {getAbstainVotes && (
          <div class="results-column-no">
            <CWText type="h4" fontWeight="medium" className="results-header">
              {`Abstain (${getAbstainVotes.length})`}
            </CWText>
            <VoteListing proposal={proposal} votes={getAbstainVotes} />
          </div>
        )}
      </div>
    );
  }
}

type AaveVotingResultAttrs = {
  noBalanceString: string;
  noVotesCount: number;
  yesBalanceString: string;
  yesVotesCount: number;
} & BaseVotingResultAttrs;

export class AaveVotingResult
  implements m.ClassComponent<AaveVotingResultAttrs>
{
  view(vnode) {
    const {
      noBalanceString,
      noVotesCount,
      proposal,
      votes,
      yesBalanceString,
      yesVotesCount,
    } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column yes-votes">
          <div class="results-header">
            {`Yes (${yesBalanceString} ${yesVotesCount}) voters`}
          </div>
          <div class="results-subheader">
            <span>User</span>
            <span>Power</span>
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => !!v.choice)}
          />
        </div>
        <div class="results-column no-votes">
          <div class="results-header">
            {`No (${noBalanceString} ${noVotesCount}) voters`}
          </div>
          <div class="results-subheader">
            <span>User</span>
            <span>Power</span>
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => !v.choice)}
          />
        </div>
      </div>
    );
  }
}

type CompletedProposalVotingResultAttrs = {
  abstainPct: string;
  abstainResults: string;
  noPct: string;
  noResults: string;
  noWithVetoPct: string;
  noWithVetoResults: string;
  yesPct: string;
  yesResults: string;
};

export class CompletedProposalVotingResult
  implements m.ClassComponent<CompletedProposalVotingResultAttrs>
{
  view(vnode) {
    const {
      abstainPct,
      abstainResults,
      noPct,
      noResults,
      noWithVetoPct,
      noWithVetoResults,
      yesPct,
      yesResults,
    } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <div class="results-header">{`${yesPct}% voted Yes`}</div>
          <div class="results-cell">{`(${yesResults})`}</div>
        </div>
        <div class="results-column">
          <div class="results-header">{`${noPct}% voted No`}</div>
          <div class="results-cell">{`(${noResults})`}</div>
        </div>
        <div class="results-column">
          <div class="results-header">{`${abstainPct}% voted Abstain`}</div>
          <div class="results-cell">{`(${abstainResults})`}</div>
        </div>
        <div class="results-column">
          <div class="results-header">{`${noWithVetoPct}% voted Veto`}</div>
          <div class="results-cell">{`(${noWithVetoResults})`}</div>
        </div>
      </div>
    );
  }
}

export class YesNoAbstainVetoVotingResult
  implements m.ClassComponent<BaseVotingResultAttrs>
{
  view(vnode) {
    const { proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <div class="results-header">
            {`Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'Yes')}
          />
        </div>
        <div class="results-column">
          <div class="results-header">
            {`Voted no (${votes.filter((v) => v.choice === 'No').length})`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'No')}
          />
        </div>
        <div class="results-column">
          <div class="results-header">
            {`Voted abstain (${
              votes.filter((v) => v.choice === 'Abstain').length
            })`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'Abstain')}
          />
        </div>
        <div class="results-column">
          <div class="results-header">
            {`Voted veto (${
              votes.filter((v) => v.choice === 'NoWithVeto').length
            })`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'NoWithVeto')}
          />
        </div>
      </div>
    );
  }
}

type SimpleYesApprovalVotingResultAttrs = {
  approvedCount: number;
} & BaseVotingResultAttrs;

export class SimpleYesApprovalVotingResult
  implements m.ClassComponent<SimpleYesApprovalVotingResultAttrs>
{
  view(vnode) {
    const { approvedCount, proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <div class="results-header">{`Approved ${approvedCount}`}</div>
          <VoteListing proposal={proposal} votes={votes} />
        </div>
      </div>
    );
  }
}

export class YesNoRejectVotingResult
  implements m.ClassComponent<BaseVotingResultAttrs>
{
  view(vnode) {
    const { proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <div class="results-header">
            {`Voted approve (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Approve)
                .length
            })`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter(
              (v) => v.choice === NearSputnikVoteString.Approve
            )}
          />
        </div>
        <div class="results-column">
          <div class="results-header">
            {`Voted reject (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
                .length
            })`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter(
              (v) => v.choice === NearSputnikVoteString.Reject
            )}
          />
        </div>
        <div class="results-column">
          <div class="results-header">
            {`Voted remove (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
                .length
            })`}
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter(
              (v) => v.choice === NearSputnikVoteString.Remove
            )}
          />
        </div>
      </div>
    );
  }
}
