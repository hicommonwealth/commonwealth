import React from 'react';

import 'components/proposals/voting_result_components.scss';
import type {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import type { AaveProposalVote } from 'controllers/chain/ethereum/aave/proposal';
import type NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import type { NearSputnikVote } from 'controllers/chain/near/sputnik/types';
import { NearSputnikVoteString } from 'controllers/chain/near/sputnik/types';

import type { AnyProposal, IVote } from 'models';
import { CWText } from '../component_kit/cw_text';
import { VoteListing } from './vote_listing';

type BaseVotingResultProps = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

type VotingResultProps = {
  abstainVotes?: Array<IVote<any>>;
  noVotes: Array<IVote<any>>;
  yesVotes: Array<IVote<any>>;
  proposal: AnyProposal;
};

export const VotingResult = (props: VotingResultProps) => {
  const { abstainVotes, noVotes, yesVotes, proposal } = props;

  return (
    <div className="VotingResult">
      <div className="results-column-yes">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Yes (${yesVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={yesVotes} />
      </div>
      <div className="results-column-no">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`No (${noVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={noVotes} />
      </div>
      {abstainVotes && (
        <div className="results-column-no">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Abstain (${abstainVotes.length})`}
          </CWText>
          <VoteListing proposal={proposal} votes={abstainVotes} />
        </div>
      )}
    </div>
  );
};

type CompletedProposalVotingResultProps = {
  abstainPct: string;
  abstainResults: string;
  noPct: string;
  noResults: string;
  noWithVetoPct: string;
  noWithVetoResults: string;
  yesPct: string;
  yesResults: string;
};

export const CompletedProposalVotingResult = (
  props: CompletedProposalVotingResultProps
) => {
  const {
    abstainPct,
    abstainResults,
    noPct,
    noResults,
    noWithVetoPct,
    noWithVetoResults,
    yesPct,
    yesResults,
  } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${yesPct}% voted Yes`}
        </CWText>
        <CWText>{`(${yesResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noPct}% voted No`}
        </CWText>
        <CWText>{`(${noResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${abstainPct}% voted Abstain`}
        </CWText>
        <CWText>{`(${abstainResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noWithVetoPct}% voted Veto`}
        </CWText>
        <CWText>{`(${noWithVetoResults})`}</CWText>
      </div>
    </div>
  );
};

type SimpleYesApprovalVotingResultProps = {
  approvedCount: number;
} & BaseVotingResultProps;

export const SimpleYesApprovalVotingResult = (
  props: SimpleYesApprovalVotingResultProps
) => {
  const { approvedCount, proposal, votes } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Approved ${approvedCount}`}
        </CWText>
        <VoteListing proposal={proposal} votes={votes} />
      </div>
    </div>
  );
};

type AaveVotingResultProps = {
  noBalanceString: string;
  noVotesCount: number;
  proposal: AaveProposal;
  votes: Array<AaveProposalVote>;
  yesBalanceString: string;
  yesVotesCount: number;
};

export const AaveVotingResult = (props: AaveVotingResultProps) => {
  const {
    noBalanceString,
    noVotesCount,
    proposal,
    votes,
    yesBalanceString,
    yesVotesCount,
  } = props;

  return (
    <div className="VotingResult">
      <div className="results-column-yes">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Yes (${yesBalanceString} ${yesVotesCount}) voters`}
        </CWText>
        <div className="results-subheader">
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
      <div className="results-column-no">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`No (${noBalanceString} ${noVotesCount}) voters`}
        </CWText>
        <div className="results-subheader">
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
};

type YesNoAbstainVetoVotingResultProps = {
  proposal: CosmosProposal;
  votes: Array<CosmosVote>;
};

export const YesNoAbstainVetoVotingResult = (
  props: YesNoAbstainVetoVotingResultProps
) => {
  const { proposal, votes } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`}
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'Yes')}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted no (${votes.filter((v) => v.choice === 'No').length})`}
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'No')}
        />
      </div>
      <div className="results-column">
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
      <div className="results-column">
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
};

type YesNoRejectVotingResultProps = {
  proposal: NearSputnikProposal;
  votes: Array<NearSputnikVote>;
};

export const YesNoRejectVotingResult = (
  props: YesNoRejectVotingResultProps
) => {
  const { proposal, votes } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
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
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted reject (${
            votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
              .length
          })`}
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === NearSputnikVoteString.Reject)}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted remove (${
            votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
              .length
          })`}
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === NearSputnikVoteString.Remove)}
        />
      </div>
    </div>
  );
};
