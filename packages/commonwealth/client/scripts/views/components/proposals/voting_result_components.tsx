/* @jsx m */
/* eslint-disable max-classes-per-file */

import m from 'mithril';

import 'components/proposals/voting_result_components.scss';

import { AnyProposal, IVote } from 'models';
import {
  NearSputnikVote,
  NearSputnikVoteString,
} from 'controllers/chain/near/sputnik/types';
import { CosmosProposal, CosmosVote } from 'controllers/chain/cosmos/proposal';
import NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
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
  view(vnode: m.Vnode<VotingResultAttrs>) {
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
  view(vnode: m.Vnode<CompletedProposalVotingResultAttrs>) {
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
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`${yesPct}% voted Yes`}
          </CWText>
          <CWText>{`(${yesResults})`}</CWText>
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`${noPct}% voted No`}
          </CWText>
          <CWText>{`(${noResults})`}</CWText>
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`${abstainPct}% voted Abstain`}
          </CWText>
          <CWText>{`(${abstainResults})`}</CWText>
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`${noWithVetoPct}% voted Veto`}
          </CWText>
          <CWText>{`(${noWithVetoResults})`}</CWText>
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
  view(vnode: m.Vnode<SimpleYesApprovalVotingResultAttrs>) {
    const { approvedCount, proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Approved ${approvedCount}`}
          </CWText>
          <VoteListing proposal={proposal} votes={votes} />
        </div>
      </div>
    );
  }
}

type AaveVotingResultAttrs = {
  noBalanceString: string;
  noVotesCount: number;
  proposal: AaveProposal;
  votes: Array<AaveProposalVote>;
  yesBalanceString: string;
  yesVotesCount: number;
};

export class AaveVotingResult
  implements m.ClassComponent<AaveVotingResultAttrs>
{
  view(vnode: m.Vnode<AaveVotingResultAttrs>) {
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
        <div class="results-column-yes">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Yes (${yesBalanceString} ${yesVotesCount}) voters`}
          </CWText>
          <div class="results-subheader">
            <CWText type="h5" fontWeight="medium">
              User
            </CWText>
            <CWText type="h5" fontWeight="medium">
              Power
            </CWText>
          </div>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => !!v.choice)}
          />
        </div>
        <div class="results-column-no">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`No (${noBalanceString} ${noVotesCount}) voters`}
          </CWText>
          <div class="results-subheader">
            <CWText type="h5" fontWeight="medium">
              User
            </CWText>
            <CWText type="h5" fontWeight="medium">
              Power
            </CWText>
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

type YesNoAbstainVetoVotingResultAttrs = {
  proposal: CosmosProposal;
  votes: Array<CosmosVote>;
};

export class YesNoAbstainVetoVotingResult
  implements m.ClassComponent<YesNoAbstainVetoVotingResultAttrs>
{
  view(vnode: m.Vnode<YesNoAbstainVetoVotingResultAttrs>) {
    const { proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'Yes')}
          />
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted no (${votes.filter((v) => v.choice === 'No').length})`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'No')}
          />
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted abstain (${
              votes.filter((v) => v.choice === 'Abstain').length
            })`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'Abstain')}
          />
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted veto (${
              votes.filter((v) => v.choice === 'NoWithVeto').length
            })`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter((v) => v.choice === 'NoWithVeto')}
          />
        </div>
      </div>
    );
  }
}

type YesNoRejectVotingResultAttrs = {
  proposal: NearSputnikProposal;
  votes: Array<NearSputnikVote>;
};

export class YesNoRejectVotingResult
  implements m.ClassComponent<YesNoRejectVotingResultAttrs>
{
  view(vnode: m.Vnode<YesNoRejectVotingResultAttrs>) {
    const { proposal, votes } = vnode.attrs;

    return (
      <div class="VotingResult">
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted approve (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Approve)
                .length
            })`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter(
              (v) => v.choice === NearSputnikVoteString.Approve
            )}
          />
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted reject (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
                .length
            })`}
          </CWText>
          <VoteListing
            proposal={proposal}
            votes={votes.filter(
              (v) => v.choice === NearSputnikVoteString.Reject
            )}
          />
        </div>
        <div class="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted remove (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
                .length
            })`}
          </CWText>
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
